import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import fotoCao from "../assets/auth/cao-vermelho.jpg";
import { CONTAINER } from "./inicio/estilos";
import Surgir from "./inicio/Surgir";
import Secoes from "./termos/Secoes";
import { CONTATO, ITENS, VERSAO, numeroDo } from "./termos/indice";

// Termos de uso e privacidade, numa página só (/termos; a privacidade é o
// item 9, em /termos#privacidade). Escritos para serem lidos: letra grande,
// blocos curtos, o essencial em um minuto no começo e os detalhes item por
// item, com um índice que acompanha a leitura no computador. O texto em si
// fica em pages/termos/Secoes.jsx.

// As quatro ideias principais, para quem só vai ler o começo.
const RESUMO = [
  {
    titulo: "O UFVet aproxima tutores",
    texto:
      "Ele ajuda quem precisa de sangue para um animal a encontrar um doador. Não é hospital nem banco de sangue.",
  },
  {
    titulo: "A doação é voluntária e gratuita",
    texto:
      "Ninguém é obrigado a doar, e ninguém pode cobrar pelo sangue. Os custos do hospital, como a bolsa de coleta e os exames, ficam com o tutor do animal que recebe.",
  },
  {
    titulo: "Seus contatos são protegidos",
    texto:
      "Seu e-mail e seu telefone só aparecem para veterinários e para tutores que receberam uma liberação, por prazo limitado.",
  },
  {
    titulo: "Você controla os seus dados",
    texto:
      "Você corrige os seus dados em Minha conta e, ao encerrar a conta, apaga tudo.",
  },
];

function Abertura() {
  return (
    <section className={`${CONTAINER} pt-28 max-md:pt-24 pb-14 md:pb-20`}>
      <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 md:gap-14 items-center">
        <Surgir>
          <span className="inline-block text-sm font-bold px-3 py-1.5 rounded-full bg-[#fdecee] text-[#9e0a24]">
            Para tutores, veterinários e visitantes
          </span>
          <h1 className="mt-5 text-[2.6rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.04] text-[#1a1c1c]">
            Termos de uso e privacidade
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-[#5b403f] max-w-xl">
            Esta página explica as regras de uso do UFVet e como cuidamos dos
            seus dados: o que o site faz, o que cada pessoa assume ao usá-lo e
            quem vê cada informação sua. Ao criar uma conta, você concorda com
            estes termos.
          </p>
          <p className="mt-7 text-base text-[#5f5e5e]">
            Última atualização: {VERSAO.vigencia} (versão {VERSAO.numero}).
          </p>
        </Surgir>
        <Surgir atraso={120}>
          <img
            src={fotoCao}
            alt="Um cachorro branco sorrindo, com fundo vermelho."
            className="w-full aspect-[16/10] md:aspect-[4/5] object-cover object-[50%_22%] rounded-[2rem]"
          />
        </Surgir>
      </div>
    </section>
  );
}

function Resumo() {
  return (
    <section
      aria-labelledby="resumo-titulo"
      className="bg-[#1a1a1a] text-white py-16 md:py-20"
    >
      <div className={CONTAINER}>
        <Surgir>
          <h2
            id="resumo-titulo"
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
          >
            Resumo
          </h2>
          <p className="mt-3 text-lg text-white/70">
            Os pontos principais destes termos.
          </p>
        </Surgir>
        <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {RESUMO.map(({ titulo, texto }, i) => (
            <li key={titulo}>
              <Surgir atraso={i * 90}>
                <span
                  aria-hidden="true"
                  className="block w-10 h-1 rounded-full bg-[#9e0a24]"
                />
                <p className="mt-5 text-2xl font-bold leading-snug">{titulo}</p>
                <p className="mt-3 text-lg leading-relaxed text-white/75">
                  {texto}
                </p>
              </Surgir>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// O índice: no computador, fica parado ao lado do texto e marca o item que
// está na tela; no celular, vem antes do texto, como uma lista de atalhos.
function Indice({ ativo }) {
  return (
    <nav aria-label="Itens dos termos" className="lg:sticky lg:top-28">
      <p className="text-base font-bold text-[#1a1c1c]">Neste documento</p>
      <ol className="mt-4 grid gap-1">
        {ITENS.map(({ id, titulo }) => {
          const marcado = ativo === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={marcado ? "location" : undefined}
                className={`flex gap-3 rounded-xl px-3 py-2.5 text-base leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24] ${
                  marcado
                    ? "bg-[#fdecee] text-[#9e0a24] font-semibold"
                    : "text-[#5b403f] hover:bg-[#faf6f6] hover:text-[#1a1c1c]"
                }`}
              >
                <span className="w-5 shrink-0 text-right font-bold tabular-nums">
                  {numeroDo(id)}
                </span>
                {titulo}
              </a>
            </li>
          );
        })}
      </ol>
      {/* O e-mail numa linha só dele: ao lado de "Dúvidas?", ele não cabe
          na coluna do índice e quebrava no meio. */}
      <p className="mt-6 px-3 text-base leading-relaxed text-[#5f5e5e]">
        Dúvidas?
        <a
          href={`mailto:${CONTATO}`}
          className="block w-fit font-semibold text-[#9e0a24] underline decoration-[#9e0a24]/30 underline-offset-4"
        >
          {CONTATO}
        </a>
      </p>
    </nav>
  );
}

function TermosPage() {
  const { hash } = useLocation();
  const [ativo, setAtivo] = useState(ITENS[0].id);

  // Quem chega por um endereço com item (/termos#privacidade) vai direto a
  // ele, já com o topo da página no lugar.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  // O item marcado no índice é o que ocupa a faixa de leitura da tela.
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.find((e) => e.isIntersecting);
        if (visivel) setAtivo(visivel.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    for (const { id } of ITENS) {
      const secao = document.getElementById(id);
      if (secao) observador.observe(secao);
    }
    return () => observador.disconnect();
  }, []);

  return (
    <>
      <Header />
      <main>
        <Abertura />
        <Resumo />
        <div
          className={`${CONTAINER} py-14 md:py-20 grid lg:grid-cols-[17rem_minmax(0,1fr)] gap-12 lg:gap-16 items-start`}
        >
          <Indice ativo={ativo} />
          <div className="max-w-[46rem] space-y-16 md:space-y-20">
            <Secoes />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default TermosPage;
