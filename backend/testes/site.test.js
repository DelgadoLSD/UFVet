import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";

// O site entregue pela própria API, como quando está publicada (app.js,
// entregarSite): as páginas do React, os arquivos montados e a política de
// segurança. Usa uma pasta de site de mentira, com um index.html e um
// arquivo montado.

const PASTA = path.join(os.tmpdir(), "ufvet-testes-site");
const PAGINA = "<!doctype html><title>UFVet</title><div id=root></div>";

let app;
beforeAll(async () => {
  await rm(PASTA, { recursive: true, force: true });
  await mkdir(path.join(PASTA, "assets"), { recursive: true });
  await writeFile(path.join(PASTA, "index.html"), PAGINA);
  await writeFile(path.join(PASTA, "assets", "index-abc123.js"), "1;");
  app = criarApp({ pastaSite: PASTA });
});
afterAll(async () => {
  await rm(PASTA, { recursive: true, force: true });
  await banco.$disconnect();
});

describe("o site no mesmo endereço da API", () => {
  test("a página inicial e as páginas do React recebem o index.html, sempre conferido de novo", async () => {
    for (const endereco of ["/", "/buscar", "/tutor/T5W2K6", "/meu-perfil"]) {
      const resposta = await request(app).get(endereco);
      expect(resposta.status).toBe(200);
      expect(resposta.headers["content-type"]).toMatch(/text\/html/);
      expect(resposta.text).toBe(PAGINA);
      expect(resposta.headers["cache-control"]).toBe("no-cache");
    }
  });

  test("os arquivos montados ficam guardados no navegador por um ano", async () => {
    const resposta = await request(app).get("/assets/index-abc123.js");

    expect(resposta.status).toBe(200);
    expect(resposta.headers["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  test("endereço da API que não existe continua com o erro da API", async () => {
    for (const endereco of ["/api/nao-existe", "/api"]) {
      const resposta = await request(app).get(endereco);
      expect(resposta.status).toBe(404);
      expect(resposta.body.erro).toBe("Endereço não encontrado.");
    }
    // A API em si continua respondendo.
    expect((await request(app).get("/api/saude")).body).toEqual({ ok: true });
  });

  test("arquivo que não existe não vira página", async () => {
    const resposta = await request(app).get("/foto-que-nao-existe.png");

    expect(resposta.status).toBe(404);
    expect(resposta.text).not.toBe(PAGINA);
  });

  test("a política de segurança aceita as prévias das fotos (blob:) e as fontes do Google", async () => {
    const politica = (await request(app).get("/")).headers[
      "content-security-policy"
    ];

    expect(politica).toContain("img-src 'self' data: blob:");
    expect(politica).toContain("font-src 'self' https: data:");
    expect(politica).toContain("style-src 'self' https: 'unsafe-inline'");
    expect(politica).toContain("script-src 'self'");
  });

  test("sem a pasta do site (no computador e nos testes), só a API responde", async () => {
    const soApi = criarApp({ pastaSite: null });

    const resposta = await request(soApi).get("/buscar");

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe("Endereço não encontrado.");
  });
});
