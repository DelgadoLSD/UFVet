import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CLASSE_ENTRADA } from "./Campo";

// Campo em que a pessoa escolhe numa lista, que já aparece ao clicar e vai se
// estreitando conforme ela digita: usado para cidade e bairro. Tem a mesma
// cara do Campo comum, para não destoar dos vizinhos no formulário.
//
// Segue o padrão de combobox da WAI-ARIA: setas percorrem as opções, Enter
// escolhe, Esc desiste, e o leitor de tela é avisado de quantas opções há.
//
// `sugerir(texto)` devolve { itens, total, sugestoes }; `sugestoes` indica a
// lista mostrada antes de a pessoa digitar. Cada item tem valor, rótulo e,
// opcionalmente, marcador (a UF), trecho (o pedaço que casou com a busca) e
// livre (a opção de usar o texto digitado). `aoSair(texto)` decide o que fazer
// quando a pessoa sai do campo sem escolher: devolve um valor aceito, ou null
// para manter o texto e avisar que falta escolher.

function Trecho({ texto, trecho }) {
  if (!trecho) return texto;
  const [inicio, fim] = trecho;
  return (
    <>
      {texto.slice(0, inicio)}
      <mark className="bg-transparent font-bold text-[#8e001b]">
        {texto.slice(inicio, fim)}
      </mark>
      {texto.slice(fim)}
    </>
  );
}

