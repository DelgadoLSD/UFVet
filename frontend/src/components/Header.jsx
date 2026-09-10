import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Header() {
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setFloating(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 transition-all duration-400 ${
        floating
          ? "mt-3 mx-6 rounded-full bg-white/95 backdrop-blur-xl border border-black/8 shadow-lg"
          : ""
      }`}
    >
      <nav className="flex justify-between items-center h-20 px-5 md:px-8 max-w-[1200px] mx-auto w-full transition-all duration-400">
        <Link
          to="/"
          className="font-extrabold text-2xl tracking-tighter flex items-center gap-1"
        >
          <span className="text-[#1a1a1a]">UFV</span>
          <span className="text-white bg-[#b7102a] px-2 py-0.5 rounded">
            et
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-semibold text-[13px] uppercase tracking-wider">
          <Link to="/" className="border-b-2 border-[#b7102a] text-[#b7102a]">
            Início
          </Link>
          <Link
            to="/buscar"
            className="text-gray-400 hover:text-[#b7102a] transition-all border-b-2 border-transparent"
          >
            Buscar Doadores
          </Link>
          <Link
            to="/cadastrar"
            className="text-gray-400 hover:text-[#b7102a] transition-all border-b-2 border-transparent"
          >
            Cadastrar Pets
          </Link>
        </div>

        {/* Avatar clicável — leva pro perfil do usuário logado */}
        <Link
          to="/meu-perfil"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full border border-[#e4bebc] bg-[#e2e2e2] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#5f5e5e] text-xl">
              person
            </span>
          </div>
          <span className="font-bold text-sm text-[#1a1c1c] hidden md:block">
            Lucas Delgado
          </span>
          <span className="material-symbols-outlined text-[#5f5e5e] text-[20px]">
            expand_more
          </span>
        </Link>
      </nav>
    </header>
  );
}

export default Header;
