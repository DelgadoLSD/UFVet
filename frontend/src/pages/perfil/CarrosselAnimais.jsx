import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NOVO_ANIMAL, idDaAba, idDoPainel } from "./animalEscolhido";
import {
  DURACAO_DESLIZE_MS,
  curvaDeslize,
  movimentoReduzido,
} from "../../util/movimento";
import { nomeRaca, partesDoTipo, statusValidacao } from "../../regras/doacao";

// Os animais de um perfil num carrossel centralizado: o escolhido fica no
// meio, um pouco maior e vermelho, e o cartão completo dele aparece embaixo
// (CartaoAnimal); os vizinhos, dos lados, são os que dá para escolher em
// seguida. Na troca, a faixa inteira desliza até o cartão novo chegar ao
// centro, no mesmo ritmo do cartão completo embaixo (util/movimento.js).
//
// Para escolher outro: as setas nas laterais, um clique num vizinho, as
// setas do teclado (como nas abas) ou, no celular, arrastar a faixa com o
// dedo: o cartão que para no centro vira o escolhido. Os pontinhos embaixo
// mostram quantos são e qual está no centro.
//
// - `itens`: a fila, com os códigos (ver itensDoCarrossel): no próprio
//   perfil, o cartão de cadastrar vem primeiro (NOVO_ANIMAL);
// - `centro`: o código do que está no centro; `onEscolher(codigo)` troca;
// - `onCadastrar`: abre o cadastro (o cartão de cadastrar, ao ser clicado).

