import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useCelular } from "../hooks/useCelular";
import { movimentoReduzido } from "../util/movimento";

// Janela sobre a página (diálogo), usada por todos os modais do site:
// cabeçalho com título e botão de fechar, corpo que rola sozinho e um rodapé
// opcional para os botões de ação.
//
// A janela é desenhada direto no <body>, e não onde o componente está: uma
// seção fechada no celular (escondida) esconderia junto a janela que o "?"
// dela abriu, e um ancestral com transform prenderia a janela "fixa" dentro
// dele.
//
// Fecha pelo X, por um clique fora da janela ou pela tecla Esc. Ao abrir, o
// foco do teclado entra na janela; ao fechar, volta para onde estava (em
// geral, o botão que abriu o modal).
//
// No celular, a janela sobe da borda de baixo e ocupa a largura toda, como
// nos aplicativos: sobra mais espaço para o formulário, e os botões ficam
// perto do polegar. Os botões do rodapé dividem a linha em partes iguais,
// na mesma largura dos campos; o principal fica à direita. Como nos
// aplicativos, ela também fecha arrastada para baixo (a barrinha no topo
// mostra isso): segue o dedo e, solta depois de um terço do caminho ou num
// puxão rápido, desce e fecha; antes disso, volta ao lugar. O arraste pelo
// conteúdo só vale com ele no começo da rolagem (senão o dedo rola o
// conteúdo). Janela com campos (um formulário) só fecha arrastada pelo topo:
// rolando um formulário comprido, um puxão sem querer não leva o que foi
// digitado. Fechada pelo X, por fora ou pelo Esc, ela também desce.

// A curva das janelas que saem: começam devagar e aceleram para fora.
const SAIDA = "240ms cubic-bezier(0.4, 0, 1, 1)";
const VOLTA = "320ms cubic-bezier(0.32, 0.72, 0, 1)";

