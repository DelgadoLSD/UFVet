import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { carregarSessao } from "./servicos/sessao";

// Ponto de entrada: pergunta à API quem está logado e monta o site na
// <div id="root"> do index.html, sem esperar a resposta. O StrictMode só age
// em desenvolvimento, apontando erros comuns do React.
carregarSessao();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
