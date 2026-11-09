import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Cancelar o pedido de liberação (NF27.5): o que a tela diz depois, sem culpar
// o veterinário, e onde o botão aparece. A API e os avisos são trocados por
// versões simples, e cada teste começa com a situação do tutor zerada.

const api = vi.hoisted(() => ({ chamar: vi.fn() }));
const avisos = vi.hoisted(() => ({ confirmar: vi.fn() }));

vi.mock("../src/servicos/sessao", () => ({
  chamarComLogin: api.chamar,
  useSessao: () => ({ codigo: "T3M8P1", papel: "TUTOR" }),
}));
// O painel do perfil pergunta o tamanho da tela, que aqui não existe.
vi.mock("../src/hooks/useCelular", () => ({
  useCelular: () => false,
}));
vi.mock("../src/hooks/confirmacoes", () => ({
  confirmar: avisos.confirmar,
}));

const veterinario = {
  codigo: "V7H4M2",
  papel: "VETERINARIO",
  nomeCompleto: "Victor Hugo Martins",
  tratamento: "DR",
  crmv: "78120",
  ufCrmv: "MG",
  estabelecimento: { nome: "Hospital Veterinário UFV" },
};
const pedidoDaApi = {
  id: "pedido-1",
  caso: "Luna precisa de sangue",
  criadoEm: "2026-11-09T12:00:00Z",
  tutor: { codigo: "T3M8P1", nomeCompleto: "Beatriz dos Reis" },
  veterinario,
};
const CODIGO = "T3M8P1";

// Faz a API responder como `resposta` às perguntas sobre a situação do tutor.
const situacaoNaApi = (resposta) =>
  api.chamar.mockImplementation(async (caminho) =>
    caminho === "/acesso" ? resposta : undefined,
  );
const COM_PEDIDO = { liberacao: null, pedido: pedidoDaApi };
const SEM_PEDIDO = { liberacao: null, pedido: null };

let servico;
beforeEach(async () => {
  vi.resetModules();
  api.chamar.mockReset();
  avisos.confirmar.mockReset();
  servico = await import("../src/servicos/acessoContatos");
  situacaoNaApi(COM_PEDIDO);
  await servico.recarregarAcesso(CODIGO);
});

const textosDosAvisos = () => avisos.confirmar.mock.calls.map(([t]) => t);

describe("depois de cancelar o pedido", () => {
  test("a API recebe o cancelamento deste pedido", async () => {
    situacaoNaApi(SEM_PEDIDO);

    await servico.cancelarPedido(CODIGO, { id: "pedido-1" });

    expect(api.chamar).toHaveBeenCalledWith("/pedidos/pedido-1", {
      metodo: "DELETE",
    });
  });

  test("o site não diz que o veterinário recusou", async () => {
    situacaoNaApi(SEM_PEDIDO);

    await servico.cancelarPedido(CODIGO, { id: "pedido-1" });
    await servico.recarregarAcesso(CODIGO);

    expect(textosDosAvisos()).toEqual([]);
  });

  test("uma busca que já estava a caminho não traz o pedido de volta", async () => {
    let responder;
    api.chamar.mockImplementation((caminho) =>
      caminho === "/acesso"
        ? new Promise((r) => {
            responder = r;
          })
        : Promise.resolve(),
    );
    const buscaAntiga = servico.recarregarAcesso(CODIGO);

    const cancelamento = servico.cancelarPedido(CODIGO, { id: "pedido-1" });
    // Deixa o cancelamento terminar antes de a busca antiga responder.
    await new Promise((r) => setTimeout(r, 0));
    responder(COM_PEDIDO);
    await buscaAntiga;
    await cancelamento;

    // Se o pedido tivesse voltado, sumir agora pareceria uma recusa.
    situacaoNaApi(SEM_PEDIDO);
    await servico.recarregarAcesso(CODIGO);
    expect(textosDosAvisos()).toEqual([]);
  });

  test("quando o veterinário recusa de verdade, o aviso continua", async () => {
    situacaoNaApi(SEM_PEDIDO);

    await servico.recarregarAcesso(CODIGO);

    expect(textosDosAvisos()).toEqual(["Dr. Victor recusou seu pedido"]);
  });

  test("se a API recusar o cancelamento, o erro chega e a situação é recarregada", async () => {
    const falha = new Error("Esse pedido já foi atendido");
    api.chamar.mockImplementation(async (caminho, opcoes) => {
      if (opcoes?.metodo === "DELETE") throw falha;
      return COM_PEDIDO;
    });
    const antes = api.chamar.mock.calls.length;

    await expect(
      servico.cancelarPedido(CODIGO, { id: "pedido-1" }),
    ).rejects.toBe(falha);

    expect(api.chamar.mock.calls.slice(antes).map(([c]) => c)).toEqual([
      "/pedidos/pedido-1",
      "/acesso",
    ]);
  });
});

describe("onde o botão aparece", () => {
  const pedido = {
    id: "pedido-1",
    veterinario: {
      nomeCompleto: "Victor Hugo Martins",
      tratamento: "DR",
      papel: "VETERINARIO",
    },
  };

  const faixa = async (acesso) => {
    const { default: FaixaAcessoContatos } =
      await import("../src/pages/busca/FaixaAcessoContatos");
    return renderToStaticMarkup(
      h(
        MemoryRouter,
        null,
        h(FaixaAcessoContatos, {
          acesso,
          onPedirLiberacao: () => {},
          onComoFunciona: () => {},
        }),
      ),
    );
  };
  const bloco = async (acesso) => {
    const { default: BlocoContato } =
      await import("../src/pages/perfil/BlocoContato");
    return renderToStaticMarkup(
      h(
        MemoryRouter,
        null,
        h(BlocoContato, {
          perfil: { codigo: "T9X9X9", nomeCompleto: "Carla Souza" },
          ehProprio: false,
          acesso,
          meuCodigo: "T3M8P1",
          onPedirLiberacao: () => {},
          onComoFunciona: () => {},
        }),
      ),
    );
  };

  test("na busca, com um pedido esperando resposta", async () => {
    const html = await faixa({ motivo: "pedido-enviado", pedido });

    expect(html).toContain("Cancelar pedido");
    expect(html).not.toContain("Pedir liberação");
  });

  test("no perfil de outro tutor, com um pedido esperando resposta", async () => {
    const html = await bloco({ pode: false, motivo: "pedido-enviado", pedido });

    expect(html).toContain("Cancelar pedido");
    expect(html).not.toContain("Pedir liberação");
  });

  test("sem pedido, volta a oferecer o pedido de liberação", async () => {
    const acesso = { pode: false, motivo: "sem-liberacao" };

    expect(await faixa(acesso)).toContain("Pedir liberação");
    expect(await faixa(acesso)).not.toContain("Cancelar pedido");
    expect(await bloco(acesso)).toContain("Pedir liberação");
    expect(await bloco(acesso)).not.toContain("Cancelar pedido");
  });
});
