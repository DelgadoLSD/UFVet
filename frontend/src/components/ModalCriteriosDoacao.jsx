import Modal from "./Modal";
import { REFERENCIA_DOADOR, pesoMinimo } from "../regras/doacao";

// Explicação única dos critérios de doação, reaproveitada na busca e no perfil:
// o que é o ideal e o que acontece com o animal fora dele. Os critérios não são
// uma proibição: quem atende a mais tem mais chance de ser chamado, mas um animal
// fora de algum deles ainda pode doar, se o veterinário avaliar e o tutor decidir.

const { CAO, GATO } = REFERENCIA_DOADOR;

// Os valores saem das regras de doação (regras/doacao.js), para esta janela
// nunca dizer um número diferente do resto do site.
const IDEAL = [
  {
    rotulo: "Peso",
    valor: `Cães com ${pesoMinimo(CAO)} ou mais; gatos com ${pesoMinimo(GATO)} ou mais`,
  },
  { rotulo: "Idade", valor: `De ${CAO.idadeMin} a ${CAO.idadeMax} anos` },
  {
    rotulo: "Última doação",
    valor: `Há ${CAO.intervaloDias} dias ou mais`,
  },
  { rotulo: "Vacinas", valor: "Vacinas e vermífugo em dia" },
  { rotulo: "Exames", valor: "Tipagem feita e sorologias negativas" },
  { rotulo: "Transfusão", valor: "Nunca ter recebido" },
];

// É uma sequência de verdade: quem procura um doador, quem examina e quem
// decide. Por isso os números.
const FORA_DO_IDEAL = [
  {
    titulo: "Quanto mais critérios, maior a chance",
    texto:
      "Quem atende a mais critérios aparece primeiro na busca e tem mais chance de ser chamado.",
  },
  {
    titulo: "O veterinário avalia",
    texto:
      "Ele examina o animal, considera a urgência do caso e explica os riscos.",
  },
  {
    titulo: "O tutor decide",
    texto:
      "Doar é sempre uma escolha do tutor, que pode dizer não sem explicar o motivo.",
  },
];

function ModalCriteriosDoacao({ onFechar }) {
  return (
    <Modal
      titulo="Os critérios de doação"
      subtitulo="O que é recomendado e o que acontece quando o animal não atende a todos"
      largura="max-w-3xl"
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-5 text-sm text-[#5b403f] leading-relaxed">
        <p>
          Os critérios existem para proteger quem doa e quem recebe, e o ideal é
          atender a todos. Mas, mesmo sem atender a todos,{" "}
          <strong className="text-[#1a1c1c]">
            um animal ainda pode ser chamado para doar e ajudar a salvar uma
            vida
          </strong>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-xl p-5 bg-[#9e0a24] text-white/85">
            <h3 className="font-bold text-white">O recomendado</h3>
            <dl className="mt-3 flex flex-col gap-2.5">
              {IDEAL.map(({ rotulo, valor }) => (
                <div key={rotulo}>
                  <dt className="text-xs font-semibold text-white/80">
                    {rotulo}
                  </dt>
                  <dd className="font-semibold text-white">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl p-5 bg-white border border-[#eadede]">
            <h3 className="font-bold text-[#1a1c1c]">
              Quando não atende a todos
            </h3>
            <ol className="mt-3 flex flex-col gap-3.5">
              {FORA_DO_IDEAL.map(({ titulo, texto }, i) => (
                <li key={titulo} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="w-7 h-7 rounded-full bg-[#9e0a24] text-white text-xs font-extrabold flex items-center justify-center shrink-0"
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-[#1a1c1c]">
                      {titulo}
                    </span>
                    {texto}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <p className="text-xs text-[#5f5e5e] border-t border-[#f0e6e6] pt-4">
          Não quer que o seu animal seja procurado agora? Marque-o como
          Indisponível no perfil: ele sai da busca até você marcar Disponível de
          novo.
        </p>
      </div>
    </Modal>
  );
}

export default ModalCriteriosDoacao;
