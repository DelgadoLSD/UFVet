import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, test } from "vitest";

// A prévia do link (Open Graph), que o WhatsApp e as redes sociais montam ao
// receber o endereço do site: as etiquetas do index.html e a imagem.

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const etiqueta = (propriedade) =>
  html.match(new RegExp(`property="${propriedade}"\\s+content="([^"]+)"`))?.[1];

describe("prévia do link no WhatsApp", () => {
  test("tem título, texto e imagem", () => {
    expect(etiqueta("og:title")).toBe("UFVet | Doação de Sangue Animal");
    expect(etiqueta("og:description")).toContain("doadores voluntários");
    expect(etiqueta("og:image")).toBeTruthy();
  });

  test("a imagem tem o endereço completo, que o WhatsApp exige", () => {
    expect(etiqueta("og:image")).toMatch(/^https:\/\/[^/]+\/\S+\.jpg$/);
  });

  test("a imagem existe no site e cabe no limite do WhatsApp", () => {
    const nome = new URL(etiqueta("og:image")).pathname;
    const arquivo = new URL(`../public${nome}`, import.meta.url);

    expect(existsSync(arquivo)).toBe(true);
    expect(statSync(arquivo).size).toBeLessThan(300 * 1024);
  });
});
