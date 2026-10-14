import jwt from "jsonwebtoken";
import { config } from "./config.js";

// O crachá de sessão (NF2.1): um JWT, assinado pela API, guardado num cookie.
//
// A API não guarda lista de quem está logado. A cada pedido, ela só confere a
// assinatura e o prazo do crachá, que diz quem a pessoa é. Por isso o crachá
// tem prazo curto e a coluna usuario.sessoes_validas_desde, que invalida de
// uma vez os crachás antigos (ver exigirLogin).

export const NOME_COOKIE = "ufvet_sessao";

// Mais ou menos um turno de trabalho: veterinários podem entrar em
// computadores compartilhados do hospital, e um crachá esquecido para de
// valer sozinho.
export const DURACAO_SESSAO_HORAS = 8;

// O conteúdo de um JWT é assinado, mas não é secreto: qualquer um decodifica.
// Por isso o crachá leva só o id interno da conta e o instante em que foi
// emitido, nada pessoal.
function emitirToken(usuarioId) {
  return jwt.sign({ emitidoEm: Date.now() }, config.jwtSegredo, {
    subject: usuarioId,
    expiresIn: `${DURACAO_SESSAO_HORAS}h`,
    algorithm: "HS256",
  });
}

// { usuarioId, emitidoEm } se o crachá é autêntico e está no prazo; senão,
// null. O algoritmo é fixado para ninguém conseguir apresentar um crachá
// "sem assinatura" como se fosse válido.
export function lerToken(token) {
  try {
    const dados = jwt.verify(token, config.jwtSegredo, {
      algorithms: ["HS256"],
    });
    // Um crachá de cadastro pendente (ver abaixo) não vale como sessão.
    if (dados.aud) return null;
    return { usuarioId: dados.sub, emitidoEm: dados.emitidoEm };
  } catch {
    return null;
  }
}

// O cookie é:
// - httpOnly: o JavaScript da página não consegue lê-lo, então um código
//   malicioso injetado no site não rouba a sessão;
// - sameSite strict: o navegador só o envia em pedidos feitos pelo próprio
//   UFVet, nunca a partir de outro site (proteção contra CSRF);
// - secure em produção: só viaja por HTTPS;
// - restrito a /api: as páginas do site não precisam dele.
const opcoesCookie = {
  httpOnly: true,
  sameSite: "strict",
  secure: config.producao,
  path: "/api",
};

export function abrirSessao(res, usuarioId) {
  res.cookie(NOME_COOKIE, emitirToken(usuarioId), {
    ...opcoesCookie,
    maxAge: DURACAO_SESSAO_HORAS * 60 * 60 * 1000,
  });
}

export function fecharSessao(res) {
  res.clearCookie(NOME_COOKIE, opcoesCookie);
}

// ─── Cadastro pendente ────────────────────────────────────────────────────────
//
// Depois do cadastro, o navegador em que ele foi feito recebe um segundo
// crachá, que só serve para corrigir o e-mail do cadastro enquanto ele não é
// confirmado (a pessoa digitou o e-mail errado e não precisa refazer tudo).
// Não é sessão: a conta pendente não entra no site. Vale pelo mesmo tempo do
// link de confirmação e só viaja para os endereços /api/email.

export const NOME_COOKIE_CADASTRO = "ufvet_cadastro";
const DURACAO_CADASTRO_HORAS = 24;
const opcoesCookieCadastro = { ...opcoesCookie, path: "/api/email" };

export function marcarCadastroPendente(res, usuarioId) {
  const token = jwt.sign({}, config.jwtSegredo, {
    subject: usuarioId,
    audience: "cadastro",
    expiresIn: `${DURACAO_CADASTRO_HORAS}h`,
    algorithm: "HS256",
  });
  res.cookie(NOME_COOKIE_CADASTRO, token, {
    ...opcoesCookieCadastro,
    maxAge: DURACAO_CADASTRO_HORAS * 60 * 60 * 1000,
  });
}

// O id da conta do cadastro feito neste navegador, ou null.
export function lerCadastroPendente(req) {
  const token = req.cookies?.[NOME_COOKIE_CADASTRO];
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSegredo, {
      algorithms: ["HS256"],
      audience: "cadastro",
    }).sub;
  } catch {
    return null;
  }
}

export function esquecerCadastroPendente(res) {
  res.clearCookie(NOME_COOKIE_CADASTRO, opcoesCookieCadastro);
}
