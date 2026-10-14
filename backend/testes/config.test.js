import { afterEach, describe, expect, test, vi } from "vitest";
import { valorDoAmbiente } from "../src/config.js";

// As variáveis do ambiente como a API as lê (config.js): no painel da
// hospedagem, é fácil colar o valor com as aspas do .env ou com um espaço.

afterEach(() => vi.unstubAllEnvs());

describe("valor de uma variável do ambiente", () => {
  test("tira espaços e aspas que vieram junto ao colar", () => {
    vi.stubEnv("EXEMPLO", '  "https://script.google.com/macros/s/abc/exec" ');
    expect(valorDoAmbiente("EXEMPLO")).toBe(
      "https://script.google.com/macros/s/abc/exec",
    );
    vi.stubEnv("EXEMPLO", "'a+b/c='");
    expect(valorDoAmbiente("EXEMPLO")).toBe("a+b/c=");
  });

  test("mantém o valor que não está entre aspas, mesmo com aspas no meio", () => {
    vi.stubEnv("EXEMPLO", 'abc"def');
    expect(valorDoAmbiente("EXEMPLO")).toBe('abc"def');
  });

  test("vazia, só de espaços ou só de aspas, conta como não definida", () => {
    vi.stubEnv("EXEMPLO", "   ");
    expect(valorDoAmbiente("EXEMPLO")).toBeNull();
    vi.stubEnv("EXEMPLO", '""');
    expect(valorDoAmbiente("EXEMPLO")).toBeNull();
    expect(valorDoAmbiente("NAO_EXISTE_NO_AMBIENTE")).toBeNull();
  });
});
