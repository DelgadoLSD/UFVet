import { useState } from "react";
import Surgir from "./Surgir";
import NotaFonte from "./NotaFonte";
import Pilula from "./Pilula";
import { CONTAINER, TITULO_SECAO } from "./estilos";
import { ESPECIES, REFERENCIA_DOADOR, pesoMinimo } from "../../regras/doacao";
import fotoCao from "../../assets/dogs/dog1_1-image.jpg";
import fotoGato from "../../assets/cats/cat7_0-image.jpg";

// "Meu pet pode doar?": o doador ideal, por espécie, o que costuma adiar uma
// doação e, em destaque, o que mais importa: mesmo sem atender a todos os
// critérios, vale cadastrar, porque o animal ainda pode ser chamado.

const { CAO, GATO } = REFERENCIA_DOADOR;

// Idade e peso saem das regras de doação (regras/doacao.js), as mesmas que o
// perfil do animal confere: assim a página inicial nunca promete um critério
// diferente do que o site aplica.
const POR_ESPECIE = {
  CAO: {
    foto: fotoCao,

    criterios: [
      {
        valor: `${CAO.idadeMin} a ${CAO.idadeMax} anos`,
        texto: "Adulto, saudável e calmo",
      },
      {
        valor: `${pesoMinimo(CAO)} ou mais`,
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

    criterios: [
      {
        valor: `${GATO.idadeMin} a ${GATO.idadeMax} anos`,
        texto: "Adulto, saudável e dócil",
      },
      {
        valor: `${pesoMinimo(GATO)} ou mais`,
        texto: "Grande, mas sem obesidade",
      },
      { valor: "Só em casa", texto: "Sem acesso à rua" },
      { valor: "Vacinas em dia", texto: "E sem uso de remédios" },
    ],
  },
};

// O que pode adiar uma doação e o que pede mais cuidado do veterinário.
const PODE_ADIAR = [
  "Cio, gestação ou amamentação",
  "Castração ou vacina recente",
  "Uso de remédios",
  "Doação nos últimos 90 dias",
];

const MAIS_CUIDADO = ["Transfusão anterior", "Doença crônica"];

// O que quem tem um animal fora do ideal precisa saber.
const MESMO_ASSIM = [
  "Quanto mais critérios ele atende, maior a chance de ser chamado.",
  "Um veterinário avalia o caso e explica os riscos para você.",
  "A decisão de doar é sempre sua.",
];

// Escolha de espécie em pílulas com a foto do bicho.
function EscolhaEspecie({ especie, onEscolher }) {
  return (
    <div
      role="group"
      aria-label="Espécie"
      className="flex p-1.5 bg-white rounded-full gap-1 self-start md:self-auto shadow-[0_1px_2px_rgba(158,10,36,0.08)]"
    >
      {Object.entries(POR_ESPECIE).map(([chave, e]) => (
        <button
          key={chave}
          type="button"
          onClick={() => onEscolher(chave)}
          aria-pressed={especie === chave}
          className={`h-12 pl-1.5 pr-5 rounded-full flex items-center gap-2.5 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24] ${
            especie === chave
              ? "bg-[#9e0a24] text-white"
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

// Uma lista de situações, com um título. A cor vem do cartão.
function Situacoes({ titulo, itens, divisoria }) {
  return (
    <>
      <h3 className="text-xl font-extrabold tracking-tight leading-snug">
        {titulo}
      </h3>
      <ul className={`mt-3 flex flex-col divide-y ${divisoria}`}>
        {itens.map((item) => (
          <li key={item} className="py-2.5 font-medium leading-snug">
            {item}
          </li>
        ))}
      </ul>
    </>
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
              Este é o doador ideal. Raça não importa: vira-latas são muito
              bem-vindos.
              <NotaFonte ids={["abvhmt", "isfm"]} />
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
                    <p className="text-3xl font-extrabold tracking-tight text-[#9e0a24]">
                      {c.valor}
                    </p>
                    <p className="text-[#5b403f] mt-1">{c.texto}</p>
                  </div>
                </Surgir>
              ))}
            </div>

            <Surgir className="flex-1">
              {/* Um par de contraste, em vermelho e preto, para não se confundir
                  com os cartões brancos de cima. Fica nas mesmas colunas deles. */}
              <div className="h-full grid sm:grid-cols-2 gap-5">
                <div className="rounded-2xl bg-[#9e0a24] p-6 text-white">
                  <Situacoes
                    titulo="Pode adiar a doação"
                    itens={PODE_ADIAR}
                    divisoria="divide-white/25"
                  />
                </div>
                <div className="rounded-2xl bg-[#1a1c1c] p-6 text-white flex flex-col">
                  <Situacoes
                    titulo="Pede uma avaliação mais cuidadosa"
                    itens={MAIS_CUIDADO}
                    divisoria="divide-white/25"
                  />
                  <p className="mt-auto pt-5 text-sm leading-relaxed text-white/75">
                    Os critérios podem variar um pouco entre hospitais. Na
                    dúvida, o veterinário confirma na triagem.
                  </p>
                </div>
              </div>
            </Surgir>
          </div>
        </div>

        {/* O que esta seção mais precisa dizer: o bloco preto é o único da
            seção, para ser lido mesmo por quem só passa os olhos. */}
        <Surgir className="mt-12">
          <div className="rounded-[2rem] bg-[#1a1c1c] text-white p-8 md:p-12 grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-14 items-center">
            <div className="flex flex-col items-start">
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-balance">
                Não atende a todos os critérios? Cadastre mesmo assim.
              </h3>
              <p className="mt-4 mb-8 text-lg text-white/75 leading-relaxed max-w-xl">
                Em uma emergência, seu pet ainda pode ser chamado para doar e
                ajudar a salvar uma vida.
              </p>
              <Pilula to="/cadastrar" variante="branco">
                Cadastrar meu animal
              </Pilula>
            </div>
            <ul className="flex flex-col divide-y divide-white/15">
              {MESMO_ASSIM.map((frase) => (
                <li
                  key={frase}
                  className="py-4 first:pt-0 last:pb-0 text-lg leading-relaxed text-white/90"
                >
                  {frase}
                </li>
              ))}
            </ul>
          </div>
        </Surgir>
      </div>
    </section>
  );
}

export default SecaoPodeDoar;
