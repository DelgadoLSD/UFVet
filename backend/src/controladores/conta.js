import { apagarArquivos, guardarImagem } from "../armazenamento.js";
import { banco } from "../banco.js";
import { cifrar, decifrar, indiceEmail } from "../cifra.js";
import { ErroApi } from "../erros.js";
import { prepararFoto } from "../imagens.js";
import { buscarUsuarioPorId, dadosDaConta } from "../modelos/usuario.js";
import { registrar } from "../registro.js";
import { conferirSenha, gerarHashSenha } from "../senha.js";
import { abrirSessao, fecharSessao } from "../token.js";
import {
  esquemaConta,
  esquemaEncerramento,
  esquemaTrocaSenha,
} from "../validacao.js";

// Controller (do MVC) da própria conta: mudar os dados e a foto (F3), trocar
// a senha (F4) e encerrar a conta (F5). É sempre a conta de quem está logado
// (req.usuario, que vem do crachá de sessão): nenhum destes endereços recebe
// o id de uma conta, e por isso ninguém consegue mexer na de outra pessoa.

// Confere a senha atual antes de uma mudança sensível. Errada, a resposta
// aponta o campo, e o limite de tentativas conta mais uma (ver
// middlewares/limites.js).
async function conferirSenhaAtual(req, res, senha) {
  if (await conferirSenha(senha, req.usuario.senhaHash)) return;
  res.locals.senhaRecusada = true;
  registrar("senha_recusada", { usuarioId: req.usuario.id, ip: req.ip });
  const mensagem = "Senha incorreta.";
  throw new ErroApi(400, mensagem, { campos: { senhaAtual: mensagem } });
}

// Trocar o e-mail é trocar o que se usa para entrar. Por isso pede a senha:
// quem encontrar um computador com a conta aberta não consegue tomar a conta
// pondo o próprio e-mail nela. A senha vem antes da conferência de e-mail
// repetido, para este endereço não servir de consulta de quem tem conta.
async function conferirTrocaDeEmail(req, res, senhaAtual, emailIndice) {
  if (senhaAtual === undefined) {
    const mensagem = "Digite sua senha para trocar o e-mail.";
    throw new ErroApi(400, mensagem, { campos: { senhaAtual: mensagem } });
  }
  await conferirSenhaAtual(req, res, senhaAtual);

  // O e-mail novo não pode ser de outra conta (NF1.2).
  const dono = await banco.usuario.findUnique({
    where: { emailIndice },
    select: { id: true },
  });
  if (dono) {
    const mensagem = "Já existe uma conta com este e-mail.";
    throw new ErroApi(409, mensagem, { campos: { email: mensagem } });
  }
}

// PATCH /api/conta — muda nome, e-mail, telefone, cidade e bairro (F3).
// Grava só o que de fato mudou e responde com a conta atualizada.
export async function atualizarConta(req, res) {
  const dados = esquemaConta.parse(req.body ?? {});
  const atual = req.usuario;
  const mudancas = {};
  // Os nomes dos campos alterados, para o registro (nunca os valores).
  const alterados = [];

  const mudar = (campo, colunas) => {
    Object.assign(mudancas, colunas);
    alterados.push(campo);
  };

  if (
    dados.nomeCompleto !== undefined &&
    dados.nomeCompleto !== atual.nomeCompleto
  ) {
    mudar("nomeCompleto", { nomeCompleto: dados.nomeCompleto });
  }
  if (
    dados.telefone !== undefined &&
    dados.telefone !== decifrar(atual.telefoneCifrado)
  ) {
    mudar("telefone", { telefoneCifrado: cifrar(dados.telefone) });
  }
  if (dados.cidade !== undefined && dados.cidade !== atual.cidade) {
    mudar("cidade", { cidade: dados.cidade });
  }
  if (dados.bairro !== undefined && dados.bairro !== atual.bairro) {
    mudar("bairro", { bairro: dados.bairro });
  }
  if (dados.email !== undefined) {
    const emailIndice = indiceEmail(dados.email);
    if (emailIndice !== atual.emailIndice) {
      await conferirTrocaDeEmail(req, res, dados.senhaAtual, emailIndice);
      mudar("email", { emailCifrado: cifrar(dados.email), emailIndice });
    }
  }

  if (alterados.length > 0) {
    await banco.usuario.update({ where: { id: atual.id }, data: mudancas });
    registrar("conta_alterada", { usuarioId: atual.id, campos: alterados });
  }
  const usuario = await buscarUsuarioPorId(atual.id);
  res.json({ usuario: await dadosDaConta(usuario) });
}

