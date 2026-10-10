// A pessoa pediu ao sistema menos movimento na tela? Aí as trocas do site
// acontecem na hora, sem deslizar.
//
// As trocas do carrossel de animais (a faixa que leva o cartão escolhido ao
// centro e o cartão completo que desliza embaixo) usam a mesma duração e a
// mesma curva, para parecerem um movimento só. O cartão de baixo usa as
// animações do tailwind.config.js (com os mesmos valores); a faixa, que anda
// pela rolagem, usa `curvaDeslize`, abaixo.
export const movimentoReduzido = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const DURACAO_DESLIZE_MS = 420;

// Uma curva cubic-bezier(x1, y1, x2, y2), como as do CSS: recebe o tempo
// (0 a 1) e devolve quanto do caminho já foi feito (0 a 1).
function curvaBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t) => ((ax * t + bx) * t + cx) * t;
  const y = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (tempo) => {
    if (tempo <= 0) return 0;
    if (tempo >= 1) return 1;
    // O instante da curva em que x vale `tempo` (método de Newton).
    let t = tempo;
    for (let i = 0; i < 8; i++) {
      const erro = x(t) - tempo;
      const inclinacao = dx(t);
      if (Math.abs(erro) < 1e-6 || Math.abs(inclinacao) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - erro / inclinacao));
    }
    return y(t);
  };
}

// Sai rápido e assenta suave, sem quicar (a das trocas de tela do iPhone).
export const curvaDeslize = curvaBezier(0.32, 0.72, 0, 1);
