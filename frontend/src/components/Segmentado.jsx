// Escolha entre poucas opções lado a lado (espécie, sexo, prazo...). A opção
// escolhida fica em vermelho sólido e as outras em branco: é o padrão de
// botões binários do site.
//
// `opcoes` é uma lista de { valor, rotulo, icone? }. `rotulo` nomeia o grupo
// para leitores de tela, já que o texto acima dele nem sempre é um <label>.
function Segmentado({ opcoes, valor, onEscolher, rotulo, altura = "h-9" }) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className="flex p-1 bg-white border border-[#e2d6d6] rounded-xl gap-1"
    >
      {opcoes.map((opcao) => {
        const escolhida = valor === opcao.valor;
        return (
          <button
            key={String(opcao.valor)}
            type="button"
            onClick={() => onEscolher(opcao.valor)}
            aria-pressed={escolhida}
            className={`flex-1 ${altura} px-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
              escolhida
                ? "bg-[#b7102a] text-white"
                : "text-[#5f5e5e] hover:text-[#1a1c1c]"
            }`}
          >
            {opcao.icone}
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}

export default Segmentado;
