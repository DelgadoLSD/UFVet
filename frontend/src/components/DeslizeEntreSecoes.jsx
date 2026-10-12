import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  destinoDoDeslize,
  direcaoDoGesto,
  metadeDoCaminho,
  paradasDoDeslize,
  secaoDoCaminho,
  trocaAoSoltar,
} from "../regras/secoes";
import { useEstadoSessao } from "../servicos/sessao";
import { pilulaDoTopo } from "./pilulaDoTopo";

// O deslize do dedo entre as seções, no celular, como nas abas dos
// aplicativos: para a esquerda, a próxima seção do topo; para a direita, a
// anterior (as paradas e as regras estão em regras/secoes.js).
//
// Enquanto o dedo desliza, a pílula do topo vai junto em direção à seção
// nova, e a página se inclina para o lado. Soltando depois de 30% da tela,
// ou com um movimento rápido, a página sai por esse lado e a nova entra pelo
// outro. Sem destino (nas pontas) ou num formulário já preenchido, a página
// só cede um pouco e volta, como as listas do iPhone quando acabam.
//
// O gesto fica de fora, e a página rola ou o elemento faz o que já fazia:
// - quando o dedo vai mais para cima ou para baixo que para o lado;
// - quando ele começa perto das bordas da tela, onde o iPhone usa o
//   deslize para voltar;
// - em campos de digitar, nos carrosséis e no que mais rola para o lado
//   (e no que está marcado com data-sem-deslize);
// - com uma janela aberta;
// - nas páginas internas (um perfil aberto pela busca, a página da conta).
// Quem pediu menos movimento ao sistema troca de página sem as animações.

const CELULAR = "(max-width: 767px)";
const MENOS_MOVIMENTO = "(prefers-reduced-motion: reduce)";
const BORDA = 24; // px
// As páginas que são formulários: com algo digitado, o deslize não sai
// delas, para não perder o que foi digitado.
const FORMULARIOS = ["/login", "/cadastrar"];
// A curva do deslize das pílulas do topo (tailwind.config.js).
const CURVA = "cubic-bezier(0.32, 0.72, 0, 1)";
const FORA_DO_GESTO =
  'input, textarea, select, [contenteditable="true"], [data-sem-deslize]';

// Algum elemento, do ponto tocado para cima, rola para o lado.
function rolaParaOLado(elemento) {
  for (let el = elemento; el && el !== document.body; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1) {
      const { overflowX } = getComputedStyle(el);
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
  }
  return false;
}

const caixa = (el) => ({ x: el.offsetLeft, largura: el.offsetWidth });
const entre = (a, b, p) => ({
  x: a.x + (b.x - a.x) * p,
  largura: a.largura + (b.largura - a.largura) * p,
});
function cobrir(el, { x, largura }) {
  el.style.transform = `translateX(${x}px)`;
  el.style.width = `${largura}px`;
}
// Sem destino, a página cede pouco: até 48 px, cada vez mais devagar.
const ceder = (dx) => Math.sign(dx) * 48 * (1 - Math.exp(-Math.abs(dx) / 160));

// A velocidade do dedo no fim do gesto (px por ms), nos últimos 100 ms.
function velocidadeFinal(amostras) {
  const ultima = amostras.at(-1);
  const primeira = amostras.find((a) => a.t >= ultima.t - 100) ?? amostras[0];
  return (ultima.x - primeira.x) / Math.max(ultima.t - primeira.t, 1);
}

