import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ModalComoFuncionaValidacao from "../components/ComoFuncionaValidacao";
import fotoCao from "../assets/dogs/dog1_1-image.jpg";
import fotoGato from "../assets/cats/cat7_0-image.jpg";
import fotoDoador from "../assets/dogs/dog1_2-image.jpg";

// ─── Referências ──────────────────────────────────────────────────────────────
// Na ordem em que aparecem na página: o número de cada fonte é a posição dela
// nesta lista, como nas notas de um texto acadêmico. Os critérios de doação
// seguem a ABVHMT e podem variar um pouco entre hospitais.
const FONTES = [
  {
    id: "msdBanco",
    curta: "MSD Veterinary Manual",
    completa:
      "MSD Veterinary Manual. Screening of Blood Donors and Blood Banking Considerations in Dogs and Cats.",
    url: "https://www.msdvetmanual.com/circulatory-system/blood-groups-and-blood-transfusions-in-dogs-and-cats/screening-of-blood-donors-and-blood-banking-considerations-in-dogs-and-cats",
  },
  {
    id: "uel",
    curta: "Serafim et al., 2024",
    completa:
      "SERAFIM, A. P. et al. Incidência de reações transfusionais em cães em hospital veterinário universitário: estudo retrospectivo. Hematology, Transfusion and Cell Therapy, out. 2024.",
    url: "https://www.htct.com.br/en-incidencia-de-reacoes-transfusionais-em-articulo-S2531137924017553",
  },
  {
    id: "abvhmt",
    curta: "ABVHMT, 2024",
    completa:
      "ABVHMT (Associação Brasileira Veterinária de Hematologia e Medicina Transfusional). Nota Técnica nº 3: Cães e gatos doadores de sangue, requisitos e cuidados. São Paulo, fev. 2024.",
    url: "https://abvhmt.org/wp-content/uploads/2024/02/Nota-Tecnica-ABVHMT-DOADORES-REQUISITOS-E-CUIDADOS.pdf",
  },
  {
    id: "ebc",
    curta: "Radioagência Nacional, 2021",
    completa:
      "Radioagência Nacional (EBC). Saiba o que é preciso para que seu pet seja um doador de sangue. Jun. 2021.",
    url: "https://agenciabrasil.ebc.com.br/radioagencia-nacional/geral/audio/2021-06/saiba-o-que-e-preciso-para-que-seu-pet-seja-um-doador-de-sangue",
  },
  {
    id: "msdGrupos",
    curta: "MSD Veterinary Manual",
    completa: "MSD Veterinary Manual. Blood Groups in Dogs and Cats.",
    url: "https://www.msdvetmanual.com/circulatory-system/blood-groups-and-blood-transfusions-in-dogs-and-cats/blood-groups-in-dogs-and-cats",
  },
];

const FONTE_POR_ID = Object.fromEntries(
  FONTES.map((f, i) => [f.id, { ...f, numero: i + 1 }]),
);

// Nota sobrescrita que leva à lista de fontes no fim da página.
function Ref({ ids, claro = false }) {
  const lista = (Array.isArray(ids) ? ids : [ids])
    .map((id) => FONTE_POR_ID[id])
    .sort((a, b) => a.numero - b.numero);
  return (
    <sup className="font-semibold">
      {lista.map((f, i) => (
        <span key={f.id}>
          {i > 0 && ","}
          <a
            href={`#fonte-${f.numero}`}
            title={f.curta}
            aria-label={`Fonte ${f.numero}: ${f.curta}`}
            className={`px-px hover:underline ${
              claro ? "text-white/70 hover:text-white" : "text-[#b7102a]"
            }`}
          >
            {f.numero}
          </a>
        </span>
      ))}
    </sup>
  );
}

// ─── Peças compartilhadas ─────────────────────────────────────────────────────

