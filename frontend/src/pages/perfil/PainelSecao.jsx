import { useId, useState } from "react";
import { useCelular } from "../../hooks/useCelular";

// Uma seção do perfil em painel: uma faixa vermelha no topo, com o título em
// branco, e o conteúdo embaixo, em branco. A faixa colorida é o
// que separa as partes de cada cartão (contato, localização, validação,
// observações, exames), em vez de deixá-las soltas no fundo branco.
//
// - `ajuda`: o "?" ao lado do título, na versão clara, para o vermelho;
// - `acao`: um botão no canto direito da faixa, no tamanho "xs" e numa
//   variante do Botao para fundo vermelho: "tonal" para o que é a ação
//   principal ali, "textoClaro" para uma ação secundária. A faixa tem sempre
//   a mesma altura, com ou sem botão, para os painéis lado a lado ficarem
//   alinhados;
// - `subtitulo`: uma linha dizendo para que serve a seção;
// - `nivel`: a tag do título. "h4" nos cartões dos animais (o nome do animal
//   é o h3); "h2" no cartão da pessoa, cujo nome é o h1 da página;
// - `corpo` ({ id, exibicao }): o id do conteúdo, para um botão da faixa
//   abri-lo e fechá-lo (aria-controls), e a classe de exibição dele ("flex"
//   por padrão; os filtros da busca usam "hidden lg:flex" quando fechados).
//
// No celular, um painel `recolhivel` abre e fecha pela faixa inteira, para a
// página não virar uma rolagem sem fim até os animais. Fechado, a faixa
// mostra o `resumo` do que tem dentro (os exames enviados, a cidade), e
// "Mostrar"; aberto, "Ocultar". A `acao` da faixa não cabe ao lado disso:
// no celular, vale a `acaoNoCelular`, no topo do conteúdo, na largura toda.
// Começa fechado, a não ser com `abertoNoInicio`. Na tela larga, os painéis
// ficam sempre abertos, lado a lado.

// O "Mostrar" e o "Ocultar" das faixas que abrem e fecham, com a setinha que
// vira. Só o desenho: quem anuncia se a seção está aberta é o aria-expanded
// do botão.
export function MostrarOcultar({ aberto }) {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 flex items-center gap-0.5 text-xs font-semibold text-white/90"
    >
      {aberto ? "Ocultar" : "Mostrar"}
      <span
        className={`material-symbols-outlined text-[18px] -mr-1 transition-transform motion-reduce:transition-none ${
          aberto ? "rotate-180" : ""
        }`}
      >
        expand_more
      </span>
    </span>
  );
}

// O botão que abre e fecha a seção: invisível, sobre a faixa inteira (absolute
// no primeiro ancestral posicionado), para o toque valer em qualquer ponto
// dela. O título continua texto comum embaixo, e o "?" segue a última palavra
// quando ele quebra a linha; o "?" e os botões da faixa ficam por cima
// (relative z-[1]) e respondem sozinhos. O leitor de tela ouve o título pelo
// botão; o texto à vista fica de fora, para não ser lido duas vezes.
// `className` arredonda os cantos da área, onde a faixa não os corta.
export function BotaoQueAbre({
  titulo,
  aberto,
  controla,
  onAlternar,
  className = "",
}) {
  return (
    <button
      type="button"
      aria-label={titulo}
      aria-expanded={aberto}
      aria-controls={controla}
      onClick={onAlternar}
      className={`absolute inset-0 [-webkit-tap-highlight-color:transparent] active:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${className}`}
    />
  );
}

// O título com o "?" colado na última palavra: se a linha quebrar, os dois
// descem juntos, em vez de o "?" cair sozinho na linha de baixo. `oculto`
// tira o texto do leitor de tela quando um BotaoQueAbre já o diz (o "?"
// continua à vista dele).
export function TituloComAjuda({
  titulo,
  ajuda,
  oculto = false,
  margem = "ml-1.5",
}) {
  const palavras = titulo.split(" ");
  const ultima = palavras.pop();
  const esconder = oculto || undefined;
  return (
    <>
      {palavras.length > 0 && (
        <span aria-hidden={esconder}>{palavras.join(" ")} </span>
      )}
      <span className="whitespace-nowrap">
        <span aria-hidden={esconder}>{ultima}</span>
        {ajuda && (
          <span
            className={`relative z-[1] inline-flex align-middle -mt-0.5 ${margem}`}
          >
            {ajuda}
          </span>
        )}
      </span>
    </>
  );
}

function PainelSecao({
  titulo,
  ajuda,
  acao,
  acaoNoCelular,
  subtitulo,
  resumo,
  recolhivel = false,
  abertoNoInicio = false,
  nivel: Titulo = "h4",
  corpo = {},
  children,
  className = "",
}) {
  const celular = useCelular();
  const [aberto, setAberto] = useState(abertoNoInicio);
  const idGerado = useId();
  const idCorpo = corpo.id ?? idGerado;
  const recolhe = recolhivel && celular;
  const fechado = recolhe && !aberto;

  return (
    <section
      className={`rounded-xl border border-[#eadede] bg-white overflow-hidden min-w-0 flex flex-col ${className}`}
    >
      <div className="relative flex items-center justify-between gap-3 px-4 py-2 min-h-12 bg-[#9e0a24]">
        <div className="min-w-0">
          <Titulo className="text-sm font-bold text-white leading-snug">
            {recolhe && (
              <BotaoQueAbre
                titulo={titulo}
                aberto={aberto}
                controla={idCorpo}
                onAlternar={() => setAberto((agora) => !agora)}
              />
            )}
            <TituloComAjuda titulo={titulo} ajuda={ajuda} oculto={recolhe} />
          </Titulo>
          {fechado && resumo && (
            <p className="mt-0.5 text-xs text-white/80 leading-snug">
              {resumo}
            </p>
          )}
        </div>
        {recolhe ? <MostrarOcultar aberto={aberto} /> : acao}
      </div>
      <div
        id={idCorpo}
        className={`p-4 flex-1 flex-col gap-3 ${
          fechado ? "hidden" : (corpo.exibicao ?? "flex")
        }`}
      >
        {subtitulo && <p className="text-xs text-[#5f5e5e]">{subtitulo}</p>}
        {recolhe && acaoNoCelular}
        {children}
      </div>
    </section>
  );
}

// Um campo de uma ficha dentro do painel (E-mail, Bairro, CRMV...): o nome do
// campo pequeno em cima e o dado embaixo.
export function CampoPainel({ rotulo, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#8f6f6e]">{rotulo}</p>
      <div className="mt-0.5 text-sm font-semibold text-[#1a1c1c] flex items-center gap-1.5 flex-wrap min-w-0">
        {children}
      </div>
    </div>
  );
}

export default PainelSecao;
