import { banco } from "../banco.js";
import { cifrar, indiceEmail } from "../cifra.js";
import { ErroApi } from "../erros.js";
import { acharConviteValido, usarConvite } from "../modelos/convite.js";
import {
  codigoPublicoLivre,
  dadosDaConta,
  buscarUsuarioPorId,
} from "../modelos/usuario.js";
import { registrar } from "../registro.js";
import { gerarHashSenha } from "../senha.js";
import { abrirSessao } from "../token.js";
import { esquemaCadastro, esquemaDisponibilidade } from "../validacao.js";

// Controller (do MVC) das contas.

// Versão dos termos de uso e da ciência sobre os custos, gravada junto com o
// aceite (F7). É a mesma que a página de termos mostra
// (frontend/src/pages/termos/indice.js): quando o texto mudar, as duas mudam
// juntas. A versão 1 foi aceita antes de os termos estarem escritos; a 2
// ainda pedia o CPF.
const VERSAO_DOS_TERMOS = "3";

const MENSAGEM_CONVITE =
  "Convite inválido, já usado ou vencido. Peça um novo à direção do hospital.";

// O e-mail não pode se repetir entre contas (NF1.2). O banco também barra a
// repetição; conferir antes serve para dizer, embaixo do campo, o que houve.
async function camposRepetidos({ email }) {
  const existente = await banco.usuario.findUnique({
    where: { emailIndice: indiceEmail(email) },
    select: { id: true },
  });
  return existente ? { email: "Já existe uma conta com este e-mail." } : {};
}

async function conferirRepetidos(dados) {
  const campos = await camposRepetidos(dados);
  if (Object.keys(campos).length > 0) {
    throw new ErroApi(409, "Já existe uma conta com estes dados.", { campos });
  }
}

// POST /api/usuarios/disponibilidade — diz, durante o cadastro, se o e-mail
// já tem conta, para o site avisar na hora e não só no fim. Responde
// { campos: {} } quando está livre. É POST para o e-mail não ir no endereço,
// que fica nos registros de acesso.
export async function conferirDisponibilidade(req, res) {
  const dados = esquemaDisponibilidade.parse(req.body);
  res.json({ campos: await camposRepetidos(dados) });
}

// Confere o convite de quem se cadastra como veterinário e devolve-o.
async function conferirConvite(req, codigo) {
  const convite = await acharConviteValido(codigo);
  if (!convite) {
    registrar("convite_recusado", { ip: req.ip });
    throw new ErroApi(400, MENSAGEM_CONVITE, {
      campos: { convite: MENSAGEM_CONVITE },
    });
  }
  const crmvEmUso = await banco.veterinario.findUnique({
    where: { crmv_ufCrmv: { crmv: convite.crmv, ufCrmv: convite.ufCrmv } },
    select: { usuarioId: true },
  });
  if (crmvEmUso) {
    const mensagem = "Já existe uma conta com o CRMV deste convite.";
    throw new ErroApi(409, mensagem, { campos: { convite: mensagem } });
  }
  return convite;
}

// POST /api/usuarios — cria a conta (F1), registra o aceite dos termos (F7)
// e já deixa a pessoa logada. E-mail e telefone são gravados cifrados, o
// e-mail com a impressão digital ao lado (NF1.5); a senha, como hash
// (NF1.1).
export async function cadastrar(req, res) {
  const dados = esquemaCadastro.parse(req.body);
  const ehVeterinario = dados.papel === "VETERINARIO";

  await conferirRepetidos(dados);
  const convite = ehVeterinario
    ? await conferirConvite(req, dados.convite)
    : null;

  const [senhaHash, codigo] = await Promise.all([
    gerarHashSenha(dados.senha),
    codigoPublicoLivre(dados.papel),
  ]);

  // Tudo ou nada: se qualquer passo falhar, nenhum dado fica gravado pela
  // metade (uma conta sem aceite, ou um convite gasto sem conta).
  const id = await banco.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        codigo,
        papel: dados.papel,
        nomeCompleto: dados.nomeCompleto,
        emailCifrado: cifrar(dados.email),
        emailIndice: indiceEmail(dados.email),
        telefoneCifrado: cifrar(dados.telefone),
        senhaHash,
        cidade: dados.cidade,
        bairro: dados.bairro,
        aceites: {
          create: [
            { tipo: "TERMOS_DE_USO", versao: VERSAO_DOS_TERMOS },
            { tipo: "CIENCIA_RESPONSABILIDADE", versao: VERSAO_DOS_TERMOS },
          ],
        },
        // CRMV e estabelecimento vêm do convite, que a direção do hospital
        // preencheu, e não do que a pessoa digitou.
        veterinario: convite
          ? {
              create: {
                crmv: convite.crmv,
                ufCrmv: convite.ufCrmv,
                tratamento: dados.tratamento,
                estabelecimentoId: convite.estabelecimentoId,
              },
            }
          : undefined,
      },
      select: { id: true },
    });

    if (convite && !(await usarConvite(tx, convite.id, usuario.id))) {
      throw new ErroApi(409, MENSAGEM_CONVITE, {
        campos: { convite: MENSAGEM_CONVITE },
      });
    }
    return usuario.id;
  });

  registrar("conta_criada", { usuarioId: id, papel: dados.papel });
  abrirSessao(res, id);
  const usuario = await buscarUsuarioPorId(id);
  res.status(201).json({ usuario: await dadosDaConta(usuario) });
}
