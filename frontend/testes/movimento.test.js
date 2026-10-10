import { describe, expect, test } from "vitest";
import { curvaDeslize } from "../src/util/movimento";

// A curva das trocas do carrossel (util/movimento.js): a mesma
// cubic-bezier(0.32, 0.72, 0, 1) do cartão que desliza embaixo, para a faixa
// e o cartão andarem juntos.
describe("curva do deslize", () => {
  test("começa parada e termina no lugar", () => {
    expect(curvaDeslize(0)).toBe(0);
    expect(curvaDeslize(1)).toBe(1);
  });

  test("sai rápida e assenta suave, sem passar do ponto", () => {
    // Com 20% do tempo, já fez mais da metade do caminho.
    expect(curvaDeslize(0.2)).toBeGreaterThan(0.5);
    let anterior = 0;
    for (let t = 0.05; t <= 1; t += 0.05) {
      const agora = curvaDeslize(t);
      expect(agora).toBeGreaterThanOrEqual(anterior);
      expect(agora).toBeLessThanOrEqual(1);
      anterior = agora;
    }
  });

  test("bate com os valores da curva do CSS", () => {
    // cubic-bezier(0.32, 0.72, 0, 1), calculada à parte por bissecção.
    expect(curvaDeslize(0.1)).toBeCloseTo(0.2698, 3);
    expect(curvaDeslize(0.2)).toBeCloseTo(0.6557, 3);
    expect(curvaDeslize(0.5)).toBeCloseTo(0.9548, 3);
    expect(curvaDeslize(0.8)).toBeCloseTo(0.9954, 3);
  });
});
