import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { banco } from "../src/banco.js";
import { criarAnimal, criarTutor, criarVeterinario, limparBanco } from "./apoio.js";

// A regra de encerramento de conta (seção 6 do modelo de dados e F5):
// apaga-se o que é só sobre a pessoa; preserva-se o que documenta um ato
// praticado sobre o animal de outra pessoa.

beforeEach(limparBanco);
afterAll(() => banco.$disconnect());

// Um veterinário que, no animal de uma tutora, assinou uma validação,
// registrou uma coleta e anotou uma observação, e que também liberou o
// contato para ela. Ele tem um animal próprio.
async function montarCenario() {
  const hospital = await banco.estabelecimento.create({
    data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
  });
  const vet = await criarVeterinario({
    nome: "Victor Hugo Martins",
    email: "victor.hugo@ufv.br",
    cpf: "08451233670",
    crmv: "78120",
    estabelecimentoId: hospital.id,
  });
  const tutora = await criarTutor({
    nome: "Beatriz dos Reis",
    email: "beatriz.reis@gmail.com",
    cpf: "12944780655",
  });
  const zeus = await criarAnimal({ tutorId: tutora.id, nome: "Zeus" });
  const thor = await criarAnimal({ tutorId: vet.id, nome: "Thor" });

  const assinatura = { veterinarioNome: vet.nomeCompleto, crmv: "78120", ufCrmv: "MG" };
  await banco.validacao.create({
    data: {
      ...assinatura,
      animalId: zeus.id,
      veterinarioId: vet.id,
      realizadaEm: new Date("2026-09-01"),
      validaAte: new Date("2027-09-01"),
      criterios: { create: [{ criterio: "TIPAGEM", atendido: true }] },
    },
  });
  await banco.doacao.create({
    data: {
      ...assinatura,
      animalId: zeus.id,
      veterinarioId: vet.id,
      estabelecimentoId: hospital.id,
      dataColeta: new Date("2026-09-10"),
      volumeMl: 450,
    },
  });
  await banco.observacao.create({
    data: {
      animalId: zeus.id,
      autorId: vet.id,
      autorNome: vet.nomeCompleto,
      texto: "Calmo durante a coleta.",
    },
  });
  await banco.liberacaoContato.create({
    data: {
      tutorId: tutora.id,
      veterinarioId: vet.id,
      duracaoHoras: 24,
      expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return { hospital, vet, tutora, zeus, thor };
}

describe("encerrar a conta do veterinário", () => {
  test("mantém o que ele assinou no animal de outra pessoa, com nome e CRMV", async () => {
    // preparar
    const { vet, zeus } = await montarCenario();

    // agir
    await banco.usuario.delete({ where: { id: vet.id } });

    // conferir: os registros continuam, sem o vínculo com a conta apagada,
    // mas com a assinatura legível
    const validacao = await banco.validacao.findFirstOrThrow({ where: { animalId: zeus.id } });
    expect(validacao.veterinarioId).toBeNull();
    expect(validacao.veterinarioNome).toBe("Victor Hugo Martins");
    expect(validacao.crmv).toBe("78120");
    expect(await banco.validacaoCriterio.count()).toBe(1);

    const doacao = await banco.doacao.findFirstOrThrow({ where: { animalId: zeus.id } });
    expect(doacao.veterinarioId).toBeNull();
    expect(doacao.veterinarioNome).toBe("Victor Hugo Martins");

    const observacao = await banco.observacao.findFirstOrThrow({ where: { animalId: zeus.id } });
    expect(observacao.autorId).toBeNull();
    expect(observacao.autorNome).toBe("Victor Hugo Martins");
  });

  test("apaga o que era só dele: o animal próprio, o registro profissional e as liberações que concedeu", async () => {
    const { vet, thor } = await montarCenario();

    await banco.usuario.delete({ where: { id: vet.id } });

    expect(await banco.animal.findUnique({ where: { id: thor.id } })).toBeNull();
    expect(await banco.veterinario.count()).toBe(0);
    expect(await banco.liberacaoContato.count()).toBe(0);
  });
});

describe("encerrar a conta da tutora", () => {
  test("leva junto os animais dela e tudo o que foi registrado sobre eles", async () => {
    const { tutora, vet, zeus } = await montarCenario();

    await banco.usuario.delete({ where: { id: tutora.id } });

    expect(await banco.animal.findUnique({ where: { id: zeus.id } })).toBeNull();
    expect(await banco.validacao.count()).toBe(0);
    expect(await banco.validacaoCriterio.count()).toBe(0);
    expect(await banco.doacao.count()).toBe(0);
    expect(await banco.observacao.count()).toBe(0);
    expect(await banco.liberacaoContato.count()).toBe(0);

    // O veterinário não é afetado.
    expect(await banco.usuario.findUnique({ where: { id: vet.id } })).not.toBeNull();
  });
});

describe("hospital", () => {
  test("não pode ser apagado enquanto tiver veterinário ligado a ele", async () => {
    const { hospital } = await montarCenario();

    await expect(
      banco.estabelecimento.delete({ where: { id: hospital.id } }),
    ).rejects.toThrow();
    expect(await banco.estabelecimento.count()).toBe(1);
  });
});