// Conteúdo que aparece suavemente quando entra na tela. Quem pede menos
// movimento no sistema vê tudo de imediato.
function Surgir({ atraso = 0, className = "", children }) {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visivel) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [visivel]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visivel ? `${atraso}ms` : "0ms" }}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Botões em pílula da landing, no mesmo desenho da abertura.
const PILULA = {
  vermelho: "bg-[#b7102a] text-white hover:bg-[#8e001b]",
  branco:
    "border border-white bg-white text-black hover:scale-105 motion-reduce:hover:scale-100",
};

function Pilula({ to, variante = "vermelho", children }) {
  return (
    <Link
      to={to}
      className={`inline-block px-6 sm:px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest text-center sm:whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] focus-visible:ring-offset-2 ${PILULA[variante]}`}
    >
      {children}
    </Link>
  );
}

const CONTAINER = "container mx-auto px-5 md:px-8 max-w-[1200px]";
const TITULO_SECAO =
  "text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08]";

// ─── Abertura ─────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black">
      <img
        src="https://i.postimg.cc/cJHksc3m/cachorrinsalsicha.jpg"
        className="absolute right-0 top-0 h-full w-2/3 object-contain object-right"
        alt=""
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0" />
      <div className={`${CONTAINER} relative z-10`}>
        <div className="max-w-2xl text-left">
          <h1 className="text-5xl md:text-7xl mb-8 leading-[1.05] font-extrabold tracking-tighter text-white">
            Seu pet pode <br />
            <span className="text-[#b7102a] italic">salvar uma vida!</span>
          </h1>
          <p className="text-lg md:text-xl mb-12 max-w-xl leading-relaxed text-white">
            Conectamos tutores de animais que precisam de transfusão a doadores
            voluntários em uma rede de solidariedade técnica e segura.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <Pilula to="/buscar">Preciso de um doador</Pilula>
            <Pilula to="/cadastrar" variante="branco">
              Quero cadastrar meu animal
            </Pilula>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Por que o UFVet existe ───────────────────────────────────────────────────
// Mensagens ilustrativas de como a busca por doador costuma acontecer hoje.
const CONVERSA = [
  {
    autor: "Ana",
    texto: "URGENTE!! Alguém tem cachorro grande que possa doar sangue? É pra hoje",
    hora: "14:02",
  },
  {
    autor: "Júlia",
    texto: "Precisa ser de algum tipo? Tem que ter exame?",
    hora: "14:31",
  },
  { autor: "Ana", texto: "Ainda procurando…", hora: "16:47" },
];

const VANTAGENS = [
  { titulo: "Espere menos", texto: "Validados já chegam com os exames em dia." },
  { titulo: "Gaste menos", texto: "Menos exames a fazer antes da coleta." },
  { titulo: "Confie mais", texto: "Dados conferidos por um veterinário." },
  { titulo: "Fale direto", texto: "Contato com o tutor, sem intermediários." },
];

