import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { banco } from "../src/banco.js";
import { criarTutor, limparBanco } from "./apoio.js";

// NF1.5 e NF1.2: os dados pessoais ficam ilegíveis no banco, e mesmo assim o
// banco impede duas contas com o mesmo e-mail ou o mesmo CPF.

beforeEach(limparBanco);
afterAll(() => banco.$disconnect());

const beatriz = {
  nome: "Beatriz dos Reis",
  email: "beatriz.reis@gmail.com",
  cpf: "129.447.806-55",
  telefone: "(31) 98871-4402",
};

describe("dados pessoais no banco", () => {
  test("quem lê o banco direto não vê CPF, e-mail nem telefone", async () => {
    await criarTutor(beatriz);

    // Lê as colunas como estão gravadas, sem passar pela cifra: é o que
    // veria quem tivesse acesso só ao banco ou a um backup dele.
    const [linha] = await banco.$queryRaw`
      select cpf_cifrado, cpf_indice, email_cifrado, email_indice, telefone_cifrado
      from usuario`;
    const tudo = Object.values(linha).join(" ");

    expect(tudo).not.toContain("beatriz");
    expect(tudo).not.toContain("12944780655");
    expect(tudo).not.toContain("129.447.806-55");
    expect(tudo).not.toContain("98871");
  });

  test("o mesmo e-mail, com letras maiúsculas, não cria uma segunda conta", async () => {
    await criarTutor(beatriz);

    await expect(
      criarTutor({ ...beatriz, cpf: "111.444.777-35", email: "Beatriz.Reis@Gmail.com" }),
    ).rejects.toMatchObject({ code: "P2002" });
    expect(await banco.usuario.count()).toBe(1);
  });

  test("o mesmo CPF, escrito sem pontuação, não cria uma segunda conta", async () => {
    await criarTutor(beatriz);

    await expect(
      criarTutor({ ...beatriz, email: "outro.email@gmail.com", cpf: "12944780655" }),
    ).rejects.toMatchObject({ code: "P2002" });
    expect(await banco.usuario.count()).toBe(1);
  });
});
