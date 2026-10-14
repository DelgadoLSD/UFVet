import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { aguardarEnvios, caixaDeSaida } from "../src/carteiro.js";
import { criarConvite } from "../src/modelos/convite.js";
import { NOME_COOKIE } from "../src/token.js";
import {
  cadastrarEEntrar,
  codigoDoUltimoEmail,
  criarTutor,
  limparBanco,
} from "./apoio.js";

// A confirmação do e-mail e os outros links que o UFVet manda por e-mail
// (controladores/email.js): sem confirmar, ninguém entra; "Esqueceu a
// senha?"; e a troca de e-mail, que só vale depois de confirmada. Os
// e-mails não saem: ficam na caixa de saída dos testes (carteiro.js).

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
  email: "beatriz@example.com",
  telefone: "(31) 98871-4402",
  cidade: "Viçosa - MG",
  bairro: "Ramos",
  senha: SENHA,
  aceiteTermos: true,
  cienciaResponsabilidade: true,
};

const cadastrar = (dados = tutora) =>
  request(app).post("/api/usuarios").send(dados);
const entrar = (email = tutora.email, senha = SENHA) =>
  request(app).post("/api/sessao").send({ email, senha });
const confirmar = (codigo) =>
  request(app).post("/api/email/confirmacao").send({ codigo });
const reenviar = (email) =>
  request(app).post("/api/email/reenvio").send({ email });
const pedirSenha = (email) =>
  request(app).post("/api/senha/esqueci").send({ email });
const criarSenha = (codigo, senha) =>
  request(app).post("/api/senha/nova").send({ codigo, senha });

const cookieDaSessao = (resposta) =>
  resposta.headers["set-cookie"]?.find((c) => c.startsWith(`${NOME_COOKIE}=`));

const LINK_INVALIDO = "LINK_INVALIDO";

