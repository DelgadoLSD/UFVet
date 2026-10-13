import Surgir from "../inicio/Surgir";
import { numeroDo, tituloDo } from "./indice";

// As peças com que os termos são escritos: a seção numerada, o parágrafo, a
// lista, o aviso, o par "é / não é", os cartões e as linhas de "dado e para
// quê". Cada uma tem a versão clara e a escura (a seção dos veterinários).

// Uma seção dos termos: o número (o mesmo do índice) num círculo vermelho e
// o título. `escura` faz dela um bloco preto, para a parte de um papel saltar
// aos olhos de quem procura por ela.
export function Secao({ id, escura = false, children }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={`scroll-mt-24 md:scroll-mt-28 ${
        escura
          ? "rounded-[2rem] bg-[#1a1a1a] text-white px-5 py-8 sm:px-8 md:p-10"
          : ""
      }`}
    >
      <Surgir>
        <h2
          id={`${id}-titulo`}
          className={`flex items-start gap-4 text-3xl md:text-4xl font-extrabold tracking-tight leading-tight ${
            escura ? "text-white" : "text-[#1a1c1c]"
          }`}
        >
          <span className="shrink-0 mt-0.5 w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#9e0a24] text-white text-lg md:text-xl flex items-center justify-center">
            {numeroDo(id)}
          </span>
          <span>{tituloDo(id)}</span>
        </h2>
        <div className="mt-7 space-y-7">{children}</div>
      </Surgir>
    </section>
  );
}

// Um parágrafo corrido, em letra de leitura confortável.
export function Texto({ escura = false, children }) {
  return (
    <p
      className={`text-lg leading-relaxed ${
        escura ? "text-white/80" : "text-[#5b403f]"
      }`}
    >
      {children}
    </p>
  );
}

// Um subtítulo dentro de uma seção.
export function Subtitulo({ escura = false, children }) {
  return (
    <h3
      className={`text-xl md:text-2xl font-bold tracking-tight ${
        escura ? "text-white" : "text-[#1a1c1c]"
      }`}
    >
      {children}
    </h3>
  );
}

// Uma lista de pontos, com um marcador vermelho pequeno.
export function Lista({ escura = false, children }) {
  return (
    <ul
      className={`space-y-3.5 text-lg leading-relaxed ${
        escura ? "text-white/85" : "text-[#5b403f]"
      }`}
    >
      {children}
    </ul>
  );
}

export function Item({ escura = false, children }) {
  return (
    <li className="flex gap-3.5">
      <span
        aria-hidden="true"
        className={`shrink-0 mt-[0.65em] w-2 h-2 rounded-full ${
          escura ? "bg-white/60" : "bg-[#9e0a24]"
        }`}
      />
      <span>{children}</span>
    </li>
  );
}

// Um aviso que não pode passar despercebido: preto para "atenção", vermelho
// para o mais grave (os golpes).
export function Aviso({ titulo, icone, vermelho = false, children }) {
  return (
    <div
      className={`rounded-3xl px-5 py-6 sm:px-7 flex gap-4 ${
        vermelho ? "bg-[#9e0a24] text-white" : "bg-[#1a1a1a] text-white"
      }`}
    >
      <span
        aria-hidden="true"
        className={`material-symbols-outlined shrink-0 text-[28px] ${
          vermelho ? "text-white" : "text-white/90"
        }`}
      >
        {icone}
      </span>
      <div>
        <p className="text-xl font-bold">{titulo}</p>
        <p className="mt-2 text-lg leading-relaxed text-white/90">{children}</p>
      </div>
    </div>
  );
}

// Dois quadros lado a lado que se opõem: o branco (o que é) e o vermelho (o
// que não é).
export function Par({ claro, vermelho }) {
  const quadro = (lado, emVermelho) => (
    <div
      className={`rounded-3xl p-6 sm:p-7 ${
        emVermelho
          ? "bg-[#9e0a24] text-white"
          : "bg-white border border-[#eadede] text-[#1a1c1c]"
      }`}
    >
      <p className="text-2xl font-extrabold tracking-tight">{lado.titulo}</p>
      <ul className="mt-5 space-y-3.5 text-lg leading-relaxed">
        {lado.itens.map((texto) => (
          <li key={texto} className="flex gap-3.5">
            <span
              aria-hidden="true"
              className={`material-symbols-outlined shrink-0 text-[22px] mt-0.5 ${
                emVermelho ? "text-white" : "text-[#9e0a24]"
              }`}
            >
              {emVermelho ? "close" : "check"}
            </span>
            <span className={emVermelho ? "text-white/95" : "text-[#5b403f]"}>
              {texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {quadro(claro, false)}
      {quadro(vermelho, true)}
    </div>
  );
}

// Cartões de mesma forma, lado a lado no computador: título e texto curto.
export function Cartoes({ escura = false, itens }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {itens.map(({ titulo, texto }) => (
        <div
          key={titulo}
          className={`rounded-3xl p-6 ${
            escura
              ? "bg-white text-[#1a1c1c]"
              : "bg-white border border-[#eadede]"
          }`}
        >
          <p className="text-lg font-bold text-[#1a1c1c]">{titulo}</p>
          <p className="mt-2 text-lg leading-relaxed text-[#5b403f]">{texto}</p>
        </div>
      ))}
    </div>
  );
}

// Linhas de "o dado e para quê", como uma tabela de duas colunas que, no
// celular, vira uma pilha.
export function Linhas({ linhas }) {
  return (
    <dl className="rounded-3xl border border-[#eadede] divide-y divide-[#eadede] overflow-hidden">
      {linhas.map(({ dado, para }) => (
        <div
          key={dado}
          className="px-5 py-4 sm:px-6 sm:grid sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-6"
        >
          <dt className="text-lg font-bold text-[#1a1c1c]">{dado}</dt>
          <dd className="mt-1 sm:mt-0 text-lg leading-relaxed text-[#5b403f]">
            {para}
          </dd>
        </div>
      ))}
    </dl>
  );
}
