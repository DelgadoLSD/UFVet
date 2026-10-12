import { useEffect, useLayoutEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import Confirmacao from "./components/Confirmacao";
import { recarregarAcesso } from "./servicos/acessoContatos";
import { useSessao } from "./servicos/sessao";
import { ehVeterinario } from "./util/texto";
import RotaProtegida from "./components/RotaProtegida";
import InicioPage from "./pages/InicioPage";
import CadastroPage from "./pages/CadastroPage";
import LoginPage from "./pages/LoginPage";
import BuscaPage from "./pages/BuscaPage";
import PerfilPage from "./pages/PerfilPage";
import ContaPage from "./pages/ContaPage";

// Rotas do site. /meu-perfil e /tutor/:codigo usam a mesma página: sem código,
// é o perfil de quem está logado; com código, o de outra pessoa.
//
// O visitante, sem conta, vê o início, a busca e os perfis, sem os contatos
// (S3, NF16.4). O próprio perfil e a conta exigem login.

// A altura da rolagem de cada página visitada, pela chave que o roteador dá
// a cada passo do histórico.
const rolagens = new Map();

// Ao trocar de página, a nova abre no topo (sem isso, ela abria na altura
// em que a anterior estava, e pulava quando o conteúdo chegava); voltando
// ou avançando pelo navegador, na altura em que estava. Trocar só o que vem
// depois do "?" (o animal aberto no perfil) não mexe na rolagem.
function PosicaoDaRolagem() {
  const { pathname, key } = useLocation();
  const tipo = useNavigationType();
  const anterior = useRef(pathname);
  const chaveAtual = useRef(key);

  // A altura é guardada enquanto a pessoa rola: na hora da troca, a página
  // nova (mais curta, se ainda carrega) já cortaria a altura da antiga.
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    const guardar = () => rolagens.set(chaveAtual.current, window.scrollY);
    window.addEventListener("scroll", guardar, { passive: true });
    return () => window.removeEventListener("scroll", guardar);
  }, []);

  useLayoutEffect(() => {
    chaveAtual.current = key;
    const mesmaPagina = anterior.current === pathname;
    anterior.current = pathname;
    if (mesmaPagina) return;
    const guardada = tipo === "POP" ? rolagens.get(key) : undefined;
    window.scrollTo(0, guardada ?? 0);
  }, [pathname, key, tipo]);

  return null;
}

// O acesso aos contatos de um tutor é buscado assim que a sessão começa, e
// não só ao abrir a busca ou um perfil: quando ele chega lá, a faixa do
// acesso já sabe o que mostrar, sem um lugar vazio que depois empurra a
// página. (As telas que mostram o acesso continuam a conferi-lo.)
function AcessoAntecipado() {
  const usuario = useSessao();
  const codigo = usuario && !ehVeterinario(usuario) ? usuario.codigo : null;
  useEffect(() => {
    if (codigo) recarregarAcesso(codigo);
  }, [codigo]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PosicaoDaRolagem />
      <AcessoAntecipado />
      <Routes>
        <Route path="/" element={<InicioPage />} />
        <Route path="/cadastrar" element={<CadastroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/buscar" element={<BuscaPage />} />
        <Route path="/tutor/:codigo" element={<PerfilPage />} />
        <Route
          path="/meu-perfil"
          element={
            <RotaProtegida>
              <PerfilPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/conta"
          element={
            <RotaProtegida>
              <ContaPage />
            </RotaProtegida>
          }
        />
      </Routes>
      {/* A confirmação de "salvo", uma só para o site inteiro. */}
      <Confirmacao />
    </BrowserRouter>
  );
}

export default App;
