import { describe, expect, test } from "vitest";
import {
  cpfValido,
  formatarCpf,
  formatarTelefone,
  limparCodigo,
  telefoneValido,
} from "../src/util/texto";

// As máscaras dos campos e as conferências de CPF e telefone (util/texto.js).
// São cópias das regras da API (backend/src/validacao.js): os exemplos aqui
// são os mesmos dos testes de lá, para as duas cópias não se desencontrarem.

describe("máscara do CPF", () => {
  test("põe os pontos e o traço enquanto a pessoa digita", () => {
    expect(formatarCpf("1")).toBe("1");
    expect(formatarCpf("1234")).toBe("123.4");
    expect(formatarCpf("1234567")).toBe("123.456.7");
    expect(formatarCpf("1234567890")).toBe("123.456.789-0");
    expect(formatarCpf("12345678909")).toBe("123.456.789-09");
  });

  test("aceita só números e para em 11", () => {
    expect(formatarCpf("abc12x3")).toBe("123");
    expect(formatarCpf("123.456.789-0999")).toBe("123.456.789-09");
  });

  test("apagar não deixa ponto nem traço sobrando", () => {
    // "123.4" com o 4 apagado chega como "123."
    expect(formatarCpf("123.")).toBe("123");
    expect(formatarCpf("")).toBe("");
  });
});

describe("CPF válido", () => {
  test("aceita CPF com os dígitos verificadores certos, com ou sem pontos", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("11144477735")).toBe(true);
    expect(cpfValido("123.456.789-09")).toBe(true);
  });

  test("recusa dígito verificador errado, números repetidos e tamanho errado", () => {
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("123.456.789-00")).toBe(false);
    // Passam na conta, mas não existem.
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("000.000.000-00")).toBe(false);
    expect(cpfValido("123.456.789")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });
});

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
