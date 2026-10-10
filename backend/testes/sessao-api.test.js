import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { NOME_COOKIE } from "../src/token.js";
import { gerarCpf, limparBanco } from "./apoio.js";

// F2 pela API: entrar, ver quem está logado, sair e o crachá de sessão.

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

// Um navegador: guarda os cookies entre um pedido e outro.
const novoNavegador = () => request.agent(app);

async function navegadorComConta() {
  const navegador = novoNavegador();
  await navegador.post("/api/usuarios").send(tutora).expect(201);
  return navegador;
}

const entrar = (navegador, email, senha) =>
  navegador.post("/api/sessao").send({ email, senha });

const quemEstaLogado = async (navegador) =>
  (await navegador.get("/api/sessao")).body.usuario;

// Crachá montado à mão, para os testes de crachá adulterado ou vencido.
const assinar = (conteudo, opcoes) =>
  jwt.sign(conteudo, Buffer.from(process.env.JWT_SEGREDO, "base64"), opcoes);

describe("entrar", () => {
  test("com e-mail e senha certos, a pessoa entra", async () => {
    await navegadorComConta();
    const navegador = novoNavegador();

    // O e-mail vale com maiúsculas e espaços.
    const resposta = await entrar(navegador, " BEATRIZ@example.com ", SENHA);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.nomeCompleto).toBe("Beatriz dos Reis");
    expect((await quemEstaLogado(navegador)).email).toBe("beatriz@example.com");
  });

  test("senha errada e e-mail inexistente recebem a mesma resposta", async () => {
    await navegadorComConta();

    const senhaErrada = await entrar(
      novoNavegador(),
      tutora.email,
      "outra-senha",
    );
    const semConta = await entrar(
      novoNavegador(),
      "ninguem@example.com",
      SENHA,
    );

    // Quem tenta descobrir se um e-mail tem conta não descobre (NF2.2).
    expect(senhaErrada.status).toBe(401);
    expect(semConta.status).toBe(401);
    expect(semConta.body).toEqual(senhaErrada.body);
    expect(senhaErrada.headers["set-cookie"]).toBeUndefined();
  });

  test("depois de 20 tentativas erradas, o login fica bloqueado por um tempo", async () => {
    await navegadorComConta();
    const navegador = novoNavegador();

    for (let i = 0; i < 20; i++) {
      await entrar(navegador, tutora.email, "chute-errado").expect(401);
    }
    // Nem a senha certa passa enquanto o bloqueio durar.
    const bloqueado = await entrar(navegador, tutora.email, SENHA);

    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.erro).toContain("Espere 15 minutos");
  });
});

describe("sessão", () => {
  test("sem crachá, ninguém está logado (é o visitante)", async () => {
    const resposta = await request(app).get("/api/sessao");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ usuario: null });
  });

  test("um crachá adulterado não vale", async () => {
    const navegador = await navegadorComConta();
    const { id } = await banco.usuario.findFirstOrThrow();
    // Assinado com outra chave: alguém tentando se passar pela Beatriz.
    const falso = jwt.sign({ emitidoEm: Date.now() }, "chave-inventada", {
      subject: id,
    });

    const resposta = await request(app)
      .get("/api/sessao")
      .set("Cookie", `${NOME_COOKIE}=${falso}`);

    expect(resposta.body.usuario).toBeNull();
    expect(await quemEstaLogado(navegador)).not.toBeNull();
  });

  test("um crachá vencido não vale", async () => {
    await navegadorComConta();
    const { id } = await banco.usuario.findFirstOrThrow();
    const vencido = assinar(
      { emitidoEm: Date.now(), exp: Math.floor(Date.now() / 1000) - 60 },
      { subject: id },
    );

    const resposta = await request(app)
      .get("/api/sessao")
      .set("Cookie", `${NOME_COOKIE}=${vencido}`);

    expect(resposta.body.usuario).toBeNull();
  });

  test("sair apaga o crachá deste navegador", async () => {
    const navegador = await navegadorComConta();

    await navegador.delete("/api/sessao").expect(204);

    expect(await quemEstaLogado(navegador)).toBeNull();
  });

  test("sair de todos os aparelhos derruba os crachás antigos", async () => {
    // A Beatriz entrou no computador do hospital e esqueceu de sair.
    const computadorDoHospital = await navegadorComConta();
    const celular = novoNavegador();
    await entrar(celular, tutora.email, SENHA).expect(200);

    // Do celular, ela sai de todos os aparelhos.
    await celular.delete("/api/sessoes").expect(204);

    expect(await quemEstaLogado(computadorDoHospital)).toBeNull();
    expect(await quemEstaLogado(celular)).toBeNull();

    // Entrando de novo, o crachá novo vale.
    await entrar(celular, tutora.email, SENHA).expect(200);
    expect(await quemEstaLogado(celular)).not.toBeNull();
  });

  test("com a conta encerrada, o crachá deixa de valer", async () => {
    const navegador = await navegadorComConta();

    await banco.usuario.deleteMany();

    expect(await quemEstaLogado(navegador)).toBeNull();
  });

  test("rotas que exigem login recusam quem não entrou", async () => {
    const resposta = await request(app).delete("/api/sessoes");

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe("Entre na sua conta para continuar.");
  });
});