function CanalSection() {
  return (
    <section id="por-que-o-ufvet" className="py-24 md:py-32 bg-white">
      <div className={CONTAINER}>
        <Surgir className="max-w-3xl mb-12">
          <h2 className={`${TITULO_SECAO} text-[#1a1c1c] mb-5`}>
            Sem banco de sangue, o doador precisa ser encontrado na hora
          </h2>
          <p className="text-lg text-[#5b403f] leading-relaxed max-w-2xl">
            Na UFV não há estoque de sangue para cães e gatos. Em casos de
            anemia grave, perda de sangue ou problemas de coagulação,
            <Ref ids="msdBanco" /> alguém precisa aparecer para doar, e rápido.
          </p>
        </Surgir>

        <div className="grid lg:grid-cols-2 gap-5">
          <Surgir className="h-full">
            <div className="h-full rounded-[2rem] bg-[#f3f0f0] p-6 md:p-8">
              <p className="font-bold text-[#1a1c1c]">Como é hoje</p>
              <p className="text-sm text-[#5f5e5e] mt-1">
                Pedidos espalhados em grupos e redes sociais.
              </p>

              <div className="mt-6 rounded-2xl bg-[#e8e3e3] p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-black/5">
                  <span className="w-9 h-9 rounded-full bg-[#cfc6c6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] text-white">
                      group
                    </span>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#1a1c1c]">
                      Tutores de pets da cidade
                    </p>
                    <p className="text-xs text-[#5f5e5e]">248 participantes</p>
                  </div>
                </div>
                {CONVERSA.map((m, i) => (
                  <div
                    key={i}
                    className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-4 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
                  >
                    <p className="text-xs font-bold text-[#8e001b]">{m.autor}</p>
                    <p className="text-[15px] text-[#1a1c1c] leading-snug">
                      {m.texto}
                    </p>
                    <p className="text-[11px] text-[#8f8a8a] text-right mt-0.5">
                      {m.hora}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Surgir>

          <Surgir atraso={120} className="h-full">
            <div className="h-full rounded-[2rem] bg-[#b7102a] text-white p-6 md:p-8">
              <p className="font-bold">No UFVet</p>
              <p className="text-sm text-white/75 mt-1">
                Um canal feito só para encontrar doadores.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-white/15 text-sm font-semibold">
                  Cão
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white text-[#8e001b] text-sm font-semibold">
                  Só validados
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/15 text-sm font-semibold">
                  Mais perto de mim
                </span>
              </div>

              <div className="mt-4 flex gap-4 rounded-2xl bg-white p-3 text-[#1a1c1c] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]">
                <img
                  src={fotoDoador}
                  alt=""
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-bold">Bento</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#fdecee] text-[#8e001b]">
                      DEA 1.1+
                    </span>
                  </div>
                  <p className="text-sm text-[#5f5e5e]">
                    Labrador, 5 anos, 30 kg
                  </p>
                  <p className="text-sm text-[#5f5e5e]">Centro, Viçosa - MG</p>
                  <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-emerald-700">
                    <span className="material-symbols-outlined text-[18px]">
                      verified
                    </span>
                    Validado por veterinário
                  </p>
                </div>
              </div>

              <dl className="mt-8 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                {VANTAGENS.map((v) => (
                  <div key={v.titulo}>
                    <dt className="text-xl font-extrabold tracking-tight">
                      {v.titulo}
                    </dt>
                    <dd className="text-white/80 leading-snug mt-0.5">
                      {v.texto}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Surgir>
        </div>

        <Surgir>
          <p className="mt-8 text-sm text-[#5f5e5e]">
            A demanda é real: só em um hospital veterinário universitário, foram
            258 transfusões em cães em dois anos e meio.
            <Ref ids="uel" />
          </p>
        </Surgir>
      </div>
    </section>
  );
}

// ─── Meu pet pode doar? ───────────────────────────────────────────────────────
const ESPECIES = {
  cao: {
    rotulo: "Cão",
    foto: fotoCao,
    legenda: "Cães doam acordados, sem anestesia. Por isso, precisam ser calmos.",
    criterios: [
      { valor: "1 a 8 anos", texto: "Adulto e saudável" },
      { valor: "Mais de 25 kg", texto: "Para doar uma bolsa inteira com segurança" },
      { valor: "Vacinas em dia", texto: "Vermífugo também" },
      { valor: "Sem remédios", texto: "Antipulgas e preventivos são permitidos" },
    ],
  },
  gato: {
    rotulo: "Gato",
    foto: fotoGato,
    legenda: "Gatos precisam ser dóceis. Se for preciso, a equipe usa sedação.",
    criterios: [
      { valor: "1 a 8 anos", texto: "Adulto e saudável" },
      { valor: "Mais de 4 kg", texto: "Grande, mas sem obesidade" },
      { valor: "Só em casa", texto: "Sem acesso à rua" },
      { valor: "Vacinas em dia", texto: "E sem uso de remédios" },
    ],
  },
};

const PAUSAS = [
  "Cio",
  "Gestação",
  "Amamentação",
  "Castração recente",
  "Vacina recente",
  "Uso de remédios",
  "Doou há menos de 90 dias",
];

const IMPEDIMENTOS = ["Já recebeu transfusão", "Doença crônica"];

function PodeDoarSection() {
  const [especie, setEspecie] = useState("cao");
  const atual = ESPECIES[especie];

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
              <Ref ids="abvhmt" />
            </p>
          </div>

          <div
            role="group"
            aria-label="Espécie"
            className="flex p-1.5 bg-white rounded-full gap-1 self-start md:self-auto shadow-[0_1px_2px_rgba(142,0,27,0.08)]"
          >
            {Object.entries(ESPECIES).map(([chave, e]) => (
              <button
                key={chave}
                type="button"
                onClick={() => setEspecie(chave)}
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
                {e.rotulo}
              </button>
            ))}
          </div>
        </Surgir>

        <div className="grid lg:grid-cols-[5fr_7fr] gap-5">
          <Surgir className="h-full">
            <div className="relative h-full min-h-[360px] rounded-[2rem] overflow-hidden bg-[#f7cdd3]">
              {Object.entries(ESPECIES).map(([chave, e]) => (
                <img
                  key={chave}
                  src={e.foto}
                  alt={
                    especie === chave
                      ? `Exemplo de ${e.rotulo.toLowerCase()} doador`
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
                <div>
                  <p className="font-bold text-[#1a1c1c]">
                    Precisa esperar um pouco
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {PAUSAS.map((p) => (
                      <li
                        key={p}
                        className="px-3 py-1.5 rounded-full bg-white text-sm font-medium text-[#1a1c1c]"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-[#1a1c1c]">Não pode doar</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {IMPEDIMENTOS.map((p) => (
                      <li
                        key={p}
                        className="px-3 py-1.5 rounded-full bg-[#1a1c1c] text-sm font-medium text-white"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
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

// ─── Como é a doação ──────────────────────────────────────────────────────────
const ETAPAS = [
  {
    titulo: "Triagem",
    texto: "Conversa sobre o histórico do animal e exame físico.",
    destaque: "No hospital",
    ref: "abvhmt",
  },
  {
    titulo: "Exame rápido",
    texto: "Uma amostra de sangue confirma que o doador está bem.",
    destaque: "Antes de toda doação",
    ref: "abvhmt",
  },
  {
    titulo: "Coleta",
    texto: "Com material estéril. Cães ficam acordados.",
    destaque: "Cerca de 15 min",
    ref: ["ebc", "abvhmt"],
  },
  {
    titulo: "Descanso",
    texto: "Água, comida e carinho. Em casa, só passeios curtos.",
    destaque: "24 horas",
    ref: "abvhmt",
  },
  {
    titulo: "Próxima doação",
    texto: "Tempo para o corpo repor as reservas de ferro.",
    destaque: "Depois de 90 dias",
    ref: "abvhmt",
  },
];

function ComoEADoacaoSection() {
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
              {i < ETAPAS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bg-[#f7cdd3] left-6 top-12 -bottom-8 w-0.5 md:left-12 md:-right-5 md:top-6 md:bottom-auto md:h-0.5 md:w-auto"
                />
              )}
              <Surgir atraso={i * 90} className="relative flex md:block gap-5">
                <span className="shrink-0 w-12 h-12 rounded-full bg-[#b7102a] text-white text-lg font-extrabold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="md:mt-5">
                  <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-[#fdecee] text-[#8e001b]">
                    {e.destaque}
                  </span>
                  <h3 className="text-xl font-bold text-[#1a1c1c] mt-3">
                    {e.titulo}
                  </h3>
                  <p className="text-[#5b403f] leading-relaxed mt-1">
                    {e.texto}
                    <Ref ids={e.ref} />
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

// ─── Mitos e verdades ─────────────────────────────────────────────────────────
const MITOS = [
  {
    afirmacao: "Doar sangue faz mal ao pet.",
    resposta:
      "O doador é examinado antes, doa uma quantidade calculada pelo peso e só volta a doar depois de 90 dias.",
    ref: "abvhmt",
  },
  {
    afirmacao: "Cachorro precisa de anestesia para doar.",
    resposta:
      "Cães doam acordados: a anestesia não é recomendada. Por isso o doador precisa ser calmo.",
    ref: "abvhmt",
  },
  {
    afirmacao: "Qualquer sangue serve para qualquer animal.",
    resposta:
      "Cães e gatos têm tipos sanguíneos diferentes. Gatos já nascem com anticorpos contra o tipo que não têm.",
    ref: "msdGrupos",
  },
  {
    afirmacao: "Só cachorro de raça pode doar.",
    resposta:
      "Raça não é critério. Um vira-lata saudável, calmo e com o peso certo pode doar.",
    ref: "abvhmt",
  },
  {
    afirmacao: "Fêmea não castrada não pode doar.",
    resposta: "Pode, sim. Só não durante o cio, a gestação e a amamentação.",
    ref: "abvhmt",
  },
];

const VERDADES = [
  {
    afirmacao: "A coleta é rápida.",
    resposta: "Leva cerca de 15 minutos, contando só a coleta.",
    ref: "ebc",
  },
  {
    afirmacao: "O doador é examinado antes de toda doação.",
    resposta:
      "Um exame de sangue rápido confirma que ele não está anêmico antes de cada coleta.",
    ref: "abvhmt",
  },
  {
    afirmacao: "Uma doação pode ajudar mais de um animal.",
    resposta:
      "O sangue pode ser separado em hemácias e plasma, que tratam problemas diferentes.",
    ref: "msdBanco",
  },
  {
    afirmacao: "Existe um intervalo entre doações.",
    resposta:
      "São pelo menos 90 dias, tempo para o corpo repor as reservas de ferro.",
    ref: "abvhmt",
  },
  {
    afirmacao: "Gato que sai de casa não pode doar.",
    resposta:
      "Na rua, ele pode pegar infecções que os exames ainda não conseguem detectar.",
    ref: "abvhmt",
  },
];

function CarrosselAfirmacoes({ verdade = false, itens }) {
  const [indice, setIndice] = useState(0);
  const inicioToque = useRef(null);
  const total = itens.length;
  const nome = verdade ? "Verdade" : "Mito";

  const ir = (novo) => setIndice((novo + total) % total);

  const cores = verdade
    ? {
        cartao: "bg-white text-[#1a1c1c]",
        titulo: "text-[#b7102a]",
        resposta: "text-[#5b403f]",
        seta: "border-[#eadede] text-[#1a1c1c] hover:bg-[#fdecee]",
        ponto: "bg-[#b7102a]",
        pontoInativo: "bg-[#eadede]",
        foco: "focus-visible:ring-[#b7102a]",
      }
    : {
        cartao: "bg-[#5e0013] text-white",
        titulo: "text-white",
        resposta: "text-white/80",
        seta: "border-white/25 text-white hover:bg-white/10",
        ponto: "bg-white",
        pontoInativo: "bg-white/25",
        foco: "focus-visible:ring-white",
      };

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label={verdade ? "Verdades" : "Mitos"}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") ir(indice + 1);
        if (e.key === "ArrowLeft") ir(indice - 1);
      }}
      className={`h-full rounded-[2rem] p-7 md:p-10 flex flex-col ${cores.cartao}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3
          className={`text-5xl md:text-6xl font-extrabold tracking-tighter ${cores.titulo}`}
        >
          {nome}
        </h3>
        <span
          aria-live="polite"
          className="text-sm font-semibold tabular-nums opacity-70"
        >
          {indice + 1} de {total}
        </span>
      </div>

      <div
        className="mt-8 flex-1 overflow-hidden"
        onTouchStart={(e) => {
          inicioToque.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (inicioToque.current === null) return;
          const dx = e.changedTouches[0].clientX - inicioToque.current;
          if (Math.abs(dx) > 40) ir(dx < 0 ? indice + 1 : indice - 1);
          inicioToque.current = null;
        }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {itens.map((item, i) => (
            <div
              key={item.afirmacao}
              role="group"
              aria-roledescription="item"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={i !== indice}
              inert={i !== indice}
              className="w-full shrink-0"
            >
              <p className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                “{item.afirmacao}”
              </p>
              <p className={`mt-4 text-lg leading-relaxed ${cores.resposta}`}>
                {item.resposta}
                <Ref ids={item.ref} claro={!verdade} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {itens.map((item, i) => (
            <button
              key={item.afirmacao}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir para ${nome.toLowerCase()} ${i + 1}`}
              aria-current={i === indice}
              className={`h-2 rounded-full transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 ${cores.foco} ${
                i === indice ? `w-6 ${cores.ponto}` : `w-2 ${cores.pontoInativo}`
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { passo: -1, icone: "chevron_left", rotulo: "Anterior" },
            { passo: 1, icone: "chevron_right", rotulo: "Próximo" },
          ].map((b) => (
            <button
              key={b.icone}
              type="button"
              onClick={() => ir(indice + b.passo)}
              aria-label={`${b.rotulo} ${nome.toLowerCase()}`}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 ${cores.seta} ${cores.foco}`}
            >
              <span className="material-symbols-outlined">{b.icone}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MitosSection() {
  return (
    <section
      id="mitos-e-verdades"
      className="py-24 md:py-32 bg-[#8e001b] text-white"
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

// ─── Chamada final ────────────────────────────────────────────────────────────
function ChamadaSection() {
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className={CONTAINER}>
        <div className="grid md:grid-cols-2 gap-5">
          <Surgir className="h-full">
            <div className="h-full rounded-[2rem] bg-[#fdecee] p-8 md:p-12 flex flex-col items-start">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-[#1a1c1c] mb-4">
                Cadastre seu pet como doador
              </h2>
              <p className="text-lg text-[#5b403f] leading-relaxed mb-10 max-w-md flex-1">
                Leva poucos minutos. Com os dados validados por um veterinário,
                a coleta fica mais rápida quando alguém precisar.
              </p>
              <Pilula to="/cadastrar">Cadastrar meu animal</Pilula>
            </div>
          </Surgir>

          <Surgir atraso={120} className="h-full">
            <div className="h-full rounded-[2rem] bg-[#1a1c1c] text-white p-8 md:p-12 flex flex-col items-start">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-4">
                Seu animal precisa de sangue?
              </h2>
              <p className="text-lg text-white/75 leading-relaxed mb-10 max-w-md flex-1">
                Filtre por espécie, tipo sanguíneo e bairro, veja quem já foi
                validado e fale direto com o tutor do doador.{" "}
                <button
                  type="button"
                  onClick={() => setExplicacaoAberta(true)}
                  className="font-semibold text-white underline underline-offset-4 decoration-white/40 hover:decoration-white"
                >
                  Como funciona a validação?
                </button>
              </p>
              <Pilula to="/buscar" variante="branco">
                Buscar doadores
              </Pilula>
            </div>
          </Surgir>
        </div>
      </div>

      {explicacaoAberta && (
        <ModalComoFuncionaValidacao onClose={() => setExplicacaoAberta(false)} />
      )}
    </section>
  );
}

// ─── Fontes ───────────────────────────────────────────────────────────────────
function FontesSection() {
  return (
    <section id="fontes" className="py-16 bg-white border-t border-[#f3e6e8]">
      <div className={CONTAINER}>
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6 lg:gap-20">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#1a1c1c] mb-2">
              Fontes
            </h2>
            <p className="text-sm text-[#5f5e5e] leading-relaxed">
              Os números pequenos ao longo da página indicam de onde vem cada
              informação. Nada aqui substitui a orientação do veterinário.
            </p>
          </div>
          <ol className="space-y-1">
            {FONTES.map((f, i) => (
              <li
                key={f.id}
                id={`fonte-${i + 1}`}
                className="scroll-mt-28 grid grid-cols-[1.75rem_1fr] gap-2 px-3 py-2 -mx-3 rounded-lg target:bg-[#fdecee]"
              >
                <span className="text-sm font-bold text-[#b7102a] tabular-nums">
                  {i + 1}
                </span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#5b403f] leading-relaxed hover:text-[#8e001b] hover:underline underline-offset-2"
                >
                  {f.completa}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  return (
    <>
      <Header dark />
      <main>
        <HeroSection />
        <CanalSection />
        <PodeDoarSection />
        <ComoEADoacaoSection />
        <MitosSection />
        <ChamadaSection />
        <FontesSection />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;
