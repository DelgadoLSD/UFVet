import { BrowserRouter, Routes, Route } from "react-router-dom";
import Confirmacao from "./components/Confirmacao";
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
function App() {
  return (
    <BrowserRouter>
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
