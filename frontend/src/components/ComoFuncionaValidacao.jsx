import Modal from "./Modal";

// Explicação única do que a validação muda na prática, reaproveitada na busca
// e no perfil. O tom é deliberadamente de "cenário", não de alerta: quem
// cadastra um animal quer ajudar, validado ou não.

function Etapa({ ok, escuro, children }) {
  return (
    <li className="flex items-start gap-2">
      <span
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

function ModalComoFuncionaValidacao({ onClose }) {
  return (
    <Modal
      titulo="Como funciona a validação"
      subtitulo="O que muda na hora da doação"
      largura="max-w-3xl"
      onClose={onClose}
    >
      <div className="flex flex-col gap-6 text-sm text-[#5b403f] leading-relaxed">
        <p>
          Todo animal cadastrado aqui pertence a alguém que quer ajudar. E toda
          doação passa por uma checagem no hospital, para proteger o doador e o
          animal que vai receber o sangue. A validação muda{" "}
          <strong className="text-[#1a1c1c]">
            quanto dessa checagem precisa ser feita no dia
          </strong>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto_1fr_auto] gap-4">
          <div className={`${CARTAO} bg-[#8e001b] text-white/85`}>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-white text-[#8e001b] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  verified_user
                </span>
              </span>
              <h3 className="font-bold text-white">Doador validado</h3>
            </div>
            <p>
              Um veterinário já conferiu os exames e os critérios de doação nos
              últimos 12 meses.
            </p>
            <div>
              <p className="text-sm font-semibold text-white mb-2">
                No hospital
              </p>
              <ul className="flex flex-col gap-1.5">
                <Etapa ok escuro>
                  Exame físico e um exame de sangue rápido, feito na hora.
                </Etapa>
                <Etapa ok escuro>
                  Estando tudo bem, a coleta pode acontecer no mesmo dia.
                </Etapa>
              </ul>
            </div>
            <p className="text-xs font-semibold text-white bg-white/10 rounded-lg px-3 py-2">
              Costuma ser o caminho mais rápido em uma emergência.
            </p>
          </div>

          <div className={`${CARTAO} bg-white border border-[#eadede]`}>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[#8f6f6e] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  schedule
                </span>
              </span>
              <h3 className="font-bold text-[#1a1c1c]">
                Doador ainda não validado
              </h3>
            </div>
            <p>
              O animal pode doar normalmente, só ainda não teve os exames
              conferidos por um veterinário aqui.
            </p>
            <div>
              <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
                No hospital
              </p>
              <ul className="flex flex-col gap-1.5">
                <Etapa ok>Exame físico e um exame de sangue rápido.</Etapa>
                <Etapa>
                  Tipagem sanguínea, hemograma e testes para doenças
                  transmitidas pelo sangue.
                </Etapa>
                <Etapa>
                  Os testes de doenças costumam levar alguns dias, e o sangue
                  coletado só pode ser usado depois que os resultados saem. Os
                  exames também podem ter custo.
                </Etapa>
              </ul>
            </div>
            <p className="text-xs font-semibold text-[#5b403f] bg-[#faf0f0] rounded-lg px-3 py-2">
              Uma ótima opção quando há algum tempo até a transfusão.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-[#1a1c1c]">
            Na prática, por que isso importa?
          </h3>
          <p>
            Em uma emergência, cada hora conta: um doador validado pode encurtar
            o caminho até a transfusão e evitar gastos com exames. Quando há
            mais tempo, ou quando não há um doador validado compatível por
            perto, um doador ainda não validado continua sendo uma grande ajuda.
            Os exames só precisam ser feitos antes.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-[#1a1c1c]">
            E os documentos?
          </h3>
          <p>
            Quando o tutor envia exames recentes e a carteira de vacinação, o
            veterinário consegue validar o animal sem pedir que eles sejam
            refeitos. Sem os documentos, o hospital pode precisar repetir esses
            exames antes da coleta.
          </p>
        </div>

        <p className="text-xs text-[#5f5e5e] border-t border-[#f0e6e6] pt-4">
          A validação vale por 1 ano, porque os testes para doenças
          transmitidas pelo sangue devem ser refeitos anualmente. Ela é
          assinada com o CRMV do veterinário responsável. Em todos os casos, a
          decisão final é da equipe veterinária no dia da coleta.
        </p>
      </div>
    </Modal>
  );
}

export default ModalComoFuncionaValidacao;