function Modal({
  titulo,
  subtitulo,
  largura = "max-w-xl",
  altura = "max-h-[90vh]",
  onFechar,
  children,
  rodape,
}) {
  const fundoRef = useRef(null);
  const janelaRef = useRef(null);
  const tituloId = useId();
  const celular = useCelular();
  // A função de fechar mais recente, para o fim da animação; se a janela já
  // está saindo (para não fechar duas vezes); e o fim de um arraste, para o
  // clique que o navegador às vezes solta em seguida não contar como clique
  // fora.
  const atual = useRef(onFechar);
  useEffect(() => {
    atual.current = onFechar;
  });
  const fechando = useRef(false);
  const espera = useRef(null);
  const acabouDeArrastar = useRef(false);

  useEffect(() => {
    const focoAnterior = document.activeElement;
    janelaRef.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(espera.current);
      focoAnterior?.focus?.({ preventScroll: true });
    };
  }, []);

  // No celular, a janela desce antes de sumir; quem pediu menos movimento ao
  // sistema (e o computador) a vê sumir na hora.
  const deslizarParaFora = useCallback(() => {
    if (fechando.current) return;
    fechando.current = true;
    const fundo = fundoRef.current;
    const janela = janelaRef.current;
    if (movimentoReduzido()) {
      atual.current();
      return;
    }
    fundo.style.pointerEvents = "none";
    fundo.style.transition = `background-color ${SAIDA}, backdrop-filter ${SAIDA}`;
    fundo.style.backgroundColor = "rgba(0, 0, 0, 0)";
    fundo.style.backdropFilter = "none";
    janela.style.transition = `transform ${SAIDA}`;
    janela.style.transform = "translateY(100%)";
    espera.current = setTimeout(() => atual.current(), 240);
  }, []);
  const pedirFechar = () => (celular ? deslizarParaFora() : onFechar());

  // O arraste para baixo, no celular. Os toques são escutados no fundo (que
  // contém a janela): o que acontece entre o dedo e a janela decide se o
  // gesto puxa a janela ou rola o conteúdo.
  useEffect(() => {
    if (!celular) return;
    const fundo = fundoRef.current;
    const janela = janelaRef.current;
    let gesto = null;

    // Algo entre o dedo e o fundo está rolado para baixo? Aí o dedo rola o
    // conteúdo de volta, em vez de puxar a janela.
    const roladoParaBaixo = (alvo) => {
      for (let el = alvo; el && el !== fundo; el = el.parentElement) {
        if (el.scrollTop > 0) return true;
      }
      return false;
    };

    const aoTocar = (e) => {
      gesto = null;
      if (e.touches.length !== 1 || fechando.current) return;
      const alvo = e.target;
      if (alvo.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      const peloTopo = !!alvo.closest("[data-topo-da-janela]");
      const temCampos = !!janela.querySelector(
        "input:not([type='hidden']), textarea, select",
      );
      if (!peloTopo && (temCampos || roladoParaBaixo(alvo))) return;
      const toque = e.touches[0];
      gesto = {
        x: toque.clientX,
        y: toque.clientY,
        arrastando: false,
        pontos: [{ y: toque.clientY, t: e.timeStamp }],
      };
    };

    const aoMover = (e) => {
      if (!gesto) return;
      const toque = e.touches[0];
      const dy = toque.clientY - gesto.y;
      const dx = toque.clientX - gesto.x;
      if (!gesto.arrastando) {
        // Para o lado ou para cima, não é para fechar: o gesto segue normal.
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          gesto = null;
          return;
        }
        if (dy < 8) return;
        gesto.arrastando = true;
        janela.style.transition = "none";
        fundo.style.transition = "none";
      }
      e.preventDefault();
      const descida = Math.max(0, dy);
      const fracao = Math.min(1, descida / janela.offsetHeight);
      janela.style.transform = `translateY(${descida}px)`;
      fundo.style.backgroundColor = `rgba(0, 0, 0, ${0.5 * (1 - fracao)})`;
      gesto.pontos.push({ y: toque.clientY, t: e.timeStamp });
      if (gesto.pontos.length > 5) gesto.pontos.shift();
    };

    const aoSoltar = () => {
      const g = gesto;
      gesto = null;
      if (!g?.arrastando) return;
      acabouDeArrastar.current = true;
      setTimeout(() => {
        acabouDeArrastar.current = false;
      }, 400);
      const primeiro = g.pontos[0];
      const ultimo = g.pontos.at(-1);
      // Velocidade dos últimos instantes do dedo, em pixels por milissegundo.
      const velocidade =
        (ultimo.y - primeiro.y) / Math.max(1, ultimo.t - primeiro.t);
      const descida = ultimo.y - g.y;
      if (descida > janela.offsetHeight / 3 || velocidade > 0.6) {
        deslizarParaFora();
        return;
      }
      janela.style.transition = `transform ${VOLTA}`;
      fundo.style.transition = `background-color ${VOLTA}`;
      janela.style.transform = "";
      fundo.style.backgroundColor = "";
    };

    fundo.addEventListener("touchstart", aoTocar, { passive: true });
    fundo.addEventListener("touchmove", aoMover, { passive: false });
    fundo.addEventListener("touchend", aoSoltar);
    fundo.addEventListener("touchcancel", aoSoltar);
    return () => {
      fundo.removeEventListener("touchstart", aoTocar);
      fundo.removeEventListener("touchmove", aoMover);
      fundo.removeEventListener("touchend", aoSoltar);
      fundo.removeEventListener("touchcancel", aoSoltar);
    };
  }, [celular, deslizarParaFora]);

  // Campos com lista aberta (seleção, busca de cidade) usam o Esc para
  // fechar a própria lista e marcam o evento: nesse caso a janela fica.
  const aoTeclar = (e) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.stopPropagation();
      pedirFechar();
    }
  };

  return createPortal(
    <div
      ref={fundoRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 max-sm:items-end max-sm:p-0 max-sm:animate-escurecer motion-reduce:animate-none"
      onClick={(e) =>
        e.target === e.currentTarget &&
        !acabouDeArrastar.current &&
        pedirFechar()
      }
    >
      <div
        ref={janelaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onKeyDown={aoTeclar}
        className={`bg-white rounded-2xl shadow-2xl w-full ${largura} ${altura} flex flex-col focus:outline-none max-sm:rounded-b-none max-sm:max-h-[92dvh] max-sm:animate-subir motion-reduce:animate-none`}
      >
        {/* O topo da janela: no celular, a barrinha de arrastar em cima do
            título; por aqui, toda janela fecha arrastada para baixo. */}
        <div data-topo-da-janela className="shrink-0 max-sm:touch-none">
          <div
            aria-hidden="true"
            className="sm:hidden flex justify-center pt-2.5"
          >
            <span className="w-10 h-1 rounded-full bg-[#dccfcf]" />
          </div>
          <div className="border-b border-[#e4bebc] px-8 py-5 max-sm:px-5 max-sm:pt-2.5 max-sm:pb-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 id={tituloId} className="text-xl font-bold text-[#1a1c1c]">
                {titulo}
              </h2>
              {subtitulo && (
                <p className="text-xs text-[#5f5e5e] mt-0.5">{subtitulo}</p>
              )}
            </div>
            <button
              type="button"
              onClick={pedirFechar}
              aria-label="Fechar"
              className="w-9 h-9 rounded-full bg-[#f3f3f3] flex items-center justify-center hover:bg-[#e4bebc] transition-colors shrink-0"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[#5f5e5e] text-xl"
              >
                close
              </span>
            </button>
          </div>
        </div>

        <div className="px-8 py-6 max-sm:px-5 max-sm:py-5 overflow-y-auto overscroll-contain flex-1 min-h-0">
          {children}
        </div>

        {rodape && (
          <div className="border-t border-[#e4bebc] px-8 py-4 shrink-0 max-sm:px-5 max-sm:[&_div:has(>button)]:w-full max-sm:[&_button]:flex-1 max-sm:[&_button]:h-11">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
