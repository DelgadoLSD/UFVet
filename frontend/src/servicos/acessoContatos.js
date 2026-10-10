import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { chamarComLogin, useSessao } from "./sessao";
import { paraVeterinario } from "./pessoas";
import { confirmar } from "../hooks/confirmacoes";
import { useAtualizacaoPeriodica } from "../hooks/useAtualizacaoPeriodica";
import { expirou } from "../util/datas";
import { ehVeterinario, nomeProfissionalCurto, pronome } from "../util/texto";

// Acesso aos contatos: quem pode ver o telefone e o e-mail dos tutores (F27 a
// F34), pela API. O tutor pede a liberação a um veterinário; o veterinário
// libera, recusa, renova e encerra. Quem decide é sempre a API: o site só
// mostra a situação e pede as ações.

// ─── Como as telas usam ───────────────────────────────────────────────────────

const paraPedido = (pedido) => ({
  id: pedido.id,
  caso: pedido.caso,
  criadoEm: pedido.criadoEm,
  tutorCodigo: pedido.tutor.codigo,
  tutorNome: pedido.tutor.nomeCompleto,
  veterinario: paraVeterinario(pedido.veterinario),
});

const paraLiberacao = (liberacao) => ({
  id: liberacao.id,
  caso: liberacao.caso,
  duracaoHoras: liberacao.duracaoHoras,
  expiraEm: liberacao.expiraEm,
  tutorCodigo: liberacao.tutor.codigo,
  tutorNome: liberacao.tutor.nomeCompleto,
  veterinario: paraVeterinario(liberacao.veterinario),
});

// ─── A situação de quem está logado ───────────────────────────────────────────
//
// Guardada fora dos componentes, para a busca e o perfil mostrarem a mesma
// coisa. A resposta do veterinário chega sem a pessoa recarregar a página: a
// situação é pedida de novo a cada página aberta, quando a pessoa volta para
// a aba e, com ela à vista, de tempos em tempos (mais seguido enquanto um
// pedido espera resposta; ver useAcessoContatos).

// Com um pedido esperando resposta, de 15 em 15 segundos; sem pedido, de
// minuto em minuto (um veterinário pode liberar pelo código, sem pedido, ou
// encerrar o acesso).
const ATUALIZAR_ESPERANDO_MS = 15 * 1000;
const ATUALIZAR_MS = 60 * 1000;

let situacao = { codigo: null, pronta: false, liberacao: null, pedido: null };
const ouvintes = new Set();

const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};

// O que mudou por ação de outra pessoa, entre a situação de antes e a nova,
// dito no aviso embaixo da tela: a pessoa estava esperando, e a resposta
// chegou sem ela precisar recarregar. Devolve null quando não há o que
// avisar (a primeira busca, ou nada mudou).
export function mudancaDoAcesso(antes, depois) {
  if (!antes.pronta || antes.codigo !== depois.codigo) return null;
  const ativa = (s) => s.liberacao && !expirou(s.liberacao.expiraEm);

  if (!ativa(antes) && ativa(depois)) {
    return {
      texto: `${nomeProfissionalCurto(depois.liberacao.veterinario)} liberou seu acesso aos contatos`,
      detalhe: "Os contatos já aparecem nos perfis dos doadores.",
    };
  }
  if (antes.pedido && !depois.pedido && !ativa(depois)) {
    const { veterinario } = antes.pedido;
    return {
      texto: `${nomeProfissionalCurto(veterinario)} recusou seu pedido`,
      detalhe: `Você pode pedir de novo, a ${pronome(veterinario)} ou a outro veterinário.`,
    };
  }
  if (ativa(antes) && !ativa(depois)) {
    return {
      texto: "Seu acesso aos contatos terminou",
      detalhe:
        "Se ainda precisar, peça uma nova liberação ao veterinário do caso.",
    };
  }
  return null;
}

// Pede a situação do tutor `codigo` à API. Uma busca de cada vez: se já há
// uma a caminho, espera por ela. Se a API não responder, a situação de antes
// continua (uma falha de rede passageira não tira o acesso da tela); sem
// situação de antes, trata como "sem liberação", e a API confere de novo
// quando a pessoa tenta ver um contato.
let buscando = null;
export function recarregarAcesso(codigo) {
  buscando ??= (async () => {
    const antes = situacao;
    let nova;
    try {
      const { liberacao, pedido } = await chamarComLogin("/acesso");
      nova = {
        codigo,
        pronta: true,
        liberacao: liberacao && paraLiberacao(liberacao),
        pedido: pedido && paraPedido(pedido),
      };
    } catch {
      nova =
        antes.pronta && antes.codigo === codigo
          ? antes
          : { codigo, pronta: true, liberacao: null, pedido: null };
    }
    const mudanca = mudancaDoAcesso(antes, nova);
    if (mudanca) confirmar(mudanca.texto, mudanca.detalhe);
    situacao = nova;
    ouvintes.forEach((aviso) => aviso());
  })().finally(() => {
    buscando = null;
  });
  return buscando;
}