describe("o cadastro só vale com o e-mail confirmado", () => {
  test("cria um cadastro pendente, não entra e manda o link para o e-mail", async () => {
    const resposta = await cadastrar();

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ email: tutora.email, enviado: true });
    expect(cookieDaSessao(resposta)).toBeUndefined();

    const conta = await banco.usuario.findFirstOrThrow();
    expect(conta.emailConfirmadoEm).toBeNull();

    expect(caixaDeSaida).toHaveLength(1);
    const [email] = caixaDeSaida;
    expect(email).toMatchObject({
      tipo: "confirmacao",
      para: tutora.email,
      assunto: "Confirme seu e-mail no UFVet",
    });
    expect(email.texto).toMatch(/^Olá, Beatriz!/);
    expect(email.texto).toMatch(
      /http:\/\/ufvet\.test\/confirmar-email#[A-Za-z0-9_-]{43}/,
    );
  });

  test("o banco guarda só a impressão digital do link, nunca o código", async () => {
    await cadastrar();
    const codigo = await codigoDoUltimoEmail(tutora.email);

    const [linha] = await banco.$queryRaw`select * from link_email`;
    expect(JSON.stringify(linha)).not.toContain(codigo);
    expect(linha.codigo_indice).toMatch(/^[0-9a-f]{64}$/);
    expect(linha.email_cifrado).not.toContain("beatriz");
  });

  test("sem confirmar, a senha certa não entra, e a resposta diz o que fazer", async () => {
    await cadastrar();

    const certa = await entrar();
    expect(certa.status).toBe(403);
    expect(certa.body.codigo).toBe("EMAIL_NAO_CONFIRMADO");
    expect(certa.body.erro).toContain(tutora.email);
    expect(certa.body.erro).toContain("spam");
    expect(cookieDaSessao(certa)).toBeUndefined();

    // Com a senha errada, a resposta é a de sempre: não conta que o
    // cadastro existe e está pendente (NF2.2).
    const errada = await entrar(tutora.email, "senha-errada");
    expect(errada.status).toBe(401);
    expect(errada.body.codigo).toBeUndefined();
  });

  test("abrir o link confirma o e-mail, e aí a pessoa entra", async () => {
    await cadastrar();
    const codigo = await codigoDoUltimoEmail(tutora.email);

    const resposta = await confirmar(codigo);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      email: tutora.email,
      troca: false,
      jaConfirmado: false,
    });
    expect(cookieDaSessao(resposta)).toBeUndefined();
    const conta = await banco.usuario.findFirstOrThrow();
    expect(conta.emailConfirmadoEm).not.toBeNull();
    expect((await entrar()).status).toBe(200);
  });

  test("aberto de novo, o link diz que o e-mail já está confirmado", async () => {
    await cadastrar();
    const codigo = await codigoDoUltimoEmail(tutora.email);
    await confirmar(codigo).expect(200);

    const deNovo = await confirmar(codigo);

    expect(deNovo.status).toBe(200);
    expect(deNovo.body).toMatchObject({ jaConfirmado: true });
  });

  test("link vencido não confirma, e a resposta explica como receber outro", async () => {
    await cadastrar();
    const codigo = await codigoDoUltimoEmail(tutora.email);
    await banco.linkEmail.updateMany({
      data: { expiraEm: new Date(Date.now() - 1000) },
    });

    const resposta = await confirmar(codigo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.codigo).toBe(LINK_INVALIDO);
    expect(resposta.body.erro).toContain("receber outro");
    expect(
      (await banco.usuario.findFirstOrThrow()).emailConfirmadoEm,
    ).toBeNull();
  });

  test("código inventado ou cortado recebe a mesma resposta do vencido", async () => {
    await cadastrar();

    const inventado = await confirmar("A".repeat(43));
    const cortado = await confirmar("Ab3");
    const semCodigo = await request(app)
      .post("/api/email/confirmacao")
      .send({});

    for (const resposta of [inventado, cortado, semCodigo]) {
      expect(resposta.status).toBe(400);
      expect(resposta.body.codigo).toBe(LINK_INVALIDO);
    }
  });

  test("um link novo tira a validade do anterior", async () => {
    await cadastrar();
    const primeiro = await codigoDoUltimoEmail(tutora.email);
    await reenviar(tutora.email).expect(202);
    const segundo = await codigoDoUltimoEmail(tutora.email);

    expect(segundo).not.toBe(primeiro);
    expect((await confirmar(primeiro)).body.codigo).toBe(LINK_INVALIDO);
    expect((await confirmar(segundo)).status).toBe(200);
  });

  test("se o e-mail não sai, o cadastro fica pendente e a resposta avisa", async () => {
    caixaDeSaida.foraDoAr = true;

    const resposta = await cadastrar();

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ email: tutora.email, enviado: false });
    expect(await banco.usuario.count()).toBe(1);
  });
});

describe("mandar o link de novo", () => {
  test("se o e-mail não sai, o reenvio diz que não saiu, em vez de fingir que mandou", async () => {
    await cadastrar();
    caixaDeSaida.foraDoAr = true;

    const resposta = await reenviar(tutora.email);

    expect(resposta.status).toBe(503);
    expect(resposta.body.erro).toBe(
      "Não conseguimos mandar o e-mail agora. Tente de novo daqui a alguns minutos.",
    );
  });

  test("a resposta é a mesma para cadastro pendente, conta confirmada e e-mail sem conta", async () => {
    await cadastrar();
    await criarTutor({ nome: "Pedro Alves", email: "pedro@example.com" });

    const pendente = await reenviar(tutora.email);
    const confirmada = await reenviar("pedro@example.com");
    const semConta = await reenviar("ninguem@example.com");

    for (const resposta of [pendente, confirmada, semConta]) {
      expect(resposta.status).toBe(202);
      expect(resposta.body).toEqual({ ok: true });
    }
    // Só o cadastro pendente recebe o link de novo.
    await aguardarEnvios();
    expect(caixaDeSaida.map((email) => email.para)).toEqual([
      tutora.email,
      tutora.email,
    ]);
  });

  test("um endereço recebe no máximo 5 e-mails por hora, contando o do cadastro", async () => {
    await cadastrar();

    await reenviar(tutora.email).expect(202);
    await reenviar(tutora.email).expect(202);
    // O mesmo endereço escrito de outro jeito conta junto.
    await reenviar("Beatriz@Example.com ").expect(202);
    await pedirSenha(tutora.email).expect(202);
    const sexto = await reenviar(tutora.email);

    expect(sexto.status).toBe(429);
    expect(sexto.body.erro).toContain("spam");
    // Outro endereço não é afetado.
    await reenviar("outra@example.com").expect(202);
  });
});

