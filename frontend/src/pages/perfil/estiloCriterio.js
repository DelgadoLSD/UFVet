// Como um critério de doação aparece no painel de validação do cartão e no
// histórico de validações. Atendido e não atendido diferem em três coisas ao
// mesmo tempo, para quem não distingue bem verde de vermelho (daltonismo): a
// claridade (caixa verde-clara contra caixa vermelha cheia, escura), o ícone
// (✓ contra ✕) e a cor. Assim o que não foi atendido salta aos olhos mesmo
// sem enxergar a cor.
export const ESTILO_CRITERIO = {
  atendido: {
    caixa: "bg-emerald-100 border-emerald-300 text-emerald-900",
    icone: "check_circle",
    corIcone: "text-emerald-700",
  },
  naoAtendido: {
    caixa: "bg-[#9e0a24] border-[#9e0a24] text-white",
    icone: "cancel",
    corIcone: "text-white",
  },
  // Antes de qualquer validação, só o nome do critério, sem julgamento.
  semValidacao: {
    caixa: "bg-white border-[#eadede] text-[#5f5e5e]",
    icone: "radio_button_unchecked",
    corIcone: "text-[#c9a5a5]",
  },
};
