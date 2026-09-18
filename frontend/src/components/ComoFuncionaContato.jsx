import Modal from "./Modal";

function Item({ escuro, children }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <span
        className={`material-symbols-outlined text-[18px] shrink-0 ${
          escuro ? "text-white" : "text-[#8e001b]"
        }`}
      >
        check_small
      </span>
      {children}
    </li>
  );
}

// Os dois lados dividem as mesmas linhas de grade, então título e listas
// começam na mesma altura nos dois cartões.
const CARTAO =
  "rounded-xl p-5 md:grid md:grid-rows-subgrid md:row-span-2 gap-3 flex flex-col";

// Explica por que os telefones não ficam abertos a qualquer pessoa cadastrada.
function ModalComoFuncionaContato({ onClose }) {
  return (
    <Modal
      titulo="Como funciona o acesso aos contatos"
      subtitulo="Por que nem todo mundo vê o telefone dos tutores"
      largura="max-w-3xl"
      onClose={onClose}
    >
      <div className="flex flex-col gap-6 text-[#5b403f]">
        <p>
          Quem cadastra um doador aceita ser procurado em uma emergência, não
          ter o telefone aberto para qualquer pessoa que criar uma conta. Por
          isso o contato só aparece para quem está mesmo em um atendimento.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_1fr] gap-4">
          <div className={`${CARTAO} bg-[#8e001b] text-white/85`}>
            <h3 className="font-bold text-white">Se você é tutor</h3>
            <ul className="flex flex-col gap-2">
              <Item escuro>
                O veterinário que está cuidando do seu animal libera o seu
                acesso pelo seu código.
              </Item>
              <Item escuro>
                Enquanto a liberação estiver ativa, você vê o contato de
                qualquer doador e fala direto com o tutor.
              </Item>
              <Item escuro>
                A liberação tem prazo e expira sozinha, sem ninguém precisar
                lembrar de encerrar.
              </Item>
            </ul>
          </div>

          <div className={`${CARTAO} bg-white border border-[#eadede]`}>
            <h3 className="font-bold text-[#1a1c1c]">Se você é veterinário</h3>
            <ul className="flex flex-col gap-2">
              <Item>
                Você vê os contatos quando precisar, sem pedir liberação a
                ninguém.
              </Item>
              <Item>
                Cada consulta fica registrada com seu nome e CRMV, do mesmo
                jeito que as validações que você assina.
              </Item>
              <Item>
                Você libera e encerra o acesso dos tutores em atendimento pelo
                seu perfil.
              </Item>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-[#1a1c1c]">
            O que fica registrado
          </h3>
          <p>
            Quem viu, quando viu e com qual permissão. O tutor dono do contato
            vê essa lista no próprio perfil, e o veterinário que liberou
            acompanha quantos contatos foram consultados durante o atendimento.
          </p>
        </div>

        <p className="text-xs text-[#5f5e5e] border-t border-[#f0e6e6] pt-4">
          Nada disso substitui o combinado com o tutor do doador: a doação
          continua sendo voluntária, e ele pode dizer não a qualquer momento.
        </p>
      </div>
    </Modal>
  );
}

export default ModalComoFuncionaContato;
