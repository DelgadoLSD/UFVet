import { describe, expect, test } from "vitest";
import {
  formatarTelefone,
  limparCodigo,
  telefoneValido,
} from "../src/util/texto";

// A máscara e a conferência do telefone e a limpeza do código público
// (util/texto.js). As regras do telefone são cópias das da API
// (backend/src/validacao.js): os exemplos aqui são os mesmos dos testes de
// lá, para as duas cópias não se desencontrarem.

describe("máscara do telefone", () => {
  test("monta o DDD e o número enquanto a pessoa digita", () => {
    expect(formatarTelefone("3")).toBe("(3");
    expect(formatarTelefone("31")).toBe("(31");
    expect(formatarTelefone("319")).toBe("(31) 9");
    expect(formatarTelefone("3199991")).toBe("(31) 9999-1");
  });

  test("o traço muda de lugar quando entra o 11º dígito", () => {
    expect(formatarTelefone("3138991234")).toBe("(31) 3899-1234");
    expect(formatarTelefone("31999991234")).toBe("(31) 99999-1234");
  });

  test("aceita só números e para em 11", () => {
    expect(formatarTelefone("a31b9")).toBe("(31) 9");
    expect(formatarTelefone("(31) 99999-12345")).toBe("(31) 99999-1234");
  });

  test("apagar não deixa parêntese nem espaço sobrando", () => {
    // "(31) 9" com o 9 apagado chega como "(31) "
    expect(formatarTelefone("(31) ")).toBe("(31");
    expect(formatarTelefone("(3")).toBe("(3");
    expect(formatarTelefone("")).toBe("");
  });
});

describe("telefone válido", () => {
  test("aceita celular (9 e mais 8 números) e fixo (8 números, de 2 a 8)", () => {
    expect(telefoneValido("(31) 99999-1234")).toBe(true);
    expect(telefoneValido("(31) 3899-1234")).toBe(true);
    expect(telefoneValido("31988714402")).toBe(true);
  });

  test("recusa DDD com zero, celular sem o 9 e fixo começando com 0, 1 ou 9", () => {
    expect(telefoneValido("(01) 99999-1234")).toBe(false);
    expect(telefoneValido("(31) 89999-1234")).toBe(false);
    expect(telefoneValido("(31) 1234-5678")).toBe(false);
    expect(telefoneValido("(31) 9999-1234")).toBe(false);
    expect(telefoneValido("(31) 9999")).toBe(false);
  });
});

describe("código público", () => {
  test("colado do perfil com # e em minúsculas, fica só com as 6 letras e números", () => {
    expect(limparCodigo("#t3m8p1")).toBe("T3M8P1");
    expect(limparCodigo(" T3M8P1 extra")).toBe("T3M8P1");
  });
});
