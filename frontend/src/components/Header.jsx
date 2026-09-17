import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import homemFoto from "../assets/people/man1_0-image.jpg";

// Simula estado de autenticação — vira true quando back-end estiver pronto
const LOGADO = true;
const USUARIO_MOCK = {
  nome: "Victor Hugo",
  papel: "Veterinário",
  foto: homemFoto,
  // Rosto fica mais abaixo no quadro dessa foto — sem isso o corte central
  // padrão pega o peito, não o rosto.
  fotoPosicao: "center 28%",
  fotoZoom: 1.7,
};

const LINKS = [
  { to: "/", label: "Início" },
  { to: "/buscar", label: "Buscar doadores" },
];

function Avatar({ tamanho = "w-9 h-9" }) {
  return (
    <span
      className={`${tamanho} rounded-full overflow-hidden bg-white/15 flex items-center justify-center shrink-0`}
    >
      {USUARIO_MOCK.foto ? (
        <img
          src={USUARIO_MOCK.foto}
          alt=""
          style={{
            objectPosition: USUARIO_MOCK.fotoPosicao,
            transform: `scale(${USUARIO_MOCK.fotoZoom || 1})`,
            transformOrigin: USUARIO_MOCK.fotoPosicao,
          }}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="material-symbols-outlined text-xl text-white">
          person
        </span>
      )}
    </span>
  );
}

function Header() {
  const [escondido, setEscondido] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();

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
    const handleScroll = () => {
      const y = window.scrollY;
      const descendo = y > ultimoY && y > 120;
      setEscondido(descendo);
      if (descendo) setMenuAberto(false);
      ultimoY = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const noPerfil = location.pathname === "/meu-perfil";

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

        <span className="hidden md:block h-6 w-px bg-white/15" aria-hidden="true" />

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
                {link.label}
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
          {LOGADO ? (
            <Link
              to="/meu-perfil"
              aria-current={noPerfil ? "page" : undefined}
              className={`flex items-center gap-3 rounded-full p-1 sm:pr-4 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
                noPerfil
                  ? "border-[#b7102a] bg-white/[0.08]"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.09]"
              }`}
            >
              <Avatar />
              <span className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-bold text-white">
                  {USUARIO_MOCK.nome}
                </span>
                <span className="text-[11px] text-white/55">
                  {USUARIO_MOCK.papel}
                </span>
              </span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-[13px] font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/cadastrar"
                className="bg-[#b7102a] text-white px-5 py-2.5 rounded-full font-bold text-[13px] uppercase tracking-wider hover:bg-[#8e001b] transition-colors"
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
            <span className="material-symbols-outlined">
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
          {LINKS.map((link) => {
            const ativo = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={ativo ? "page" : undefined}
                className={`flex items-center gap-3 py-3 text-[13px] font-semibold uppercase tracking-wider ${
                  ativo ? "text-white" : "text-white/60"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-[3px] h-5 rounded-full ${ativo ? "bg-[#b7102a]" : "bg-transparent"}`}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export default Header;
