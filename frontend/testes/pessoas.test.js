import { afterEach, describe, expect, test, vi } from "vitest";
import { buscarContato, buscarPerfil } from "../src/servicos/pessoas";

// O perfil de outra pessoa e o contato dela (servicos/pessoas.js), com o
// fetch do navegador trocado por respostas prontas: o perfil chega com os
// mesmos nomes da conta logada, e o contato só sai da rota protegida.

afterEach(() => vi.unstubAllGlobals());

// Faz o fetch responder com este corpo e guarda os endereços pedidos.
function responder(corpo, status = 200) {
  const pedidos = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (endereco) => {
      pedidos.push(endereco);
      return new Response(JSON.stringify(corpo), { status });
    }),
  );
  return pedidos;
}

describe("perfil público", () => {
  test("o veterinário chega com o CRMV completo, o hospital e as validações", async () => {
    const pedidos = responder({
      usuario: {
        codigo: "V7H4M2",
        papel: "VETERINARIO",
        nomeCompleto: "Victor Hugo Martins",
        cidade: "Viçosa - MG",
        bairro: "Centro",
        fotoUrl: "/api/arquivos/victor.webp",
        membroDesde: "2026-10-01T12:00:00.000Z",
        veterinario: {
          crmv: "78120",
          ufCrmv: "MG",
          tratamento: "DR",
          estabelecimento: { nome: "Hospital Veterinário UFV" },
          validacoesRealizadas: 7,
        },
      },
    });

    expect(await buscarPerfil("v7h4m2")).toStrictEqual({
      codigo: "V7H4M2",
      papel: "VETERINARIO",
      nomeCompleto: "Victor Hugo Martins",
      cidade: "Viçosa - MG",
      bairro: "Centro",
      membroDesde: "2026-10-01T12:00:00.000Z",
      foto: "/api/arquivos/victor.webp",
      tratamento: "DR",
      crmv: "78120-MG",
      hospital: "Hospital Veterinário UFV",
      validacoesRealizadas: 7,
    });
    expect(pedidos).toEqual(["/api/usuarios/v7h4m2"]);
  });

  test("o tutor chega sem campos de veterinário e sem contato nenhum", async () => {
    responder({
      usuario: {
        codigo: "T7X9K2",
        papel: "TUTOR",
        nomeCompleto: "Lucas Silva Delgado",
        cidade: "Viçosa - MG",
        bairro: "Silvestre",
        fotoUrl: null,
        membroDesde: "2026-10-01T12:00:00.000Z",
        veterinario: null,
      },
    });
    const perfil = await buscarPerfil("T7X9K2");
    expect(perfil).not.toHaveProperty("crmv");
    expect(perfil).not.toHaveProperty("email");
    expect(perfil).not.toHaveProperty("telefone");
  });
});

describe("contato", () => {
  test("vem da rota protegida do perfil", async () => {
    const pedidos = responder({
      contato: { email: "lucas@example.com", telefone: "(31) 99715-2280" },
    });
    expect(await buscarContato("T7X9K2")).toEqual({
      email: "lucas@example.com",
      telefone: "(31) 99715-2280",
    });
    expect(pedidos).toEqual(["/api/usuarios/T7X9K2/contato"]);
  });

  test("a recusa chega com o motivo da API, para a tela mostrar", async () => {
    responder(
      {
        erro: "O contato aparece quando um veterinário libera o seu acesso. Peça a liberação a quem acompanha o seu caso.",
      },
      403,
    );
    await expect(buscarContato("T7X9K2")).rejects.toMatchObject({
      status: 403,
      message:
        "O contato aparece quando um veterinário libera o seu acesso. Peça a liberação a quem acompanha o seu caso.",
    });
  });
});
