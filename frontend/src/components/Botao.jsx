// Sistema único de botões do app. Botões usam cantos arredondados (xl/lg) e
// as etiquetas de status usam pílula (rounded-full) — assim dá para distinguir
// "o que eu clico" de "o que só informa".
const VARIANTES = {
  primario:
    "text-white bg-gradient-to-b from-[#b7102a] to-[#8e001b] shadow-[0_1px_2px_rgba(142,0,27,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_6px_16px_-4px_rgba(142,0,27,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-110",
  secundario:
    "text-[#1a1c1c] bg-white border border-[#e6dcdc] shadow-[0_1px_2px_rgba(26,28,28,0.06)] hover:bg-[#faf6f6] hover:border-[#d6c3c3]",
  editar:
    "text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200",
  perigo:
    "text-[#5f5e5e] bg-white border border-[#e6dcdc] hover:text-red-600 hover:bg-red-50 hover:border-red-200",
  perigoSolido:
    "text-white bg-red-600 shadow-[0_1px_2px_rgba(220,38,38,0.3)] hover:bg-red-700",
  fantasma: "text-[#8e001b] hover:bg-[#8e001b]/[0.06]",
};

const TAMANHOS = {
  sm: { classe: "h-8 px-3 text-xs gap-1.5 rounded-lg", icone: "text-[16px]" },
  md: { classe: "h-10 px-4 text-sm gap-2 rounded-xl", icone: "text-[18px]" },
  lg: { classe: "h-12 px-6 text-sm gap-2 rounded-xl", icone: "text-[20px]" },
};

function Botao({
  as: Componente = "button",
  variante = "primario",
  tamanho = "md",
  icone,
  className = "",
  children,
  ...props
}) {
  const t = TAMANHOS[tamanho];
  const extras = Componente === "button" ? { type: "button" } : {};

  return (
    <Componente
      {...extras}
      {...props}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap select-none cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e001b]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${t.classe} ${VARIANTES[variante]} ${className}`}
    >
      {icone && (
        <span className={`material-symbols-outlined ${t.icone}`} aria-hidden="true">
          {icone}
        </span>
      )}
      {children}
    </Componente>
  );
}

export default Botao;
