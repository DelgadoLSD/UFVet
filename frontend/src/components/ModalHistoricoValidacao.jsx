import Modal from "./Modal";

// Histórico de validações do animal. A mais recente é a que vale hoje — as
// demais nunca foram apagadas nem alteradas: uma validação assinada não
// muda depois; quando o veterinário revisa, nasce uma validação nova, e a
// anterior fica marcada como substituída. É essa lista que prova isso.

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const paraData = (dataBR) => {
  const [dia, mes, ano] = dataBR.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
};

const ESTILO_STATUS = {
  validado: {
    rotulo: "Vigente",
    classe: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  pendencias: {
    rotulo: "Vigente, com pendências",
    classe: "bg-amber-50 text-amber-800 border-amber-200",
  },
  vencida: {
    rotulo: "Vencida",
    classe: "bg-orange-50 text-orange-800 border-orange-200",
  },
  substituida: {
    rotulo: "Substituída",
    classe: "bg-[#f3f3f3] text-[#5f5e5e] border-[#e6dcdc]",
  },
};

// Cabeçalho e linhas dividem a mesma grade, então cada círculo fica embaixo do
// nome do seu critério. Lida de cima a baixo, uma coluna mostra como aquele
// critério mudou de uma validação para outra.
const GRADE = "sm:grid sm:grid-cols-5 sm:w-[22rem]";

// Só a partir de sm: no celular não cabem cinco colunas com rótulo, e cada
// círculo leva o próprio nome ao lado.
function CabecalhoCriterios({ criterios }) {
  return (
    <div className="hidden sm:flex gap-4 mb-3" aria-hidden="true">
      <div className="w-12 shrink-0" />
      <div className="border-l border-transparent pl-4">
        <div className={`${GRADE} items-end`}>
          {criterios.map((c) => (
            <span
              key={c.key}
              className="text-[11px] leading-tight text-[#8f6f6e] text-center px-1"
            >
              {c.curto}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// A data é a identidade do ato assinado, então ela vira o marcador da linha —
// mesmo desenho do histórico de doações, para os dois lerem como a mesma
// linguagem visual.
function ItemValidacao({ validacao, status, criterios }) {
  const data = paraData(validacao.em);
  const estilo = ESTILO_STATUS[status];

  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="w-12 shrink-0 text-center">
        <p className="text-xl font-extrabold text-[#8e001b] leading-none tabular-nums">
          {String(data.getDate()).padStart(2, "0")}
        </p>
        <p className="text-[11px] text-[#8f6f6e] mt-1 leading-none">
          {MESES_CURTOS[data.getMonth()]} {data.getFullYear()}
        </p>
      </div>
      <div className="min-w-0 flex-1 border-l border-[#f0e6e6] pl-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-[#1a1c1c] text-sm">
            {validacao.por}, CRMV {validacao.crmv}
          </p>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${estilo.classe}`}
          >
            {estilo.rotulo}
          </span>
        </div>

        <ul className={`flex flex-wrap gap-x-3 gap-y-1.5 mt-2 sm:gap-0 ${GRADE}`}>
          {criterios.map((c) => {
            const atendido = validacao.criterios[c.key];
            return (
              <li
                key={c.key}
                className="flex items-center gap-1 sm:justify-center"
              >
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined text-[16px] ${
                    atendido ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {atendido ? "check_circle" : "remove_circle"}
                </span>
                <span className="text-[11px] text-[#5b403f] sm:sr-only">
                  {c.curto}
                  <span className="sr-only">
                    : {atendido ? "atendido" : "não atendido"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        {validacao.nota && (
          <p className="text-sm text-[#5b403f] mt-2 leading-relaxed">
            {validacao.nota}
          </p>
        )}
      </div>
    </li>
  );
}

function ModalHistoricoValidacao({ animal, itens, criterios, onClose }) {
  return (
    <Modal
      titulo={`Validações de ${animal.nome}`}
      subtitulo={
        itens.length === 1
          ? "1 validação registrada"
          : `${itens.length} validações registradas`
      }
      onClose={onClose}
    >
      <CabecalhoCriterios criterios={criterios} />
      <ul className="divide-y divide-[#f0e6e6]">
        {itens.map(({ validacao, status }, i) => (
          <ItemValidacao
            key={i}
            validacao={validacao}
            status={status}
            criterios={criterios}
          />
        ))}
      </ul>

      <p className="text-xs text-[#5f5e5e] leading-relaxed mt-5 pt-4 border-t border-[#f0e6e6]">
        Uma validação assinada não é editada. Quando o veterinário revisa os
        critérios, nasce uma validação nova, e a anterior permanece aqui,
        substituída.
      </p>
    </Modal>
  );
}

export default ModalHistoricoValidacao;
