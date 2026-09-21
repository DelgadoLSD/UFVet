import { useState } from "react";

// Calendário do site. Existe porque escolher a data da coleta é o gesto
// central do registro de doação, e o seletor nativo do navegador muda de
// cara em cada sistema — aqui ele tem a mesma tipografia e o mesmo vermelho
// do resto do UFVet.
// Datas futuras ficam desligadas: uma coleta só é registrada depois de
// acontecer.

const DIAS_DA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const mesmoDia = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const primeiroDoMes = (data) =>
  new Date(data.getFullYear(), data.getMonth(), 1);

const somarMeses = (data, quantidade) =>
  new Date(data.getFullYear(), data.getMonth() + quantidade, 1);

function Calendario({ valor, onEscolher, limite = new Date() }) {
  const [mes, setMes] = useState(() => primeiroDoMes(valor || new Date()));

  const hoje = new Date();
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const vaziosAntes = mes.getDay();
  const dias = Array.from({ length: ultimoDia }, (_, i) => i + 1);

  // Não adianta avançar para um mês inteiro no futuro.
  const proximoMesDisponivel = somarMeses(mes, 1) <= primeiroDoMes(limite);

  return (
    <div className="rounded-xl border border-[#dccfcf] bg-white p-3 shadow-[0_1px_2px_rgba(26,28,28,0.04)]">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <button
          type="button"
          onClick={() => setMes(somarMeses(mes, -1))}
          aria-label="Mês anterior"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8f6f6e] hover:bg-[#faf6f6] hover:text-[#8e001b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
        >
          <span className="material-symbols-outlined text-[20px]">
            chevron_left
          </span>
        </button>
        <p
          aria-live="polite"
          className="text-sm font-bold text-[#1a1c1c] tabular-nums"
        >
          {MESES[mes.getMonth()]} de {mes.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => setMes(somarMeses(mes, 1))}
          disabled={!proximoMesDisponivel}
          aria-label="Próximo mês"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8f6f6e] hover:bg-[#faf6f6] hover:text-[#8e001b] transition-colors disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
        >
          <span className="material-symbols-outlined text-[20px]">
            chevron_right
          </span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_DA_SEMANA.map((dia, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="h-7 flex items-center justify-center text-[11px] font-semibold text-[#a79d9d]"
          >
            {dia}
          </span>
        ))}

        {Array.from({ length: vaziosAntes }, (_, i) => (
          <span key={`vazio-${i}`} />
        ))}

        {dias.map((dia) => {
          const data = new Date(mes.getFullYear(), mes.getMonth(), dia);
          const selecionado = mesmoDia(data, valor);
          const ehHoje = mesmoDia(data, hoje);
          const futuro = data > limite;

          return (
            <button
              key={dia}
              type="button"
              disabled={futuro}
              aria-pressed={selecionado}
              aria-label={`${dia} de ${MESES[mes.getMonth()]} de ${mes.getFullYear()}`}
              onClick={() => onEscolher(data)}
              className={`h-9 rounded-lg text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
                selecionado
                  ? "bg-[#b7102a] text-white font-bold"
                  : futuro
                    ? "text-[#d5cccc] cursor-not-allowed"
                    : ehHoje
                      ? "text-[#8e001b] font-bold ring-1 ring-inset ring-[#e4bebc] hover:bg-[#fdecee]"
                      : "text-[#1a1c1c] hover:bg-[#faf6f6]"
              }`}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendario;
