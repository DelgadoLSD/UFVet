import { useEffect, useId, useRef, useState } from "react";

// Campo de seleção próprio, no lugar do <select> nativo (cuja lista aberta
// usa o visual do sistema operacional e não segue a identidade do site).
// Funciona por teclado: setas navegam, Enter escolhe, Esc fecha.
//
// `opcoes` é uma lista de { valor, rotulo, rotuloCurto?, descricao?, icone? }.
// Os ícones são opcionais: sem `icone` (no campo e nas opções), o campo
// mostra só o texto, quando o nome dele já está escrito em cima.
// `rotulo` nomeia o campo para leitores de tela, já que o texto acima dele
// costuma ser um título, e não um <label>. `onEscolher` recebe o valor da
// opção escolhida. Com `limpavel`, um "x" ao lado desfaz a escolha (o valor
// volta a ser ""). Com `desabilitado`, o campo fica apagado e não abre: o
// `placeholder` diz o que falta fazer antes (escolher a cidade, por exemplo).
//
// `compacto` é a versão para uma escolha no meio de uma linha, como a ordem
// dos resultados da busca: uma pílula do tamanho do texto, com o `prefixo`
// apagado antes do valor ("Ordenar por Validados primeiro"), e a lista
// aberta alinhada pela direita (no celular, onde a pílula fica sozinha na
// linha, pela esquerda).
function Selecao({
  opcoes,
  valor,
  onEscolher,
  placeholder,
  icone,
  rotulo,
  limpavel = true,
  desabilitado = false,
  compacto = false,
  prefixo,
}) {
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
    onEscolher(opcao.valor);
    setAberto(false);
  };

  const aoTeclar = (e) => {
    if (!aberto && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      return abrir();
    }
    if (!aberto) return;
    if (e.key === "Escape") {
      // Marca o Esc como usado: dentro de um modal, fecha só a lista.
      e.preventDefault();
      setAberto(false);
    }
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
    <div ref={raizRef} className={compacto ? "relative inline-block" : "relative"}>
      <button
        type="button"
        role="combobox"
        aria-label={selecionada ? `${rotulo}: ${selecionada.rotulo}` : rotulo}
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-haspopup="listbox"
        disabled={desabilitado}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={aoTeclar}
        className={`flex items-center border text-sm text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]/30 ${
          compacto
            ? "h-9 gap-1.5 pl-4 pr-2.5 rounded-full whitespace-nowrap"
            : "w-full h-11 gap-2.5 pl-3 pr-2 rounded-xl"
        } ${
          desabilitado
            ? "bg-[#faf6f6] border-[#eadede] cursor-not-allowed"
            : aberto
              ? "bg-white border-[#9e0a24] ring-2 ring-[#9e0a24]/15 shadow-[0_1px_2px_rgba(26,28,28,0.05)]"
              : compacto
                ? "bg-white border-[#eadede] hover:border-[#cfa9a7]"
                : "bg-white border-[#e4bebc] hover:border-[#cfa9a7] shadow-[0_1px_2px_rgba(26,28,28,0.05)]"
        }`}
      >
        {prefixo && <span className="text-[#5f5e5e]">{prefixo}</span>}
        {(selecionada?.icone ?? icone) && (
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-[18px] shrink-0 ${
              selecionada ? "text-[#9e0a24]" : "text-[#8f6f6e]"
            }`}
          >
            {selecionada?.icone ?? icone}
          </span>
        )}
        <span
          className={`flex-1 truncate ${
            selecionada
              ? `text-[#1a1c1c] ${compacto ? "font-bold" : "font-semibold"}`
              : "text-[#8f6f6e]"
          } ${limpavel && selecionada ? "pr-7" : ""}`}
        >
          {selecionada
            ? (selecionada.rotuloCurto ?? selecionada.rotulo)
            : placeholder}
        </span>
        <span
          aria-hidden="true"
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
            onEscolher("");
            setAberto(false);
          }}
          className="absolute top-1/2 -translate-y-1/2 right-9 w-6 h-6 flex items-center justify-center rounded-md text-[#8f6f6e] hover:text-[#7d0a1d] hover:bg-[#faf0f0] transition-colors"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[16px]"
          >
            close
          </span>
        </button>
      )}

      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          className={`absolute z-30 mt-2 p-1.5 bg-white border border-[#eadede] rounded-xl shadow-[0_12px_32px_-8px_rgba(26,28,28,0.25)] animate-aparecer ${
            compacto ? "left-0 sm:left-auto sm:right-0 w-72" : "left-0 right-0"
          }`}
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
                {opcao.icone && (
                  <span
                    aria-hidden="true"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      ativa
                        ? "bg-[#9e0a24] text-white"
                        : "bg-[#f5efef] text-[#9e0a24]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {opcao.icone}
                    </span>
                  </span>
                )}
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
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px] text-[#9e0a24]"
                  >
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
