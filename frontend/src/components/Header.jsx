import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { sair, useEstadoSessao } from "../servicos/sessao";
import { nomeCurto, rotuloPapel } from "../util/texto";

// Barra do topo, presente em todas as páginas: logo, navegação principal e,
// à direita, o menu da conta (ou "Entrar" e "Criar conta", para o visitante).
// No celular, a navegação vai para um menu que abre por baixo.

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
        className="material-symbols-outlined text-[20px] text-[#8e001b]"
      >
        {icone}
      </span>
      {children}
    </Componente>
  );
}

// Menu da conta logada: leva ao perfil e à conta, e sai.
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
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label={`Menu da conta de ${nomeCurto(conta)}`}
        className={`flex items-center gap-3 rounded-full p-1 sm:pr-3 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
          noPerfil
            ? "border-[#b7102a] bg-white/[0.08]"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.09]"
        }`}
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
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[20px] text-white/50 transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

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
            <ItemMenu to="/meu-perfil" icone="person" onClick={fechar}>
              Meu perfil
            </ItemMenu>
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
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();
  const { usuario, carregando } = useEstadoSessao();

  // Zera o estado ao trocar de rota (ajuste durante a renderização, não em
  // efeito) — evita chegar numa página nova com o header escondido ou o menu
  // aberto.
  const [rotaAnterior, setRotaAnterior] = useState(location.pathname);
  if (rotaAnterior !== location.pathname) {
    setRotaAnterior(location.pathname);
    setEscondido(false);
    setMenuAberto(false);
  }

  // Em todas as páginas o header some ao rolar para baixo e reaparece ao
  // rolar para cima — dá espaço de leitura sem esconder a navegação de vez.
  useEffect(() => {
    let ultimoY = window.scrollY;
    const aoRolar = () => {
      const y = window.scrollY;
      const descendo = y > ultimoY && y > 120;
      setEscondido(descendo);
      if (descendo) setMenuAberto(false);
      ultimoY = y;
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  const noPerfil = location.pathname === "/meu-perfil";

  // O menu do celular repete a navegação e, para o visitante em tela
  // estreita, ganha o "Criar conta" que saiu do topo.
  const linksDoMenu =
    carregando || usuario
      ? LINKS
      : [
          ...LINKS,
          { to: "/cadastrar", rotulo: "Criar conta", soTelaEstreita: true },
        ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-white/[0.07] transition-transform duration-300 motion-reduce:transition-none ${
        escondido ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="h-20 px-5 md:px-8 max-w-[1200px] mx-auto flex items-center gap-7">
        <Link
          to="/"
          className="font-extrabold text-3xl tracking-tighter shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
        >
          <span className="text-white">UF</span>
          <span className="text-[#b7102a]">Vet</span>
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
                className={`relative flex items-center text-[13px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:text-white ${
                  ativo ? "text-white" : "text-white/55 hover:text-white"
                }`}
              >
                {link.rotulo}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-px h-[3px] rounded-t-full bg-[#b7102a] origin-center transition-transform duration-200 motion-reduce:transition-none ${
                    ativo ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Enquanto o site pergunta à API quem está logado, o canto fica
              vazio, para não piscar "Entrar" antes do menu da conta. */}
          {carregando ? null : usuario ? (
            <MenuConta conta={usuario} noPerfil={noPerfil} />
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-[13px] font-semibold uppercase tracking-wider whitespace-nowrap text-white/70 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              {/* Em telas estreitas, "Criar conta" vai para o menu, para o
                  topo não quebrar em duas linhas. */}
              <Link
                to="/cadastrar"
                className="hidden sm:inline-block bg-[#b7102a] text-white px-5 py-2.5 rounded-full font-bold text-[13px] uppercase tracking-wider whitespace-nowrap hover:bg-[#8e001b] transition-colors"
              >
                Criar conta
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-expanded={menuAberto}
            aria-controls="menu-celular"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            className="md:hidden w-11 h-11 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              {menuAberto ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav
          id="menu-celular"
          aria-label="Principal"
          className="md:hidden border-t border-white/[0.07] px-5 py-3 animate-aparecer"
        >
          {linksDoMenu.map((link) => {
            const ativo = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={ativo ? "page" : undefined}
                className={`flex items-center gap-3 py-3 text-[13px] font-semibold uppercase tracking-wider ${
                  ativo ? "text-white" : "text-white/60"
                } ${link.soTelaEstreita ? "sm:hidden" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`w-[3px] h-5 rounded-full ${ativo ? "bg-[#b7102a]" : "bg-transparent"}`}
                />
                {link.rotulo}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export default Header;
