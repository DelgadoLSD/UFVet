import { useRef, useState } from "react";
import NotaFonte from "./NotaFonte";

// Carrossel de afirmações, um cartão por vez: mitos (cartão escuro) ou
// verdades (cartão branco). Passa pelas setas, pelos pontos, pelas setas do
// teclado ou arrastando o dedo no celular.
//
// `itens` é uma lista de { afirmacao, resposta, fonte }.

// Distância mínima, em pixels, para um arrasto contar como troca de cartão.
const ARRASTO_MINIMO = 40;

const CORES = {
  verdade: {
    cartao: "bg-white text-[#1a1c1c]",
    titulo: "text-[#b7102a]",
    resposta: "text-[#5b403f]",
    seta: "border-[#eadede] text-[#1a1c1c] hover:bg-[#fdecee]",
    ponto: "bg-[#b7102a]",
    pontoInativo: "bg-[#eadede]",
    foco: "focus-visible:ring-[#b7102a]",
  },
  mito: {
    cartao: "bg-[#5e0013] text-white",
    titulo: "text-white",
    resposta: "text-white/80",
    seta: "border-white/25 text-white hover:bg-white/10",
    ponto: "bg-white",
    pontoInativo: "bg-white/25",
    foco: "focus-visible:ring-white",
  },
};

const SETAS = [
  { passo: -1, icone: "chevron_left", rotulo: "Anterior" },
  { passo: 1, icone: "chevron_right", rotulo: "Próximo" },
];

function CarrosselAfirmacoes({ verdade = false, itens }) {
  const [indice, setIndice] = useState(0);
  const inicioToque = useRef(null);
  const total = itens.length;
  const nome = verdade ? "Verdade" : "Mito";
  const cores = verdade ? CORES.verdade : CORES.mito;

  // Dá a volta: depois do último vem o primeiro.
  const ir = (novo) => setIndice((novo + total) % total);

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label={verdade ? "Verdades" : "Mitos"}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") ir(indice + 1);
        if (e.key === "ArrowLeft") ir(indice - 1);
      }}
      className={`h-full rounded-[2rem] p-7 md:p-10 flex flex-col ${cores.cartao}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3
          className={`text-5xl md:text-6xl font-extrabold tracking-tighter ${cores.titulo}`}
        >
          {nome}
        </h3>
        <span
          aria-live="polite"
          className="text-sm font-semibold tabular-nums opacity-70"
        >
          {indice + 1} de {total}
        </span>
      </div>

      <div
        className="mt-8 flex-1 overflow-hidden"
        onTouchStart={(e) => {
          inicioToque.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (inicioToque.current === null) return;
          const dx = e.changedTouches[0].clientX - inicioToque.current;
          if (Math.abs(dx) > ARRASTO_MINIMO) {
            ir(dx < 0 ? indice + 1 : indice - 1);
          }
          inicioToque.current = null;
        }}
      >
        {/* Os cartões ficam lado a lado numa faixa que desliza; os que estão
            fora da vista saem da navegação por teclado (inert). */}
        <div
          className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {itens.map((item, i) => (
            <div
              key={item.afirmacao}
              role="group"
              aria-roledescription="item"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={i !== indice}
              inert={i !== indice}
              className="w-full shrink-0"
            >
              <p className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                “{item.afirmacao}”
              </p>
              <p className={`mt-4 text-lg leading-relaxed ${cores.resposta}`}>
                {item.resposta}
                <NotaFonte ids={item.fonte} claro={!verdade} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {itens.map((item, i) => (
            <button
              key={item.afirmacao}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir para ${nome.toLowerCase()} ${i + 1}`}
              aria-current={i === indice}
              className={`h-2 rounded-full transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 ${cores.foco} ${
                i === indice
                  ? `w-6 ${cores.ponto}`
                  : `w-2 ${cores.pontoInativo}`
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {SETAS.map((s) => (
            <button
              key={s.icone}
              type="button"
              onClick={() => ir(indice + s.passo)}
              aria-label={`${s.rotulo} ${nome.toLowerCase()}`}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 ${cores.seta} ${cores.foco}`}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                {s.icone}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CarrosselAfirmacoes;
