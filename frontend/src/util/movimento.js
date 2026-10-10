// A pessoa pediu ao sistema menos movimento na tela? Aí as trocas do site
// acontecem na hora, sem deslizar.
//
// As trocas do carrossel de animais (a placa vermelha que passa de um cartão
// para o outro e o cartão completo que desliza embaixo) usam a mesma duração
// e a mesma curva, definidas no tailwind.config.js (duration-deslize,
// ease-deslize e as animações de sair e entrar), para parecerem um movimento
// só.
export const movimentoReduzido = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
