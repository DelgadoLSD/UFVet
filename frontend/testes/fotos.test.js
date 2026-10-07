import { describe, expect, test } from "vitest";
import {
  erroDoArquivo,
  pedidoDasFotos,
  tornarPrincipal,
} from "../src/regras/fotos";

// As regras das fotos no site (regras/fotos.js): o que se confere antes de
// enviar e o que vai para a API sobre a ordem das fotos de um animal.

const MB = 1024 * 1024;

describe("conferência do arquivo escolhido", () => {
  test("aceita JPG, PNG e WebP de até 10 MB, com as mensagens da API", () => {
    expect(erroDoArquivo({ type: "image/jpeg", size: 3 * MB })).toBeUndefined();
    expect(erroDoArquivo({ type: "image/png", size: 10 * MB })).toBeUndefined();
    expect(erroDoArquivo({ type: "image/webp", size: 1 })).toBeUndefined();

    const formato = "Envie a foto em JPG, PNG ou WebP.";
    expect(erroDoArquivo({ type: "image/gif", size: MB })).toBe(formato);
    expect(erroDoArquivo({ type: "image/svg+xml", size: MB })).toBe(formato);
    expect(erroDoArquivo({ type: "application/pdf", size: MB })).toBe(formato);
    expect(erroDoArquivo({ type: "", size: MB })).toBe(formato);
    expect(erroDoArquivo({ type: "image/jpeg", size: 10 * MB + 1 })).toBe(
      "Cada foto pode ter no máximo 10 MB.",
    );
  });
});

describe("o que vai para a API sobre as fotos", () => {
  const salvas = [
    { id: "a", url: "/api/arquivos/a.webp" },
    { id: "b", url: "/api/arquivos/b.webp" },
    { id: "c", url: "/api/arquivos/c.webp" },
  ];
  const nova = (nome) => ({ arquivo: { name: nome }, url: `blob:${nome}` });

  test("sem mudança, a ordem não vai", () => {
    expect(pedidoDasFotos(salvas, salvas)).toEqual({
      arquivos: [],
      ordem: undefined,
    });
    expect(pedidoDasFotos([], [])).toEqual({ arquivos: [], ordem: undefined });
  });

  test("remover e reordenar mandam a ordem nova, só com as que ficam", () => {
    expect(pedidoDasFotos([salvas[2], salvas[0]], salvas).ordem).toEqual([
      "c",
      "a",
    ]);
    expect(pedidoDasFotos([], salvas).ordem).toEqual([]);
  });

  test("fotos novas vão como arquivos, e a ordem diz onde cada uma entra", () => {
    const x = nova("x.jpg");
    const y = nova("y.jpg");

    const pedido = pedidoDasFotos([x, salvas[1], y], salvas);

    expect(pedido.arquivos).toEqual([x.arquivo, y.arquivo]);
    expect(pedido.ordem).toEqual(["nova", "b", "nova"]);
  });

  test("tornar principal leva a foto para o começo, sem mudar as outras", () => {
    expect(tornarPrincipal(salvas, 2).map((f) => f.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(tornarPrincipal(salvas, 0)).toEqual(salvas);
  });
});