describe("a conta da aba (cabeçalho X-Conta)", () => {
  // Um navegador com a sessão da Beatriz, e o código dela.
  async function comBeatriz() {
    const navegador = await navegadorComConta();
    navegador.codigo = (await quemEstaLogado(navegador)).codigo;
    return navegador;
  }

  test("a aba que mostra a mesma conta do cookie age normalmente", async () => {
    const navegador = await comBeatriz();
    await navegador
      .patch("/api/conta")
      .set("X-Conta", navegador.codigo.toLowerCase())
      .send({ bairro: "Centro" })
      .expect(200);
  });

  test("a aba que mostra outra conta é recusada, e nada muda", async () => {
    const navegador = await comBeatriz();
    const { body } = await navegador
      .patch("/api/conta")
      .set("X-Conta", "V7H4M2")
      .send({ bairro: "Centro" })
      .expect(409);
    expect(body.codigo).toBe("CONTA_TROCADA");
    expect(body.erro).toMatch(/A conta deste navegador mudou/);
    expect((await quemEstaLogado(navegador)).bairro).toBe("Ramos");
  });

  test("sem o cabeçalho, vale só o cookie (testes, programas)", async () => {
    const navegador = await comBeatriz();
    await navegador.patch("/api/conta").send({ bairro: "Centro" }).expect(200);
  });

  test("ver quem está logado não depende da aba: é como ela descobre a conta certa", async () => {
    const navegador = await comBeatriz();
    const { body } = await navegador
      .get("/api/sessao")
      .set("X-Conta", "V7H4M2")
      .expect(200);
    expect(body.usuario.codigo).toBe(navegador.codigo);
  });
});

describe("a API em geral", () => {
  test("responde que está no ar", async () => {
    const resposta = await request(app).get("/api/saude");

    expect(resposta.body).toEqual({ ok: true });
  });

  test("endereço inexistente e dados mal formados viram mensagens claras", async () => {
    const inexistente = await request(app).get("/api/nada");
    const malFormado = await request(app)
      .post("/api/sessao")
      .set("Content-Type", "application/json")
      .send("{ isto não é JSON");

    expect(inexistente.status).toBe(404);
    expect(inexistente.body.erro).toBe("Endereço não encontrado.");
    expect(malFormado.status).toBe(400);
    expect(malFormado.body.erro).toBe("Os dados enviados estão mal formados.");
  });

  test("envia os cabeçalhos de segurança e não se apresenta", async () => {
    const resposta = await request(app).get("/api/saude");

    expect(resposta.headers["x-content-type-options"]).toBe("nosniff");
    expect(resposta.headers["strict-transport-security"]).toBeDefined();
    // Dizer que a API é feita em Express ajudaria quem procura falhas.
    expect(resposta.headers["x-powered-by"]).toBeUndefined();
  });
});
