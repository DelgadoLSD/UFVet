import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { decifrar, indiceCpf } from "../src/cifra.js";
import { criarConvite } from "../src/modelos/convite.js";
import { NOME_COOKIE } from "../src/token.js";
import { criarAnimal, gerarCpf, limparBanco } from "./apoio.js";

// F3, F4 e F5 pela API: mudar os dados da própria conta, trocar a senha e
// encerrar a conta. Cada teste cria uma API nova (com os limites de
// tentativas zerados) sobre um banco vazio.

let app;
beforeEach(async () => {
  await limparBanco();
  app = criarApp();
});
afterAll(() => banco.$disconnect());

const SENHA = "senha-da-beatriz";

const tutora = {
  papel: "TUTOR",
  nomeCompleto: "Beatriz dos Reis",
  cpf: gerarCpf("111444777"),
  email: "beatriz@example.com",
  telefone: "(31) 98871-4402",
  cidade: "Viçosa - MG",
  bairro: "Ramos",
  senha: SENHA,
  aceiteTermos: true,
  cienciaResponsabilidade: true,
};

const outraTutora = {
  ...tutora,
  nomeCompleto: "Clara Mendes",
  cpf: gerarCpf("222555888"),
  email: "clara@example.com",
};

// Um navegador: guarda os cookies entre um pedido e outro.
const novoNavegador = () => request.agent(app);

async function navegadorComConta(dados = tutora) {
  const navegador = novoNavegador();
  await navegador.post("/api/usuarios").send(dados).expect(201);
  return navegador;
}

const entrar = (navegador, email, senha) =>
  navegador.post("/api/sessao").send({ email, senha });

const quemEstaLogado = async (navegador) =>
  (await navegador.get("/api/sessao")).body.usuario;

const mudarDados = (navegador, dados) =>
  navegador.patch("/api/conta").send(dados);

const trocarSenha = (navegador, senhaAtual, senhaNova) =>
  navegador.put("/api/conta/senha").send({ senhaAtual, senhaNova });

const encerrar = (navegador, senhaAtual) =>
  navegador.delete("/api/conta").send({ senhaAtual });

describe("só com login", () => {
  test("sem entrar, ninguém muda dados, senha ou encerra conta", async () => {
    await navegadorComConta();
    const visitante = request(app);

    const pedidos = [
      visitante.patch("/api/conta").send({ telefone: "(31) 3899-1234" }),
      visitante
        .put("/api/conta/senha")
        .send({ senhaAtual: SENHA, senhaNova: "outra-senha-1" }),
      visitante.delete("/api/conta").send({ senhaAtual: SENHA }),
    ];

    for (const resposta of await Promise.all(pedidos)) {
      expect(resposta.status).toBe(401);
    }
    expect(await banco.usuario.count()).toBe(1);
  });
});

