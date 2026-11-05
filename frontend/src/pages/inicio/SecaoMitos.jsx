import Surgir from "./Surgir";
import CarrosselAfirmacoes from "./CarrosselAfirmacoes";
import { CONTAINER, TITULO_SECAO } from "./estilos";

// Mitos e verdades sobre a doação de sangue animal, em dois carrosséis lado a
// lado. Cada cartão responde a uma dúvida ou a um medo de quem pensa em cadastrar
// o pet: o que não ajuda essa pessoa a decidir não entra aqui. Cada resposta
// clínica cita a fonte (ids de fontes.js); as que falam de como o UFVet funciona
// não têm fonte a citar.

const MITOS = [
  {
    afirmacao: "Meu pet sente dor durante a doação.",
    resposta:
      "O procedimento é praticamente indolor e dura cerca de 15 minutos.",
    fonte: "ebc",
  },
  {
    afirmacao: "Doar sangue faz mal ao pet.",
    resposta:
      "O doador é examinado antes de cada coleta e doa uma quantidade calculada pelo peso. Depois, o ideal é esperar 90 dias até a próxima doação.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Cachorro precisa de anestesia para doar.",
    resposta:
      "Cães doam acordados, e a anestesia não é recomendada. Por isso, o doador precisa ser calmo.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Vou ter que pagar para doar.",
    resposta:
      "Não. Os custos ficam por conta do tutor do animal que recebe o sangue.",
  },
  {
    afirmacao: "Só cachorro de raça pode doar.",
    resposta:
      "Raça não é critério. Um vira-lata saudável e calmo pode doar como qualquer outro.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Fêmea não castrada não pode doar.",
    resposta:
      "Pode, sim. O cio, a gestação e a amamentação é que costumam adiar a doação.",
    fonte: "abvhmt",
  },
  {
    afirmacao:
      "Se meu pet não atende a todos os critérios, não adianta cadastrar.",
    resposta:
      "Adianta, sim. Em uma emergência, ele ainda pode ser chamado para doar. Um veterinário avalia cada caso, e a decisão é sua.",
  },
];

const VERDADES = [
  {
    afirmacao: "O doador é examinado antes de toda doação.",
    resposta:
      "Um exame físico e um exame de sangue confirmam que ele está bem. É também uma forma de acompanhar a saúde dele.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Os cuidados depois da doação são simples.",
    resposta:
      "O doador recebe água e comida logo depois da coleta. Em casa, basta evitar brincadeiras agitadas por 24 horas. Se notar algo diferente, procure o veterinário.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Você pode recusar um pedido de doação.",
    resposta:
      "A doação é voluntária. Você pode dizer não sem precisar explicar o motivo e tirar seu pet da busca quando quiser.",
  },
  {
    afirmacao: "Não é preciso saber o tipo sanguíneo para cadastrar.",
    resposta:
      "O tipo sai do exame de tipagem, e quem registra é o veterinário.",
  },
  {
    afirmacao: "Gato que sai de casa não é o doador ideal.",
    resposta:
      "Na rua, ele pode pegar infecções que os exames ainda não conseguem detectar.",
    fonte: "abvhmt",
  },
  {
    afirmacao: "Uma doação pode ajudar mais de um animal.",
    resposta:
      "O sangue pode ser separado em hemácias e plasma, que tratam problemas diferentes.",
    fonte: "msdBanco",
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
