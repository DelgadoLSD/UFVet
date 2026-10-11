import { describe, expect, test } from "vitest";
import { erroDoExame } from "../src/regras/documentos";

// O que o site confere no arquivo de um exame antes de enviar
// (regras/documentos.js), com as mesmas mensagens da API.

const MB = 1024 * 1024;

describe("conferência do arquivo de exame", () => {
  test("aceita PDF, JPG, PNG e WebP de até 10 MB", () => {
    for (const type of [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]) {
      expect(erroDoExame({ type, size: 2 * MB })).toBeUndefined();
    }
    expect(erroDoExame({ type: "application/pdf", size: 10 * MB })).toBe(
      undefined,
    );
  });

  test("outro formato recebe a mensagem dos formatos aceitos", () => {
    const formato = "Envie o exame em PDF, JPG, PNG ou WebP.";
    for (const type of [
      "image/gif",
      "image/heic",
      "image/svg+xml",
      "text/html",
      "application/msword",
      "",
    ]) {
      expect(erroDoExame({ type, size: MB })).toBe(formato);
    }
  });

  test("acima de 10 MB, a mensagem diz o limite", () => {
    expect(erroDoExame({ type: "application/pdf", size: 10 * MB + 1 })).toBe(
      "O arquivo pode ter no máximo 10 MB.",
    );
  });
});
