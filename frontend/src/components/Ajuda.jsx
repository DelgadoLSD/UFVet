import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Botão "?" que explica um dado num balão. No computador abre ao pousar o
// mouse por um instante, sem precisar clicar; no celular, e para quem prefere,
// abre com clique. Um clique "fixa" o balão aberto até clicar fora, apertar
// Esc, rolar a página ou mudar o tamanho da janela.
//
// Para um "?" que abre um modal com a explicação completa, use BotaoAjuda.

const LARGURA = 264;
const MARGEM = 12;
// Altura de um balão com texto mais longo; abaixo disso, abre para cima.
const ESPACO_MINIMO_ABAIXO = 220;
const ATRASO_ABRIR = 350;
const ATRASO_FECHAR = 180;
function Ajuda({ titulo, children, claro = false, className = "" }) {
  const [posicao, setPosicao] = useState(null);
  const [fixado, setFixado] = useState(false);
  const botaoRef = useRef(null);
  const balaoRef = useRef(null);
  const timer = useRef(null);

  // Só dispositivos com mouse abrem o balão ao pousar o ponteiro.
  const temHover = () => window.matchMedia("(hover: hover)").matches;

  const calcularPosicao = () => {
    const r = botaoRef.current.getBoundingClientRect();
    const esquerda = Math.min(
      Math.max(r.left + r.width / 2 - LARGURA / 2, MARGEM),
      window.innerWidth - LARGURA - MARGEM,
    );
    const espacoAbaixo = window.innerHeight - r.bottom;
    if (espacoAbaixo < ESPACO_MINIMO_ABAIXO && r.top > espacoAbaixo) {
      return { bottom: window.innerHeight - r.top + 8, left: esquerda };
    }
    return { top: r.bottom + 8, left: esquerda };
  };

  const agendar = (fn, ms) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };

  const fechar = useCallback(() => {
    clearTimeout(timer.current);
    setPosicao(null);
    setFixado(false);
  }, []);

  const aoEntrar = () => {
    if (!temHover() || fixado) return;
    if (posicao) {
      clearTimeout(timer.current);
      return;
    }
    agendar(() => setPosicao(calcularPosicao()), ATRASO_ABRIR);
  };

  const aoSair = () => {
    if (!temHover() || fixado) return;
    agendar(() => setPosicao(null), ATRASO_FECHAR);
  };

  const aoClicar = () => {
    clearTimeout(timer.current);
    if (posicao && fixado) return fechar();
    setPosicao(posicao ?? calcularPosicao());
    setFixado(true);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const aberto = !!posicao;

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (e) => {
      if (
        balaoRef.current?.contains(e.target) ||
        botaoRef.current?.contains(e.target)
      )
        return;
      fechar();
    };
    const fecharTecla = (e) => e.key === "Escape" && fechar();

    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", fecharTecla);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("keydown", fecharTecla);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [aberto, fechar]);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={aoClicar}
        onMouseEnter={aoEntrar}
        onMouseLeave={aoSair}
        onFocus={() => !posicao && setPosicao(calcularPosicao())}
        onBlur={() => !fixado && setPosicao(null)}
        onKeyDown={(e) => {
          // Com o balão aberto, o Esc fecha só o balão, e não o modal em
          // volta dele.
          if (e.key === "Escape" && posicao) {
            e.preventDefault();
            fechar();
          }
        }}
        aria-label={`Entenda: ${titulo}`}
        aria-expanded={!!posicao}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none normal-case tracking-normal cursor-help transition-colors shrink-0 ${
          claro
            ? "bg-white/25 text-white hover:bg-white hover:text-[#8e001b]"
            : "bg-[#8e001b]/10 text-[#8e001b] hover:bg-[#8e001b] hover:text-white"
        } ${className}`}
      >
        ?
      </button>

      {/* Renderizado direto no <body>: um ancestral com transform, filter ou
          overflow-hidden (card que sobe no hover, fundo borrado de modal)
          prenderia o balão "fixo" dentro dele e o esconderia. */}
      {posicao &&
        createPortal(
          <div
            ref={balaoRef}
            role="tooltip"
            onMouseEnter={() => clearTimeout(timer.current)}
            onMouseLeave={aoSair}
            style={{ ...posicao, width: LARGURA }}
            className="fixed z-[70] bg-white border border-[#e4bebc] rounded-xl shadow-xl p-4 text-left normal-case tracking-normal animate-aparecer"
          >
            <p className="text-sm font-bold text-[#1a1c1c] mb-1.5">{titulo}</p>
            <div className="text-xs font-normal text-[#5b403f] leading-relaxed space-y-2">
              {children}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default Ajuda;
