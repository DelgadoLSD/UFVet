import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { sair, useEstadoSessao } from "../servicos/sessao";
import { nomeCurto, primeiroNome, rotuloPapel } from "../util/texto";

// Barra do topo, presente em todas as páginas: um seletor das três seções do
// site, como os seletores do iPhone, numa pílula só. A logo leva ao início;
// a busca, à busca de doadores (e os perfis abertos por ela são dessa
// seção); a conta, ao próprio perfil (e a página da conta, entrar e
// cadastrar-se são dessa seção). Uma pílula vermelha, dentro da grande, fica
// atrás da seção em que a pessoa está e, ao trocar de seção, desliza até a
// nova, como quem passa de uma tela para a outra. Entre as seções, um vão
// pequeno e uma linha fina (que some ao lado da pílula) as separam.
//
// No computador, as três seções têm a mesma largura. No celular, cada uma
// ocupa o que precisa (a logo, a lupa da busca) e a conta fica com o resto,
// para nada ficar apertado. Para o visitante, a conta se divide em duas
// partes, Entrar e Cadastre-se, com uma pílula vermelha menor que desliza
// entre elas do mesmo jeito. Nada fica escondido num menu.

// A seção de cada página: 0, o início; 1, a busca; 2, a conta. Uma página
// fora delas (um endereço que não existe) fica sem destaque.
function secaoDoCaminho(caminho) {
  if (caminho === "/") return 0;
  if (caminho === "/buscar" || caminho.startsWith("/tutor/")) return 1;
  if (["/meu-perfil", "/conta", "/login", "/cadastrar"].includes(caminho)) {
    return 2;
  }
  return null;
}

// Onde a pílula estava na página anterior. Cada página desenha o próprio
// topo: guardada aqui, fora dele, a posição deixa o topo da página nova
// começar com a pílula no lugar antigo e deslizar até o novo.
let posicaoAnterior = null;
// O mesmo para a pílula menor do visitante: 0, Entrar; 1, Cadastre-se.
let metadeAnterior = null;

// "page" no link da página aberta; "true" no da seção, quando a página é
// outra dela (um perfil aberto pela busca, a página da conta).
const atual = (daSecao, daPagina) =>
  daPagina ? "page" : daSecao ? "true" : undefined;

// Põe a pílula sobre o elemento `alvo`: a mesma distância da esquerda e a
// mesma largura, escritas direto nela. Sem `animar` (a primeira posição, ou
// a tela que mudou de tamanho), ela só aparece no lugar, sem deslizar.
function cobrir(pilula, alvo, animar) {
  const transform = `translateX(${alvo.offsetLeft}px)`;
  const width = `${alvo.offsetWidth}px`;
  if (pilula.style.transform === transform && pilula.style.width === width) {
    return;
  }
  if (!animar) pilula.style.transition = "none";
  pilula.style.transform = transform;
  pilula.style.width = width;
  if (!animar) {
    pilula.getBoundingClientRect();
    pilula.style.transition = "";
  }
}

// Uma seção da barra: o conteúdo no meio, por cima da pílula. A cor do texto
// muda junto com ela, no mesmo tempo e na mesma curva.
const SECAO =
  "relative z-[1] min-w-0 h-full flex items-center justify-center rounded-full transition-colors duration-deslize ease-deslize motion-reduce:transition-none";
const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70";
// Sem a pílula, a seção clareia um pouco ao passar o mouse.
const PASSAR = "hover:bg-white/[0.06]";

const CLASSE_ITEM =
  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#1a1c1c] text-left hover:bg-[#faf6f6] transition-colors";

