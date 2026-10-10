import { afterEach, describe, expect, test, vi } from "vitest";
import { chamarApi, definirContaDaAba } from "../src/servicos/api";
import { carregarSessao, chamarComLogin } from "../src/servicos/sessao";

// A conta da aba (servicos/api.js e servicos/sessao.js): o navegador guarda
// um login só por site, e sair numa aba e entrar com outra conta muda o
// login de todas. Cada pedido diz à API qual conta a aba mostra; se a API
// responde que é outra, a aba passa para a conta certa e diz o que houve.

afterEach(() => {
  vi.unstubAllGlobals();
  definirContaDaAba(null);
});

// O fetch responde, na ordem, cada um dos `respostas` ([status, corpo]) e
// guarda os pedidos feitos (endereço e cabeçalhos).
function responder(...respostas) {
  const pedidos = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (endereco, opcoes) => {
      pedidos.push({ endereco, cabecalhos: opcoes?.headers ?? {} });
      const [status, corpo] = respostas[pedidos.length - 1] ?? [200, {}];
      return new Response(JSON.stringify(corpo), { status });
    }),
  );
  return pedidos;
}

const conta = (codigo, nomeCompleto, papel = "TUTOR") => ({
  codigo,
  papel,
  nomeCompleto,
  email: "x@example.com",
  telefone: "(31) 90000-0000",
  cpfMascarado: "•••.000.000-••",
  cidade: "Viçosa - MG",
  bairro: "Centro",
  membroDesde: "2026-09-01T12:00:00.000Z",
  fotoUrl: null,
  veterinario:
    papel === "VETERINARIO"
      ? {
          tratamento: "DR",
          crmv: "78120",
          ufCrmv: "MG",
          estabelecimento: { id: "h1", nome: "Hospital Veterinário UFV" },
          validacoesRealizadas: 0,
        }
      : null,
});

describe("cada pedido diz a conta da aba", () => {
  test("com uma conta na aba, vai o código dela; sem conta, nada", async () => {
    const pedidos = responder([200, {}], [200, {}]);
    definirContaDaAba("T3M8P1");
    await chamarApi("/acesso");
    definirContaDaAba(null);
    await chamarApi("/doadores");
    expect(pedidos[0].cabecalhos["X-Conta"]).toBe("T3M8P1");
    expect(pedidos[1].cabecalhos["X-Conta"]).toBeUndefined();
  });

  test("o erro da API traz o código que o site reconhece", async () => {
    responder([409, { erro: "A conta mudou.", codigo: "CONTA_TROCADA" }]);
    await expect(
      chamarApi("/pedidos", { metodo: "POST" }),
    ).rejects.toMatchObject({ status: 409, codigo: "CONTA_TROCADA" });
  });
});

describe("a aba passa para a conta certa", () => {
  test("entrou com outra conta em outra aba: nada é feito, e a aba muda", async () => {
    const pedidos = responder(
      [200, { usuario: conta("T3M8P1", "Beatriz dos Reis") }],
      [409, { erro: "A conta mudou.", codigo: "CONTA_TROCADA" }],
      [200, { usuario: conta("V7H4M2", "Victor Hugo Martins", "VETERINARIO") }],
      [200, {}],
    );
    await carregarSessao();

    await expect(
      chamarComLogin("/pedidos", { metodo: "POST", corpo: {} }),
    ).rejects.toThrow(
      "Nada foi feito: este navegador agora está na conta de Victor Martins, que entrou em outra aba.",
    );
    expect(pedidos[1].cabecalhos["X-Conta"]).toBe("T3M8P1");
    // Os próximos pedidos já saem com a conta nova.
    await chamarComLogin("/acesso");
    expect(pedidos[3].cabecalhos["X-Conta"]).toBe("V7H4M2");
  });

  test("saiu da conta em outra aba: a aba vira visitante", async () => {
    const pedidos = responder(
      [200, { usuario: conta("T3M8P1", "Beatriz dos Reis") }],
      [409, { erro: "A conta mudou.", codigo: "CONTA_TROCADA" }],
      [200, { usuario: null }],
      [200, {}],
    );
    await carregarSessao();
    await expect(chamarComLogin("/acesso")).rejects.toThrow(
      "Nada foi feito: você saiu da conta em outra aba.",
    );
    await chamarApi("/doadores");
    expect(pedidos[3].cabecalhos["X-Conta"]).toBeUndefined();
  });
});
