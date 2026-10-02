import BotaoAjuda from "../../components/BotaoAjuda";

// Faixa que explica os dois selos dos cartões (validado e ainda não
// validado). Fica acima dos resultados, no momento da escolha; antes ficava
// escondida no fim da barra lateral.

function Selo({ icone, circulo, titulo, corTitulo, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={`w-7 h-7 rounded-full ${circulo} text-white flex items-center justify-center shrink-0`}
      >
        <span className="material-symbols-outlined text-[16px]">{icone}</span>
      </span>
      <p className="text-xs text-[#5b403f] leading-relaxed">
        <strong className={`block text-sm font-semibold ${corTitulo}`}>
          {titulo}
        </strong>
        {children}
      </p>
    </div>
  );
}

function LegendaValidacao({ onEntender }) {
  return (
    <div className="bg-white border border-[#eadede] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        <Selo
          icone="verified_user"
          circulo="bg-emerald-600"
          titulo="Validado"
          corTitulo="text-emerald-800"
        >
          Exames já conferidos por um veterinário. No hospital, só uma checagem
          rápida antes da coleta.
        </Selo>
        <Selo
          icone="schedule"
          circulo="bg-[#8f6f6e]"
          titulo="Ainda não validado"
          corTitulo="text-[#1a1c1c]"
        >
          Pode doar normalmente. Os exames de triagem, inclusive a tipagem
          sanguínea, são feitos no hospital antes da coleta.
        </Selo>
      </div>
      <BotaoAjuda
        rotulo="Como funciona a validação?"
        onClick={onEntender}
        className="shrink-0 self-start lg:self-auto"
      />
    </div>
  );
}

export default LegendaValidacao;
