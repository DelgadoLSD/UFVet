import { describe, expect, test } from "vitest";
import {
  VOLUME_MAXIMO_ML,
  errosDaDoacao,
} from "../src/pages/perfil/formularioDoacao";

// O formulário de registro de doação (pages/perfil/formularioDoacao.js): o
// que ele confere antes de mandar para a API. Sem esta conferência, clicar em
// registrar com um campo faltando não fazia nada.

const HOSPITAL = {
  id: "0b6f4c1e-8a2d-4c3b-9e5f-1d2a3b4c5d6e",
  nome: "Hospital Veterinário UFV",
};

// Um formulário pronto para enviar.
const pronto = {
  data: new Date(2026, 9, 8),
  volume: "50",
  estabelecimentoId: HOSPITAL.id,
  locais: [HOSPITAL],
};

describe("o que falta para registrar a doação", () => {
  test("com o dia, o volume e o local, não há o que corrigir", () => {
    expect(errosDaDoacao(pronto)).toEqual({});
  });

  test("sem o dia escolhido no calendário, pede o dia", () => {
    expect(errosDaDoacao({ ...pronto, data: null })).toEqual({
      dataColeta: "Escolha no calendário o dia da coleta.",
    });
  });

  test.each([
    ["", "Informe o volume em mL."],
    ["   ", "Informe o volume em mL."],
    ["0", "Informe o volume em mL."],
    ["-50", "Informe o volume em mL."],
    ["450.5", "Informe o volume em mL, sem casas decimais."],
    ["1001", "Confira o volume: mais de 1000 mL."],
  ])("volume %j: %s", (volume, mensagem) => {
    expect(errosDaDoacao({ ...pronto, volume })).toEqual({
      volumeMl: mensagem,
    });
  });

  test("aceita os limites da API: 1 e 1000 mL", () => {
    expect(VOLUME_MAXIMO_ML).toBe(1000);
    expect(errosDaDoacao({ ...pronto, volume: "1" })).toEqual({});
    expect(errosDaDoacao({ ...pronto, volume: "1000" })).toEqual({});
  });

  test("sem local, ou com um que não está na lista, pede o local", () => {
    const mensagem = { estabelecimentoId: "Escolha onde a coleta foi feita." };
    expect(errosDaDoacao({ ...pronto, estabelecimentoId: "" })).toEqual(
      mensagem,
    );
    expect(errosDaDoacao({ ...pronto, estabelecimentoId: "outro" })).toEqual(
      mensagem,
    );
    // A lista ainda não chegou da API: nenhum local vale.
    expect(errosDaDoacao({ ...pronto, locais: [] })).toEqual(mensagem);
  });

  test("aponta tudo o que falta de uma vez, na ordem da tela", () => {
    const vazio = {
      data: null,
      volume: "",
      estabelecimentoId: "",
      locais: [HOSPITAL],
    };
    expect(Object.keys(errosDaDoacao(vazio))).toEqual([
      "dataColeta",
      "volumeMl",
      "estabelecimentoId",
    ]);
  });
});
