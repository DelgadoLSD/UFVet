import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { idDaAba, idDoPainel } from "./animalEscolhido";
import { movimentoReduzido } from "../../util/movimento";
import { nomeRaca, partesDoTipo, statusValidacao } from "../../regras/doacao";

// Os animais de um perfil num carrossel: uma faixa de cartões, um por
// animal, para escolher qual aparece aberto embaixo (o cartão completo,
// CartaoAnimal). Funciona como abas, no padrão de escolha do site: o
// escolhido fica vermelho, os outros brancos. O vermelho é uma placa só, que
// desliza de um cartão para o outro na troca, junto com o cartão completo
// embaixo (no mesmo ritmo; ver util/movimento.js).
//
// Os cartões têm a largura medida pela da faixa (a da página): no
// computador, 4 preenchem a largura toda, e o último termina na mesma linha
// em que termina o cartão completo embaixo; no tablet, 3. Com mais animais do
// que cabem, a faixa segue até a borda e o próximo cartão aparece cortado
// ali. No celular, cabe um e um pedaço do seguinte.
//
// Para ficar claro que a faixa anda para o lado: o cartão seguinte aparece
// cortado e a borda esmaece do lado em que há mais animais; as setas ao lado
// do título passam para o animal anterior ou o próximo, com o contador ("2 de
// 5"); e, no celular, uma linha avisa que dá para deslizar.
//
// - `escolhido`: o animal aberto; `onEscolher(animal)` troca;
// - `fim`: o que vem depois do último cartão, dentro da faixa (o cartão de
//   cadastrar, no próprio perfil).

