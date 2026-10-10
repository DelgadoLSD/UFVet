import { describe, expect, test } from "vitest";
import {
  animalEscolhido,
  enderecoDoAnimal,
} from "../src/pages/perfil/animalEscolhido";

// Qual animal do perfil aparece aberto embaixo do carrossel
// (pages/perfil/animalEscolhido.js).

const animais = [
  { codigo: "H4R8T2", nome: "Thor" },
  { codigo: "F6J3R9", nome: "Frajola" },
  { codigo: "B7Q2M5", nome: "Bolt" },
];

describe("animal aberto no perfil", () => {
  test("abre o animal que veio no endereço", () => {
    expect(animalEscolhido(animais, "B7Q2M5").nome).toBe("Bolt");
  });

  test("aceita o código digitado à mão, com # e em minúsculas", () => {
    expect(animalEscolhido(animais, " #f6j3r9 ").nome).toBe("Frajola");
  });

  test("sem animal no endereço, abre o primeiro", () => {
    expect(animalEscolhido(animais, null).nome).toBe("Thor");
  });

  test("um código que não é deste perfil (excluído, de outro tutor) abre o primeiro", () => {
    expect(animalEscolhido(animais, "ZZZ999").nome).toBe("Thor");
  });

  test("sem animais, nenhum", () => {
    expect(animalEscolhido([], "H4R8T2")).toBeNull();
  });
});

describe("endereço do animal", () => {
  test("o cartão da busca leva ao perfil do tutor já no animal", () => {
    expect(enderecoDoAnimal("T7X9K2", "B7Q2M5")).toBe(
      "/tutor/T7X9K2?animal=B7Q2M5",
    );
  });
});
