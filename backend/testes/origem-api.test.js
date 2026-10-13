import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import {
  arquivosGuardados,
  fotoDeCelular,
  gerarCpf,
  limparBanco,
} from "./apoio.js";

// A segunda trava contra CSRF (middlewares/origem.js): um pedido que muda
// alguma coisa e vem de outro site é recusado antes de qualquer efeito. Aqui
// o UFVet atende em "ufvet.test" (o Host do pedido), e o site malicioso é
// "site-malicioso.example". O navegador diz de onde o pedido saiu no
// cabeçalho Origin.

let app;
beforeEach(async () => {
  await limparBanco();
  app = criarApp();
});
afterAll(() => banco.$disconnect());

const SITE = "ufvet.test";
const DO_SITE = { Host: SITE, Origin: `https://${SITE}` };
const DE_FORA = { Host: SITE, Origin: "https://site-malicioso.example" };
const RECUSA =
  "Pedido recusado: ele não saiu do site do UFVet. Abra o UFVet pelo endereço dele e tente de novo.";

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
const zeus = {
  nome: "Zeus",
  especie: "CAO",
  raca: "Golden Retriever",
  sexo: "MACHO",
  castrado: true,
  dataNascimento: "2021-08-20",
  pesoKg: 32,
};

// Um navegador com a conta da Beatriz já aberta, pelo próprio site.
async function navegadorComConta() {
  const navegador = request.agent(app);
  await navegador.post("/api/usuarios").set(DO_SITE).send(tutora).expect(201);
  return navegador;
}

const entrar = (cabecalhos) =>
  request(app)
    .post("/api/sessao")
    .set(cabecalhos)
    .send({ email: tutora.email, senha: SENHA });

describe("pedidos vindos de outro site", () => {
  test("entrar é recusado com a explicação, e ninguém entra", async () => {
    await navegadorComConta();

    const resposta = await entrar(DE_FORA);

    expect(resposta.status).toBe(403);
    expect(resposta.body.erro).toBe(RECUSA);
    expect(resposta.headers["set-cookie"]).toBeUndefined();
  });

  test("encerrar a conta é recusado, e a conta continua", async () => {
    const navegador = await navegadorComConta();

    const resposta = await navegador
      .delete("/api/conta")
      .set(DE_FORA)
      .send({ senhaAtual: SENHA });

    expect(resposta.status).toBe(403);
    expect(await banco.usuario.count()).toBe(1);
  });

  test("cadastrar um animal com foto é recusado, e nenhuma foto é gravada", async () => {
    const navegador = await navegadorComConta();

    const resposta = await navegador
      .post("/api/animais")
      .set(DE_FORA)
      .field("dados", JSON.stringify(zeus))
      .attach("fotos", await fotoDeCelular(), {
        filename: "zeus.jpg",
        contentType: "image/jpeg",
      });

    expect(resposta.status).toBe(403);
    expect(await banco.animal.count()).toBe(0);
    expect(await arquivosGuardados()).toEqual([]);
  });

  test('a origem "null" (página isolada, arquivo local) também é recusada', async () => {
    await navegadorComConta();

    const resposta = await entrar({ Host: SITE, Origin: "null" });

    expect(resposta.status).toBe(403);
  });
});

describe("o uso normal continua", () => {
  test("do próprio site, entrar funciona", async () => {
    await navegadorComConta();

    const resposta = await entrar(DO_SITE);

    expect(resposta.status).toBe(200);
  });

  test("o mesmo site em outra porta passa (o Vite repassa assim no computador)", async () => {
    await navegadorComConta();

    const resposta = await entrar({
      Host: "localhost:3000",
      Origin: "http://localhost:5173",
    });

    expect(resposta.status).toBe(200);
  });

  test("ler não é barrado: a busca responde a qualquer origem", async () => {
    // Ler não muda nada, e o navegador não deixa outro site ver a resposta.
    const resposta = await request(app)
      .get("/api/doadores?especie=CAO")
      .set(DE_FORA);

    expect(resposta.status).toBe(200);
  });

  test("sem Origin (um programa, não um navegador), o pedido passa", async () => {
    await navegadorComConta();

    const resposta = await request(app)
      .post("/api/sessao")
      .send({ email: tutora.email, senha: SENHA });

    expect(resposta.status).toBe(200);
  });
});
