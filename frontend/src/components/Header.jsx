import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

function Header() {
  const [floating, setFloating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setFloating(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/buscar", label: "Buscar Doadores" },
  ];

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
          className="font-extrabold text-3xl tracking-tighter flex items-center"
        >
          <span className="text-[#1a1c1c]">UF</span>
          <span className="text-[#b7102a]">Vet</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-semibold text-[13px] uppercase tracking-wider">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition-all border-b-2 ${
                location.pathname === link.to
                  ? "border-[#b7102a] text-[#b7102a]"
                  : "border-transparent text-gray-400 hover:text-[#b7102a]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

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