function DeslizeEntreSecoes() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const { usuario, carregando } = useEstadoSessao();
  const logado = !!usuario;
  // O lado por onde a página nova entra, depois de um deslize (1, pela
  // direita; -1, pela esquerda), ou 0.
  const entrada = useRef(0);

  useLayoutEffect(() => {
    const sentido = entrada.current;
    entrada.current = 0;
    if (!sentido) return;
    document.querySelector("main")?.animate(
      [
        { transform: `translateX(${sentido * 24}%)`, opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 280, easing: CURVA },
    );
  }, [pathname]);

  useEffect(() => {
    const paradas = paradasDoDeslize({ logado, carregando });
    if (!paradas.includes(pathname)) return;
    const secaoAtual = secaoDoCaminho(pathname);
    const metadeAtual = metadeDoCaminho(pathname);
    let preenchido = false;
    let gesto = null;
    let trocando = false;
    let quadro = 0;
    let espera = 0;
    // Devolve as transições de antes do gesto, depois que tudo voltou ao
    // lugar (ou na hora, se outro gesto começa antes).
    let devolver = null;

    // Num formulário, qualquer campo mudado conta: mesmo numa etapa já
    // vencida do cadastro, que não aparece mais na tela.
    const aoDigitar = (e) => {
      if (FORMULARIOS.includes(pathname) && e.target.closest?.("main")) {
        preenchido = true;
      }
    };

    // O estilo que cada elemento tinha antes do gesto, para voltar a ele.
    const guardar = (els) =>
      new Map(
        els.map((el) => [
          el,
          {
            transform: el.style.transform,
            width: el.style.width,
            opacity: el.style.opacity,
            transition: el.style.transition,
          },
        ]),
      );
    const restaurar = (els, campos) => {
      for (const el of els) {
        const original = gesto.originais.get(el);
        for (const campo of campos) el.style[campo] = original[campo];
      }
    };

    function comecarArrasto() {
      const barra = document.querySelector(
        'header nav[aria-label="Seções do site"]',
      );
      const achar = (seletor) => barra?.querySelector(seletor) ?? null;
      gesto.direcao = "lado";
      gesto.reduzir = matchMedia(MENOS_MOVIMENTO).matches;
      gesto.main = document.querySelector("main");
      gesto.topo = document.querySelector("header");
      gesto.pilula = achar("[data-pilula]");
      gesto.menor = achar("[data-pilula-menor]");
      gesto.divisoes = barra
        ? [...barra.querySelectorAll("[data-divisao]")]
        : [];
      gesto.secoes = barra
        ? [...barra.querySelectorAll(":scope > [data-secao]")].map(caixa)
        : [];
      gesto.partes = [achar('a[href="/login"]'), achar('a[href="/cadastrar"]')]
        .filter(Boolean)
        .map(caixa);
      gesto.elementos = [
        gesto.main,
        gesto.topo,
        gesto.pilula,
        gesto.menor,
        ...gesto.divisoes,
      ].filter(Boolean);
      gesto.originais = guardar(gesto.elementos);
      // Durante o arrasto, tudo segue o dedo na hora, sem transição.
      for (const el of [gesto.main, gesto.pilula, gesto.menor]) {
        if (el) el.style.transition = "none";
      }
      // O topo aparece (se estava escondido pela rolagem), e as linhas finas
      // entre as seções somem, para a pílula passar limpa.
      if (gesto.topo) gesto.topo.style.transform = "translateY(0)";
      for (const linha of gesto.divisoes) linha.style.opacity = "0";
    }

    // As pílulas do topo a caminho da seção de `destino`, `p` de 0 a 1.
    function moverPilulas(destino, p) {
      const { pilula, menor, secoes, partes } = gesto;
      restaurar([pilula, menor].filter(Boolean), [
        "transform",
        "width",
        "opacity",
      ]);
      if (!destino) return;
      const secaoNova = secaoDoCaminho(destino);
      const metadeNova = metadeDoCaminho(destino);
      if (secaoNova !== secaoAtual) {
        if (pilula && secoes[secaoAtual] && secoes[secaoNova]) {
          cobrir(pilula, entre(secoes[secaoAtual], secoes[secaoNova], p));
        }
        // Saindo da conta do visitante, a pílula menor some aos poucos.
        if (menor && metadeAtual !== null) {
          menor.style.opacity = String(1 - p);
        }
      } else if (menor && partes[metadeAtual] && partes[metadeNova]) {
        cobrir(menor, entre(partes[metadeAtual], partes[metadeNova], p));
      }
    }

    function desenhar() {
      quadro = 0;
      if (gesto?.direcao !== "lado") return;
      const { dx } = gesto;
      const largura = window.innerWidth;
      const destino = destinoDoDeslize(pathname, dx < 0 ? 1 : -1, paradas);
      const livre =
        !!destino && !(preenchido && FORMULARIOS.includes(pathname));
      const progresso = livre ? Math.min(Math.abs(dx) / (largura * 0.5), 1) : 0;
      gesto.destino = livre ? destino : null;
      if (gesto.main && !gesto.reduzir) {
        gesto.main.style.transform = `translateX(${livre ? dx * 0.45 : ceder(dx)}px)`;
        gesto.main.style.opacity = livre ? String(1 - progresso * 0.35) : "";
      }
      moverPilulas(gesto.destino, progresso);
    }

    // Soltou antes da hora: tudo volta ao lugar, na curva das pílulas.
    function voltar() {
      const { elementos } = gesto;
      const transicao = `transform 280ms ${CURVA}, width 280ms ${CURVA}, opacity 280ms ${CURVA}`;
      for (const el of [gesto.main, gesto.pilula, gesto.menor]) {
        if (el) el.style.transition = transicao;
      }
      restaurar(elementos, ["transform", "width", "opacity"]);
      const { originais } = gesto;
      devolver = () => {
        for (const el of elementos) {
          el.style.transition = originais.get(el).transition;
        }
        devolver = null;
      };
      espera = window.setTimeout(devolver, 300);
      gesto = null;
    }

    // Soltou depois da hora: a pílula termina o caminho, a página sai pelo
    // lado do dedo, e a nova entra pelo outro.
    function trocar() {
      const { destino, dx, main, reduzir } = gesto;
      const sentido = dx < 0 ? 1 : -1;
      trocando = true;
      for (const el of [gesto.pilula, gesto.menor]) {
        if (el)
          el.style.transition = `transform 160ms ${CURVA}, width 160ms ${CURVA}, opacity 160ms ${CURVA}`;
      }
      moverPilulas(destino, 1);
      pilulaDoTopo.secao = secaoDoCaminho(destino);
      pilulaDoTopo.metade = metadeDoCaminho(destino);
      gesto = null;
      if (reduzir || !main) {
        navegar(destino);
        return;
      }
      const saida = main.animate(
        [
          {
            transform: main.style.transform || "none",
            opacity: Number(main.style.opacity || 1),
          },
          { transform: `translateX(${-sentido * 40}%)`, opacity: 0 },
        ],
        {
          duration: 160,
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          fill: "forwards",
        },
      );
      saida.onfinish = () => {
        entrada.current = sentido;
        navegar(destino);
      };
    }

    function desistir() {
      if (gesto?.direcao === "lado") voltar();
      gesto = null;
    }

    const aoTocar = (e) => {
      if (trocando) return;
      if (devolver) {
        window.clearTimeout(espera);
        devolver();
      }
      // Um segundo dedo (quem vai ampliar a página) desfaz o gesto.
      if (gesto || e.touches.length !== 1) {
        desistir();
        return;
      }
      if (!matchMedia(CELULAR).matches) return;
      const { clientX, clientY } = e.touches[0];
      if (clientX < BORDA || clientX > window.innerWidth - BORDA) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      // O que está exatamente sob o dedo: o navegador às vezes troca o alvo
      // do toque pelo elemento clicável mais próximo (um campo logo abaixo),
      // e o deslize que começa ao lado dele ficaria de fora.
      const alvo = document.elementFromPoint(clientX, clientY) ?? e.target;
      if (!(alvo instanceof Element)) return;
      if (alvo.closest(FORA_DO_GESTO) || rolaParaOLado(alvo)) return;
      gesto = {
        inicioX: clientX,
        inicioY: clientY,
        dx: 0,
        direcao: null,
        amostras: [{ t: e.timeStamp, x: clientX }],
      };
    };

    const aoMover = (e) => {
      if (!gesto) return;
      const toque = e.touches[0];
      const dx = toque.clientX - gesto.inicioX;
      const dy = toque.clientY - gesto.inicioY;
      if (!gesto.direcao) {
        const direcao = direcaoDoGesto(dx, dy);
        if (!direcao) return;
        if (direcao === "rolagem") {
          gesto = null;
          return;
        }
        comecarArrasto();
      }
      gesto.dx = dx;
      gesto.amostras.push({ t: e.timeStamp, x: toque.clientX });
      if (gesto.amostras.length > 12) gesto.amostras.shift();
      if (!quadro) quadro = requestAnimationFrame(desenhar);
    };

    const aoSoltar = () => {
      if (!gesto) return;
      if (gesto.direcao !== "lado") {
        gesto = null;
        return;
      }
      cancelAnimationFrame(quadro);
      desenhar();
      const troca =
        gesto.destino &&
        trocaAoSoltar({
          deslocamento: gesto.dx,
          largura: window.innerWidth,
          velocidade: velocidadeFinal(gesto.amostras),
        });
      if (troca) trocar();
      else voltar();
    };

    const passivo = { passive: true };
    document.addEventListener("input", aoDigitar, true);
    document.addEventListener("touchstart", aoTocar, passivo);
    document.addEventListener("touchmove", aoMover, passivo);
    document.addEventListener("touchend", aoSoltar, passivo);
    document.addEventListener("touchcancel", desistir, passivo);
    return () => {
      document.removeEventListener("input", aoDigitar, true);
      document.removeEventListener("touchstart", aoTocar, passivo);
      document.removeEventListener("touchmove", aoMover, passivo);
      document.removeEventListener("touchend", aoSoltar, passivo);
      document.removeEventListener("touchcancel", desistir, passivo);
      cancelAnimationFrame(quadro);
      window.clearTimeout(espera);
      devolver?.();
      if (gesto?.direcao === "lado") {
        restaurar(gesto.elementos, [
          "transform",
          "width",
          "opacity",
          "transition",
        ]);
      }
    };
  }, [pathname, logado, carregando, navegar]);

  return null;
}

export default DeslizeEntreSecoes;
