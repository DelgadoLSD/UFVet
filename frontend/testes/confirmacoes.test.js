import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { confirmacaoAtual, confirmar } from "../src/hooks/confirmacoes";
import { finalDoGenero } from "../src/regras/doacao";

// A confirmação de "salvo" (hooks/confirmacoes.js): aparece, some sozinha e
// a nova toma o lugar da anterior. O relógio dos testes é falso, para
// avançar o tempo sem esperar.

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
});

describe("confirmação de salvo", () => {
  test("aparece e some sozinha depois de alguns segundos", () => {
    confirmar("Foto atualizada");
    expect(confirmacaoAtual()).toMatchObject({
      texto: "Foto atualizada",
      saindo: false,
    });

    vi.advanceTimersByTime(3500);
    expect(confirmacaoAtual().saindo).toBe(true);

    vi.advanceTimersByTime(180);
    expect(confirmacaoAtual()).toBeNull();
  });

  test("com uma segunda linha, fica mais tempo na tela", () => {
    confirmar("Alterações salvas", "Use o novo e-mail para entrar.");

    vi.advanceTimersByTime(3500);
    expect(confirmacaoAtual().saindo).toBe(false);
    vi.advanceTimersByTime(2500);
    expect(confirmacaoAtual().saindo).toBe(true);
  });

  test("a nova toma o lugar da anterior e recomeça a contagem", () => {
    confirmar("Rex saiu da busca");
    vi.advanceTimersByTime(3000);
    confirmar("Rex voltou para a busca");

    vi.advanceTimersByTime(3000);
    expect(confirmacaoAtual()).toMatchObject({
      texto: "Rex voltou para a busca",
      saindo: false,
    });
  });
});

describe("gênero nas mensagens sobre o animal", () => {
  test("Luna cadastrada, Rex cadastrado", () => {
    expect(`cadastrad${finalDoGenero({ sexo: "FEMEA" })}`).toBe("cadastrada");
    expect(`cadastrad${finalDoGenero({ sexo: "MACHO" })}`).toBe("cadastrado");
  });
});
