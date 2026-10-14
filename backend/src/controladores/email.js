import { banco } from "../banco.js";
import { enviarEmSegundoPlano } from "../carteiro.js";
import { cifrar, decifrar, indiceEmail } from "../cifra.js";
import { mandarConfirmacao, mandarLinkDeSenha } from "../emails.js";
import { ErroApi } from "../erros.js";
import { acharLink, linkValeAgora, usarLink } from "../modelos/links.js";
import {
  CONTA_CONFIRMADA,
  apagarCadastrosPendentes,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
} from "../modelos/usuario.js";
import { registrar } from "../registro.js";
import { gerarHashSenha } from "../senha.js";
import { esquecerCadastroPendente, lerCadastroPendente } from "../token.js";
import {
  codigoDoLink,
  esquemaNovaSenha,
  esquemaSoEmail,
} from "../validacao.js";

// Controller (do MVC) dos links que o UFVet manda por e-mail: confirmar o
// e-mail (no cadastro e na troca de e-mail), mandar o link de confirmação de
// novo e criar uma senha nova para quem esqueceu a atual (F4).
//
// O código do link é o único segredo destes endereços: 32 bytes sorteados,
// que ninguém adivinha. Mesmo assim eles têm limite de tentativas, e o
// código errado recebe a mesma resposta do vencido e do já usado.

const LINK_INVALIDO = {
  confirmacao:
    "Este link não vale mais: ele venceu, já foi usado ou foi trocado por um mais novo. Entre com seu e-mail e sua senha para receber outro.",
  senha:
    'Este link não vale mais: ele venceu, já foi usado ou foi trocado por um mais novo. Peça outro em "Esqueceu a senha?".',
};

const linkInvalido = (tipo) =>
  new ErroApi(400, LINK_INVALIDO[tipo], { codigo: "LINK_INVALIDO" });

// POST /api/email/confirmacao — confirma o e-mail com o código do link.
// No cadastro, a conta passa a entrar no site. Numa troca de e-mail, o
// e-mail novo passa a valer só agora, e só se ninguém o confirmou numa
// outra conta enquanto isso. Responde o e-mail confirmado, para o site
// já preenchê-lo na página de entrar.
export async function confirmarEmail(req, res) {
  const codigo = codigoDoLink(req.body);
  const link = codigo && (await acharLink(codigo, "CONFIRMAR_EMAIL"));
  if (!link) throw linkInvalido("confirmacao");
  const email = decifrar(link.emailCifrado);
  const { usuario } = link;

  // Aberto de novo depois de usado, ou depois de confirmar por um link mais
  // novo (ou antes pelo antivírus do e-mail, que abre os links para
  // conferir): se este e-mail já está confirmado na conta, não há o que
  // fazer, e a pessoa só precisa saber disso. Quem tem o link é o dono do
  // e-mail, então a resposta não conta nada a um estranho.
  if (usuario.emailConfirmadoEm && usuario.emailIndice === link.emailIndice) {
    return res.json({ email, troca: false, jaConfirmado: true });
  }
  if (!linkValeAgora(link)) throw linkInvalido("confirmacao");

  const troca = link.emailIndice !== usuario.emailIndice;
  await banco.$transaction(async (tx) => {
    if (!(await usarLink(tx, link.id))) throw linkInvalido("confirmacao");
    if (troca) {
      const dono = await tx.usuario.findFirst({
        where: { emailIndice: link.emailIndice, ...CONTA_CONFIRMADA },
        select: { id: true },
      });
      if (dono) {
        throw new ErroApi(
          409,
          "Este e-mail passou a ser de outra conta do UFVet. Na Minha conta, escolha outro.",
        );
      }
      // Um cadastro pendente com este e-mail não segura nada: quem abriu o
      // link provou que o e-mail é seu.
      await apagarCadastrosPendentes(tx, { emailIndice: link.emailIndice });
      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          emailCifrado: link.emailCifrado,
          emailIndice: link.emailIndice,
          emailConfirmadoEm: new Date(),
        },
      });
    } else {
      await tx.usuario.update({
        where: { id: usuario.id },
        data: { emailConfirmadoEm: usuario.emailConfirmadoEm ?? new Date() },
      });
    }
  });
  registrar(troca ? "email_trocado" : "email_confirmado", {
    usuarioId: usuario.id,
  });
  // Confirmado, o cadastro não tem mais o que corrigir neste navegador.
  esquecerCadastroPendente(res);
  res.json({ email, troca, jaConfirmado: false });
}

