import { defineConfig } from "vitest/config";

// Testes automáticos do site (npm test). Por enquanto testam as regras que
// rodam no navegador antes de qualquer dado chegar à API: formatos, máscaras e
// mensagens dos campos. Não abrem o navegador nem chamam a API.
export default defineConfig({
  test: {
    include: ["testes/**/*.test.js"],
  },
});
