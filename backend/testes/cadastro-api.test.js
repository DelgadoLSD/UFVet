import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { criarConvite } from "../src/modelos/convite.js";
import { NOME_COOKIE } from "../src/token.js";
import { gerarCpf, limparBanco } from "./apoio.js";

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
  cpf: gerarCpf("111444777"),
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
      cpfMascarado: "•••.444.777-••",
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
    expect(texto).not.toContain(tutora.cpf);
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
      cpf: gerarCpf("123456789"),
      email: "BEATRIZ@example.com",
    });

    expect(resposta.status).toBe(409);
    expect(resposta.body.campos).toEqual({
      email: "Já existe uma conta com este e-mail.",
    });
    expect(await banco.usuario.count()).toBe(1);
  });

  test("recusa CPF já cadastrado, mesmo escrito de outro jeito", async () => {
    await cadastrar(tutora);

    const resposta = await cadastrar({
      ...tutora,
      email: "outra@example.com",
      cpf: tutora.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
    });

    expect(resposta.status).toBe(409);
    expect(resposta.body.campos).toHaveProperty("cpf");
  });

  test("aponta cada campo inválido com a sua mensagem", async () => {
    const resposta = await cadastrar({
      ...tutora,
      nomeCompleto: "Beatriz",
      cpf: "123.456.789-00",
      telefone: "1234",
      cidade: "Viçosa",
      senha: "curta",
      aceiteTermos: false,
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      nomeCompleto: "Informe o nome e o sobrenome.",
      cpf: "CPF inválido. Confira os números.",
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

describe("conferência de e-mail e CPF durante o cadastro", () => {
  const conferir = (dados) =>
    request(app).post("/api/usuarios/disponibilidade").send(dados);

  test("e-mail e CPF livres não trazem nenhum aviso", async () => {
    const resposta = await conferir({
      email: tutora.email,
      cpf: tutora.cpf,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ campos: {} });
  });

  test("aponta o e-mail e o CPF que já têm conta, um de cada vez", async () => {
    await cadastrar(tutora);

    const porEmail = await conferir({ email: "Beatriz@Example.com " });
    expect(porEmail.body.campos).toEqual({
      email: "Já existe uma conta com este e-mail.",
    });

    const porCpf = await conferir({
      cpf: tutora.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
    });
    expect(porCpf.body.campos).toEqual({
      cpf: "Já existe uma conta com este CPF.",
    });
  });

  test("recusa dado mal escrito, com a mesma mensagem do cadastro", async () => {
    const resposta = await conferir({ cpf: "123.456.789-00" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      cpf: "CPF inválido. Confira os números.",
    });
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
    cpf: gerarCpf("987654321"),
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
      cpf: gerarCpf("123456789"),
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
