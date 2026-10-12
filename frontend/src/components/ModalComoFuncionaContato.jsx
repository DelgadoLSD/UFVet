import Modal from "./Modal";

// Explica por que os telefones não ficam abertos a qualquer pessoa cadastrada.
// Abre pelo "?" do acesso aos contatos, na busca e no perfil.

// Item de lista com um "visto" na frente. `escuro` é a versão para o cartão
// vermelho.
function Item({ escuro, children }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-[18px] shrink-0 ${
          escuro ? "text-white" : "text-[#9e0a24]"
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

function ModalComoFuncionaContato({ onFechar }) {
  return (
    <Modal
      titulo="Como funciona o acesso aos contatos"
      subtitulo="Por que nem todo mundo vê o telefone dos tutores"
      largura="max-w-3xl"
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-5 text-[#5b403f]">
        <p className="text-sm leading-relaxed">
          O telefone de quem cadastra um doador só aparece para quem está num
          atendimento.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_1fr] gap-4">
          <div className={`${CARTAO} bg-[#9e0a24] text-white/85`}>
            <h3 className="font-bold text-white">Se você é tutor</h3>
            <ul className="flex flex-col gap-2">
              <Item escuro>
                O veterinário que cuida do seu animal libera seu acesso pelo seu
                código.
              </Item>
              <Item escuro>
                Enquanto vale, você vê o contato de todos os doadores.
              </Item>
              <Item escuro>
                O acesso vence sozinho: em 24 horas, 3 ou 7 dias.
              </Item>
            </ul>
          </div>

          <div className={`${CARTAO} bg-white border border-[#eadede]`}>
            <h3 className="font-bold text-[#1a1c1c]">Se você é veterinário</h3>
            <ul className="flex flex-col gap-2">
              <Item>Você vê os contatos sempre, sem pedir a ninguém.</Item>
              <Item>
                Você libera, renova e encerra o acesso dos tutores pelo seu
                perfil.
              </Item>
            </ul>
          </div>
        </div>

        <p className="text-xs text-[#5f5e5e] border-t border-[#f0e6e6] pt-4">
          A doação é voluntária: o tutor do doador pode dizer não.
        </p>
      </div>
    </Modal>
  );
}

export default ModalComoFuncionaContato;
