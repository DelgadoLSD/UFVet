import Surgir from "./Surgir";
import NotaFonte from "./NotaFonte";
import { CONTAINER, TITULO_SECAO } from "./estilos";
import fotoDoador from "../../assets/dogs/dog1_2-image.jpg";

// Por que o UFVet existe: como a busca por um doador acontece hoje (pedidos
// espalhados em grupos) ao lado de como fica com o site.

// Mensagens ilustrativas de um grupo de tutores procurando doador.
const CONVERSA = [
  {
    autor: "Ana",
    texto:
      "URGENTE!! Alguém tem cachorro grande que possa doar sangue? É pra hoje",
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
  {
    titulo: "Espere menos",
    texto: "Validados já chegam com os exames em dia.",
  },
  { titulo: "Gaste menos", texto: "Menos exames a fazer antes da coleta." },
  { titulo: "Confie mais", texto: "Dados conferidos por um veterinário." },
  { titulo: "Fale direto", texto: "Contato com o tutor, sem intermediários." },
];

// Cartão cinza: a conversa de grupo, como é hoje.
function ComoEHoje() {
  return (
    <div className="h-full rounded-[2rem] bg-[#f3f0f0] p-6 md:p-8">
      <p className="font-bold text-[#1a1c1c]">Como é hoje</p>
      <p className="text-sm text-[#5f5e5e] mt-1">
        Pedidos espalhados em grupos e redes sociais.
      </p>

      <div className="mt-6 rounded-2xl bg-[#e8e3e3] p-4 space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-black/5">
          <span className="w-9 h-9 rounded-full bg-[#cfc6c6] flex items-center justify-center">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[20px] text-white"
            >
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
            <p className="text-[15px] text-[#1a1c1c] leading-snug">{m.texto}</p>
            <p className="text-[11px] text-[#8f8a8a] text-right mt-0.5">
              {m.hora}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cartão vermelho: os filtros e um doador de exemplo, como fica no UFVet.
function NoUFVet() {
  return (
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
          <p className="text-sm text-[#5f5e5e]">Labrador, 5 anos, 30 kg</p>
          <p className="text-sm text-[#5f5e5e]">Centro, Viçosa - MG</p>
          <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px]"
            >
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
            <dd className="text-white/80 leading-snug mt-0.5">{v.texto}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SecaoPorQue() {
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
            <NotaFonte ids="msdBanco" /> alguém precisa aparecer para doar, e
            rápido.
          </p>
        </Surgir>

        <div className="grid lg:grid-cols-2 gap-5">
          <Surgir className="h-full">
            <ComoEHoje />
          </Surgir>
          <Surgir atraso={120} className="h-full">
            <NoUFVet />
          </Surgir>
        </div>

        <Surgir>
          <p className="mt-8 text-sm text-[#5f5e5e]">
            A demanda é real: só em um hospital veterinário universitário, foram
            258 transfusões em cães em dois anos e meio.
            <NotaFonte ids="uel" />
          </p>
        </Surgir>
      </div>
    </section>
  );
}

export default SecaoPorQue;