// Uma linha do menu da conta, com ícone. `as` desenha a linha como outro
// elemento (um Link para as páginas, um botão para sair).
function ItemMenu({ as: Componente = Link, icone, children, ...props }) {
  return (
    <Componente role="menuitem" className={CLASSE_ITEM} {...props}>
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[20px] text-[#9e0a24]"
      >
        {icone}
      </span>
      {children}
    </Componente>
  );
}

// A seção da conta logada, em duas partes, como nos aplicativos: a foto e o
// nome (no celular, o primeiro; no computador, o nome curto e o papel) levam
// ao próprio perfil, e a seção inteira responde ao toque; a setinha abre as
// outras opções (a conta e sair). O perfil não se repete no menu: a foto já
// leva até ele.
function SecaoDaConta({ conta, destaque, naSecao, caminho }) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);
  const navegar = useNavigate();

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (e) => {
      if (!raizRef.current?.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fecharFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  const sairDaConta = async () => {
    fechar();
    await sair();
    navegar("/");
  };

  return (
    <div
      ref={raizRef}
      data-secao
      className={`${SECAO} flex-1 gap-1 md:gap-2 px-1.5 ${destaque ? "" : PASSAR}`}
    >
      <Link
        to="/meu-perfil"
        aria-label={`Meu perfil (${nomeCurto(conta)})`}
        aria-current={atual(naSecao, caminho === "/meu-perfil")}
        className="min-w-0 flex items-center gap-2 md:gap-2.5 rounded-full after:absolute after:inset-0 after:rounded-full focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-white/70"
      >
        <span
          className={`shrink-0 rounded-full transition-shadow duration-deslize ease-deslize ${
            destaque ? "ring-2 ring-white/80" : "ring-1 ring-white/15"
          }`}
        >
          <Avatar pessoa={conta} tamanho="w-8 h-8 md:w-9 md:h-9" />
        </span>
        <span
          className={`md:hidden min-w-0 truncate text-[13px] font-semibold transition-colors duration-deslize ease-deslize ${
            destaque ? "text-white" : "text-white/75"
          }`}
        >
          {primeiroNome(conta.nomeCompleto)}
        </span>
        <span className="hidden md:flex flex-col min-w-0 leading-tight text-left">
          <span className="text-sm font-bold text-white truncate">
            {nomeCurto(conta)}
          </span>
          <span
            className={`text-[11px] truncate transition-colors duration-deslize ease-deslize ${
              destaque ? "text-white/80" : "text-white/55"
            }`}
          >
            {rotuloPapel(conta)}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label="Mais opções da conta"
        title="Mais opções da conta"
        className={`relative z-[2] w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-colors ${FOCO} ${
          destaque
            ? "text-white hover:bg-white/15"
            : "text-white/55 hover:text-white hover:bg-white/10"
        }`}
      >
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[20px] transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[3] mt-3 w-72 bg-white rounded-2xl border border-[#eadede] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] overflow-hidden animate-aparecer"
        >
          <div className="px-4 pt-3.5 pb-3 border-b border-[#f0e6e6]">
            <p className="text-sm font-bold text-[#1a1c1c] truncate">
              {conta.nomeCompleto}
            </p>
            <p className="text-xs text-[#5f5e5e] mt-0.5">
              {rotuloPapel(conta)}, código #{conta.codigo}
            </p>
          </div>

          <div className="py-1.5">
            <ItemMenu to="/conta" icone="manage_accounts" onClick={fechar}>
              Minha conta
            </ItemMenu>
            <ItemMenu
              as="button"
              type="button"
              icone="logout"
              onClick={sairDaConta}
            >
              Sair
            </ItemMenu>
          </div>
        </div>
      )}
    </div>
  );
}

// A seção da conta para o visitante, em duas partes: Entrar e Cadastre-se.
// Na página de uma delas, a seção fica no tom claro e uma pílula vermelha
// menor fica atrás dela; de uma para a outra, essa pílula desliza como a das
// seções. No computador, as duas partes têm a mesma largura. No celular e no
// tablet, cada palavra tem a mesma folga dos lados: em metades iguais,
// "Cadastre-se" (o dobro de "Entrar") encostava na borda da pílula. O toque
// vale a altura inteira da seção, e não só a da pílula menor.
const PARTE =
  "relative z-[1] min-w-0 flex-auto lg:flex-1 h-full flex items-center justify-center rounded-full px-1 text-[13px] md:text-[15px] font-semibold whitespace-nowrap transition-colors duration-deslize ease-deslize motion-reduce:transition-none after:absolute after:inset-x-0 after:-inset-y-1";