// Regra única de quem vê contato (F33), com o motivo, que decide o texto da
// tela: o visitante, sem conta, nunca; o veterinário, sempre; o tutor, só
// com liberação ativa. Enquanto a situação do tutor não chega, o motivo é
// "carregando" e nenhum botão aparece. Uma liberação que vence com a página
// aberta deixa de valer na hora (F32).
export function acessoDe(usuario, situacaoAtual) {
  if (!usuario) return { pode: false, motivo: "visitante" };
  if (ehVeterinario(usuario)) return { pode: true, motivo: "veterinario" };
  if (!situacaoAtual.pronta || situacaoAtual.codigo !== usuario.codigo) {
    return { pode: false, motivo: "carregando" };
  }
  const { liberacao, pedido } = situacaoAtual;
  if (liberacao && !expirou(liberacao.expiraEm)) {
    return { pode: true, motivo: "liberacao", liberacao };
  }
  if (pedido) return { pode: false, motivo: "pedido-enviado", pedido };
  return { pode: false, motivo: "sem-liberacao" };
}

// O acesso de quem está logado, para a tela: { pode, motivo, liberacao,
// pedido } (ver acessoDe).
export function useAcessoContatos() {
  const usuario = useSessao();
  const atual = useSyncExternalStore(assinar, () => situacao);
  const codigoDoTutor =
    usuario && !ehVeterinario(usuario) ? usuario.codigo : null;
  useEffect(() => {
    if (codigoDoTutor) recarregarAcesso(codigoDoTutor);
  }, [codigoDoTutor]);
  const esperando = !!(atual.codigo === codigoDoTutor && atual.pedido);
  useAtualizacaoPeriodica(
    () => recarregarAcesso(codigoDoTutor),
    esperando ? ATUALIZAR_ESPERANDO_MS : ATUALIZAR_MS,
    !!codigoDoTutor,
  );
  return acessoDe(usuario, atual);
}

// O tutor pede a liberação a um veterinário, pelo código dele (F27). Em
// seguida, a situação é recarregada: a busca e o perfil passam a dizer
// "pedido enviado".
export async function pedirLiberacao({ usuario, veterinario, caso }) {
  const { pedido } = await chamarComLogin("/pedidos", {
    metodo: "POST",
    corpo: { veterinario, caso },
  });
  await recarregarAcesso(usuario.codigo);
  return paraPedido(pedido);
}

// ─── O painel do veterinário ──────────────────────────────────────────────────

// De 30 em 30 segundos, com a aba à vista, e ao voltar para ela.
const ATUALIZAR_PAINEL_MS = 30 * 1000;

// Os pedidos que esperam resposta do veterinário logado e as liberações
// ativas que ele concedeu (NF28.5). `recarregar` pede tudo de novo depois de
// cada ação e só termina quando as listas novas estão na tela: o painel
// espera por ele antes de confirmar, para o aviso "recusado" não aparecer
// com o pedido ainda na lista. Enquanto recarrega, as listas de antes
// continuam à vista.
export function usePainelAcesso() {
  const [estado, setEstado] = useState({
    pronto: false,
    pedidos: [],
    liberacoes: [],
    erro: "",
  });
  // Respostas que chegam depois de o painel sair da tela são descartadas.
  const montado = useRef(true);

  const recarregar = useCallback(async () => {
    try {
      const [{ pedidos }, { liberacoes }] = await Promise.all([
        chamarComLogin("/pedidos"),
        chamarComLogin("/liberacoes"),
      ]);
      if (!montado.current) return;
      setEstado({
        pronto: true,
        pedidos: pedidos.map(paraPedido),
        liberacoes: liberacoes.map(paraLiberacao),
        erro: "",
      });
    } catch (falha) {
      if (!montado.current) return;
      setEstado((anterior) => ({
        ...anterior,
        pronto: true,
        erro: falha.message,
      }));
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    recarregar();
    return () => {
      montado.current = false;
    };
  }, [recarregar]);
  // Pedidos novos chegam sem o veterinário recarregar a página.
  useAtualizacaoPeriodica(recarregar, ATUALIZAR_PAINEL_MS);

  return { ...estado, recarregar };
}

// Libera o acesso de um tutor (F28), pelo código dele (`tutor`) ou aceitando
// um pedido (`pedido`, o id), por 24, 72 ou 168 horas.
export async function liberarAcesso({ tutor, pedido, duracaoHoras, caso }) {
  const { liberacao } = await chamarComLogin("/liberacoes", {
    metodo: "POST",
    corpo: { tutor, pedido, duracaoHoras, caso: caso || undefined },
  });
  return paraLiberacao(liberacao);
}

// Dá um prazo novo, contado de agora (F30): 24, 72 ou 168 horas. Devolve a
// liberação com o prazo novo.
export async function renovarAcesso(id, duracaoHoras) {
  const { liberacao } = await chamarComLogin(
    `/liberacoes/${encodeURIComponent(id)}/renovacao`,
    { metodo: "POST", corpo: { duracaoHoras } },
  );
  return paraLiberacao(liberacao);
}

// Encerra antes do prazo (F31).
export const encerrarAcesso = (id) =>
  chamarComLogin(`/liberacoes/${encodeURIComponent(id)}`, {
    metodo: "DELETE",
  });

// Recusa um pedido (F29).
export const recusarPedido = (id) =>
  chamarComLogin(`/pedidos/${encodeURIComponent(id)}/recusa`, {
    metodo: "POST",
  });
