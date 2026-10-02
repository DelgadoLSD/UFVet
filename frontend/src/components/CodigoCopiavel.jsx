import { useCopiar } from "../hooks/useCopiar";

// Código público de uma pessoa ou de um animal (#T3M8P1). Um clique copia o
// código: útil para passar a alguém por mensagem ou para achar na busca.
function CodigoCopiavel({ codigo, rotulo = "Código" }) {
  const [copiado, copiar] = useCopiar();

  return (
    <button
      type="button"
      onClick={() => copiar(`#${codigo}`)}
      title={copiado ? "Copiado!" : `Copiar ${rotulo.toLowerCase()}`}
      aria-label={`Copiar ${rotulo.toLowerCase()} ${codigo}`}
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[11px] font-bold tracking-wide transition-colors ${
        copiado
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-[#faf6f6] border-[#eadede] text-[#8e001b] hover:bg-[#f5e9e9] hover:border-[#dcc6c6]"
      }`}
    >
      #{codigo}
      <span
        className="material-symbols-outlined text-[13px]"
        aria-hidden="true"
      >
        {copiado ? "check" : "content_copy"}
      </span>
      <span className="sr-only" aria-live="polite">
        {copiado ? "Código copiado" : ""}
      </span>
    </button>
  );
}

export default CodigoCopiavel;
