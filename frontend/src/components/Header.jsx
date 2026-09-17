import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import homemFoto from "../assets/people/man1_0-image.jpg";

// Simula estado de autenticação — vira true quando back-end estiver pronto
const LOGADO = true;
const USUARIO_MOCK = {
  nome: "Victor Hugo",
  foto: homemFoto,
  // Rosto fica mais abaixo no quadro dessa foto — sem isso o corte central
  // padrão pega o peito, não o rosto.
  fotoPosicao: "center 28%",
  fotoZoom: 1.7,
};

function Header({ dark = false }) {
  const [escondido, setEscondido] = useState(false);
  const location = useLocation();

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
    const handleScroll = () => {
      const y = window.scrollY;
      setEscondido(y > ultimoY && y > 120);
      ultimoY = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/buscar", label: "Buscar Doadores" },
  ];

  const bg = dark ? "bg-[#1a1a1a]" : "bg-white/95";

  const logoEscuro = dark ? "text-white" : "text-[#1a1c1c]";
  const linkAtivo = dark
    ? "border-white text-white"
    : "border-[#b7102a] text-[#b7102a]";
  const linkInativo = dark
    ? "border-transparent text-white/60 hover:text-white"
    : "border-transparent text-gray-400 hover:text-[#b7102a]";
  const avatarBg = dark
    ? "bg-white/20 border-white/20"
    : "bg-[#e2e2e2] border-[#e4bebc]";
  const avatarIcon = dark ? "text-white" : "text-[#5f5e5e]";
  const nomeColor = dark ? "text-white" : "text-[#1a1c1c]";
  const chevronColor = dark ? "text-white/60" : "text-[#5f5e5e]";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        escondido ? "-translate-y-full" : "translate-y-0"
      } ${bg}`}
    >
      <nav className="flex justify-between items-center h-20 px-5 md:px-8 max-w-[1200px] mx-auto w-full">
        {/* Logo */}
        <Link
          to="/"
          className="font-extrabold text-3xl tracking-tighter flex items-center"
        >
          <span className={logoEscuro}>UF</span>
          <span className="text-[#b7102a]">Vet</span>
        </Link>

        {/* Links de navegação */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-[13px] uppercase tracking-wider">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition-all border-b-2 ${
                location.pathname === link.to ? linkAtivo : linkInativo
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Lado direito — logado ou não */}
        {LOGADO ? (
          <Link
            to="/meu-perfil"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div
              className={`w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center ${avatarBg}`}
            >
              {USUARIO_MOCK.foto ? (
                <img
                  src={USUARIO_MOCK.foto}
                  alt={USUARIO_MOCK.nome}
                  style={{
                    objectPosition: USUARIO_MOCK.fotoPosicao,
                    transform: `scale(${USUARIO_MOCK.fotoZoom || 1})`,
                    transformOrigin: USUARIO_MOCK.fotoPosicao,
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className={`material-symbols-outlined text-xl ${avatarIcon}`}
                >
                  person
                </span>
              )}
            </div>
            <span className={`font-bold text-sm hidden md:block ${nomeColor}`}>
              {USUARIO_MOCK.nome}
            </span>
            <span
              className={`material-symbols-outlined text-[20px] ${chevronColor}`}
            >
              expand_more
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`font-bold text-sm uppercase tracking-wider transition-all ${
                dark
                  ? "text-white/80 hover:text-white"
                  : "text-[#5f5e5e] hover:text-[#8e001b]"
              }`}
            >
              Entrar
            </Link>
            <Link
              to="/cadastrar"
              className="bg-[#b7102a] text-white px-5 py-2 rounded-full font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
            >
              Cadastrar
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
