import { banco } from "../banco.js";
import { ErroApi } from "../erros.js";
import { usuarioDaSessao } from "../middlewares/sessao.js";
import { buscarUsuarioPorEmail, dadosDaConta } from "../modelos/usuario.js";
import { registrar } from "../registro.js";
import { conferirSenha } from "../senha.js";
import { NOME_COOKIE, abrirSessao, fecharSessao } from "../token.js";
import { esquemaLogin } from "../validacao.js";

// Controller (do MVC) da sessão: entrar, ver quem está logado e sair (F2).

// POST /api/sessao — entra com e-mail e senha. E-mail inexistente e senha
// errada recebem a mesma resposta, no mesmo tempo, para ninguém descobrir
// quem tem conta (NF2.2).
export async function entrar(req, res) {
  const { email, senha } = esquemaLogin.parse(req.body);
  const usuario = await buscarUsuarioPorEmail(email);
  const senhaConfere = await conferirSenha(senha, usuario?.senhaHash);

  if (!usuario || !senhaConfere) {
    registrar("login_recusado", { ip: req.ip });
    throw new ErroApi(401, "E-mail ou senha incorretos.");
  }

  registrar("login", { usuarioId: usuario.id });
  abrirSessao(res, usuario.id);
  res.json({ usuario: await dadosDaConta(usuario) });
}

// GET /api/sessao — quem está logado. O site pergunta isto ao abrir. Sem
// sessão a resposta é { usuario: null }, e não um erro: não estar logado é
// um estado normal (o visitante).
export async function sessaoAtual(req, res) {
  const usuario = await usuarioDaSessao(req);
  // Crachá vencido ou revogado: sai do navegador também.
  if (!usuario && req.cookies?.[NOME_COOKIE]) fecharSessao(res);
  res.json({ usuario: usuario ? await dadosDaConta(usuario) : null });
}

// DELETE /api/sessao — sai neste aparelho.
export function sair(req, res) {
  fecharSessao(res);
  res.status(204).end();
}

// DELETE /api/sessoes — sai de todos os aparelhos: todo crachá emitido até
// agora deixa de valer, inclusive o deste. Exige login.
export async function sairDeTodos(req, res) {
  await banco.usuario.update({
    where: { id: req.usuario.id },
    data: { sessoesValidasDesde: new Date() },
  });
  registrar("sessoes_encerradas", { usuarioId: req.usuario.id });
  fecharSessao(res);
  res.status(204).end();
}
