import Modal from "./Modal";
import { REFERENCIA_DOADOR, pesoMinimo } from "../regras/doacao";

// Explicação única dos critérios de doação, reaproveitada na busca e no perfil:
// o que é recomendado e o que acontece com o animal que não atende a todos. Os
// critérios não são uma proibição: quem atende a mais tem mais chance de ser
// chamado, mas não atender a um deles não necessariamente impede a doação.
//
// De cima para baixo: os critérios numa faixa de células, no desenho da faixa de
// dados do animal, e os três passos num bloco preto, um ao lado do outro.

const { CAO, GATO } = REFERENCIA_DOADOR;

// Os valores saem das regras de doação (regras/doacao.js), para esta janela
// nunca dizer um número diferente do resto do site.
const RECOMENDADO = [
  { rotulo: "Peso dos cães", valor: `${pesoMinimo(CAO)} ou mais` },
  { rotulo: "Peso dos gatos", valor: `${pesoMinimo(GATO)} ou mais` },
  { rotulo: "Idade", valor: `${CAO.idadeMin} a ${CAO.idadeMax} anos` },
  { rotulo: "Última doação", valor: `Há ${CAO.intervaloDias} dias ou mais` },
  { rotulo: "Vacinas e vermífugo", valor: "Em dia" },
  { rotulo: "Tipagem sanguínea", valor: "Confirmada" },
  { rotulo: "Sorologias", valor: "Negativas" },
  { rotulo: "Transfusão", valor: "Nunca recebeu" },
];

// É uma sequência de verdade: quem procura um doador, quem examina e quem
// decide. Por isso os números.
const QUANDO_NAO_ATENDE = [
  {
    titulo: "Quanto mais critérios, maior a chance",
    texto: "Quem atende a mais critérios aparece primeiro na busca.",
  },
  {
    titulo: "O veterinário avalia",
    texto: "Ele examina o animal, considera a urgência e explica os riscos.",
  },
  {
    titulo: "O tutor decide",
    texto: "Doar é sempre uma escolha do tutor, que pode dizer não.",
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

        <section aria-labelledby="criterios-recomendado">
          <h3
            id="criterios-recomendado"
            className="font-bold text-[#1a1c1c] mb-2.5"
          >
            O recomendado
          </h3>
          {/* As divisões são o fundo branco nos vãos de 2px, como na faixa de
              dados do animal. */}
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-[2px] rounded-xl overflow-hidden">
            {RECOMENDADO.map(({ rotulo, valor }) => (
              <div key={rotulo} className="bg-[#fdecee] px-3.5 py-3">
                <dt className="text-xs font-semibold text-[#5b403f] leading-snug">
                  {rotulo}
                </dt>
                <dd className="mt-0.5 font-extrabold tracking-tight text-[#1a1c1c] leading-snug">
                  {valor}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="criterios-nao-atende"
          className="rounded-xl bg-[#1a1c1c] text-white p-5"
        >
          <h3 id="criterios-nao-atende" className="font-bold">
            Quando o animal não atende a todos
          </h3>
          <ol className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {QUANDO_NAO_ATENDE.map(({ titulo, texto }, i) => (
              <li key={titulo} className="flex md:flex-col items-start gap-3">
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-full bg-[#9e0a24] text-xs font-extrabold flex items-center justify-center shrink-0"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold leading-snug">
                    {titulo}
                  </span>
                  <span className="block mt-1 text-white/75">{texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <p className="text-xs text-[#5f5e5e]">
          Não quer que o seu animal seja procurado agora? Marque-o como
          Indisponível no perfil: ele sai da busca até você marcar Disponível de
          novo.
        </p>
      </div>
    </Modal>
  );
}

export default ModalCriteriosDoacao;