function CampoBusca({
  id,
  rotulo,
  valor,
  onEscolher,
  sugerir,
  aoSair,
  aoFocar,
  placeholder,
  desabilitado = false,
  carregando = false,
  dica,
  vazio,
  erro,
  ajuda,
  rodape,
  maxLength,
}) {
  // null enquanto a pessoa não digitou nada: o campo mostra o valor escolhido.
  const [termo, setTermo] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [pendente, setPendente] = useState(false);
  const listaRef = useRef(null);
  const listaId = useId();
  const avisoId = useId();

  const texto = termo ?? "";
  const { itens, total, sugestoes } = useMemo(
    () => (aberto ? sugerir(texto) : { itens: [], total: 0 }),
    [aberto, texto, sugerir],
  );
  const ativoValido = ativo < itens.length ? ativo : -1;

  // A opção destacada precisa ficar visível numa lista longa. A rolagem é feita
  // só dentro da lista: scrollIntoView rolaria a página inteira, e a lista
  // passaria por baixo do cursor parado, roubando o destaque.
  useEffect(() => {
    const lista = listaRef.current;
    const opcao = lista?.querySelector(`[data-indice="${ativoValido}"]`);
    if (!opcao) return;
    const topo = opcao.offsetTop - lista.offsetTop;
    const base = topo + opcao.offsetHeight;
    if (topo < lista.scrollTop) lista.scrollTop = topo - 6;
    else if (base > lista.scrollTop + lista.clientHeight)
      lista.scrollTop = base - lista.clientHeight + 6;
  }, [ativoValido]);

  const escolher = (item) => {
    onEscolher(item.valor);
    setTermo(null);
    setPendente(false);
    setAberto(false);
    setAtivo(-1);
  };

  const sair = () => {
    setAberto(false);
    setAtivo(-1);
    if (termo === null) return;
    if (!termo.trim()) {
      onEscolher("");
      setTermo(null);
      setPendente(false);
      return;
    }
    const aceito = aoSair?.(termo);
    if (aceito) {
      onEscolher(aceito);
      setTermo(null);
      setPendente(false);
    } else {
      setPendente(true);
    }
  };

  const aoTeclar = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!aberto) return setAberto(true);
      if (!itens.length) return;
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setAtivo((i) => (i + passo + itens.length) % itens.length);
    } else if (e.key === "Enter") {
      // Sem isto, o Enter enviaria o formulário com a cidade ainda por escolher.
      if (aberto && ativoValido >= 0) {
        e.preventDefault();
        escolher(itens[ativoValido]);
      } else if (aberto && termo !== null) {
        e.preventDefault();
      }
    } else if (e.key === "Escape" && aberto) {
      e.preventDefault();
      setAberto(false);
      setTermo(null);
      setPendente(false);
    }
  };

  const mensagem = carregando
    ? "Carregando…"
    : texto.trim()
      ? vazio?.(texto.trim())
      : dica;
  const status = !aberto
    ? ""
    : carregando
      ? "Carregando opções"
      : itens.length
        ? `${itens.length} ${itens.length === 1 ? "opção" : "opções"}. Use as setas para escolher.`
        : mensagem || "";
  const aviso = pendente ? erro : ajuda;
  const textoRodape = rodape?.({
    total,
    mostrados: itens.length,
    sugestoes: !!sugestoes,
  });
  const mostrarPainel = aberto && !desabilitado && (itens.length > 0 || mensagem);

  return (
    <div>
      <label
        htmlFor={id}
        className={`block text-sm font-semibold mb-2 ${
          desabilitado ? "text-[#a79d9d]" : "text-[#1a1c1c]"
        }`}
      >
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={!!mostrarPainel}
          aria-controls={listaId}
          aria-activedescendant={
            aberto && ativoValido >= 0 ? `${listaId}-${ativoValido}` : undefined
          }
          aria-describedby={aviso ? avisoId : undefined}
          aria-invalid={pendente || undefined}
          autoComplete="off"
          spellCheck={false}
          maxLength={maxLength}
          disabled={desabilitado}
          placeholder={placeholder}
          value={termo ?? valor}
          onFocus={(e) => {
            e.target.select();
            aoFocar?.();
            setAberto(true);
            // A lista abre já rolada até o que está escolhido, e as setas
            // partem dali.
            const atual = sugerir("").itens.findIndex(
              (item) => !item.livre && item.valor === valor,
            );
            setAtivo(atual);
          }}
          onClick={() => setAberto(true)}
          onBlur={sair}
          onChange={(e) => {
            setTermo(e.target.value);
            setPendente(false);
            setAberto(true);
            setAtivo(e.target.value.trim() ? 0 : -1);
          }}
          onKeyDown={aoTeclar}
          className={`w-full h-12 pl-4 pr-11 ${CLASSE_ENTRADA} disabled:bg-[#f7f3f3] disabled:text-[#a79d9d] disabled:cursor-not-allowed disabled:shadow-none disabled:hover:border-[#dccfcf]`}
        />
        <span
          aria-hidden="true"
          className={`material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[20px] ${
            desabilitado ? "text-[#cfc4c4]" : "text-[#8f6f6e]"
          } ${carregando && aberto ? "motion-safe:animate-spin" : ""} ${
            aberto && !carregando ? "rotate-180" : ""
          } transition-transform`}
        >
          {carregando && aberto ? "progress_activity" : "expand_more"}
        </span>

        {mostrarPainel && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute z-30 left-0 right-0 mt-2 bg-white border border-[#eadede] rounded-xl shadow-[0_12px_32px_-8px_rgba(26,28,28,0.25)] overflow-hidden motion-safe:animate-aparecer"
          >
            <ul
              id={listaId}
              ref={listaRef}
              role="listbox"
              aria-label={rotulo}
              className={itens.length ? "max-h-72 overflow-y-auto p-1.5" : ""}
            >
              {itens.map((item, i) => {
                const escolhido = !item.livre && item.valor === valor;
                return (
                  <li
                    key={item.id}
                    id={`${listaId}-${i}`}
                    data-indice={i}
                    role="option"
                    aria-selected={escolhido}
                    // Só o movimento real do mouse muda o destaque; a lista
                    // rolando por baixo de um cursor parado, não.
                    onMouseMove={() => i !== ativoValido && setAtivo(i)}
                    onClick={() => escolher(item)}
                    className={`flex items-center gap-3 min-h-11 px-3 py-2 rounded-lg cursor-pointer text-sm text-[#1a1c1c] ${
                      i === ativoValido ? "bg-[#faf3f3]" : ""
                    }`}
                  >
                    {item.livre ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="material-symbols-outlined text-[18px] text-[#8e001b]"
                        >
                          add
                        </span>
                        <span className="flex-1 min-w-0 truncate">
                          Usar “<span className="font-semibold">{item.rotulo}</span>”
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className={`flex-1 min-w-0 truncate ${
                            escolhido ? "font-semibold" : ""
                          }`}
                        >
                          <Trecho texto={item.rotulo} trecho={item.trecho} />
                        </span>
                        {item.marcador && (
                          <span className="shrink-0 text-[11px] font-bold leading-none px-1.5 py-1 rounded-md bg-[#f5efef] text-[#5b403f]">
                            {/* Sem isto o leitor de tela diria "ViçosaMG". */}
                            <span className="sr-only">, </span>
                            {item.marcador}
                          </span>
                        )}
                        {escolhido && (
                          <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-[18px] text-[#8e001b] shrink-0"
                          >
                            check
                          </span>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {!itens.length && (
              <p className="px-4 py-3.5 text-sm text-[#5f5e5e] leading-snug">
                {mensagem}
              </p>
            )}
            {textoRodape && (
              <p className="px-4 py-2 border-t border-[#f0e6e6] bg-[#fcfafa] text-[11px] text-[#8f6f6e]">
                {textoRodape}
              </p>
            )}
          </div>
        )}
      </div>

      {aviso && (
        <p
          id={avisoId}
          className={`text-xs mt-2 ${pendente ? "text-red-600" : "text-[#5f5e5e]"}`}
        >
          {aviso}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

export default CampoBusca;
