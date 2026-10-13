import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { criarConvite } from "../src/modelos/convite.js";
import { NOME_COOKIE } from "../src/token.js";
import { limparBanco } from "./apoio.js";

// F1 e F7 pela API: o cadastro de tutor, o de veterinário com convite e o
// aceite dos termos. Cada teste cria uma API nova (com os limites de
// tentativas zerados) sobre um banco vazio.

let app;
beforeEach(async () => {
  await limparBanco();
  app = criarApp();
});
afterAll(() => banco.$disconnect());

const tutora = {
  papel: "TUTOR",
  nomeCompleto: "Beatriz dos Reis",
  email: "beatriz@example.com",
  telefone: "(31) 98871-4402",
  cidade: "Viçosa - MG",
  bairro: "Ramos",
  senha: "senha-da-beatriz",
  aceiteTermos: true,
  cienciaResponsabilidade: true,
};

const cadastrar = (dados) => request(app).post("/api/usuarios").send(dados);

const cookieDaSessao = (resposta) =>
  resposta.headers["set-cookie"]?.find((c) => c.startsWith(`${NOME_COOKIE}=`));

async function criarHospital() {
  return banco.estabelecimento.create({
    data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
  });
}

describe("cadastro de tutor", () => {
  test("cria a conta e já deixa a pessoa logada", async () => {
    const resposta = await cadastrar(tutora);

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario).toMatchObject({
      papel: "TUTOR",
      nomeCompleto: "Beatriz dos Reis",
      email: "beatriz@example.com",
      veterinario: null,
    });
    // Código público de tutor: T e mais cinco letras e números (F6).
    expect(resposta.body.usuario.codigo).toMatch(/^T[2-9A-HJ-NP-Z]{5}$/);

    // O crachá vai num cookie que o JavaScript da página não lê, só volta
    // para a própria API e só para os endereços /api.
    const cookie = cookieDaSessao(resposta);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/api");
  });

  test("não devolve nada interno: senha, índices ou textos cifrados", async () => {
    const resposta = await cadastrar(tutora);

    const texto = JSON.stringify(resposta.body);
    expect(texto).not.toContain("senha");
    expect(texto).not.toContain("Indice");
    expect(texto).not.toContain("Cifrado");
  });

  test("não pede CPF: se um pedido trouxer um, ele é ignorado e não fica guardado", async () => {
    const resposta = await cadastrar({ ...tutora, cpf: "529.982.247-25" });

    expect(resposta.status).toBe(201);
    expect(JSON.stringify(resposta.body)).not.toMatch(
      /cpf|52998224725|529\.982/i,
    );
    // Nem coluna de CPF existe mais: uma, mesmo vazia, apareceria aqui.
    const [linha] = await banco.$queryRaw`select * from usuario`;
    expect(JSON.stringify(linha)).not.toMatch(/cpf|52998224725/i);
  });

  test("guarda a senha como hash bcrypt e registra os dois aceites", async () => {
    await cadastrar(tutora);

    const usuario = await banco.usuario.findFirstOrThrow({
      include: { aceites: true },
    });
    expect(usuario.senhaHash).toMatch(/^\$2[aby]\$/);
    expect(usuario.senhaHash).not.toContain(tutora.senha);
    expect(usuario.aceites.map((a) => a.tipo).sort()).toEqual([
      "CIENCIA_RESPONSABILIDADE",
      "TERMOS_DE_USO",
    ]);
    // A versão é a da página de termos (frontend/src/pages/termos/indice.js).
    expect(usuario.aceites.map((a) => a.versao)).toEqual(["3", "3"]);
  });

  test("arruma o que foi digitado: espaços, maiúsculas e o formato do telefone", async () => {
    const resposta = await cadastrar({
      ...tutora,
      nomeCompleto: "  Beatriz   dos Reis ",
      email: " Beatriz@Example.COM ",
      telefone: "31988714402",
      bairro: " Ramos ",
    });

    expect(resposta.body.usuario).toMatchObject({
      nomeCompleto: "Beatriz dos Reis",
      email: "beatriz@example.com",
      telefone: "(31) 98871-4402",
      bairro: "Ramos",
    });
  });

  test("recusa e-mail já cadastrado e diz qual campo repetiu", async () => {
    await cadastrar(tutora);

    const resposta = await cadastrar({
      ...tutora,
      email: "BEATRIZ@example.com",
    });

    expect(resposta.status).toBe(409);
    expect(resposta.body.campos).toEqual({
      email: "Já existe uma conta com este e-mail.",
    });
    expect(await banco.usuario.count()).toBe(1);
  });

  test("aponta cada campo inválido com a sua mensagem", async () => {
    const resposta = await cadastrar({
      ...tutora,
      nomeCompleto: "Beatriz",
      telefone: "1234",
      cidade: "Viçosa",
      senha: "curta",
      aceiteTermos: false,
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      nomeCompleto: "Informe o nome e o sobrenome.",
      telefone: "Telefone inválido. Use o DDD e o número.",
      cidade: "Escolha a cidade na lista.",
      senha: "A senha precisa ter pelo menos 8 caracteres.",
      aceiteTermos: "É preciso aceitar para criar a conta.",
    });
  });

  test("ignora campos que não fazem parte do cadastro", async () => {
    const resposta = await cadastrar({ ...tutora, codigo: "AAAAAA" });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.codigo).not.toBe("AAAAAA");
  });
});

