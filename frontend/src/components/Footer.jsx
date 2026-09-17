import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white py-24 border-t border-white/10">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px]">
        <div className="grid md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-1">
            <div className="text-3xl font-extrabold tracking-tighter mb-8">
              <span className="text-white">UF</span>
              <span className="text-[#b7102a]">Vet</span>
            </div>
            <p className="text-gray-500 leading-relaxed text-sm">
              Portal que conecta doadores voluntários de sangue animal a quem
              precisa — e explica como a doação funciona.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-10 uppercase tracking-[0.2em] text-[10px] text-[#b7102a]">
              Navegação
            </h4>
            <ul className="space-y-6 text-gray-400 text-sm font-medium">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/buscar"
                  className="hover:text-white transition-colors"
                >
                  Buscar Doadores
                </Link>
              </li>
              <li>
                <Link
                  to="/cadastrar"
                  className="hover:text-white transition-colors"
                >
                  Cadastrar Pets
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-10 uppercase tracking-[0.2em] text-[10px] text-[#b7102a]">
              Jurídico
            </h4>
            <ul className="space-y-6 text-gray-400 text-sm font-medium">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-10 uppercase tracking-[0.2em] text-[10px] text-[#b7102a]">
              Contato
            </h4>
            <div className="space-y-4 text-gray-400 text-sm font-medium">
              <p>Hospital Veterinário UFV</p>
              <p className="text-white font-bold">contato@ufvet.org.br</p>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 text-center text-gray-600 text-[10px] uppercase tracking-[0.2em] font-bold">
          © 2026 UFVet. Parceria UFV / Hospital Veterinário - UFV. Todos os
          direitos reservados.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
