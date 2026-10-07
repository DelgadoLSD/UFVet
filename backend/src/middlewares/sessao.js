import { ErroApi } from "../erros.js";
import { buscarUsuarioPorId } from "../modelos/usuario.js";
import { NOME_COOKIE, lerToken } from "../token.js";

// Quem está fazendo o pedido, a partir do crachá de sessão no cookie.
//
// Devolve a conta, ou null quando não há crachá ou ele não vale mais:
// - assinatura inválida ou prazo vencido (8 horas);
// - conta encerrada depois que o crachá foi emitido;
// - crachá emitido antes de "sessões válidas desde" (a pessoa trocou a senha
//   ou saiu de todos os aparelhos depois).
export async function usuarioDaSessao(req) {
  const token = req.cookies?.[NOME_COOKIE];
  if (!token) return null;

  const sessao = lerToken(token);
  if (!sessao) return null;

  const usuario = await buscarUsuarioPorId(sessao.usuarioId);
  if (!usuario) return null;

  const validasDesde = usuario.sessoesValidasDesde?.getTime();
  if (validasDesde && !(sessao.emitidoEm >= validasDesde)) return null;

  return usuario;
}

// Filtro das rotas que exigem login: sem uma sessão válida, o pedido para
// aqui com 401. Com ela, a conta fica disponível em req.usuario para o
// controlador.
export async function exigirLogin(req, res, next) {
  const usuario = await usuarioDaSessao(req);
  if (!usuario) {
    throw new ErroApi(401, "Entre na sua conta para continuar.");
  }
  req.usuario = usuario;
  next();
}

// Filtro das rotas de um papel só (por exemplo, as do veterinário). Vem
// sempre depois de exigirLogin.
export const exigirPapel = (papel) => (req, res, next) => {
  if (req.usuario.papel !== papel) {
    throw new ErroApi(403, "Esta ação não está disponível para a sua conta.");
  }
  next();
};
