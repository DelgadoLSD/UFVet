// Regras do acesso aos contatos dos doadores.
//
// O telefone e o e-mail de um tutor não ficam abertos a qualquer pessoa
// cadastrada. Veterinários veem sempre; um tutor só vê enquanto um veterinário
// que acompanha o caso dele liberar o acesso, por um prazo. Quando o prazo
// acaba, o acesso some sozinho.
//
// O banco não confere esses prazos (a coluna duracao_horas aceita qualquer
// número): quando a API existir, é ela que precisa recusar valores fora desta
// lista.

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
    const terminaEm = new Date(agora + duracao.valor * 60 * 60 * 1000);
    return { ...duracao, terminaEm, encurta: terminaEm.getTime() <= atual };
  });
}
