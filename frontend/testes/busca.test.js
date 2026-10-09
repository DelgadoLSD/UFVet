import { describe, expect, test } from "vitest";
import { FILTROS_INICIAIS, consultaDaBusca } from "../src/pages/busca/filtros";

// A consulta da busca de doadores (pages/busca/filtros.js): os filtros da tela
// viram o endereço que vai para a API. Só vai o que filtra de fato.

// A consulta como uma lista de pares, para comparar com facilidade.
const pares = (consulta) => [...new URLSearchParams(consulta)];

describe("consulta da busca", () => {
  test("os filtros iniciais pedem só a espécie e a ordem", () => {
    expect(consultaDaBusca(FILTROS_INICIAIS, "validados")).toBe(
      "especie=CAO&ordem=validados",
    );
  });

  test("cada tipo vai repetido, como a API lê uma lista", () => {
    const filtros = { ...FILTROS_INICIAIS, tipos: ["DEA 4", "DEA 1.1-"] };
    expect(pares(consultaDaBusca(filtros, "nome"))).toEqual([
      ["especie", "CAO"],
      ["tipos", "DEA 4"],
      ["tipos", "DEA 1.1-"],
      ["ordem", "nome"],
    ]);
  });

  test("gato pede só a espécie e a ordem; não há filtro de peso", () => {
    const gato = { ...FILTROS_INICIAIS, especie: "GATO" };
    expect(consultaDaBusca(gato, "peso")).toBe("especie=GATO&ordem=peso");
  });

  test("o bairro só vai junto com a cidade", () => {
    const comCidade = {
      ...FILTROS_INICIAIS,
      cidade: "Viçosa - MG",
      bairro: "Centro",
    };
    expect(pares(consultaDaBusca(comCidade, "validados"))).toEqual([
      ["especie", "CAO"],
      ["cidade", "Viçosa - MG"],
      ["bairro", "Centro"],
      ["ordem", "validados"],
    ]);

    const semCidade = { ...FILTROS_INICIAIS, bairro: "Centro" };
    expect(consultaDaBusca(semCidade, "validados")).not.toContain("bairro");
  });

  test("apenas validados, o texto sem espaços nas pontas e a página a partir da segunda", () => {
    const filtros = {
      ...FILTROS_INICIAIS,
      apenasValidados: true,
      busca: "  #h4r8 ",
    };
    expect(pares(consultaDaBusca(filtros, "validados", 2))).toEqual([
      ["especie", "CAO"],
      ["apenasValidados", "true"],
      ["busca", "#h4r8"],
      ["ordem", "validados"],
      ["pagina", "2"],
    ]);
    // Só espaços é o mesmo que não buscar nada.
    expect(
      consultaDaBusca({ ...FILTROS_INICIAIS, busca: "   " }, "validados"),
    ).not.toContain("busca");
  });
});
