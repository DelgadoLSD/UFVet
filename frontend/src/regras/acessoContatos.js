import { HORA, expirou } from "../util/datas";
import { ehVeterinario, nomeProfissionalCurto, pronome } from "../util/texto";

// Regras do acesso aos contatos dos doadores.
//
// O telefone e o e-mail de um tutor não ficam abertos a qualquer pessoa
// cadastrada. Veterinários veem sempre; um tutor só vê enquanto um veterinário
// que acompanha o caso dele liberar o acesso, por um prazo. Quando o prazo
// acaba, o acesso some sozinho.
//
// O banco não confere esses prazos (a coluna duracao_horas aceita qualquer
// número): é a API que recusa valores fora desta lista.

// Prazos que o veterinário pode escolher ao liberar.
export const DURACOES_LIBERACAO = [
  { valor: 24, rotulo: "24 horas" },
  { valor: 72, rotulo: "3 dias" },
  { valor: 168, rotulo: "7 dias" },
];

// Prazo que já vem marcado ao liberar, e o usado quando o veterinário aceita
// um pedido direto do painel.
export const DURACAO_PADRAO_HORAS = 72;

export const rotuloDuracao = (horas) =>
  DURACOES_LIBERACAO.find((d) => d.valor === horas)?.rotulo ?? `${horas} horas`;

// Tamanho mínimo da descrição do caso num pedido de liberação: o veterinário
// precisa entender do que se trata antes de liberar.
export const TAMANHO_MINIMO_CASO = 5;

// As opções de renovação de uma liberação (F30): cada prazo, contado de
// agora, com o momento em que terminaria. Renovar só estende o acesso: a
// opção que terminaria antes do prazo atual vem marcada como `encurta`, para
// a tela desligá-la (para tirar o acesso antes, existe o encerramento).
export function opcoesDeRenovacao(expiraEm, agora = Date.now()) {
  const atual = new Date(expiraEm).getTime();
  return DURACOES_LIBERACAO.map((duracao) => {
    const terminaEm = new Date(agora + duracao.valor * HORA);
    return { ...duracao, terminaEm, encurta: terminaEm.getTime() <= atual };
  });
}

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
  if (
    antes.pedido &&
    !depois.pedido &&
    depois.pedidoRecusado === antes.pedido.id
  ) {
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
