import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CadastroPage from "./pages/CadastroPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cadastrar" element={<CadastroPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
