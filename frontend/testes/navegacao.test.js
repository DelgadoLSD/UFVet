import { describe, expect, test } from "vitest";
import { destinoSeguro } from "../src/util/navegacao";

// Para onde a pessoa vai depois de entrar (util/navegacao.js). O destino vem
// na própria URL (/login?voltar=/conta), e qualquer um pode montar um link com
// outro valor: só caminhos do próprio site são aceitos, para ninguém usar o
// login do UFVet para levar a pessoa a uma página falsa.

describe("destino depois de entrar", () => {
  test("aceita páginas do próprio site", () => {
    expect(destinoSeguro("/conta")).toBe("/conta");
    expect(destinoSeguro("/tutor/T3M8P1?aba=animais")).toBe(
      "/tutor/T3M8P1?aba=animais",
    );
  });

  test("troca endereços de fora pelo próprio perfil", () => {
    expect(destinoSeguro("https://site-falso.com")).toBe("/meu-perfil");
    // Começar com // ou /\ faz o navegador sair do site.
    expect(destinoSeguro("//site-falso.com")).toBe("/meu-perfil");
    expect(destinoSeguro("/\\site-falso.com")).toBe("/meu-perfil");
    expect(destinoSeguro("javascript:alert(1)")).toBe("/meu-perfil");
    expect(destinoSeguro("conta")).toBe("/meu-perfil");
  });

  test("sem destino, vai para o padrão", () => {
    expect(destinoSeguro(null)).toBe("/meu-perfil");
    expect(destinoSeguro(undefined)).toBe("/meu-perfil");
    expect(destinoSeguro("//site-falso.com", "/")).toBe("/");
  });
});
