import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Ponto de entrada: monta o site na <div id="root"> do index.html. O
// StrictMode só age em desenvolvimento, apontando erros comuns do React.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
