import { afterEach, describe, expect, test, vi } from "vitest";
import { acessoDe, mudancaDoAcesso } from "../src/servicos/acessoContatos";
import { conferirTutor, resumoDosAnimais } from "../src/servicos/pessoas";
import { opcoesDeRenovacao } from "../src/regras/acessoContatos";
import { diaEHora } from "../src/util/datas";

// O acesso aos contatos no site (servicos/acessoContatos.js e
// servicos/pessoas.js): quem vê o contato e por quê, o que decide os textos
// e os botões da busca e do perfil, e a conferência do tutor antes de
// liberar.

afterEach(() => vi.unstubAllGlobals());

const HORA = 60 * 60 * 1000;
const daqui = (horas) => new Date(Date.now() + horas * HORA).toISOString();

const tutora = { codigo: "T3M8P1", papel: "TUTOR", nomeCompleto: "Beatriz" };
const veterinario = {
  codigo: "V7H4M2",
  papel: "VETERINARIO",
  nomeCompleto: "Victor Hugo Martins",
  tratamento: "DR",
};
const situacao = (dados) => ({
  codigo: tutora.codigo,
  pronta: true,
  liberacao: null,
  pedido: null,
  ...dados,
});

describe("quem vê o contato (F33)", () => {
  test("o visitante, sem conta, nunca", () => {
    expect(acessoDe(null, situacao({}))).toEqual({
      pode: false,
      motivo: "visitante",
    });
  });

  test("o veterinário, sempre, sem esperar resposta da API", () => {
    expect(acessoDe(veterinario, { pronta: false })).toEqual({
      pode: true,
      motivo: "veterinario",
    });
  });

  test("enquanto a situação da tutora não chega, nenhum botão (carregando)", () => {
    expect(acessoDe(tutora, { codigo: null, pronta: false }).motivo).toBe(
      "carregando",
    );
    // A situação de outra conta (trocou de conta no meio) não serve.
    const deOutra = situacao({
      codigo: "T7X9K2",
      liberacao: { expiraEm: daqui(5) },
    });
    expect(acessoDe(tutora, deOutra).motivo).toBe("carregando");
  });

  test("a tutora com liberação ativa vê", () => {
    const liberacao = { expiraEm: daqui(5) };
    expect(acessoDe(tutora, situacao({ liberacao }))).toEqual({
      pode: true,
      motivo: "liberacao",
      liberacao,
    });
  });

  test("a liberação que vence com a página aberta deixa de valer na hora (F32)", () => {
    const vencida = { expiraEm: daqui(-0.01) };
    expect(acessoDe(tutora, situacao({ liberacao: vencida }))).toEqual({
      pode: false,
      motivo: "sem-liberacao",
    });
  });

  test("com o pedido esperando resposta, o site diz que foi enviado", () => {
    const pedido = { id: "p1", veterinario };
    expect(acessoDe(tutora, situacao({ pedido }))).toEqual({
      pode: false,
      motivo: "pedido-enviado",
      pedido,
    });
  });

  test("sem nada, a tutora pode pedir a liberação", () => {
    expect(acessoDe(tutora, situacao({})).motivo).toBe("sem-liberacao");
  });
});

describe("conferência do tutor antes de liberar (NF28.3)", () => {
  test("os animais numa frase", () => {
    expect(resumoDosAnimais([])).toBe("Nenhum animal cadastrado");
    expect(resumoDosAnimais([{ nome: "Thor", especie: "CAO" }])).toBe(
      "Thor (cão)",
    );
    expect(
      resumoDosAnimais([
        { nome: "Zeus", especie: "CAO" },
        { nome: "Luna", especie: "GATO" },
        { nome: "Bela", especie: "CAO" },
      ]),
    ).toBe("Zeus (cão), Luna (gato) e Bela (cão)");
  });

  test("o tutor e a liberação que ele já tem chegam do jeito que o modal usa", async () => {
    const pedidos = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (endereco) => {
        pedidos.push(endereco);
        return new Response(
          JSON.stringify({
            tutor: {
              codigo: "T3M8P1",
              papel: "TUTOR",
              nomeCompleto: "Beatriz dos Reis",
              cidade: "Viçosa - MG",
              bairro: "Ramos",
              fotoUrl: "/api/arquivos/foto.webp",
              membroDesde: "2026-09-01T12:00:00.000Z",
              veterinario: null,
              animais: [
                { nome: "Zeus", especie: "CAO" },
                { nome: "Luna", especie: "GATO" },
              ],
            },
            liberacao: {
              expiraEm: "2026-10-12T12:00:00.000Z",
              veterinario: {
                codigo: "V9P3R7",
                nomeCompleto: "Paulo Rezende",
                tratamento: "DR",
                crmv: "88214",
                ufCrmv: "MG",
                fotoUrl: null,
                estabelecimento: { nome: "Hospital Veterinário UFV" },
              },
            },
          }),
          { status: 200 },
        );
      }),
    );

    const { tutor, liberacao } = await conferirTutor("T3M8P1");
    expect(pedidos).toEqual(["/api/usuarios/T3M8P1/acesso"]);
    expect(tutor).toMatchObject({
      codigo: "T3M8P1",
      nomeCompleto: "Beatriz dos Reis",
      foto: "/api/arquivos/foto.webp",
      animaisResumo: "Zeus (cão) e Luna (gato)",
    });
    expect(liberacao.veterinario).toMatchObject({
      nomeCompleto: "Paulo Rezende",
      tratamento: "DR",
      crmv: "88214-MG",
      hospital: "Hospital Veterinário UFV",
    });
  });
});