// O cartão de um animal na faixa: a foto emoldurada, o nome, a raça e uma
// faixa com o tipo sanguíneo e a validação, como no cartão da busca. O
// cartão não tem fundo: o branco é o da página, e o vermelho, a placa que
// desliza por baixo. Escolhido, as letras ficam brancas e a célula do tipo se
// inverte (branca, com o tipo em vermelho), no mesmo ritmo da placa. A
// geometria é sempre a mesma, para os nomes e as fotos dos cartões lado a
// lado ficarem na mesma altura.
function AbaAnimal({ animal, escolhido, largura, onEscolher, onTeclar }) {
  const foto = animal.fotos[0]?.url;
  const tipo = animal.tipoSanguineo && partesDoTipo(animal.tipoSanguineo);
  const validado = statusValidacao(animal.validacoes[0] ?? null) === "validado";

  return (
    <button
      type="button"
      role="tab"
      id={idDaAba(animal.codigo)}
      data-codigo={animal.codigo}
      data-parada
      aria-selected={escolhido}
      aria-controls={idDoPainel(animal.codigo)}
      tabIndex={escolhido ? 0 : -1}
      onClick={() => onEscolher(animal)}
      onKeyDown={onTeclar}
      className={`group snap-start shrink-0 ${largura} flex flex-col p-2 text-left rounded-2xl border transition-colors duration-deslize ease-deslize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1c1c] focus-visible:ring-offset-2 ${
        escolhido
          ? "border-transparent text-white"
          : "border-[#eadede] text-[#1a1c1c] hover:border-[#cfa9a7]"
      }`}
    >
      <span className="relative block aspect-[4/3] rounded-xl overflow-hidden bg-[#fdecee]">
        {foto ? (
          <img
            src={foto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#8f6f6e]">
            Sem foto ainda
          </span>
        )}
      </span>

      <span className="block px-1.5 pt-3 pb-2.5">
        <span
          className={`block text-[1.0625rem] font-extrabold leading-tight tracking-tight truncate transition-colors duration-deslize ease-deslize ${
            escolhido ? "" : "group-hover:text-[#9e0a24]"
          }`}
        >
          {animal.nome}
        </span>
        <span
          className={`block text-xs truncate transition-colors duration-deslize ease-deslize ${
            escolhido ? "text-white/80" : "text-[#5f5e5e]"
          }`}
        >
          {nomeRaca(animal)}
        </span>
      </span>

      {/* Os vãos de 2px entre as células, como na faixa de dados. Cada
          célula tem uma linha só, centralizada, e a mesma altura, com ou sem
          tipagem: o sistema e o tipo lado a lado ("DEA 1.1+"), e a
          validação com o ícone. As duas têm a mesma largura, para a divisão
          entre elas ficar alinhada de um cartão para o outro; o tipo de nome
          longo ("Universal") usa uma letra um pouco menor, para caber. */}
      <span className="grid grid-cols-2 gap-[2px] rounded-lg overflow-hidden text-[11px]">
        {tipo ? (
          <span
            className={`h-9 px-1.5 min-w-0 flex items-center justify-center transition-colors duration-deslize ease-deslize ${
              escolhido ? "bg-white text-[#9e0a24]" : "bg-[#9e0a24] text-white"
            }`}
          >
            <span className="sr-only">Tipo sanguíneo {tipo.porExtenso}</span>
            {/* O sistema e o tipo na mesma linha, alinhados pela base das
                letras. */}
            <span
              aria-hidden="true"
              className="min-w-0 flex items-baseline gap-1"
            >
              <span
                className={`shrink-0 font-semibold transition-colors duration-deslize ease-deslize ${
                  escolhido ? "text-[#9e0a24]/80" : "text-white/80"
                }`}
              >
                {tipo.sistema}
              </span>
              <span
                className={`min-w-0 font-extrabold tracking-tight truncate ${
                  tipo.valor.length > 4 ? "text-xs" : "text-sm"
                }`}
              >
                {tipo.valor}
              </span>
            </span>
          </span>
        ) : (
          <span className="h-9 px-1.5 min-w-0 flex items-center justify-center bg-[#fdecee] text-[#5f5e5e] font-bold">
            <span className="truncate">Sem tipagem</span>
          </span>
        )}
        <span
          className={`h-9 px-1.5 min-w-0 flex items-center justify-center gap-1 font-bold ${
            validado ? "bg-[#1a1c1c] text-white" : "bg-[#fdecee] text-[#5f5e5e]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-[15px] shrink-0 ${
              validado ? "" : "text-[#8f6f6e]"
            }`}
            style={validado ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {validado ? "verified" : "schedule"}
          </span>
          <span className="truncate">
            {validado ? "Validado" : "Não validado"}
          </span>
        </span>
      </span>
    </button>
  );
}

function Seta({ rotulo, icone, desativada, onClick }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      disabled={desativada}
      onClick={onClick}
      className="w-10 h-10 shrink-0 rounded-full bg-white border border-[#eadede] text-[#1a1c1c] flex items-center justify-center transition-colors hover:bg-[#9e0a24] hover:border-[#9e0a24] hover:text-white disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24] focus-visible:ring-offset-2"
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[22px]"
      >
        {icone}
      </span>
    </button>
  );
}

// A folga entre a borda da faixa e o primeiro cartão (o px-1 da faixa), para
// o contorno de foco do cartão não ser cortado.
const FOLGA = 4;
// A largura do esmaecimento nas bordas da faixa, do lado em que há mais.
const ESMAECER = "48px";

// A largura de cada cartão, a partir da largura da faixa (100cqw, sem as
// folgas), com os vãos de 16px entre eles: 4 por vez nos computadores (a
// partir de 1280 px), 3 nos notebooks menores, 2,5 no tablet e 1,4 no
// celular, para a faixa de tipo e validação caber sempre inteira. Quando há mais
// cartões do que cabem, cada um estreita um pouco, para o seguinte aparecer
// cortado na borda.
function larguraDosCartoes(itens) {
  const tablet =
    itens > 2
      ? "md:w-[calc((100cqw-32px)/2.5)]"
      : "md:w-[calc((100cqw-16px)/2)]";
  const notebook =
    itens > 3
      ? "lg:w-[calc((100cqw-48px)/3.25)]"
      : "lg:w-[calc((100cqw-32px)/3)]";
  const computador =
    itens > 4
      ? "xl:w-[calc((100cqw-64px)/4.2)]"
      : "xl:w-[calc((100cqw-48px)/4)]";
  return `w-[calc((100cqw-16px)/1.4)] ${tablet} ${notebook} ${computador}`;
}

// Põe a placa vermelha exatamente atrás do cartão: mede os dois na tela, em
// frações de pixel, e soma o quanto a faixa já rolou. `imediato` pula o
// deslize (na primeira vez, quando a janela muda de tamanho ou com
// movimento reduzido).
function posicionarPlaca(faixa, placa, aba, imediato) {
  const f = faixa.getBoundingClientRect();
  const r = aba.getBoundingClientRect();
  if (imediato) placa.style.transition = "none";
  placa.style.width = `${r.width}px`;
  placa.style.height = `${r.height}px`;
  placa.style.transform = `translate(${r.left - f.left + faixa.scrollLeft}px, ${r.top - f.top + faixa.scrollTop}px)`;
  if (imediato) {
    // Lê a posição para o navegador aplicar o lugar novo sem transição,
    // antes de devolvê-la.
    void placa.offsetWidth;
    placa.style.transition = "";
  }
}

// Para onde a faixa rola para o cartão `aba` ficar inteiro à vista, ou null
// se ele já está. A faixa para sempre no começo de um cartão (como o dedo a
// deixa, no celular): à direita, escolhe a primeira parada em que o cartão
// cabe inteiro.
function rolagemPara(faixa, aba) {
  const inicio = aba.offsetLeft - FOLGA;
  const fim = aba.offsetLeft + aba.offsetWidth + FOLGA;
  if (inicio < faixa.scrollLeft) return inicio;
  if (fim <= faixa.scrollLeft + faixa.clientWidth) return null;
  const paradas = [...faixa.querySelectorAll("[data-parada]")].map(
    (cartao) => cartao.offsetLeft - FOLGA,
  );
  return (
    paradas.find((parada) => parada + faixa.clientWidth >= fim) ??
    faixa.scrollWidth
  );
}

// A máscara que esmaece as bordas da faixa onde ainda há cartões escondidos.
function mascara({ antes, depois }) {
  if (!antes && !depois) return undefined;
  const esquerda = antes ? `transparent 0, black ${ESMAECER}` : "black 0";
  const direita = depois
    ? `black calc(100% - ${ESMAECER}), transparent 100%`
    : "black 100%";
  const gradiente = `linear-gradient(to right, ${esquerda}, ${direita})`;
  return { maskImage: gradiente, WebkitMaskImage: gradiente };
}

function CarrosselAnimais({ titulo, animais, escolhido, onEscolher, fim }) {
  const faixaRef = useRef(null);
  const placaRef = useRef(null);
  const primeiraVez = useRef(true);
  // Há cartões escondidos antes ou depois do trecho à vista? (Decide o
  // esmaecimento das bordas e o aviso de deslizar.)
  const [escondidos, setEscondidos] = useState({
    antes: false,
    depois: false,
  });
  const posicao = animais.findIndex((a) => a.codigo === escolhido.codigo);
  const varios = animais.length > 1;
  const largura = larguraDosCartoes(animais.length + (fim ? 1 : 0));

  const irPara = (indice, focar = false) => {
    const animal = animais[Math.max(0, Math.min(indice, animais.length - 1))];
    onEscolher(animal);
    if (focar) {
      faixaRef.current
        ?.querySelector(`[data-codigo="${animal.codigo}"]`)
        ?.focus({ preventScroll: true });
    }
  };

  // Teclado, como nas abas: setas para os lados, Home e End.
  const aoTeclar = (e) => {
    const destino = {
      ArrowRight: posicao + 1,
      ArrowLeft: posicao - 1,
      Home: 0,
      End: animais.length - 1,
    }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    irPara(destino, true);
  };

  // A cada troca: a placa vermelha desliza até o cartão escolhido, e a faixa
  // rola para ele ficar inteiro à vista (um animal vindo da busca pode ser o
  // quinto). Só a faixa anda, para os lados; a página não rola. Na primeira
  // vez, tudo já começa no lugar, sem deslizar.
  useLayoutEffect(() => {
    const faixa = faixaRef.current;
    const aba = faixa?.querySelector(`[data-codigo="${escolhido.codigo}"]`);
    if (!aba) return;
    const imediato = primeiraVez.current || movimentoReduzido();
    primeiraVez.current = false;
    posicionarPlaca(faixa, placaRef.current, aba, imediato);
    const destino = rolagemPara(faixa, aba);
    if (destino !== null) {
      faixa.scrollTo({
        left: Math.max(0, destino),
        behavior: imediato ? "auto" : "smooth",
      });
    }
  }, [escolhido.codigo]);

  // Mede o que está escondido nas bordas ao rolar e ao mudar de tamanho; e,
  // se o cartão mudar de tamanho (a janela, a fonte), põe a placa no lugar.
  useEffect(() => {
    const faixa = faixaRef.current;
    const medir = () =>
      setEscondidos({
        antes: faixa.scrollLeft > 2,
        depois: faixa.scrollLeft + faixa.clientWidth < faixa.scrollWidth - 2,
      });
    const reposicionar = () => {
      const aba = faixa.querySelector('[role="tab"][aria-selected="true"]');
      if (aba) posicionarPlaca(faixa, placaRef.current, aba, true);
    };
    medir();
    faixa.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(() => {
      medir();
      reposicionar();
    });
    observador.observe(faixa);
    return () => {
      faixa.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [animais.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="text-2xl font-bold text-[#1a1c1c]">{titulo}</h2>
        {/* Com um animal só (no próprio perfil, ao lado do cartão de
            cadastrar), não há para onde passar. */}
        {varios && (
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[#5f5e5e] tabular-nums whitespace-nowrap">
              <span className="text-[#1a1c1c]">{posicao + 1}</span> de{" "}
              {animais.length}
            </p>
            <div className="flex items-center gap-2">
              <Seta
                rotulo="Animal anterior"
                icone="chevron_left"
                desativada={posicao <= 0}
                onClick={() => irPara(posicao - 1)}
              />
              <Seta
                rotulo="Próximo animal"
                icone="chevron_right"
                desativada={posicao >= animais.length - 1}
                onClick={() => irPara(posicao + 1)}
              />
            </div>
          </div>
        )}
      </div>

      {/* A faixa rola para os lados (no celular, com o dedo), parando no
          começo de cada cartão. A barra de rolagem fica escondida: o cartão
          cortado, a borda esmaecida, as setas e o contador mostram que há
          mais. */}
      <div
        ref={faixaRef}
        style={mascara(escondidos)}
        className="relative isolate [container-type:inline-size] -mx-1 px-1 py-1 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* A placa vermelha do escolhido, atrás dos cartões (a faixa isola
            as camadas: a placa fica abaixo do conteúdo dela, e não da
            página). */}
        <span
          ref={placaRef}
          aria-hidden="true"
          className="absolute left-0 top-0 -z-10 rounded-2xl bg-[#9e0a24] transition-transform duration-deslize ease-deslize motion-reduce:transition-none"
        />
        <div role="tablist" aria-label={titulo} className="flex gap-4">
          {animais.map((animal) => (
            <AbaAnimal
              key={animal.codigo}
              animal={animal}
              escolhido={animal.codigo === escolhido.codigo}
              largura={largura}
              onEscolher={onEscolher}
              onTeclar={aoTeclar}
            />
          ))}
        </div>
        {fim && (
          <div data-parada className={`snap-start shrink-0 flex ${largura}`}>
            {fim}
          </div>
        )}
      </div>

      {(escondidos.antes || escondidos.depois) && (
        <p className="md:hidden -mt-1 flex items-center gap-1.5 text-xs text-[#5f5e5e]">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[18px] text-[#9e0a24]"
          >
            swipe
          </span>
          Deslize para o lado para ver os outros animais
        </p>
      )}
    </div>
  );
}

export default CarrosselAnimais;
