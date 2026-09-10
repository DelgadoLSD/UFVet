import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CadastroPage from "./pages/CadastroPage";
import LoginPage from "./pages/LoginPage";
import BuscaPage from "./pages/BuscaPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cadastrar" element={<CadastroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/buscar" element={<BuscaPage />} />
        <Route path="/tutor/:id" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
