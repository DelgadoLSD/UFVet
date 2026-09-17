import { Link } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Início" },
  { to: "/buscar", label: "Buscar doadores" },
  { to: "/cadastrar", label: "Criar conta" },
  { to: "/login", label: "Entrar" },
];

function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px] pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <p className="text-3xl font-extrabold tracking-tighter">
              <span className="text-white">UF</span>
              <span className="text-[#b7102a]">Vet</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Portal que conecta doadores voluntários de sangue animal a quem
              precisa, e explica como a doação funciona.
            </p>
          </div>

          <nav aria-label="Rodapé">
            <p className="text-sm font-semibold">Navegação</p>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-sm font-semibold">Contato</p>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li>Hospital Veterinário UFV</li>
              <li className="text-white">contato@ufvet.org.br</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-white/45">
          <p>© 2026 UFVet. Parceria UFV e Hospital Veterinário da UFV.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Termos de uso
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Política de privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
