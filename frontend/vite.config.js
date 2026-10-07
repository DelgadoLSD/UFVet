import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Repassa /api para a API, que roda separada (npm run dev, na pasta backend).
// Assim o site e a API parecem o mesmo endereço para o navegador, e o cookie
// do crachá de sessão funciona sem abrir o CORS. Publicado o site, a
// hospedagem faz este repasse.
const proxy = { "/api": "http://localhost:3000" };

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
