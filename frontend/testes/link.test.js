import { describe, expect, test } from "vitest";
import { codigoDoLink, temCodigo } from "../src/regras/link";

// O código dos links que o UFVet manda por e-mail, lido do endereço
// (regras/link.js). A API sorteia 32 bytes e os escreve em base64url: 43
// letras, números, "-" e "_".

const CODIGO = "Ab3_-xY9Ab3_-xY9Ab3_-xY9Ab3_-xY9Ab3_-xY9Ab3";

describe("código do link", () => {
  test("lê o código depois do #", () => {
    expect(CODIGO).toHaveLength(43);
    expect(codigoDoLink(`#${CODIGO}`)).toBe(CODIGO);
  });

  test("um link cortado ou com sobras não vale como código", () => {
    // O leitor de e-mail quebrou o endereço, ou a pessoa copiou só um pedaço.
    expect(codigoDoLink(`#${CODIGO.slice(0, 30)}`)).toBeNull();
    expect(codigoDoLink(`#${CODIGO}a`)).toBeNull();
    // Um caractere que o código nunca tem.
    expect(codigoDoLink(`#${CODIGO.slice(0, 42)}=`)).toBeNull();
  });

  test("sem nada depois do #, não há código, e a página sabe que não veio do link", () => {
    expect(codigoDoLink("")).toBeNull();
    expect(temCodigo("")).toBe(false);
    expect(temCodigo("#")).toBe(false);
    // Veio do link, mas cortado: a página explica que o link está incompleto.
    expect(temCodigo("#Ab3")).toBe(true);
  });
});