describe("conferência do e-mail durante o cadastro", () => {
  const conferir = (dados) =>
    request(app).post("/api/usuarios/disponibilidade").send(dados);

  test("e-mail livre não traz nenhum aviso", async () => {
    const resposta = await conferir({ email: tutora.email });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ campos: {} });
  });

  test("aponta o e-mail que já tem conta, mesmo escrito de outro jeito", async () => {
    await cadastrar(tutora);

    const resposta = await conferir({ email: "Beatriz@Example.com " });

    expect(resposta.body.campos).toEqual({
      email: "Já existe uma conta com este e-mail.",
    });
  });

  test("recusa e-mail mal escrito, com a mesma mensagem do cadastro", async () => {
    const resposta = await conferir({ email: "beatriz@" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      email: "E-mail inválido. Confira o endereço.",
    });
  });

  test("sem o e-mail, diz o que falta", async () => {
    const resposta = await conferir({});

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({ email: "Preencha este campo." });
  });

  test("tem limite de conferências, para ninguém testar uma lista de e-mails", async () => {
    for (let i = 0; i < 60; i++) {
      await conferir({ email: `pessoa${i}@example.com` });
    }
    const resposta = await conferir({ email: "mais-uma@example.com" });

    expect(resposta.status).toBe(429);
  });
});

describe("cadastro de veterinário", () => {
  const veterinaria = {
    ...tutora,
    papel: "VETERINARIO",
    nomeCompleto: "Camila Duarte",
    email: "camila@example.com",
    tratamento: "DRA",
  };

  async function convite(dados = {}) {
    const hospital = await criarHospital();
    const { codigo } = await criarConvite({
      nome: "Camila Duarte",
      crmv: "45210",
      ufCrmv: "MG",
      estabelecimentoId: hospital.id,
      ...dados,
    });
    return codigo;
  }

  test("com convite, a conta já vem com o CRMV e o local do convite", async () => {
    const codigo = await convite();

    // O código vale em minúsculas e sem o traço.
    const resposta = await cadastrar({
      ...veterinaria,
      convite: codigo.toLowerCase().replace("-", ""),
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.codigo).toMatch(/^V/);
    expect(resposta.body.usuario.veterinario).toMatchObject({
      crmv: "45210",
      ufCrmv: "MG",
      tratamento: "DRA",
      estabelecimento: { nome: "Hospital Veterinário UFV" },
      validacoesRealizadas: 0,
    });
    const usado = await banco.conviteVeterinario.findFirstOrThrow();
    expect(usado.usadoEm).not.toBeNull();
  });

  test("sem convite, ninguém vira veterinário", async () => {
    const resposta = await cadastrar(veterinaria);

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toHaveProperty("convite");
    expect(await banco.usuario.count()).toBe(0);
  });

  test("um convite só serve uma vez", async () => {
    const codigo = await convite();
    await cadastrar({ ...veterinaria, convite: codigo });

    const segunda = await cadastrar({
      ...veterinaria,
      email: "outra@example.com",
      convite: codigo,
    });

    expect(segunda.status).toBe(400);
    expect(segunda.body.campos.convite).toContain("já usado");
    expect(await banco.usuario.count()).toBe(1);
  });

  test("convite vencido não vale", async () => {
    const codigo = await convite();
    await banco.conviteVeterinario.updateMany({
      data: { expiraEm: new Date(Date.now() - 1000) },
    });

    const resposta = await cadastrar({ ...veterinaria, convite: codigo });

    expect(resposta.status).toBe(400);
    expect(await banco.usuario.count()).toBe(0);
  });

  test("o código do convite não fica guardado no banco, só a impressão digital", async () => {
    const codigo = await convite();

    const [linha] = await banco.$queryRaw`select * from convite_veterinario`;
    expect(JSON.stringify(linha)).not.toContain(codigo.replace("-", ""));
    expect(linha.codigo_indice).toMatch(/^[0-9a-f]{64}$/);
  });

  test("o site pode conferir o convite antes do fim do cadastro", async () => {
    const codigo = await convite();

    const valido = await request(app).get(`/api/convites/${codigo}`);
    const inventado = await request(app).get("/api/convites/ABCD-EFGH");

    expect(valido.status).toBe(200);
    expect(valido.body.convite).toMatchObject({
      nome: "Camila Duarte",
      crmv: "45210",
      ufCrmv: "MG",
      estabelecimento: "Hospital Veterinário UFV",
    });
    expect(inventado.status).toBe(404);
  });
});
