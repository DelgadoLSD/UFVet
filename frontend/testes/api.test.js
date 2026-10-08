import { afterEach, describe, expect, test, vi } from "vitest";
import { ErroApi, chamarApi } from "../src/servicos/api";

// A conversa com a API (servicos/api.js), com o fetch do navegador trocado
// por respostas prontas: o erro que chega aos formulários precisa dizer se o
// problema é num campo ou geral, senão o erro geral não aparece em lugar
// nenhum.

afterEach(() => vi.unstubAllGlobals());

// Faz o fetch responder com este status e este corpo em JSON.
function responder(status, corpo) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(corpo), { status })),
  );
}

// O erro que chamarApi lança.
async function erroDe(promessa) {
  try {
    await promessa;
  } catch (erro) {
    return erro;
  }
  throw new Error("a chamada deveria ter falhado");
}

describe("os erros da API chegam aos formulários", () => {
  test("erro geral, sem campos: a mensagem da API e campos null", async () => {
    responder(429, {
      erro: "Muitos registros feitos em pouco tempo. Tente de novo mais tarde.",
    });
    const erro = await erroDe(chamarApi("/animais/L4N8C1/doacoes"));
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro.status).toBe(429);
    expect(erro.message).toBe(
      "Muitos registros feitos em pouco tempo. Tente de novo mais tarde.",
    );
    expect(erro.campos).toBeNull();
  });

  test("erro de campo: a mensagem de cada campo", async () => {
    responder(400, {
      erro: "Confira os campos destacados.",
      campos: { volumeMl: "Confira o volume: mais de 1000 mL." },
    });
    const erro = await erroDe(chamarApi("/animais/L4N8C1/doacoes"));
    expect(erro.campos).toEqual({
      volumeMl: "Confira o volume: mais de 1000 mL.",
    });
  });

  test("sem conexão: uma mensagem que diz o que fazer, sem campos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const erro = await erroDe(chamarApi("/conta"));
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch(/Não foi possível falar com o servidor/);
    expect(erro.campos).toBeNull();
  });

  test("resposta de erro sem corpo: mensagem padrão, sem campos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 502 })),
    );
    const erro = await erroDe(chamarApi("/conta"));
    expect(erro.message).toBe("Algo deu errado. Tente de novo em instantes.");
    expect(erro.campos).toBeNull();
  });

  test("lista de campos vazia conta como erro geral", () => {
    expect(new ErroApi(400, "Confira os dados.", {}).campos).toBeNull();
  });
});
