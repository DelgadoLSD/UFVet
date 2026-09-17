import { useEffect, useState } from "react";

// Identificador curto de uma pessoa ou animal. Um clique copia o código —
// útil para passar a alguém por mensagem ou para localizar na busca.
function CodigoCopiavel({ codigo, rotulo = "Código" }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 1600);
    return () => clearTimeout(t);
  }, [copiado]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`#${codigo}`);
      setCopiado(true);
    } catch {
      // Sem permissão de área de transferência: o código continua visível
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      title={copiado ? "Copiado!" : `Copiar ${rotulo.toLowerCase()}`}
      aria-label={`Copiar ${rotulo.toLowerCase()} ${codigo}`}
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[11px] font-bold tracking-wide transition-colors ${
        copiado
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-[#faf6f6] border-[#eadede] text-[#8e001b] hover:bg-[#f5e9e9] hover:border-[#dcc6c6]"
      }`}
    >
      #{codigo}
      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
        {copiado ? "check" : "content_copy"}
      </span>
      <span className="sr-only" aria-live="polite">
        {copiado ? "Código copiado" : ""}
      </span>
    </button>
  );
}

export default CodigoCopiavel;