describe("renovação de uma liberação (F30)", () => {
  const agora = new Date(2026, 9, 10, 14, 30).getTime(); // sáb, 10/10 às 14:30

  test("cada prazo diz quando o acesso passaria a terminar, contado de agora", () => {
    const opcoes = opcoesDeRenovacao(new Date(agora + 2 * HORA), agora);
    expect(
      opcoes.map((o) => [o.rotulo, diaEHora(o.terminaEm), o.encurta]),
    ).toEqual([
      ["24 horas", "dom, 11/10 às 14:30", false],
      ["3 dias", "ter, 13/10 às 14:30", false],
      ["7 dias", "sáb, 17/10 às 14:30", false],
    ]);
  });

  test("o prazo que terminaria antes do atual fica de fora (renovar só estende)", () => {
    // Faltam 2 dias: renovar por 24 horas encurtaria o acesso.
    const opcoes = opcoesDeRenovacao(new Date(agora + 48 * HORA), agora);
    expect(opcoes.map((o) => o.encurta)).toEqual([true, false, false]);
  });
});

describe("a resposta do veterinário chega sem recarregar a página", () => {
  const pedido = { id: "p1", veterinario };
  const liberacao = { expiraEm: daqui(72), veterinario };

  test("pedido esperando -> liberado: avisa quem liberou", () => {
    expect(
      mudancaDoAcesso(situacao({ pedido }), situacao({ liberacao })),
    ).toMatchObject({ texto: "Dr. Victor liberou seu acesso aos contatos" });
  });

  test("liberado pelo código, sem pedido antes: avisa também", () => {
    expect(mudancaDoAcesso(situacao({}), situacao({ liberacao })).texto).toBe(
      "Dr. Victor liberou seu acesso aos contatos",
    );
  });

  test("pedido esperando -> sem pedido e sem acesso: foi recusado", () => {
    expect(mudancaDoAcesso(situacao({ pedido }), situacao({}))).toEqual({
      texto: "Dr. Victor recusou seu pedido",
      detalhe: "Você pode pedir de novo, a ele ou a outro veterinário.",
    });
  });

  test("liberado -> sem acesso: o acesso terminou", () => {
    expect(mudancaDoAcesso(situacao({ liberacao }), situacao({})).texto).toBe(
      "Seu acesso aos contatos terminou",
    );
  });

  test("sem aviso na primeira busca, quando nada mudou e ao fazer o próprio pedido", () => {
    expect(
      mudancaDoAcesso({ codigo: null, pronta: false }, situacao({ liberacao })),
    ).toBeNull();
    expect(
      mudancaDoAcesso(situacao({ liberacao }), situacao({ liberacao })),
    ).toBeNull();
    expect(mudancaDoAcesso(situacao({}), situacao({ pedido }))).toBeNull();
    // O pedido continua esperando: não foi recusado.
    expect(
      mudancaDoAcesso(situacao({ pedido }), situacao({ pedido })),
    ).toBeNull();
    // Outra conta (trocou de conta no meio): não é mudança desta pessoa.
    expect(
      mudancaDoAcesso(
        { ...situacao({ pedido }), codigo: "T7X9K2" },
        situacao({}),
      ),
    ).toBeNull();
  });
});
