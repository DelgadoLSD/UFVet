/** @type {import('tailwindcss').Config} */

// A troca de animal no carrossel do perfil: 420 ms, numa curva que sai rápida
// e assenta suave, sem quicar (a das trocas de tela do iPhone). A placa
// vermelha da faixa e o cartão completo embaixo usam os mesmos valores, para
// se moverem juntos (ver util/movimento.js).
const DESLIZE = "420ms cubic-bezier(0.32, 0.72, 0, 1)";
// O cartão que sai e o que entra andam a largura inteira, mais o vão entre
// eles, como duas páginas lado a lado.
const LADO = "calc(100% + 32px)";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        aparecer: {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sair-para-esquerda": {
          to: { transform: `translateX(calc(-1 * ${LADO}))` },
        },
        "sair-para-direita": {
          to: { transform: `translateX(${LADO})` },
        },
        "entrar-pela-direita": {
          from: { transform: `translateX(${LADO})` },
        },
        "entrar-pela-esquerda": {
          from: { transform: `translateX(calc(-1 * ${LADO}))` },
        },
      },
      animation: {
        aparecer: "aparecer 120ms ease-out",
        "sair-para-esquerda": `sair-para-esquerda ${DESLIZE} forwards`,
        "sair-para-direita": `sair-para-direita ${DESLIZE} forwards`,
        "entrar-pela-direita": `entrar-pela-direita ${DESLIZE}`,
        "entrar-pela-esquerda": `entrar-pela-esquerda ${DESLIZE}`,
      },
      transitionDuration: {
        deslize: "420ms",
      },
      transitionTimingFunction: {
        deslize: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};
