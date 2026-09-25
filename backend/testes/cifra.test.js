import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cifrar, decifrar, indiceCpf, indiceEmail } from "../src/cifra.js";

// Cada teste tem três partes:
//   preparar: monta a situação;
//   agir: faz a coisa que está sendo testada;
//   conferir: diz o que tinha de acontecer (expect). Se não acontecer, o teste
//             falha e mostra o esperado e o obtido.

afterEach(() => vi.unstubAllEnvs());

describe("cofre dos dados pessoais", () => {
  test("decifrar devolve exatamente o que foi cifrado", () => {
    // preparar
    const telefone = "(31) 99204-7715";

    // agir
    const cifrado = cifrar(telefone);

    // conferir
    expect(cifrado).not.toContain("99204");
    expect(decifrar(cifrado)).toBe(telefone);
  });

  test("cifrar o mesmo valor duas vezes dá textos diferentes", () => {
    const primeira = cifrar("victor.hugo@ufv.br");
    const segunda = cifrar("victor.hugo@ufv.br");

    // Quem olha o banco não consegue saber se duas pessoas têm o mesmo dado.
    expect(primeira).not.toBe(segunda);
  });

  test("um dado adulterado no banco é recusado, e não aberto com outro conteúdo", () => {
    const cifrado = cifrar("084.512.336-70");
    const ultimo = cifrado.at(-5);
    const adulterado = cifrado.slice(0, -5) + (ultimo === "A" ? "B" : "A") + cifrado.slice(-4);

    expect(() => decifrar(adulterado)).toThrow();
  });

  test("com outra chave, o cofre não abre", () => {
    const cifrado = cifrar("(31) 99204-7715");
    vi.stubEnv("CHAVE_CIFRAGEM", randomBytes(32).toString("base64"));

    expect(() => decifrar(cifrado)).toThrow();
  });

  test("sem a chave no .env, o erro diz qual chave falta", () => {
    vi.stubEnv("CHAVE_CIFRAGEM", "");

    expect(() => cifrar("qualquer coisa")).toThrow("CHAVE_CIFRAGEM não está definida");
  });
});

describe("impressão digital (índice) de e-mail e CPF", () => {
  test("o mesmo e-mail, escrito de jeitos diferentes, tem a mesma impressão digital", () => {
    expect(indiceEmail(" Victor.Hugo@UFV.br ")).toBe(indiceEmail("victor.hugo@ufv.br"));
  });

  test("e-mails diferentes têm impressões digitais diferentes", () => {
    expect(indiceEmail("ana@ufv.br")).not.toBe(indiceEmail("ana@gmail.com"));
  });

  test("CPF com e sem pontuação tem a mesma impressão digital", () => {
    expect(indiceCpf("084.512.336-70")).toBe(indiceCpf("08451233670"));
  });

  test("a impressão digital não contém o dado original", () => {
    const indice = indiceCpf("08451233670");

    expect(indice).toMatch(/^[0-9a-f]{64}$/);
    expect(indice).not.toContain("08451233670");
  });
});