// POST /api/email/correcao — corrige o e-mail de um cadastro que ainda não
// foi confirmado, sem refazer o cadastro: a pessoa digitou o e-mail errado.
// Só vale no navegador em que o cadastro foi feito, nas 24 horas seguintes
// (o crachá de cadastro, ver token.js), e só para cadastro pendente. O
// link mandado ao e-mail errado deixa de valer, e um link novo vai para o
// certo. Responde como o cadastro: { email, enviado }.
export async function corrigirEmail(req, res) {
  const usuarioId = lerCadastroPendente(req);
  const usuario = usuarioId && (await buscarUsuarioPorId(usuarioId));
  if (!usuario) {
    throw new ErroApi(
      401,
      "Não deu para corrigir o e-mail por aqui: o cadastro foi feito em outro navegador ou há mais de 24 horas. Cadastre-se de novo com o e-mail certo.",
      { codigo: "SEM_CADASTRO" },
    );
  }
  if (usuario.emailConfirmadoEm) {
    throw new ErroApi(409, "Este cadastro já foi confirmado. É só entrar.");
  }
  const { email } = esquemaSoEmail.parse(req.body ?? {});
  const emailIndice = indiceEmail(email);

  if (emailIndice !== usuario.emailIndice) {
    const dono = await banco.usuario.findFirst({
      where: { emailIndice, ...CONTA_CONFIRMADA },
      select: { id: true },
    });
    if (dono) {
      const mensagem = "Já existe uma conta com este e-mail.";
      throw new ErroApi(409, mensagem, { campos: { email: mensagem } });
    }
    await banco.$transaction(async (tx) => {
      // Um outro cadastro pendente com o e-mail certo sai, como no cadastro.
      await apagarCadastrosPendentes(tx, { emailIndice });
      await tx.usuario.update({
        where: { id: usuario.id },
        data: { emailCifrado: cifrar(email), emailIndice },
      });
    });
    registrar("email_do_cadastro_corrigido", { usuarioId: usuario.id });
  }

  const enviado = await mandarConfirmacao(
    await buscarUsuarioPorId(usuario.id),
    email,
  );
  res.json({ email, enviado });
}

// POST /api/email/reenvio — manda de novo o link de confirmação de um
// cadastro pendente. Para o e-mail sem conta e para a conta já confirmada, a
// resposta é a mesma de um envio que deu certo: ela não diz quem tem conta.
// Para o cadastro pendente, a API espera o e-mail sair e diz a verdade se ele
// não saiu, em vez de deixar a pessoa esperando um e-mail que não vem. Isso
// revela, a quem tentar, que um e-mail tem um cadastro esperando
// confirmação, o que não expõe a pessoa: esse cadastro não entra, não
// aparece para ninguém e some em 7 dias.
export async function reenviarConfirmacao(req, res) {
  const { email } = esquemaSoEmail.parse(req.body ?? {});
  const usuario = await buscarUsuarioPorEmail(email);
  if (usuario && !usuario.emailConfirmadoEm) {
    registrar("confirmacao_reenviada", { usuarioId: usuario.id });
    if (!(await mandarConfirmacao(usuario, email))) {
      throw new ErroApi(
        503,
        "Não conseguimos mandar o e-mail agora. Tente de novo daqui a alguns minutos.",
      );
    }
  }
  res.status(202).json({ ok: true });
}

// POST /api/senha/esqueci — manda o link para criar uma senha nova. Como no
// login (NF2.2), a resposta não diz se o e-mail tem conta: é sempre a mesma,
// e na mesma hora.
export async function esqueciASenha(req, res) {
  const { email } = esquemaSoEmail.parse(req.body ?? {});
  const usuario = await buscarUsuarioPorEmail(email);
  if (usuario) {
    registrar("senha_nova_pedida", { usuarioId: usuario.id });
    enviarEmSegundoPlano(() => mandarLinkDeSenha(usuario));
  }
  res.status(202).json({ ok: true });
}

// POST /api/senha/nova — cria a senha nova com o código do link. Como na
// troca de senha (NF2.3), todos os aparelhos saem da conta: se alguém tinha
// descoberto a senha antiga, perde o acesso. Abrir o link também prova que
// o e-mail é da pessoa, e um cadastro ainda pendente fica confirmado.
// Responde o e-mail da conta, para o site já preenchê-lo na página de
// entrar.
export async function criarSenhaNova(req, res) {
  const codigo = codigoDoLink(req.body);
  const link = codigo && (await acharLink(codigo, "NOVA_SENHA"));
  if (!link || !linkValeAgora(link)) throw linkInvalido("senha");
  // A senha é conferida depois do link: com o link vencido, não adianta
  // acertar a senha.
  const { senha } = esquemaNovaSenha.parse(req.body);

  const senhaHash = await gerarHashSenha(senha);
  await banco.$transaction(async (tx) => {
    if (!(await usarLink(tx, link.id))) throw linkInvalido("senha");
    await tx.usuario.update({
      where: { id: link.usuarioId },
      data: {
        senhaHash,
        sessoesValidasDesde: new Date(),
        emailConfirmadoEm: link.usuario.emailConfirmadoEm ?? new Date(),
      },
    });
  });
  registrar("senha_redefinida", { usuarioId: link.usuarioId });
  res.json({ email: decifrar(link.usuario.emailCifrado) });
}
