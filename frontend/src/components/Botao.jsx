// Sistema único de botões do app. Botões usam cantos arredondados (xl/lg) e
// as etiquetas de status usam pílula (rounded-full) — assim dá para distinguir
// "o que eu clico" de "o que só informa".
const VARIANTES = {
  primario:
    "text-white bg-[#b7102a] shadow-[0_1px_2px_rgba(142,0,27,0.25)] hover:bg-[#8e001b]",
  secundario:
    "text-[#1a1c1c] bg-white border border-[#e6dcdc] shadow-[0_1px_2px_rgba(26,28,28,0.06)] hover:bg-[#faf6f6] hover:border-[#d6c3c3]",
  // Editar é uma ação comum, não um destaque: botão neutro, no tom da página.
  editar:
    "text-[#1a1c1c] bg-[#f4efef] hover:bg-[#ebe3e3]",
  // Excluir tem o mesmo formato de editar e só assume o vermelho no hover.
  perigo: "text-[#5f5e5e] bg-[#f4efef] hover:text-red-600 hover:bg-red-50",
  perigoSolido: "text-white bg-red-600 hover:bg-red-700",
  fantasma: "text-[#8e001b] hover:bg-[#8e001b]/[0.06]",
  // Para blocos escuros ou vermelhos, onde o vermelho sólido sumiria.
  claro: "text-[#8e001b] bg-white hover:bg-white/90",
  contornoClaro: "text-white border border-white/40 hover:bg-white/10",
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
  // Só ícone, sem texto: botão quadrado (use aria-label para dar nome a ele).
  const soIcone = icone && !children ? "aspect-square !px-0" : "";

  return (
    <Componente
      {...extras}
      {...props}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap select-none cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e001b]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${t.classe} ${soIcone} ${VARIANTES[variante]} ${className}`}
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
