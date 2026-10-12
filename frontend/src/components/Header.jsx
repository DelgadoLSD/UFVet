import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { sair, useEstadoSessao } from "../servicos/sessao";
import { nomeCurto, rotuloPapel } from "../util/texto";

// Barra do topo, presente em todas as páginas: um seletor das três seções do
// site, em terços iguais, no desenho da chave Disponível/Indisponível dos
// animais. A logo leva ao início; a busca, à busca de doadores (e os perfis
// abertos por ela são dessa seção); a conta, ao próprio perfil (e a página
// da conta, entrar e criar conta são dessa seção). Uma pílula vermelha fica
// atrás da seção em que a pessoa está e, ao trocar de seção, desliza até a
// nova, como quem passa de uma tela para a outra. Igual no celular e no
// computador; nada fica escondido num menu.

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

// "page" no link da página aberta; "true" no da seção, quando a página é
// outra dela (um perfil aberto pela busca, a página da conta).
const atual = (daSecao, daPagina) =>
  daPagina ? "page" : daSecao ? "true" : undefined;

// Um terço da barra: o conteúdo no meio, por cima da pílula. A cor do texto
// muda junto com ela, no mesmo tempo e na mesma curva.
const TERCO =
  "relative z-[1] min-w-0 h-full flex items-center justify-center rounded-full transition-colors duration-deslize ease-deslize motion-reduce:transition-none";
const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70";
// Sem a pílula, o terço clareia um pouco ao passar o mouse.
const PASSAR = "hover:bg-white/[0.05]";

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

// O terço da conta logada, em duas partes, como nos aplicativos: a foto (e,
// no computador, o nome) leva ao próprio perfil, e o terço inteiro responde
// ao toque; a setinha abre as outras opções (a conta e sair). O perfil não se
// repete no menu: a foto já leva até ele.
function TercoDaConta({ conta, destaque, naSecao, caminho }) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);
  const navegar = useNavigate();

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (e) => {
      if (!raizRef.current?.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
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
      className={`${TERCO} gap-1 sm:gap-2 px-1 ${destaque ? "" : PASSAR}`}
    >
      <Link
        to="/meu-perfil"
        aria-label={`Meu perfil (${nomeCurto(conta)})`}
        aria-current={atual(naSecao, caminho === "/meu-perfil")}
        className="min-w-0 flex items-center gap-2.5 rounded-full after:absolute after:inset-0 after:rounded-full focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-white/70"
      >
        <span
          className={`shrink-0 rounded-full transition-shadow duration-deslize ease-deslize ${
            destaque ? "ring-2 ring-white/80" : "ring-1 ring-white/15"
          }`}
        >
          <Avatar pessoa={conta} tamanho="w-8 h-8 sm:w-9 sm:h-9" />
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
          {/* Quem está logado: no celular, o terço mostra só a foto. */}
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

// O terço da conta para o visitante: "Entrar" e, no computador, "Criar
// conta", numa pílula discreta (a vermelha é a da seção). No celular, só
// "Entrar", e o terço inteiro responde ao toque; criar conta fica no início
// e na página de entrar.
function TercoDoVisitante({ destaque, caminho }) {
  return (
    <div className={`${TERCO} gap-2 px-2 ${destaque ? "" : PASSAR}`}>
      <Link
        to="/login"
        aria-current={atual(false, caminho === "/login")}
        className={`px-2 py-1.5 rounded-full text-sm sm:text-[15px] font-semibold whitespace-nowrap transition-colors duration-deslize ease-deslize max-md:after:absolute max-md:after:inset-0 max-md:after:rounded-full ${FOCO} ${
          destaque ? "text-white" : "text-white/75 hover:text-white"
        }`}
      >
        Entrar
      </Link>
      <Link
        to="/cadastrar"
        aria-current={atual(false, caminho === "/cadastrar")}
        className={`hidden md:inline-flex items-center h-9 px-4 rounded-full text-sm font-bold text-white whitespace-nowrap transition-colors ${FOCO} ${
          destaque
            ? "bg-white/20 hover:bg-white/30"
            : "bg-white/10 hover:bg-white/[0.16]"
        }`}
      >
        Criar conta
      </Link>
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
  // O terço destacado é o que está em cima da pílula agora: as cores trocam
  // junto com o deslize.
  const destaque = secao === null ? null : posicao;

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
          aria-label="Seções do site"
          className="relative flex-1 grid grid-cols-3 h-12 md:h-[52px] p-1 rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]"
        >
          {/* A pílula vermelha: um terço da barra, levada de um terço a outro
              pelo transform (100% da própria largura é um terço). */}
          <span
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-[#9e0a24] shadow-[0_8px_20px_-10px_rgba(158,10,36,0.9),inset_0_1px_0_rgba(255,255,255,0.14)] transition-[transform,opacity] duration-deslize ease-deslize motion-reduce:transition-none ${
              destaque === null ? "opacity-0" : "opacity-100"
            }`}
            style={{ transform: `translateX(${(posicao ?? 0) * 100}%)` }}
          />

          <Link
            to="/"
            aria-label="UFVet, página inicial"
            aria-current={atual(secao === 0, caminho === "/")}
            className={`${TERCO} ${FOCO} ${destaque === 0 ? "" : PASSAR}`}
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

          {/* A busca: o ícone fica cheio na própria seção, para o destaque
              não depender só da cor. */}
          <Link
            to="/buscar"
            aria-label="Buscar doadores"
            aria-current={atual(secao === 1, caminho === "/buscar")}
            className={`${TERCO} ${FOCO} gap-2 px-3 text-sm sm:text-[15px] font-semibold ${
              destaque === 1
                ? "text-white"
                : `text-white/65 hover:text-white ${PASSAR}`
            }`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[20px] shrink-0"
              style={
                destaque === 1
                  ? { fontVariationSettings: "'FILL' 1, 'wght' 500" }
                  : undefined
              }
            >
              search
            </span>
            <span className="truncate">
              Buscar<span className="max-sm:hidden"> doadores</span>
            </span>
          </Link>

          {/* Enquanto o site pergunta à API quem está logado, o terço mostra
              só o lugar da foto, para não piscar "Entrar" antes da conta. */}
          {carregando ? (
            <div className={TERCO}>
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10" />
            </div>
          ) : usuario ? (
            <TercoDaConta
              conta={usuario}
              destaque={destaque === 2}
              naSecao={secao === 2}
              caminho={caminho}
            />
          ) : (
            <TercoDoVisitante destaque={destaque === 2} caminho={caminho} />
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
