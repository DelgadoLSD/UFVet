import { useEffect, useId, useRef, useState } from "react";

// Campo de seleção próprio, no lugar do <select> nativo (cuja lista aberta
// usa o visual do sistema operacional e não segue a identidade do site).
// Funciona por teclado: setas navegam, Enter escolhe, Esc fecha.
function Selecao({ opcoes, valor, onChange, placeholder, icone, limpavel = true }) {
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(0);
  const raizRef = useRef(null);
  const listaId = useId();

  const selecionada = opcoes.find((o) => o.valor === valor);

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (e) => {
      if (!raizRef.current?.contains(e.target)) setAberto(false);
    };
    document.addEventListener("mousedown", fecharFora);
    return () => document.removeEventListener("mousedown", fecharFora);
  }, [aberto]);

  const abrir = () => {
    const i = opcoes.findIndex((o) => o.valor === valor);
    setDestacado(i >= 0 ? i : 0);
    setAberto(true);
  };

  const escolher = (opcao) => {
    onChange(opcao.valor);
    setAberto(false);
  };

  const aoTeclar = (e) => {
    if (!aberto && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      return abrir();
    }
    if (!aberto) return;
    if (e.key === "Escape") setAberto(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestacado((i) => (i + 1) % opcoes.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestacado((i) => (i - 1 + opcoes.length) % opcoes.length);
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      escolher(opcoes[destacado]);
    }
  };

  return (
    <div ref={raizRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-haspopup="listbox"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={aoTeclar}
        className={`w-full h-11 flex items-center gap-2.5 pl-3 pr-2 bg-white border rounded-xl text-sm text-left transition-all shadow-[0_1px_2px_rgba(26,28,28,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8e001b]/30 ${
          aberto
            ? "border-[#8e001b] ring-2 ring-[#8e001b]/15"
            : "border-[#e4bebc] hover:border-[#cfa9a7]"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] shrink-0 ${
            selecionada ? "text-[#8e001b]" : "text-[#8f6f6e]"
          }`}
        >
          {selecionada?.icone ?? icone}
        </span>
        <span
          className={`flex-1 truncate ${
            selecionada ? "text-[#1a1c1c] font-semibold" : "text-[#8f6f6e]"
          } ${limpavel && selecionada ? "pr-7" : ""}`}
        >
          {selecionada ? selecionada.rotuloCurto ?? selecionada.rotulo : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-[20px] text-[#8f6f6e] transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {limpavel && selecionada && (
        <button
          type="button"
          aria-label="Limpar seleção"
          onClick={() => {
            onChange("");
            setAberto(false);
          }}
          className="absolute top-1/2 -translate-y-1/2 right-9 w-6 h-6 flex items-center justify-center rounded-md text-[#8f6f6e] hover:text-[#8e001b] hover:bg-[#faf0f0] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}

      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-2 p-1.5 bg-white border border-[#eadede] rounded-xl shadow-[0_12px_32px_-8px_rgba(26,28,28,0.25)] animate-aparecer"
        >
          {opcoes.map((opcao, i) => {
            const ativa = opcao.valor === valor;
            return (
              <li
                key={opcao.valor}
                role="option"
                aria-selected={ativa}
                onMouseEnter={() => setDestacado(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(opcao)}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                  i === destacado ? "bg-[#faf3f3]" : ""
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    ativa
                      ? "bg-[#8e001b] text-white"
                      : "bg-[#f5efef] text-[#8e001b]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {opcao.icone}
                  </span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#1a1c1c] truncate">
                    {opcao.rotulo}
                  </span>
                  {opcao.descricao && (
                    <span className="block text-[11px] text-[#5f5e5e] truncate">
                      {opcao.descricao}
                    </span>
                  )}
                </span>
                {ativa && (
                  <span className="material-symbols-outlined text-[18px] text-[#8e001b]">
                    check
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Selecao;