describe("cadastro pendente não segura nada", () => {
  test("cadastrar de novo com o mesmo e-mail troca o pendente pelo novo", async () => {
    await cadastrar();
    const antigo = await codigoDoUltimoEmail(tutora.email);

    const resposta = await cadastrar({
      ...tutora,
      nomeCompleto: "Beatriz Reis",
    });

    expect(resposta.status).toBe(201);
    const contas = await banco.usuario.findMany();
    expect(contas.map((c) => c.nomeCompleto)).toEqual(["Beatriz Reis"]);
    // O link do cadastro que saiu não vale mais.
    expect((await confirmar(antigo)).body.codigo).toBe(LINK_INVALIDO);
  });

  test("a conferência durante o cadastro não acusa o e-mail de um cadastro pendente", async () => {
    await cadastrar();

    const resposta = await request(app)
      .post("/api/usuarios/disponibilidade")
      .send({ email: tutora.email });

    expect(resposta.body).toEqual({ campos: {} });
  });

  test("uma conta confirmada segura o e-mail", async () => {
    await criarTutor({ nome: "Beatriz dos Reis", email: tutora.email });

    const resposta = await cadastrar();

    expect(resposta.status).toBe(409);
    expect(resposta.body.campos).toEqual({
      email: "Já existe uma conta com este e-mail.",
    });
  });

  test("cadastros pendentes com mais de 7 dias saem no próximo cadastro", async () => {
    await cadastrar();
    await banco.usuario.updateMany({
      data: { criadoEm: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    });

    await cadastrar({
      ...tutora,
      nomeCompleto: "Outra Pessoa",
      email: "outra@example.com",
    }).expect(201);

    const contas = await banco.usuario.findMany();
    expect(contas.map((c) => c.nomeCompleto)).toEqual(["Outra Pessoa"]);
  });

  test("o convite usado por um cadastro pendente vale para o cadastro novo do veterinário", async () => {
    const hospital = await banco.estabelecimento.create({
      data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
    });
    const { codigo } = await criarConvite({
      nome: "Camila Duarte",
      crmv: "45210",
      ufCrmv: "MG",
      estabelecimentoId: hospital.id,
    });
    const veterinaria = {
      ...tutora,
      papel: "VETERINARIO",
      nomeCompleto: "Camila Duarte",
      email: "camila@gmial.com",
      tratamento: "DRA",
      convite: codigo,
    };
    // Digitou o e-mail errado: o cadastro ficou pendente, com o convite.
    await cadastrar(veterinaria).expect(201);

    // O site confere o convite antes do fim do cadastro novo.
    const consulta = await request(app).get(`/api/convites/${codigo}`);
    expect(consulta.status).toBe(200);

    const certo = await cadastrar({
      ...veterinaria,
      email: "camila@gmail.com",
    });

    expect(certo.status).toBe(201);
    const contas = await banco.usuario.findMany({
      include: { veterinario: true, convitesUsados: true },
    });
    expect(contas).toHaveLength(1);
    expect(contas[0].veterinario.crmv).toBe("45210");
    expect(contas[0].convitesUsados).toHaveLength(1);
  });

  test("um cadastro pendente não aparece para ninguém", async () => {
    const hospital = await banco.estabelecimento.create({
      data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
    });
    const { codigo } = await criarConvite({
      nome: "Camila Duarte",
      crmv: "45210",
      ufCrmv: "MG",
      estabelecimentoId: hospital.id,
    });
    await cadastrar({
      ...tutora,
      papel: "VETERINARIO",
      email: "camila@example.com",
      tratamento: "DRA",
      convite: codigo,
    }).expect(201);
    const pendente = await banco.usuario.findFirstOrThrow();

    const navegador = request.agent(app);
    await cadastrarEEntrar(navegador, tutora);

    const perfil = await navegador.get(`/api/usuarios/${pendente.codigo}`);
    const lista = await navegador.get(
      `/api/estabelecimentos/${hospital.id}/veterinarios`,
    );

    expect(perfil.status).toBe(404);
    expect(lista.body.veterinarios).toEqual([]);
  });
});

describe("esqueceu a senha", () => {
  test("manda o link a quem tem conta, e responde igual a quem não tem", async () => {
    await criarTutor({ nome: "Beatriz dos Reis", email: tutora.email });

    const comConta = await pedirSenha(tutora.email);
    const semConta = await pedirSenha("ninguem@example.com");

    expect(comConta.status).toBe(202);
    expect(semConta.status).toBe(202);
    expect(comConta.body).toEqual(semConta.body);
    await aguardarEnvios();
    expect(caixaDeSaida).toHaveLength(1);
    expect(caixaDeSaida[0]).toMatchObject({
      tipo: "senha",
      para: tutora.email,
      assunto: "Crie uma senha nova no UFVet",
    });
    expect(caixaDeSaida[0].texto).toMatch(
      /http:\/\/ufvet\.test\/nova-senha#[A-Za-z0-9_-]{43}/,
    );
  });

  test("o link cria a senha nova, tira a conta de todos os aparelhos e a senha antiga para de valer", async () => {
    const celular = request.agent(app);
    await cadastrarEEntrar(celular, tutora);
    await pedirSenha(tutora.email).expect(202);
    const codigo = await codigoDoUltimoEmail(tutora.email, "senha");

    const resposta = await criarSenha(codigo, "uma-senha-nova");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ email: tutora.email });
    expect((await celular.get("/api/sessao")).body.usuario).toBeNull();
    expect((await entrar(tutora.email, SENHA)).status).toBe(401);
    expect((await entrar(tutora.email, "uma-senha-nova")).status).toBe(200);
  });

  test("o link vale uma vez só e por 1 hora", async () => {
    await criarTutor({ nome: "Beatriz dos Reis", email: tutora.email });
    await pedirSenha(tutora.email).expect(202);
    const codigo = await codigoDoUltimoEmail(tutora.email, "senha");
    await criarSenha(codigo, "uma-senha-nova").expect(200);

    const deNovo = await criarSenha(codigo, "outra-senha-nova");
    expect(deNovo.status).toBe(400);
    expect(deNovo.body.codigo).toBe(LINK_INVALIDO);

    await pedirSenha(tutora.email).expect(202);
    const outro = await codigoDoUltimoEmail(tutora.email, "senha");
    const link = await banco.linkEmail.findFirstOrThrow({
      where: { usadoEm: null },
    });
    expect(link.expiraEm - link.criadoEm).toBe(60 * 60 * 1000);
    await banco.linkEmail.update({
      where: { id: link.id },
      data: { expiraEm: new Date(Date.now() - 1000) },
    });
    expect((await criarSenha(outro, "outra-senha-nova")).body.codigo).toBe(
      LINK_INVALIDO,
    );
  });

  test("senha nova curta é recusada no campo, e o link continua valendo", async () => {
    await criarTutor({ nome: "Beatriz dos Reis", email: tutora.email });
    await pedirSenha(tutora.email).expect(202);
    const codigo = await codigoDoUltimoEmail(tutora.email, "senha");

    const curta = await criarSenha(codigo, "curta");

    expect(curta.status).toBe(400);
    expect(curta.body.campos).toEqual({
      senha: "A senha precisa ter pelo menos 8 caracteres.",
    });
    expect((await criarSenha(codigo, "uma-senha-nova")).status).toBe(200);
  });

  test("abrir o link de senha nova também confirma um cadastro pendente", async () => {
    await cadastrar();
    await pedirSenha(tutora.email).expect(202);
    const codigo = await codigoDoUltimoEmail(tutora.email, "senha");

    await criarSenha(codigo, "uma-senha-nova").expect(200);

    expect((await entrar(tutora.email, "uma-senha-nova")).status).toBe(200);
  });

  test("um link não serve para o outro: o de confirmar não cria senha, e o de senha não confirma", async () => {
    await cadastrar();
    const deConfirmar = await codigoDoUltimoEmail(tutora.email, "confirmacao");
    await pedirSenha(tutora.email).expect(202);
    const deSenha = await codigoDoUltimoEmail(tutora.email, "senha");

    expect((await criarSenha(deConfirmar, "uma-senha-nova")).body.codigo).toBe(
      LINK_INVALIDO,
    );
    expect((await confirmar(deSenha)).body.codigo).toBe(LINK_INVALIDO);
  });
});

