import { useState } from "react";
import Surgir from "./Surgir";
import NotaFonte from "./NotaFonte";
import { CONTAINER, TITULO_SECAO } from "./estilos";
import { ESPECIES, REFERENCIA_DOADOR } from "../../regras/doacao";
import fotoCao from "../../assets/dogs/dog1_1-image.jpg";
import fotoGato from "../../assets/cats/cat7_0-image.jpg";

// "Meu pet pode doar?": os critérios para doar, por espécie, e o que impede
// ou adia uma doação.

const { CAO, GATO } = REFERENCIA_DOADOR;

// Idade e peso saem das regras de doação (regras/doacao.js), as mesmas que o
// perfil do animal confere: assim a página inicial nunca promete um critério
// diferente do que o site aplica.
const POR_ESPECIE = {
  CAO: {
    foto: fotoCao,
    legenda:
      "Cães doam acordados, sem anestesia. Por isso, precisam ser calmos.",
    criterios: [
      {
        valor: `${CAO.idadeMin} a ${CAO.idadeMax} anos`,
        texto: "Adulto e saudável",
      },
      {
        valor: `Mais de ${CAO.pesoMin} kg`,
        texto: "Para doar uma bolsa inteira com segurança",
      },
      { valor: "Vacinas em dia", texto: "Vermífugo também" },
      {
        valor: "Sem remédios",
        texto: "Antipulgas e preventivos são permitidos",
      },
    ],
  },
  GATO: {
    foto: fotoGato,
    legenda: "Gatos precisam ser dóceis. Se for preciso, a equipe usa sedação.",
    criterios: [
      {
        valor: `${GATO.idadeMin} a ${GATO.idadeMax} anos`,
        texto: "Adulto e saudável",
      },
      {
        valor: `Mais de ${GATO.pesoMin} kg`,
        texto: "Grande, mas sem obesidade",
      },
      { valor: "Só em casa", texto: "Sem acesso à rua" },
      { valor: "Vacinas em dia", texto: "E sem uso de remédios" },
    ],
  },
};

// Situações que adiam a doação por um tempo.
const PAUSAS = [
  "Cio",
  "Gestação",
  "Amamentação",
  "Castração recente",
  "Vacina recente",
  "Uso de remédios",
  "Doou há menos de 90 dias",
];

// Situações que impedem a doação de vez.
const IMPEDIMENTOS = ["Já recebeu transfusão", "Doença crônica"];

// Escolha de espécie em pílulas com a foto do bicho.
function EscolhaEspecie({ especie, onEscolher }) {
  return (
    <div
      role="group"
      aria-label="Espécie"
      className="flex p-1.5 bg-white rounded-full gap-1 self-start md:self-auto shadow-[0_1px_2px_rgba(142,0,27,0.08)]"
    >
      {Object.entries(POR_ESPECIE).map(([chave, e]) => (
        <button
          key={chave}
          type="button"
          onClick={() => onEscolher(chave)}
          aria-pressed={especie === chave}
          className={`h-12 pl-1.5 pr-5 rounded-full flex items-center gap-2.5 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
            especie === chave
              ? "bg-[#b7102a] text-white"
              : "text-[#5b403f] hover:bg-[#fdecee]"
          }`}
        >
          <img
            src={e.foto}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
          {ESPECIES[chave].rotulo}
        </button>
      ))}
    </div>
  );
}

// Lista de etiquetas em pílula (pausas e impedimentos).
function Etiquetas({ titulo, itens, classe }) {
  return (
    <div>
      <p className="font-bold text-[#1a1c1c]">{titulo}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {itens.map((item) => (
          <li
            key={item}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${classe}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SecaoPodeDoar() {
  const [especie, setEspecie] = useState("CAO");
  const atual = POR_ESPECIE[especie];

  return (
    <section id="quem-pode-doar" className="py-24 md:py-32 bg-[#fdecee]">
      <div className={CONTAINER}>
        <Surgir className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <h2 className={`${TITULO_SECAO} text-[#1a1c1c] mb-4`}>
              Meu pet pode doar?
            </h2>
            <p className="text-lg text-[#5b403f] leading-relaxed">
              Raça não importa: vira-latas são muito bem-vindos.
              <NotaFonte ids="abvhmt" />
            </p>
          </div>

          <EscolhaEspecie especie={especie} onEscolher={setEspecie} />
        </Surgir>

        <div className="grid lg:grid-cols-[5fr_7fr] gap-5">
          <Surgir className="h-full">
            {/* As duas fotos ficam empilhadas e trocam por esmaecimento. */}
            <div className="relative h-full min-h-[360px] rounded-[2rem] overflow-hidden bg-[#f7cdd3]">
              {Object.entries(POR_ESPECIE).map(([chave, e]) => (
                <img
                  key={chave}
                  src={e.foto}
                  alt={
                    especie === chave
                      ? `Exemplo de ${ESPECIES[chave].rotulo.toLowerCase()} doador`
                      : ""
                  }
                  aria-hidden={especie !== chave}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                    especie === chave ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <p className="absolute left-4 right-4 bottom-4 rounded-2xl bg-white/95 px-4 py-3 text-[15px] font-semibold text-[#1a1c1c] leading-snug">
                {atual.legenda}
              </p>
            </div>
          </Surgir>

          <div className="flex flex-col gap-5">
            <div className="grid sm:grid-cols-2 gap-5">
              {atual.criterios.map((c, i) => (
                <Surgir key={i} atraso={i * 70}>
                  {/* A chave muda com a espécie: o cartão é recriado e a
                      animação de entrada roda de novo na troca. */}
                  <div
                    key={`${especie}-${c.valor}`}
                    className="h-full rounded-2xl bg-white p-6 animate-aparecer"
                  >
                    <p className="text-3xl font-extrabold tracking-tight text-[#b7102a]">
                      {c.valor}
                    </p>
                    <p className="text-[#5b403f] mt-1">{c.texto}</p>
                  </div>
                </Surgir>
              ))}
            </div>

            <Surgir className="flex-1">
              <div className="h-full rounded-2xl border-2 border-dashed border-[#e9aab3] p-6 space-y-5">
                <Etiquetas
                  titulo="Precisa esperar um pouco"
                  itens={PAUSAS}
                  classe="bg-white text-[#1a1c1c]"
                />
                <Etiquetas
                  titulo="Não pode doar"
                  itens={IMPEDIMENTOS}
                  classe="bg-[#1a1c1c] text-white"
                />
                <p className="text-sm text-[#5b403f]">
                  Os critérios podem variar um pouco entre hospitais. Na dúvida,
                  o veterinário confirma na triagem.
                </p>
              </div>
            </Surgir>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SecaoPodeDoar;