// Grava a nova foto de perfil (ou nenhuma) e apaga o arquivo da anterior.
// Se gravar falhar, o arquivo novo é que sai.
async function mudarFoto(req, res, fotoUrl) {
  try {
    await banco.usuario.update({
      where: { id: req.usuario.id },
      data: { fotoUrl },
    });
  } catch (erro) {
    await apagarArquivos([fotoUrl]);
    throw erro;
  }
  await apagarArquivos([req.usuario.fotoUrl]);
  registrar(fotoUrl ? "foto_de_perfil_trocada" : "foto_de_perfil_removida", {
    usuarioId: req.usuario.id,
  });
  const usuario = await buscarUsuarioPorId(req.usuario.id);
  res.json({ usuario: await dadosDaConta(usuario) });
}

// PUT /api/conta/foto — troca a foto de perfil (F3), que chega num
// formulário com arquivo, no campo "foto". A imagem é tratada como as dos
// animais: conferida, reduzida e sem a localização (imagens.js).
export async function trocarFoto(req, res) {
  if (!req.file) {
    const mensagem = "Escolha uma foto.";
    throw new ErroApi(400, mensagem, { campos: { foto: mensagem } });
  }
  const imagem = await prepararFoto(req.file.buffer, "foto");
  await mudarFoto(req, res, await guardarImagem(imagem));
}

// DELETE /api/conta/foto — volta para as iniciais no lugar da foto.
export async function removerFoto(req, res) {
  await mudarFoto(req, res, null);
}

// PUT /api/conta/senha — troca a senha (F4), com a senha atual. Os outros
// aparelhos saem da conta (NF2.3): se alguém tinha descoberto a senha antiga
// e entrado com ela, perde o acesso. Este aparelho recebe um crachá novo e
// continua logado.
export async function trocarSenha(req, res) {
  const { senhaAtual, senhaNova } = esquemaTrocaSenha.parse(req.body ?? {});
  await conferirSenhaAtual(req, res, senhaAtual);

  // A atual acabou de ser conferida, então basta comparar as duas.
  if (senhaNova === senhaAtual) {
    const mensagem = "A nova senha precisa ser diferente da atual.";
    throw new ErroApi(400, mensagem, { campos: { senhaNova: mensagem } });
  }

  await banco.usuario.update({
    where: { id: req.usuario.id },
    data: {
      senhaHash: await gerarHashSenha(senhaNova),
      sessoesValidasDesde: new Date(),
    },
  });
  // Emitido depois do instante gravado acima, o crachá novo vale.
  abrirSessao(res, req.usuario.id);
  registrar("senha_trocada", { usuarioId: req.usuario.id });
  res.status(204).end();
}

// DELETE /api/conta — encerra a conta (F5), com a senha (NF5.1). O banco
// apaga junto o que é só da pessoa (os animais e o que foi registrado sobre
// eles, pedidos, liberações e aceites) e mantém o que ela assinou no animal
// de outra pessoa, com o nome e o CRMV copiados na assinatura (NF5.4). A
// regra de cada tabela está no schema.prisma (onDelete) e é testada em
// exclusao-conta.test.js.
//
// Depois do banco, saem os arquivos: a foto de perfil e as fotos dos
// animais. Quando os exames forem enviados de verdade, os arquivos deles
// também precisam sair aqui.
export async function encerrarConta(req, res) {
  const { senhaAtual } = esquemaEncerramento.parse(req.body ?? {});
  await conferirSenhaAtual(req, res, senhaAtual);

  const fotosDosAnimais = await banco.animalFoto.findMany({
    where: { animal: { tutorId: req.usuario.id } },
    select: { url: true },
  });
  await banco.usuario.delete({ where: { id: req.usuario.id } });
  await apagarArquivos([
    req.usuario.fotoUrl,
    ...fotosDosAnimais.map((foto) => foto.url),
  ]);
  registrar("conta_encerrada", {
    usuarioId: req.usuario.id,
    papel: req.usuario.papel,
  });
  fecharSessao(res);
  res.status(204).end();
}