// O cartão de um animal na faixa: a foto emoldurada, o nome, a raça e uma
// faixa com o tipo sanguíneo e a validação, como no cartão da busca. No
// centro, fica vermelho, com as letras brancas e a célula do tipo invertida
// (branca, com o tipo em vermelho). A geometria é sempre a mesma, para os
// nomes e as fotos dos cartões lado a lado ficarem na mesma altura.
function CartaoAnimalDaFila({ animal, noCentro }) {
  const foto = animal.fotos[0]?.url;
  const tipo = animal.tipoSanguineo && partesDoTipo(animal.tipoSanguineo);
  const validado = statusValidacao(animal.validacoes[0] ?? null) === "validado";
  const cor = "transition-colors duration-deslize ease-deslize";

  return (
    <>
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
          className={`block text-[1.0625rem] font-extrabold leading-tight tracking-tight truncate ${cor} ${
            noCentro ? "" : "group-hover:text-[#9e0a24]"
          }`}
        >
          {animal.nome}
        </span>
        <span
          className={`block text-xs truncate ${cor} ${
            noCentro ? "text-white/80" : "text-[#5f5e5e]"
          }`}
        >
          {nomeRaca(animal)}
        </span>
      </span>

      {/* Os vãos de 2px entre as células, como na faixa de dados. Cada
          célula tem uma linha só, centralizada, e a mesma altura, com ou sem
          tipagem; as duas têm a mesma largura, para a divisão ficar alinhada
          de um cartão para o outro. O tipo de nome longo ("Universal") usa
          uma letra um pouco menor, para caber. */}
      <span className="grid grid-cols-2 gap-[2px] rounded-lg overflow-hidden text-[11px]">
        {tipo ? (
          <span
            className={`h-9 px-1.5 min-w-0 flex items-center justify-center ${cor} ${
              noCentro ? "bg-white text-[#9e0a24]" : "bg-[#9e0a24] text-white"
            }`}
          >
            <span className="sr-only">Tipo sanguíneo {tipo.porExtenso}</span>
            <span
              aria-hidden="true"
              className="min-w-0 flex items-baseline gap-1"
            >
              <span
                className={`shrink-0 font-semibold ${cor} ${
                  noCentro ? "text-[#9e0a24]/80" : "text-white/80"
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
    </>
  );
}

// O cartão de cadastrar, na fila como os outros: tracejado, com o "+"
// vermelho e o convite. No centro, fica vermelho como o animal escolhido,
// com o "+" em branco.
function CartaoCadastrarDaFila({ noCentro }) {
  const cor = "transition-colors duration-deslize ease-deslize";
  return (
    <span className="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
      <span
        aria-hidden="true"
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 motion-reduce:group-hover:scale-100 ${cor} ${
          noCentro ? "bg-white text-[#9e0a24]" : "bg-[#9e0a24] text-white"
        }`}
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </span>
      <span
        className={`text-[1.0625rem] font-extrabold tracking-tight ${cor} ${
          noCentro ? "" : "text-[#1a1c1c]"
        }`}
      >
        Cadastrar animal
      </span>
      <span
        className={`text-xs leading-relaxed ${cor} ${
          noCentro ? "text-white/80" : "text-[#5f5e5e]"
        }`}
      >
        Cada doador cadastrado pode ajudar a salvar uma vida
      </span>
    </span>
  );
}

// A seta de uma lateral, na altura dos cartões: no computador e no tablet,
// na margem da página, do lado de fora dos cartões (sem cobrir nenhum); no
// celular, onde não há margem, por cima da borda da faixa.
function Seta({ lado, rotulo, desativada, onClick }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      disabled={desativada}
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-10 ${
        lado === "esquerda" ? "left-0 md:-left-14" : "right-0 md:-right-14"
      } w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border border-[#eadede] text-[#1a1c1c] shadow-[0_6px_18px_-6px_rgba(26,28,28,0.35)] flex items-center justify-center transition-[background-color,border-color,color,opacity] hover:bg-[#9e0a24] hover:border-[#9e0a24] hover:text-white disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24] focus-visible:ring-offset-2`}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[24px]"
      >
        {lado === "esquerda" ? "chevron_left" : "chevron_right"}
      </span>
    </button>
  );
}

// A largura do esmaecimento nas bordas da faixa, do lado em que há mais.
const ESMAECER = "40px";

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

// Quanto a faixa precisa rolar para o cartão ficar no centro dela.
const rolagemDoCentro = (faixa, cartao) =>
  cartao.offsetLeft + cartao.offsetWidth / 2 - faixa.clientWidth / 2;

// O cartão mais perto do centro da faixa, agora.
function cartaoNoCentro(faixa) {
  const meio = faixa.scrollLeft + faixa.clientWidth / 2;
  let maisPerto = null;
  let menorDistancia = Infinity;
  for (const cartao of faixa.querySelectorAll("[data-codigo]")) {
    const distancia = Math.abs(
      cartao.offsetLeft + cartao.offsetWidth / 2 - meio,
    );
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      maisPerto = cartao;
    }
  }
  return maisPerto;
}

function CarrosselAnimais({
  titulo,
  resumo,
  animais,
  itens,
  centro,
  onEscolher,
  onCadastrar,
}) {
  const faixaRef = useRef(null);
  const primeiraVez = useRef(true);
  // A animação da rolagem em andamento (o pedido de quadro), para uma troca
  // nova interromper a anterior; e se a faixa está andando sozinha (aí o
  // centro ainda não é escolha de ninguém).
  const quadro = useRef(null);
  const andandoSozinha = useRef(false);
  // O escolhido e a função de escolher mais recentes, para quem escuta a
  // rolagem (que não é recriado a cada troca).
  const atual = useRef({ centro, onEscolher });
  useEffect(() => {
    atual.current = { centro, onEscolher };
  });
  // Há cartões escondidos antes ou depois do trecho à vista? (Decide o
  // esmaecimento das bordas.)
  const [escondidos, setEscondidos] = useState({
    antes: false,
    depois: false,
  });

  const porCodigo = new Map(animais.map((animal) => [animal.codigo, animal]));
  const posicao = itens.indexOf(centro);
  const nomeDe = (codigo) =>
    codigo === NOVO_ANIMAL ? "Cadastrar animal" : porCodigo.get(codigo)?.nome;

  const irPara = (indice, focar = false) => {
    const codigo = itens[Math.max(0, Math.min(indice, itens.length - 1))];
    onEscolher(codigo);
    if (focar) {
      faixaRef.current
        ?.querySelector(`[data-codigo="${codigo}"]`)
        ?.focus({ preventScroll: true });
    }
  };

  // Teclado, como nas abas: setas para os lados, Home e End.
  const aoTeclar = (e) => {
    const destino = {
      ArrowRight: posicao + 1,
      ArrowLeft: posicao - 1,
      Home: 0,
      End: itens.length - 1,
    }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    irPara(destino, true);
  };

  // A cada troca, a faixa desliza até o escolhido chegar ao centro: na
  // mesma duração e curva do cartão completo embaixo. O encaixe da rolagem
  // (que segura a faixa parada no centro de um cartão) fica desligado
  // enquanto ela anda, para não brigar com o deslize. Na primeira vez, e com
  // movimento reduzido, a faixa já vai direto ao lugar.
  useLayoutEffect(() => {
    const faixa = faixaRef.current;
    const cartao = faixa?.querySelector(`[data-codigo="${centro}"]`);
    if (!cartao) return;
    cancelAnimationFrame(quadro.current);
    const destino = rolagemDoCentro(faixa, cartao);
    const imediato = primeiraVez.current || movimentoReduzido();
    primeiraVez.current = false;
    if (imediato || Math.abs(destino - faixa.scrollLeft) < 1) {
      faixa.scrollLeft = destino;
      return;
    }
    const inicio = faixa.scrollLeft;
    const comeco = performance.now();
    andandoSozinha.current = true;
    faixa.style.scrollSnapType = "none";
    const passo = (agora) => {
      const tempo = Math.min(1, (agora - comeco) / DURACAO_DESLIZE_MS);
      faixa.scrollLeft = inicio + (destino - inicio) * curvaDeslize(tempo);
      if (tempo < 1) {
        quadro.current = requestAnimationFrame(passo);
      } else {
        faixa.style.scrollSnapType = "";
        andandoSozinha.current = false;
      }
    };
    quadro.current = requestAnimationFrame(passo);
  }, [centro]);

  useEffect(() => () => cancelAnimationFrame(quadro.current), []);

  // Escuta a faixa: mede o que está escondido nas bordas e, quando a pessoa
  // arrasta a faixa (o dedo, o trackpad), o cartão que para no centro vira
  // o escolhido, um instante depois de ela parar. Ao mudar de tamanho (a
  // janela), o escolhido volta para o centro.
  useEffect(() => {
    const faixa = faixaRef.current;
    let espera;
    const medir = () =>
      setEscondidos({
        antes: faixa.scrollLeft > 2,
        depois: faixa.scrollLeft + faixa.clientWidth < faixa.scrollWidth - 2,
      });
    const aoRolar = () => {
      medir();
      if (andandoSozinha.current) return;
      clearTimeout(espera);
      espera = setTimeout(() => {
        const codigo = cartaoNoCentro(faixa)?.dataset.codigo;
        if (codigo && codigo !== atual.current.centro) {
          atual.current.onEscolher(codigo);
        }
      }, 140);
    };
    const recentralizar = () => {
      const cartao = faixa.querySelector(
        `[data-codigo="${atual.current.centro}"]`,
      );
      if (cartao && !andandoSozinha.current) {
        faixa.scrollLeft = rolagemDoCentro(faixa, cartao);
      }
      medir();
    };
    medir();
    faixa.addEventListener("scroll", aoRolar, { passive: true });
    const observador = new ResizeObserver(recentralizar);
    observador.observe(faixa);
    return () => {
      clearTimeout(espera);
      faixa.removeEventListener("scroll", aoRolar);
      observador.disconnect();
    };
  }, [itens.length]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-2xl font-bold text-[#1a1c1c]">{titulo}</h2>
        {resumo && (
          <span className="text-sm text-[#5f5e5e] whitespace-nowrap">
            {resumo}
          </span>
        )}
      </div>

      {/* A largura dos cartões sai da largura deste bloco (a da página):
          cabem o do centro, os dois vizinhos e um pedaço dos seguintes. */}
      <div className="[container-type:inline-size]">
        <div
          className="relative"
          style={{ "--largura": "clamp(236px, 70cqw, 288px)" }}
        >
          {/* A faixa rola para os lados, parando com um cartão no centro.
              Os espaços nas pontas deixam o primeiro e o último chegarem ao
              meio. A barra de rolagem fica escondida: os vizinhos à vista,
              as setas e os pontinhos mostram que há mais. */}
          <div
            ref={faixaRef}
            style={{
              ...mascara(escondidos),
              paddingInline: "calc(50% - var(--largura) / 2)",
            }}
            className="relative flex overflow-x-auto snap-x snap-mandatory py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              role="tablist"
              aria-label={titulo}
              className="flex gap-3 md:gap-6"
            >
              {itens.map((codigo) => {
                const noCentro = codigo === centro;
                const novo = codigo === NOVO_ANIMAL;
                return (
                  <button
                    key={codigo}
                    type="button"
                    role="tab"
                    id={idDaAba(codigo)}
                    data-codigo={codigo}
                    aria-selected={noCentro}
                    aria-controls={idDoPainel(codigo)}
                    aria-label={novo ? "Cadastrar animal" : undefined}
                    tabIndex={noCentro ? 0 : -1}
                    onClick={() => {
                      onEscolher(codigo);
                      // O cartão de cadastrar já abre o cadastro.
                      if (novo) onCadastrar?.();
                    }}
                    onKeyDown={aoTeclar}
                    style={{ width: "var(--largura)" }}
                    className={`group snap-center shrink-0 flex flex-col p-2 text-left rounded-2xl border transition-[transform,background-color,border-color,color,box-shadow] duration-deslize ease-deslize motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1c1c] focus-visible:ring-offset-2 ${
                      noCentro
                        ? "scale-[1.06] bg-[#9e0a24] border-[#9e0a24] text-white shadow-[0_22px_44px_-22px_rgba(158,10,36,0.7)]"
                        : `bg-white text-[#1a1c1c] hover:border-[#cfa9a7] ${
                            novo
                              ? "border-2 border-dashed border-[#e2cfcf] hover:bg-[#fffafa]"
                              : "border-[#eadede]"
                          }`
                    }`}
                  >
                    {novo ? (
                      <CartaoCadastrarDaFila noCentro={noCentro} />
                    ) : (
                      <CartaoAnimalDaFila
                        animal={porCodigo.get(codigo)}
                        noCentro={noCentro}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Seta
            lado="esquerda"
            rotulo={
              posicao > 0
                ? `Anterior: ${nomeDe(itens[posicao - 1])}`
                : "Anterior"
            }
            desativada={posicao <= 0}
            onClick={() => irPara(posicao - 1)}
          />
          <Seta
            lado="direita"
            rotulo={
              posicao < itens.length - 1
                ? `Próximo: ${nomeDe(itens[posicao + 1])}`
                : "Próximo"
            }
            desativada={posicao >= itens.length - 1}
            onClick={() => irPara(posicao + 1)}
          />
        </div>
      </div>

      {/* Os pontinhos: quantos são e qual está no centro. Para quem usa o
          mouse; o leitor de tela e o teclado já têm as abas. O cartão de
          cadastrar aparece como um "+". */}
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-2"
      >
        {itens.map((codigo) => {
          const noCentro = codigo === centro;
          return codigo === NOVO_ANIMAL ? (
            <button
              key={codigo}
              type="button"
              tabIndex={-1}
              onClick={() => onEscolher(codigo)}
              className={`material-symbols-outlined text-[16px] leading-none transition-colors ${
                noCentro
                  ? "text-[#9e0a24]"
                  : "text-[#c9b6b6] hover:text-[#7d0a1d]"
              }`}
            >
              add
            </button>
          ) : (
            <button
              key={codigo}
              type="button"
              tabIndex={-1}
              onClick={() => onEscolher(codigo)}
              className={`h-2 rounded-full transition-all duration-deslize ease-deslize ${
                noCentro
                  ? "w-6 bg-[#9e0a24]"
                  : "w-2 bg-[#e2cfcf] hover:bg-[#cfa9a7]"
              }`}
            />
          );
        })}
      </div>

      <p className="md:hidden flex items-center justify-center gap-1.5 text-xs text-[#5f5e5e]">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[18px] text-[#9e0a24]"
        >
          swipe
        </span>
        Deslize para o lado para ver os outros
      </p>
    </div>
  );
}

export default CarrosselAnimais;