function SecaoDoVisitante({ naSecao, caminho }) {
  const metade = caminho === "/login" ? 0 : caminho === "/cadastrar" ? 1 : null;
  // Vindo de Entrar para Cadastre-se (ou o contrário), a pílula menor começa
  // na anterior e desliza; vindo de outra seção, já nasce na desta página.
  const [posicao, setPosicao] = useState(() => metadeAnterior ?? metade);
  useEffect(() => {
    metadeAnterior = metade;
    if (metade === null) return;
    const quadro = requestAnimationFrame(() => setPosicao(metade));
    return () => cancelAnimationFrame(quadro);
  }, [metade]);
  const destaque = metade === null ? null : posicao;
  const corDa = (indice) =>
    destaque === indice
      ? "text-white"
      : naSecao
        ? "text-white/80 hover:text-white"
        : `text-white/70 hover:text-white ${PASSAR}`;

  const faixaRef = useRef(null);
  const pilulaRef = useRef(null);
  const noLugar = useRef(false);
  useLayoutEffect(() => {
    const partes = faixaRef.current.querySelectorAll("a");
    const posicionar = (animar) =>
      cobrir(pilulaRef.current, partes[posicao ?? 0], animar);
    posicionar(noLugar.current);
    noLugar.current = true;
    const observador = new ResizeObserver(() => posicionar(false));
    partes.forEach((parte) => observador.observe(parte));
    return () => observador.disconnect();
  }, [posicao]);

  return (
    <div data-secao className={`${SECAO} flex-1 p-1`}>
      <div ref={faixaRef} className="relative w-full h-full flex">
        {/* Aparece junto com a pílula clara da seção, que chega deslizando
            quando se vem de outra seção. */}
        <span
          ref={pilulaRef}
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 rounded-full bg-[#9e0a24] shadow-[0_6px_16px_-8px_rgba(158,10,36,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] transition-[transform,width,opacity] duration-deslize ease-deslize motion-reduce:transition-none ${
            naSecao && metade !== null ? "opacity-100" : "opacity-0"
          }`}
        />
        <Link
          to="/login"
          aria-current={atual(false, caminho === "/login")}
          className={`${PARTE} ${FOCO} ${corDa(0)}`}
        >
          Entrar
        </Link>
        <Link
          to="/cadastrar"
          aria-current={atual(false, caminho === "/cadastrar")}
          className={`${PARTE} ${FOCO} ${corDa(1)}`}
        >
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}

function Header() {
  const [escondido, setEscondido] = useState(false);
  const location = useLocation();
  const caminho = location.pathname;
  const { usuario, carregando } = useEstadoSessao();
  const secao = secaoDoCaminho(caminho);

  // A pílula começa onde estava na página anterior e, um quadro depois,
  // desliza até a seção desta página (de uma seção para ela mesma, não se
  // move). Quem pediu menos movimento ao sistema vê a troca na hora.
  const [posicao, setPosicao] = useState(() => posicaoAnterior ?? secao);
  useEffect(() => {
    if (secao === null) return;
    posicaoAnterior = secao;
    const quadro = requestAnimationFrame(() => setPosicao(secao));
    return () => cancelAnimationFrame(quadro);
  }, [secao]);
  // A seção destacada é a que está embaixo da pílula agora: as cores trocam
  // junto com o deslize.
  const destaque = secao === null ? null : posicao;
  // Entrar e Cadastre-se são só do visitante (quem está logado é levado ao
  // próprio perfil): nelas, a pílula da seção já nasce no tom claro, sem
  // esperar saber quem está logado (sem isso, piscava vermelha e clareava).
  const contaDoVisitante =
    destaque === 2 && (caminho === "/login" || caminho === "/cadastrar");

  // As seções não têm a mesma largura no celular: a pílula mede a seção em
  // que vai ficar e toma o lugar e a largura dela (antes de a tela ser
  // desenhada, para não piscar). Quando o tamanho muda (a fonte chegou, a
  // tela girou), mede de novo.
  const barraRef = useRef(null);
  const pilulaRef = useRef(null);
  const noLugar = useRef(false);
  useLayoutEffect(() => {
    const barra = barraRef.current;
    const posicionar = (animar) => {
      const secoes = barra.querySelectorAll("[data-secao]");
      if (secoes.length !== 3) return;
      cobrir(pilulaRef.current, secoes[posicao ?? 0], animar);
      // As linhas finas ficam no meio do vão entre duas seções.
      barra.querySelectorAll("[data-divisao]").forEach((linha, i) => {
        const fim = secoes[i].offsetLeft + secoes[i].offsetWidth;
        linha.style.left = `${(fim + secoes[i + 1].offsetLeft) / 2}px`;
      });
    };
    posicionar(noLugar.current);
    noLugar.current = true;
    const observador = new ResizeObserver(() => posicionar(false));
    observador.observe(barra);
    barra
      .querySelectorAll("[data-secao]")
      .forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, [posicao, usuario, carregando]);

  // Zera o estado ao trocar de rota (ajuste durante a renderização, não em
  // efeito) — evita chegar numa página nova com o header escondido.
  const [rotaAnterior, setRotaAnterior] = useState(caminho);
  if (rotaAnterior !== caminho) {
    setRotaAnterior(caminho);
    setEscondido(false);
  }

  // Em todas as páginas o header some ao rolar para baixo e reaparece ao
  // rolar para cima — dá espaço de leitura sem esconder a navegação de vez.
  useEffect(() => {
    let ultimoY = window.scrollY;
    const aoRolar = () => {
      const y = window.scrollY;
      setEscondido(y > ultimoY && y > 120);
      ultimoY = y;
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-white/[0.07] transition-transform duration-300 motion-reduce:transition-none ${
        escondido ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="h-16 md:h-20 px-4 min-[375px]:px-5 md:px-8 max-w-[1200px] mx-auto flex items-center">
        <nav
          ref={barraRef}
          aria-label="Seções do site"
          className="relative flex-1 flex md:grid md:grid-cols-3 gap-1 md:gap-1.5 p-1 h-12 md:h-[52px] rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]"
        >
          {/* A pílula da seção. Na conta do visitante, ela fica no tom
              claro, e a vermelha é a menor, dentro dela, atrás de Entrar ou
              de Cadastre-se. */}
          <span
            ref={pilulaRef}
            aria-hidden="true"
            className={`absolute inset-y-1 left-0 rounded-full transition-[transform,width,opacity,background-color,box-shadow] duration-deslize ease-deslize motion-reduce:transition-none ${
              destaque === null ? "opacity-0" : "opacity-100"
            } ${
              contaDoVisitante
                ? "bg-white/[0.13] shadow-none"
                : "bg-[#9e0a24] shadow-[0_8px_20px_-10px_rgba(158,10,36,0.9),inset_0_1px_0_rgba(255,255,255,0.14)]"
            }`}
          />
          {/* As linhas finas entre as seções; a que encosta na pílula some. */}
          {[0, 1].map((i) => (
            <span
              key={i}
              data-divisao
              aria-hidden="true"
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-px bg-white/15 transition-opacity duration-deslize ease-deslize motion-reduce:transition-none ${
                destaque === i || destaque === i + 1
                  ? "opacity-0"
                  : "opacity-100"
              }`}
            />
          ))}

          <Link
            data-secao
            to="/"
            aria-label="UFVet, página inicial"
            aria-current={atual(secao === 0, caminho === "/")}
            className={`${SECAO} ${FOCO} shrink-0 px-3 min-[375px]:px-4 md:px-0 ${destaque === 0 ? "" : PASSAR}`}
          >
            <span
              aria-hidden="true"
              className="font-extrabold text-[1.625rem] md:text-[1.75rem] leading-none tracking-tighter"
            >
              <span className="text-white">UF</span>
              <span
                className={`transition-colors duration-deslize ease-deslize motion-reduce:transition-none ${
                  destaque === 0 ? "text-white" : "text-[#9e0a24]"
                }`}
              >
                Vet
              </span>
            </span>
          </Link>

          {/* A busca: no celular, só a lupa; no computador, com o nome. O
              ícone fica cheio na própria seção, para o destaque não
              depender só da cor. */}
          <Link
            data-secao
            to="/buscar"
            aria-label="Buscar doadores"
            aria-current={atual(secao === 1, caminho === "/buscar")}
            className={`${SECAO} ${FOCO} shrink-0 w-11 min-[375px]:w-12 md:w-auto gap-2 text-[15px] font-semibold ${
              destaque === 1
                ? "text-white"
                : `text-white/70 hover:text-white ${PASSAR}`
            }`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[22px] md:text-[20px] shrink-0"
              style={
                destaque === 1
                  ? { fontVariationSettings: "'FILL' 1, 'wght' 500" }
                  : undefined
              }
            >
              search
            </span>
            <span className="hidden md:inline truncate">Buscar doadores</span>
          </Link>

          {/* Enquanto o site pergunta à API quem está logado, a seção mostra
              só o lugar da foto, para não piscar "Entrar" antes da conta. */}
          {carregando ? (
            <div data-secao className={`${SECAO} flex-1`}>
              <span className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10" />
            </div>
          ) : usuario ? (
            <SecaoDaConta
              conta={usuario}
              destaque={destaque === 2}
              naSecao={secao === 2}
              caminho={caminho}
            />
          ) : (
            <SecaoDoVisitante naSecao={destaque === 2} caminho={caminho} />
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
