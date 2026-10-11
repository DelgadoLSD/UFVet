import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { sair, useEstadoSessao } from "../servicos/sessao";
import { nomeCurto, rotuloPapel } from "../util/texto";

// Barra do topo, presente em todas as páginas: logo, navegação principal e,
// à direita, o menu da conta (ou "Entrar" e "Criar conta", para o visitante).
// No celular, como nos aplicativos de busca: a marca (que leva ao início),
// um campo de busca em pílula, que leva à busca de doadores (o motivo de o
// site existir), e o círculo da foto. Nada fica escondido num menu.

const LINKS = [
  { to: "/", rotulo: "Início" },
  { to: "/buscar", rotulo: "Buscar doadores" },
];

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

// A conta logada, no canto do topo, em duas partes, como nos aplicativos:
// a foto e o nome levam direto ao próprio perfil; a setinha ao lado abre as
// outras opções (a conta e sair). O perfil não se repete no menu: a foto já
// leva até ele.
function MenuConta({ conta, noPerfil }) {
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
    <div ref={raizRef} className="relative">
      <div
        className={`flex items-center rounded-full border transition-colors ${
          noPerfil
            ? "border-[#9e0a24] bg-white/[0.08]"
            : "border-white/10 bg-white/[0.04]"
        }`}
      >
        <Link
          to="/meu-perfil"
          aria-label={`Meu perfil (${nomeCurto(conta)})`}
          aria-current={noPerfil ? "page" : undefined}
          className="flex items-center gap-3 rounded-full p-1 sm:pr-2 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
        >
          <Avatar pessoa={conta} />
          <span className="hidden sm:flex flex-col leading-tight text-left">
            <span className="text-sm font-bold text-white">
              {nomeCurto(conta)}
            </span>
            <span className="text-[11px] text-white/55">
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
          className="w-9 h-9 mr-0.5 rounded-full flex items-center justify-center text-white/55 transition-colors hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
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
      </div>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-[#eadede] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] overflow-hidden animate-aparecer"
        >
          {/* Quem está logado: no celular, o botão mostra só a foto. */}
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

function Header() {
  const [escondido, setEscondido] = useState(false);
  const location = useLocation();
  const { usuario, carregando } = useEstadoSessao();

  // Zera o estado ao trocar de rota (ajuste durante a renderização, não em
  // efeito) — evita chegar numa página nova com o header escondido.
  const [rotaAnterior, setRotaAnterior] = useState(location.pathname);
  if (rotaAnterior !== location.pathname) {
    setRotaAnterior(location.pathname);
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

  const noPerfil = location.pathname === "/meu-perfil";
  const naBusca = location.pathname === "/buscar";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-white/[0.07] transition-transform duration-300 motion-reduce:transition-none ${
        escondido ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="h-16 md:h-20 px-5 md:px-8 max-w-[1200px] mx-auto flex items-center gap-3 md:gap-7">
        <Link
          to="/"
          className="font-extrabold text-[1.75rem] md:text-3xl tracking-tighter shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
        >
          <span className="text-white">UF</span>
          <span className="text-[#9e0a24]">Vet</span>
        </Link>

        <span
          className="hidden md:block h-6 w-px bg-white/15"
          aria-hidden="true"
        />

        {/* A página atual é marcada por uma barra vermelha colada na borda de
            baixo do header, como uma aba. */}
        <nav
          aria-label="Principal"
          className="hidden md:flex self-stretch items-stretch gap-8"
        >
          {LINKS.map((link) => {
            const ativo = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex items-center text-[15px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:text-white ${
                  ativo ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {link.rotulo}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-px h-[3px] rounded-t-full bg-[#9e0a24] origin-center transition-transform duration-200 motion-reduce:transition-none ${
                    ativo ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* A busca, no celular: uma pílula com cara de campo, como nos
            aplicativos; tocar leva à página de busca. Na própria busca, a
            borda fica vermelha, como a do círculo da foto no perfil. */}
        <Link
          to="/buscar"
          aria-label="Buscar doadores"
          aria-current={naBusca ? "page" : undefined}
          className={`md:hidden flex-1 min-w-0 h-11 flex items-center gap-2 px-3.5 rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24] ${
            naBusca
              ? "border-[#9e0a24] bg-white/[0.08] text-white"
              : "border-white/10 bg-white/[0.05] text-white/60 active:bg-white/10"
          }`}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[20px] shrink-0"
          >
            search
          </span>
          <span className="truncate">
            Buscar<span className="max-[379px]:hidden"> doador</span>
          </span>
        </Link>

        <div className="md:ml-auto flex items-center gap-2 shrink-0">
          {/* Enquanto o site pergunta à API quem está logado, o canto fica
              vazio, para não piscar "Entrar" antes do menu da conta. */}
          {carregando ? null : usuario ? (
            <MenuConta conta={usuario} noPerfil={noPerfil} />
          ) : (
            <>
              <Link
                to="/login"
                className="px-2 md:px-3 py-2 text-sm md:text-[15px] font-semibold whitespace-nowrap text-white/80 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              {/* No celular, "Criar conta" fica no "Entrar" e no início, para
                  o topo não apertar. */}
              <Link
                to="/cadastrar"
                className="hidden sm:inline-block bg-[#9e0a24] text-white px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap hover:bg-[#7d0a1d] transition-colors"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