describe("trocar o e-mail", () => {
  const NOVO = "beatriz.nova@example.com";
  const trocar = (navegador, email = NOVO) =>
    navegador.patch("/api/conta").send({ email, senhaAtual: SENHA });

  test("manda o link para o e-mail novo, e nada muda antes da confirmação", async () => {
    const navegador = request.agent(app);
    await cadastrarEEntrar(navegador, tutora);

    const resposta = await trocar(navegador);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toMatchObject({
      email: tutora.email,
      emailNovo: NOVO,
    });
    await aguardarEnvios();
    expect(caixaDeSaida.at(-1)).toMatchObject({
      tipo: "troca",
      para: NOVO,
      assunto: "Confirme seu novo e-mail no UFVet",
    });
    expect((await entrar(tutora.email)).status).toBe(200);
  });

  test("abrir o link faz a troca: depois, entra com o novo e não com o antigo", async () => {
    const navegador = request.agent(app);
    await cadastrarEEntrar(navegador, tutora);
    await trocar(navegador).expect(200);
    const codigo = await codigoDoUltimoEmail(NOVO, "troca");

    const resposta = await confirmar(codigo);

    expect(resposta.body).toEqual({
      email: NOVO,
      troca: true,
      jaConfirmado: false,
    });
    const { usuario } = (await navegador.get("/api/sessao")).body;
    expect(usuario).toMatchObject({ email: NOVO, emailNovo: null });
    expect((await entrar(NOVO)).status).toBe(200);
    expect((await entrar(tutora.email)).status).toBe(401);
  });

  test("se o e-mail novo virou de outra conta antes da confirmação, a troca é recusada", async () => {
    const navegador = request.agent(app);
    await cadastrarEEntrar(navegador, tutora);
    await trocar(navegador).expect(200);
    const codigo = await codigoDoUltimoEmail(NOVO, "troca");
    await criarTutor({ nome: "Outra Pessoa", email: NOVO });

    const resposta = await confirmar(codigo);

    expect(resposta.status).toBe(409);
    expect((await navegador.get("/api/sessao")).body.usuario.email).toBe(
      tutora.email,
    );
  });

  test("um cadastro pendente com o e-mail novo não impede a troca", async () => {
    await cadastrar({
      ...tutora,
      nomeCompleto: "Alguém Pendente",
      email: NOVO,
    });
    const navegador = request.agent(app);
    await cadastrarEEntrar(navegador, tutora);

    await trocar(navegador).expect(200);
    await confirmar(await codigoDoUltimoEmail(NOVO, "troca")).expect(200);

    const contas = await banco.usuario.findMany();
    expect(contas.map((c) => c.nomeCompleto)).toEqual(["Beatriz dos Reis"]);
  });
});
