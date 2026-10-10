import { ErroApi } from "../erros.js";
import { registrar } from "../registro.js";
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
//
// O navegador guarda um login só por site, o mesmo para todas as abas: quem
// sai numa aba e entra com outra conta muda o login de todas. Uma aba aberta
// antes continuaria mostrando a conta antiga, mas agindo com a nova (um
// pedido de liberação saindo como veterinário, uma liberação assinada por
// outro veterinário). Por isso o site diz, em cada pedido, qual conta a aba
// está mostrando (cabeçalho X-Conta, com o código público), e a API recusa a
// ação quando não é a do cookie: nada é feito em nome de uma pessoa
// diferente da que aparece na tela. Sem o cabeçalho (um teste, um programa
// que chama a API direto), vale só o cookie.
export async function exigirLogin(req, res, next) {
  const usuario = await usuarioDaSessao(req);
  if (!usuario) {
    throw new ErroApi(401, "Entre na sua conta para continuar.");
  }
  const contaDaAba = req.get("X-Conta")?.trim().toUpperCase();
  if (contaDaAba && contaDaAba !== usuario.codigo) {
    registrar("conta_trocada", { caminho: req.path });
    throw new ErroApi(
      409,
      "A conta deste navegador mudou depois que esta página foi aberta. Confira a conta no topo da página antes de continuar.",
      { codigo: "CONTA_TROCADA" },
    );
  }
  req.usuario = usuario;
  next();
}

// Filtro das rotas públicas que contam com quem está logado, sem exigir
// login (a busca e os perfis): a conta, quando há, fica em req.usuario, e o
// visitante passa com req.usuario vazio. Serve aos limites de tentativas, que
// contam por conta, e não pelo endereço de rede, quem está logado.
export async function identificarSessao(req, res, next) {
  req.usuario = await usuarioDaSessao(req);
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
