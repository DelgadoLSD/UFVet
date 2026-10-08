// Sistema único de botões do app. Botões usam cantos arredondados (xl/lg) e
// as etiquetas de status usam pílula (rounded-full) — assim dá para distinguir
// "o que eu clico" de "o que só informa".
const VARIANTES = {
  primario:
    "text-white bg-[#9e0a24] shadow-[0_1px_2px_rgba(158,10,36,0.25)] hover:bg-[#7d0a1d]",
  secundario:
    "text-[#1a1c1c] bg-white border border-[#e6dcdc] shadow-[0_1px_2px_rgba(26,28,28,0.06)] hover:bg-[#faf6f6] hover:border-[#d6c3c3]",
  // Editar é uma ação comum, não um destaque: botão neutro, no tom da página.
  editar: "text-[#1a1c1c] bg-[#f4efef] hover:bg-[#ebe3e3]",
  // Excluir tem o mesmo formato de editar e só assume o vermelho no hover.
  perigo: "text-[#5f5e5e] bg-[#f4efef] hover:text-[#9e0a24] hover:bg-[#fdecee]",
  perigoSolido: "text-white bg-[#9e0a24] hover:bg-[#7d0a1d]",
  fantasma: "text-[#9e0a24] hover:bg-[#7d0a1d]/[0.06]",
  // Para blocos escuros ou vermelhos, onde o vermelho sólido sumiria.
  claro: "text-[#9e0a24] bg-white hover:bg-white/90",
  contornoClaro: "text-white border border-white/40 hover:bg-white/10",
  // Editar e excluir no cabeçalho vermelho dos cartões dos animais: o mesmo
  // botão quadrado neutro, em branco translúcido.
  sobreVermelho: "text-white bg-white/15 hover:bg-white hover:text-[#7d0a1d]",
};

const TAMANHOS = {
  // Para a faixa vermelha dos painéis (PainelSecao): baixo o bastante para
  // sobrar espaço em volta, em vez de parecer espremido na faixa.
  xs: { classe: "h-7 px-2.5 text-xs gap-1 rounded-lg", icone: "text-[15px]" },
  sm: { classe: "h-8 px-3 text-xs gap-1.5 rounded-lg", icone: "text-[16px]" },
  md: { classe: "h-10 px-4 text-sm gap-2 rounded-xl", icone: "text-[18px]" },
  lg: { classe: "h-12 px-6 text-sm gap-2 rounded-xl", icone: "text-[20px]" },
};

// - `variante`: uma das chaves de VARIANTES (padrão: primario);
// - `tamanho`: xs (só na faixa dos painéis), sm, md ou lg;
// - `icone`: nome de um ícone do Material Symbols, antes do texto;
// - `as`: desenha o botão como outro elemento, com a mesma cara (um Link do
//   React Router, um <a> ou o <label> de um campo de arquivo).
// As outras props (onClick, disabled, aria-label...) vão direto para o
// elemento.
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
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap select-none cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${t.classe} ${soIcone} ${VARIANTES[variante]} ${className}`}
    >
      {icone && (
        <span
          className={`material-symbols-outlined ${t.icone}`}
          aria-hidden="true"
        >
          {icone}
        </span>
      )}
      {children}
    </Componente>
  );
}

export default Botao;
