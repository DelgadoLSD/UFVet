import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ModalValidacao from "../src/pages/perfil/ModalValidacao";
import { todosCriterios } from "../src/regras/doacao";

// A janela em que o veterinário marca os critérios (pages/perfil/ModalValidacao
// .jsx) vira HTML, sem abrir o navegador. A moldura da janela e a sessão são
// trocadas por versões simples, porque aqui só importa o que vai dentro. O
// "hoje" dos testes é fixo: 07/10/2026.

vi.mock("../src/components/Modal", () => ({
  default: ({ children, rodape }) => h("div", null, children, rodape),
}));
vi.mock("../src/servicos/sessao", () => ({
  useSessao: () => ({
    nomeCompleto: "Camila Duarte",
    papel: "VETERINARIO",
    tratamento: "DRA",
    crmv: "45210-MG",
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
});
afterEach(() => vi.useRealTimers());

const dentro = {
  nome: "Zeus",
  especie: "CAO",
  pesoKg: 32,
  dataNascimento: "2021-08-20",
  nascimentoAproximado: false,
  tipoSanguineo: null,
};
const leve = { ...dentro, nome: "Luna", pesoKg: 22 };
const assinada = {
  realizadaEm: "2026-08-20",
  criterios: todosCriterios(true),
  nota: "",
};

const janela = (animal, validacao = null) =>
  renderToStaticMarkup(
    h(ModalValidacao, {
      animal,
      validacao,
      onSalvar: () => {},
      onFechar: () => {},
    }),
  );

// O critério de peso e idade como botão de marcar.
const botaoPesoIdade =
  /<button[^>]*aria-pressed(?:(?!<\/button>).)*Peso e idade dentro do ideal/;

describe("peso e idade na janela de validação (NF19.7)", () => {
  test("dentro do ideal, é um critério como os outros", () => {
    const html = janela(dentro);

    expect(html).toMatch(botaoPesoIdade);
    expect(html).not.toContain("não atendido");
  });

  test("fora do ideal, não há o que marcar, e a janela diz por quê e o que fazer", () => {
    const html = janela(leve);

    expect(html).not.toMatch(botaoPesoIdade);
    expect(html).toContain("Peso e idade dentro do ideal");
    expect(html).toContain("não atendido");
    expect(html).toContain("Peso: 22 kg. O ideal é 25 kg ou mais.");
    expect(html).toContain(
      "Se o dado estiver errado, o tutor pode corrigi-lo.",
    );
  });

  test("fora do ideal, os outros critérios continuam podendo ser marcados", () => {
    const botoes = janela(leve).match(/aria-pressed/g);

    expect(botoes).toHaveLength(4);
  });

  test("a revisão de quem está fora do ideal começa com esse critério de fora", () => {
    const html = janela(leve, assinada);

    expect(html).toContain("4 de 5 critérios: ficará com pendências");
    expect(html).not.toContain("Todos os critérios conferidos");
    // Os quatro que dá para marcar já estão marcados.
    expect(html).toContain("Desmarcar todos");
  });

  test("a revisão de quem está dentro do ideal continua completa", () => {
    const html = janela(dentro, assinada);

    expect(html).toContain("Todos os critérios conferidos");
    expect(html).toContain("Desmarcar todos");
  });

  test("uma validação nova começa desmarcada, dentro ou fora do ideal", () => {
    expect(janela(leve)).toContain("0 de 5 critérios");
    expect(janela(leve)).toContain("Marcar todos");
    expect(janela(dentro)).toContain("0 de 5 critérios");
  });
});