describe("mudar os dados da conta (F3)", () => {
  test("muda nome, telefone, cidade e bairro e responde com a conta nova", async () => {
    const navegador = await navegadorComConta();

    const resposta = await mudarDados(navegador, {
      nomeCompleto: "  Beatriz   Reis Souza ",
      telefone: "31 3899-1234",
      cidade: "Ubá - MG",
      bairro: "Centro",
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toMatchObject({
      nomeCompleto: "Beatriz Reis Souza",
      telefone: "(31) 3899-1234",
      cidade: "Ubá - MG",
      bairro: "Centro",
    });
    // O telefone continua cifrado no banco.
    const conta = await banco.usuario.findFirstOrThrow();
    expect(conta.telefoneCifrado).not.toContain("3899");
    expect(decifrar(conta.telefoneCifrado)).toBe("(31) 3899-1234");
    // E a sessão continua.
    expect((await quemEstaLogado(navegador)).bairro).toBe("Centro");
  });

  test("CPF, CRMV, papel e código não mudam por aqui, mesmo que o pedido traga (NF3.1)", async () => {
    const navegador = await navegadorComConta();
    const antes = await banco.usuario.findFirstOrThrow();

    const resposta = await mudarDados(navegador, {
      cpf: gerarCpf("333666999"),
      papel: "VETERINARIO",
      codigo: "AAAAAA",
      senhaHash: "troquei",
      crmv: "12345",
      veterinario: { crmv: "12345", ufCrmv: "MG" },
    });

    expect(resposta.status).toBe(200);
    const depois = await banco.usuario.findFirstOrThrow({
      include: { veterinario: true },
    });
    expect(depois.cpfIndice).toBe(antes.cpfIndice);
    expect(depois.papel).toBe("TUTOR");
    expect(depois.codigo).toBe(antes.codigo);
    expect(depois.senhaHash).toBe(antes.senhaHash);
    expect(depois.veterinario).toBeNull();
  });

  test("trocar o e-mail pede a senha atual", async () => {
    const navegador = await navegadorComConta();

    const semSenha = await mudarDados(navegador, {
      email: "bia@example.com",
    });
    expect(semSenha.status).toBe(400);
    expect(semSenha.body.campos).toEqual({
      senhaAtual: "Digite sua senha para trocar o e-mail.",
    });

    const senhaErrada = await mudarDados(navegador, {
      email: "bia@example.com",
      senhaAtual: "nao-e-a-senha",
    });
    expect(senhaErrada.status).toBe(400);
    expect(senhaErrada.body.campos).toEqual({ senhaAtual: "Senha incorreta." });
    expect((await quemEstaLogado(navegador)).email).toBe(tutora.email);

    const certo = await mudarDados(navegador, {
      email: "Bia@Example.com",
      senhaAtual: SENHA,
    });
    expect(certo.status).toBe(200);
    expect(certo.body.usuario.email).toBe("bia@example.com");

    // Daqui em diante, entra-se com o e-mail novo, e o antigo não vale.
    expect(
      (await entrar(novoNavegador(), "bia@example.com", SENHA)).status,
    ).toBe(200);
    expect((await entrar(novoNavegador(), tutora.email, SENHA)).status).toBe(
      401,
    );
  });

  test("o mesmo e-mail escrito de outro jeito não é troca e não pede senha", async () => {
    const navegador = await navegadorComConta();

    const resposta = await mudarDados(navegador, {
      email: " BEATRIZ@example.com ",
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.email).toBe(tutora.email);
  });

  test("não aceita o e-mail de outra conta, e só diz isso a quem acertou a senha", async () => {
    await navegadorComConta(outraTutora);
    const navegador = await navegadorComConta();

    // Com a senha errada, a resposta é sobre a senha: o endereço não serve
    // para descobrir quem tem conta.
    const senhaErrada = await mudarDados(navegador, {
      email: outraTutora.email,
      senhaAtual: "nao-e-a-senha",
    });
    expect(senhaErrada.body.campos).toEqual({ senhaAtual: "Senha incorreta." });

    const resposta = await mudarDados(navegador, {
      email: outraTutora.email,
      senhaAtual: SENHA,
    });
    expect(resposta.status).toBe(409);
    expect(resposta.body.campos).toEqual({
      email: "Já existe uma conta com este e-mail.",
    });
  });

  test("aponta cada campo inválido com a sua mensagem", async () => {
    const navegador = await navegadorComConta();

    const resposta = await mudarDados(navegador, {
      nomeCompleto: "Beatriz",
      email: "beatriz@",
      telefone: "1234",
      cidade: "Viçosa",
      bairro: "",
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      nomeCompleto: "Informe o nome e o sobrenome.",
      email: "E-mail inválido. Confira o endereço.",
      telefone: "Telefone inválido. Use o DDD e o número.",
      cidade: "Escolha a cidade na lista.",
      bairro: "Preencha este campo.",
    });
  });

  test("trocar de cidade exige escolher o bairro da nova cidade", async () => {
    const navegador = await navegadorComConta();

    const resposta = await mudarDados(navegador, { cidade: "Ubá - MG" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      bairro: "Escolha o bairro da nova cidade.",
    });
    expect((await quemEstaLogado(navegador)).cidade).toBe("Viçosa - MG");
  });
});

describe("trocar a senha (F4)", () => {
  test("com a senha atual certa, troca, e só a nova senha entra", async () => {
    const navegador = await navegadorComConta();

    const resposta = await trocarSenha(navegador, SENHA, "senha-nova-da-bia");

    expect(resposta.status).toBe(204);
    expect((await entrar(novoNavegador(), tutora.email, SENHA)).status).toBe(
      401,
    );
    expect(
      (await entrar(novoNavegador(), tutora.email, "senha-nova-da-bia")).status,
    ).toBe(200);

    // Guardada como hash bcrypt, nunca a senha em si (NF1.1).
    const conta = await banco.usuario.findFirstOrThrow();
    expect(conta.senhaHash).toMatch(/^\$2[aby]\$/);
    expect(conta.senhaHash).not.toContain("senha-nova-da-bia");
  });

  test("os outros aparelhos saem da conta, e este continua (NF2.3)", async () => {
    // A Beatriz entrou no computador do hospital e esqueceu de sair.
    const computadorDoHospital = await navegadorComConta();
    const celular = novoNavegador();
    await entrar(celular, tutora.email, SENHA).expect(200);

    await trocarSenha(celular, SENHA, "senha-nova-da-bia").expect(204);

    expect(await quemEstaLogado(computadorDoHospital)).toBeNull();
    expect(await quemEstaLogado(celular)).not.toBeNull();
  });

  test("com a senha atual errada, nada muda", async () => {
    const navegador = await navegadorComConta();

    const resposta = await trocarSenha(
      navegador,
      "nao-e-a-senha",
      "senha-nova-da-bia",
    );

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ senhaAtual: "Senha incorreta." });
    expect((await entrar(novoNavegador(), tutora.email, SENHA)).status).toBe(
      200,
    );
    expect(await quemEstaLogado(navegador)).not.toBeNull();
  });

  test("a nova senha segue as regras do cadastro e precisa ser diferente da atual", async () => {
    const navegador = await navegadorComConta();

    const casos = [
      ["curta", "A senha precisa ter pelo menos 8 caracteres."],
      // 37 "ç" são 74 bytes: o bcrypt ignoraria o que passa de 72.
      ["ç".repeat(37), "A senha pode ter no máximo 72 caracteres."],
      [SENHA, "A nova senha precisa ser diferente da atual."],
    ];
    for (const [senhaNova, mensagem] of casos) {
      const resposta = await trocarSenha(navegador, SENHA, senhaNova);
      expect(resposta.status).toBe(400);
      expect(resposta.body.campos).toEqual({ senhaNova: mensagem });
    }
  });
});

describe("limite de tentativas com a senha atual", () => {
  test("depois de 10 senhas erradas, as confirmações param por um tempo", async () => {
    const navegador = await navegadorComConta();
    const outra = await navegadorComConta(outraTutora);

    for (let i = 0; i < 10; i++) {
      await trocarSenha(navegador, `chute-${i}`, "senha-nova-da-bia").expect(
        400,
      );
    }

    // Nem a senha certa passa enquanto dura o bloqueio.
    const certa = await trocarSenha(navegador, SENHA, "senha-nova-da-bia");
    expect(certa.status).toBe(429);
    expect(certa.body.erro).toBe(
      "Muitas tentativas com a senha errada. Espere 15 minutos e tente de novo.",
    );
    expect((await encerrar(navegador, SENHA)).status).toBe(429);

    // Mudar o que não pede senha continua possível.
    await mudarDados(navegador, { telefone: "(31) 3899-1234" }).expect(200);

    // O limite é da conta: as outras não são afetadas.
    await trocarSenha(outra, SENHA, "senha-nova-da-clara").expect(204);
  });

  test("senhas certas não contam para o limite", async () => {
    const navegador = await navegadorComConta();

    for (let i = 0; i < 9; i++) {
      await trocarSenha(navegador, `chute-${i}`, "senha-nova-da-bia").expect(
        400,
      );
    }
    for (const email of ["bia1@example.com", "bia2@example.com"]) {
      await mudarDados(navegador, { email, senhaAtual: SENHA }).expect(200);
    }

    // A 10ª errada ainda é respondida; só a 11ª é barrada.
    await trocarSenha(navegador, "chute-9", "senha-nova-da-bia").expect(400);
    await trocarSenha(navegador, "chute-10", "senha-nova-da-bia").expect(429);
  });
});

describe("encerrar a conta (F5)", () => {
  test("sem a senha certa, a conta continua (NF5.1)", async () => {
    const navegador = await navegadorComConta();

    const semSenha = await navegador.delete("/api/conta");
    expect(semSenha.status).toBe(400);
    expect(semSenha.body.campos).toEqual({
      senhaAtual: "Preencha este campo.",
    });

    const senhaErrada = await encerrar(navegador, "nao-e-a-senha");
    expect(senhaErrada.status).toBe(400);
    expect(senhaErrada.body.campos).toEqual({
      senhaAtual: "Senha incorreta.",
    });

    expect(await banco.usuario.count()).toBe(1);
    expect(await quemEstaLogado(navegador)).not.toBeNull();
  });

  test("com a senha, apaga a conta e o que é só dela, e todos os aparelhos saem", async () => {
    const computadorDoHospital = await navegadorComConta();
    const celular = novoNavegador();
    await entrar(celular, tutora.email, SENHA).expect(200);
    const conta = await banco.usuario.findFirstOrThrow();
    await criarAnimal({ tutorId: conta.id, nome: "Zeus" });

    const resposta = await encerrar(celular, SENHA);

    expect(resposta.status).toBe(204);
    // O cookie do crachá é apagado neste navegador.
    const cookie = resposta.headers["set-cookie"]?.find((c) =>
      c.startsWith(`${NOME_COOKIE}=;`),
    );
    expect(cookie).toBeDefined();

    expect(await banco.usuario.count()).toBe(0);
    expect(await banco.animal.count()).toBe(0);
    expect(await banco.aceite.count()).toBe(0);
    expect(await quemEstaLogado(celular)).toBeNull();
    expect(await quemEstaLogado(computadorDoHospital)).toBeNull();
  });

  test("depois de encerrada, o e-mail e o CPF podem ser usados num cadastro novo", async () => {
    const navegador = await navegadorComConta();
    await encerrar(navegador, SENHA).expect(204);

    await novoNavegador().post("/api/usuarios").send(tutora).expect(201);

    const nova = await banco.usuario.findFirstOrThrow();
    expect(nova.cpfIndice).toBe(indiceCpf(tutora.cpf));
  });

  test("o veterinário sai, mas o que ele assinou no animal de outra pessoa fica (NF5.4)", async () => {
    const hospital = await banco.estabelecimento.create({
      data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
    });
    const { codigo } = await criarConvite({
      nome: "Camila Duarte",
      crmv: "45210",
      ufCrmv: "MG",
      estabelecimentoId: hospital.id,
    });
    const veterinaria = await navegadorComConta({
      ...tutora,
      papel: "VETERINARIO",
      nomeCompleto: "Camila Duarte",
      cpf: gerarCpf("987654321"),
      email: "camila@example.com",
      tratamento: "DRA",
      convite: codigo,
    });
    await navegadorComConta();
    const [camila, beatriz] = await Promise.all([
      banco.usuario.findFirstOrThrow({ where: { papel: "VETERINARIO" } }),
      banco.usuario.findFirstOrThrow({ where: { papel: "TUTOR" } }),
    ]);
    const zeus = await criarAnimal({ tutorId: beatriz.id, nome: "Zeus" });
    await banco.validacao.create({
      data: {
        animalId: zeus.id,
        veterinarioId: camila.id,
        veterinarioNome: "Camila Duarte",
        crmv: "45210",
        ufCrmv: "MG",
        realizadaEm: new Date("2026-09-01"),
        validaAte: new Date("2027-09-01"),
      },
    });

    await encerrar(veterinaria, SENHA).expect(204);

    const validacao = await banco.validacao.findFirstOrThrow();
    expect(validacao.veterinarioId).toBeNull();
    expect(validacao).toMatchObject({
      veterinarioNome: "Camila Duarte",
      crmv: "45210",
    });
    expect(await banco.animal.count()).toBe(1);
    expect(await banco.veterinario.count()).toBe(0);
  });
});
