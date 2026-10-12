import Modal from "./Modal";

// Explicação única do que a validação muda na prática, reaproveitada no
// início, na busca e no perfil. O tom é deliberadamente de "cenário", não de
// alerta: quem cadastra um animal quer ajudar, validado ou não.

// Uma etapa do atendimento no hospital: com "ok", o que já está resolvido;
// sem, o que ainda precisa ser feito. `escuro` é a versão do cartão vermelho.
function Etapa({ ok, escuro, children }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-[18px] shrink-0 ${
          ok ? (escuro ? "text-white" : "text-emerald-600") : "text-[#8f6f6e]"
        }`}
      >
        {ok ? "check_circle" : "science"}
      </span>
      <span>{children}</span>
    </li>
  );
}

// Os dois cenários usam as mesmas linhas de grade (subgrid), então título,
// lista e rodapé ficam na mesma altura nos dois cartões.
const CARTAO =
  "rounded-xl p-5 md:grid md:grid-rows-subgrid md:row-span-4 gap-3 flex flex-col";

function ModalComoFuncionaValidacao({ onFechar }) {
  return (
    <Modal
      titulo="Como funciona a validação"
      subtitulo="O que muda na hora da doação"
      largura="max-w-3xl"
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-5 text-sm text-[#5b403f] leading-relaxed">
        <p>
          Toda doação passa por uma checagem no hospital. A validação diz{" "}
          <strong className="text-[#1a1c1c]">
            quanto dela ainda falta no dia
          </strong>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto_1fr_auto] gap-4">
          <div className={`${CARTAO} bg-[#9e0a24] text-white/85`}>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-white text-[#9e0a24] flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">
                  verified_user
                </span>
              </span>
              <h3 className="font-bold text-white">Validado</h3>
            </div>
            <p>Um veterinário conferiu os exames nos últimos 12 meses.</p>
            <ul className="flex flex-col gap-1.5">
              <Etapa ok escuro>
                No hospital, só exame físico e um exame de sangue rápido.
              </Etapa>
              <Etapa ok escuro>
                Estando tudo bem, a coleta é no mesmo dia.
              </Etapa>
            </ul>
            <p className="text-xs font-semibold text-white bg-white/10 rounded-lg px-3 py-2">
              O caminho mais rápido numa emergência.
            </p>
          </div>

          <div className={`${CARTAO} bg-white border border-[#eadede]`}>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-[#8f6f6e] text-white flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">
                  schedule
                </span>
              </span>
              <h3 className="font-bold text-[#1a1c1c]">Ainda não validado</h3>
            </div>
            <p>Pode doar do mesmo jeito. Só falta conferir os exames.</p>
            <ul className="flex flex-col gap-1.5">
              <Etapa ok>Exame físico e um exame de sangue rápido.</Etapa>
              <Etapa>Tipagem, hemograma e testes de doenças.</Etapa>
              <Etapa>Os resultados levam alguns dias e podem ter custo.</Etapa>
            </ul>
            <p className="text-xs font-semibold text-[#5b403f] bg-[#faf0f0] rounded-lg px-3 py-2">
              Boa opção quando há tempo até a transfusão.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#5f5e5e] border-t border-[#f0e6e6] pt-4">
          Enviar exames recentes ajuda o veterinário a validar sem refazê-los. A
          validação vale 1 ano e leva o CRMV de quem assinou; a decisão final é
          sempre da equipe do hospital.
        </p>
      </div>
    </Modal>
  );
}

export default ModalComoFuncionaValidacao;
