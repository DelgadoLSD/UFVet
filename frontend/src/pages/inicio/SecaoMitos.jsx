import Surgir from "./Surgir";
import CarrosselAfirmacoes from "./CarrosselAfirmacoes";
import { CONTAINER, TITULO_SECAO } from "./estilos";

// Mitos e verdades sobre a doação de sangue animal, em dois carrosséis lado a
// lado. Cada resposta cita a fonte (ids de fontes.js).

const MITOS = [
  {
    afirmacao: "Doar sangue faz mal ao pet.",
    resposta:
      "O doador é examinado antes, doa uma quantidade calculada pelo peso e só volta a doar depois de 90 dias.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Cachorro precisa de anestesia para doar.",
    resposta:
      "Cães doam acordados: a anestesia não é recomendada. Por isso o doador precisa ser calmo.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Qualquer sangue serve para qualquer animal.",
    resposta:
      "Cães e gatos têm tipos sanguíneos diferentes. Gatos já nascem com anticorpos contra o tipo que não têm.",
    fonte: "msdGrupos",
  },
  {
    afirmacao: "Só cachorro de raça pode doar.",
    resposta:
      "Raça não é critério. Um vira-lata saudável, calmo e com o peso certo pode doar.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Fêmea não castrada não pode doar.",
    resposta: "Pode, sim. Só não durante o cio, a gestação e a amamentação.",
    fonte: "abvhmt",
  },
];

const VERDADES = [
  {
    afirmacao: "A coleta é rápida.",
    resposta: "Leva cerca de 15 minutos, contando só a coleta.",
    fonte: "ebc",
  },
  {
    afirmacao: "O doador é examinado antes de toda doação.",
    resposta:
      "Um exame de sangue rápido confirma que ele não está anêmico antes de cada coleta.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Uma doação pode ajudar mais de um animal.",
    resposta:
      "O sangue pode ser separado em hemácias e plasma, que tratam problemas diferentes.",
    fonte: "msdBanco",
  },
  {
    afirmacao: "Existe um intervalo entre doações.",
    resposta:
      "São pelo menos 90 dias, tempo para o corpo repor as reservas de ferro.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Gato que sai de casa não pode doar.",
    resposta:
      "Na rua, ele pode pegar infecções que os exames ainda não conseguem detectar.",
    fonte: "abvhmt",
  },
];

function SecaoMitos() {
  return (
    <section
      id="mitos-e-verdades"
      className="py-24 md:py-32 bg-[#9e0a24] text-white"
    >
      <div className={CONTAINER}>
        <Surgir className="max-w-3xl mb-12">
          <h2 className={`${TITULO_SECAO} mb-5`}>Mitos e verdades</h2>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
            Muita gente deixa de doar por medo de algo que não é verdade.
          </p>
        </Surgir>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Surgir className="h-full min-w-0">
            <CarrosselAfirmacoes itens={MITOS} />
          </Surgir>
          <Surgir atraso={120} className="h-full min-w-0">
            <CarrosselAfirmacoes verdade itens={VERDADES} />
          </Surgir>
        </div>
      </div>
    </section>
  );
}

export default SecaoMitos;
