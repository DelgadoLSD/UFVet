import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import Botao from "../src/components/Botao";
import Carregando from "../src/components/Carregando";

// O sinal de "carregando" do site (components/Carregando.jsx e `carregando`
// em Botao): o círculo vermelho girando. Os componentes viram HTML, sem
// abrir o navegador, e o teste confere o que sai.
const html = (elemento) => renderToStaticMarkup(elemento);
const circulo = /<svg[^>]*class="girando /;

describe("botão carregando", () => {
  const salvar = (props = {}) =>
    html(h(Botao, { icone: "save", ...props }, "Salvar"));

  test("parado, mostra o ícone e aceita o clique", () => {
    const botao = salvar();
    expect(botao).toContain(">save</span>");
    expect(botao).not.toMatch(circulo);
    expect(botao).not.toContain('disabled=""');
    expect(botao).not.toContain("aria-busy");
  });

  test("carregando, troca o ícone pelo círculo e mantém o texto", () => {
    const botao = salvar({ carregando: true });
    expect(botao).toMatch(circulo);
    expect(botao).not.toContain(">save</span>");
    expect(botao).toContain("Salvar");
  });

  test("carregando, não aceita um segundo clique e avisa o leitor de tela", () => {
    const botao = salvar({ carregando: true });
    expect(botao).toContain('disabled=""');
    expect(botao).toContain('aria-busy="true"');
  });

  test("carregando, não fica apagado como um botão desligado", () => {
    expect(salvar({ carregando: true })).not.toContain("opacity-50");
    // Desligado de verdade (sem estar carregando), continua apagado.
    expect(salvar({ disabled: true })).toContain("disabled:opacity-50");
  });

  test("sem ícone, o círculo aparece antes do texto", () => {
    const botao = html(h(Botao, { carregando: true }, "Entrando…"));
    expect(botao).toMatch(/<svg[^>]*class="girando [\s\S]*Entrando…/);
  });

  test("no botão vermelho o círculo segue a letra branca; no branco, é vermelho", () => {
    expect(salvar({ carregando: true })).toContain("text-current");
    const branco = salvar({ carregando: true, variante: "secundario" });
    expect(branco).toContain("text-[#9e0a24]");
    expect(branco).not.toContain("text-current");
  });
});

describe("espera de página ou lista", () => {
  test("mostra o círculo e diz o que está vindo, para o leitor de tela também", () => {
    const espera = html(h(Carregando, { texto: "Carregando o perfil…" }));
    expect(espera).toMatch(/^<div role="status"/);
    expect(espera).toMatch(circulo);
    expect(espera).toContain("Carregando o perfil…");
    // O círculo é só desenho: quem fala é o texto.
    expect(espera).toContain('aria-hidden="true"');
  });

  test("nos blocos escuros, fica branco", () => {
    const espera = html(h(Carregando, { texto: "Carregando…", claro: true }));
    expect(espera).toContain("text-white");
    expect(espera).not.toContain("text-[#9e0a24]");
  });
});

describe("abertura do site", () => {
  const pagina = readFileSync(
    new URL("../index.html", import.meta.url),
    "utf8",
  );

  test("antes de o React chegar, a página já mostra o círculo", () => {
    expect(pagina).toMatch(
      /<div id="root">\s*<div class="abrindo" role="status"[^>]*><\/div>\s*<\/div>/,
    );
  });
});

describe("movimento reduzido", () => {
  const css = readFileSync(
    new URL("../src/index.css", import.meta.url),
    "utf8",
  );
  const segundos = (texto) =>
    parseFloat(texto) * (texto.endsWith("ms") ? 0.001 : 1);

  test("o círculo gira mais devagar, mas não para", () => {
    const normal = css.match(
      /\.girando\s*\{\s*animation:\s*girar\s+([\d.]+m?s)/,
    );
    const reduzido = css.match(
      /prefers-reduced-motion:\s*reduce\)\s*\{\s*\.girando\s*\{\s*animation-duration:\s*([\d.]+m?s)/,
    );
    expect(normal).not.toBeNull();
    expect(reduzido).not.toBeNull();
    expect(segundos(reduzido[1])).toBeGreaterThan(segundos(normal[1]));
    expect(css).not.toMatch(/\.girando\s*\{[^}]*animation:\s*none/);
  });
});
