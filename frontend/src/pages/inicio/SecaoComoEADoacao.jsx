import Surgir from "./Surgir";
import NotaFonte from "./NotaFonte";
import { CONTAINER, TITULO_SECAO } from "./estilos";

// Como é a doação, do começo ao fim, em cinco etapas numeradas (é uma
// sequência de verdade). No computador, as etapas ficam lado a lado, ligadas
// por uma linha; no celular, uma embaixo da outra.

const ETAPAS = [
  {
    titulo: "Triagem",
    texto: "Conversa sobre o histórico do animal e exame físico.",
    destaque: "No hospital",
    fonte: "abvhmt",
  },
  {
    titulo: "Exame rápido",
    texto: "Uma amostra de sangue confirma que o doador está bem.",
    destaque: "Antes de toda doação",
    fonte: "abvhmt",
  },
  {
    titulo: "Coleta",
    texto: "Com material estéril. Cães ficam acordados.",
    destaque: "Cerca de 15 min",
    fonte: ["ebc", "abvhmt"],
  },
  {
    titulo: "Descanso",
    texto: "Água, comida e carinho. Em casa, só passeios curtos.",
    destaque: "24 horas",
    fonte: "abvhmt",
  },
  {
    titulo: "Próxima doação",
    texto: "Tempo para o corpo repor as reservas de ferro.",
    destaque: "Depois de 90 dias",
    fonte: "abvhmt",
  },
];

function SecaoComoEADoacao() {
  return (
    <section id="como-e-a-doacao" className="py-24 md:py-32 bg-white">
      <div className={CONTAINER}>
        <Surgir className="max-w-3xl mb-12">
          <h2 className={`${TITULO_SECAO} text-[#1a1c1c] mb-5`}>
            Como é a doação
          </h2>
          <p className="text-lg text-[#5b403f] leading-relaxed max-w-2xl">
            Rápida, feita no hospital e com a segurança do doador em primeiro
            lugar.
          </p>
        </Surgir>

        <ol className="grid md:grid-cols-5 gap-8 md:gap-5">
          {ETAPAS.map((e, i) => (
            <li key={e.titulo} className="relative">
              {/* Linha até a próxima etapa: vertical no celular, horizontal
                  no computador. */}
              {i < ETAPAS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bg-[#f7cdd3] left-6 top-12 -bottom-8 w-0.5 md:left-12 md:-right-5 md:top-6 md:bottom-auto md:h-0.5 md:w-auto"
                />
              )}
              <Surgir atraso={i * 90} className="relative flex md:block gap-5">
                <span className="shrink-0 w-12 h-12 rounded-full bg-[#9e0a24] text-white text-lg font-extrabold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="md:mt-5">
                  <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-[#fdecee] text-[#9e0a24]">
                    {e.destaque}
                  </span>
                  <h3 className="text-xl font-bold text-[#1a1c1c] mt-3">
                    {e.titulo}
                  </h3>
                  <p className="text-[#5b403f] leading-relaxed mt-1">
                    {e.texto}
                    <NotaFonte ids={e.fonte} />
                  </p>
                </div>
              </Surgir>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default SecaoComoEADoacao;
