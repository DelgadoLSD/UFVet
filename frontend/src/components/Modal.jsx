import { useEffect, useId, useRef } from "react";

// Janela sobre a página (diálogo), usada por todos os modais do site:
// cabeçalho com título e botão de fechar, corpo que rola sozinho e um rodapé
// opcional para os botões de ação.
//
// Fecha pelo X, por um clique fora da janela ou pela tecla Esc. Ao abrir, o
// foco do teclado entra na janela; ao fechar, volta para onde estava (em
// geral, o botão que abriu o modal).
function Modal({
  titulo,
  subtitulo,
  largura = "max-w-xl",
  altura = "max-h-[90vh]",
  onFechar,
  children,
  rodape,
}) {
  const janelaRef = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    const focoAnterior = document.activeElement;
    janelaRef.current?.focus({ preventScroll: true });
    return () => focoAnterior?.focus?.({ preventScroll: true });
  }, []);

  // Campos com lista aberta (seleção, busca de cidade) usam o Esc para
  // fechar a própria lista e marcam o evento: nesse caso a janela fica.
  const aoTeclar = (e) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.stopPropagation();
      onFechar();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        ref={janelaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onKeyDown={aoTeclar}
        className={`bg-white rounded-2xl shadow-2xl w-full ${largura} ${altura} flex flex-col focus:outline-none`}
      >
        <div className="border-b border-[#e4bebc] px-8 py-5 flex items-center justify-between gap-4 shrink-0">
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
            onClick={onFechar}
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

        <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {rodape && (
          <div className="border-t border-[#e4bebc] px-8 py-4 shrink-0">
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
