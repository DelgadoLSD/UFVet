import { BrowserRouter, Routes, Route } from "react-router-dom";
import InicioPage from "./pages/InicioPage";
import CadastroPage from "./pages/CadastroPage";
import LoginPage from "./pages/LoginPage";
import BuscaPage from "./pages/BuscaPage";
import PerfilPage from "./pages/PerfilPage";
import ContaPage from "./pages/ContaPage";

// Rotas do site. /meu-perfil e /tutor/:codigo usam a mesma página: sem código,
// é o perfil de quem está logado; com código, o de outra pessoa.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InicioPage />} />
        <Route path="/cadastrar" element={<CadastroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/buscar" element={<BuscaPage />} />
        <Route path="/tutor/:codigo" element={<PerfilPage />} />
        <Route path="/meu-perfil" element={<PerfilPage />} />
        <Route path="/conta" element={<ContaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
