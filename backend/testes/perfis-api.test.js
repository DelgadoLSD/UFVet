import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { paraDataDoBanco } from "../src/datas.js";
import { criarConvite } from "../src/modelos/convite.js";
import {
  criarTutor,
  criarVeterinario,
  gerarCpf,
  limparBanco,
} from "./apoio.js";

// O perfil de outra pessoa pela API: os dados públicos, que qualquer um vê
// (a busca é aberta, NF16.4), e o contato, que só quem tem acesso vê (F33):
// a própria pessoa, o veterinário e o tutor com uma liberação em vigor. Cada
// teste cria uma API nova (com os limites zerados) sobre um banco vazio.

let app;
let hospital;
let pedro;
let paulo;
beforeEach(async () => {
  await limparBanco();
  app = criarApp();
  hospital = await banco.estabelecimento.create({
    data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
  });
  // O dono do perfil visitado nos testes.
  pedro = await criarTutor({
    nome: "Pedro Alves",
    email: "pedro@example.com",
    cpf: gerarCpf("222333444"),
    telefone: "(31) 98123-4567",
  });
  // O veterinário que dá as liberações nos testes de contato.
  paulo = await criarVeterinario({
    nome: "Paulo Rezende",
    email: "paulo@example.com",
    cpf: gerarCpf("333444555"),
    crmv: "88214",
    estabelecimentoId: hospital.id,
  });
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

// Um navegador logado, que guarda o cookie da sessão.
async function navegadorDaTutora() {
  const navegador = request.agent(app);
  const resposta = await navegador.post("/api/usuarios").send(tutora);
  navegador.codigo = resposta.body.usuario.codigo;
  navegador.conta = await banco.usuario.findUnique({
    where: { codigo: navegador.codigo },
  });
  return navegador;
}

async function navegadorDaVeterinaria() {
  const { codigo } = await criarConvite({
    nome: "Camila Rocha Duarte",
    crmv: "45210",
    ufCrmv: "MG",
    estabelecimentoId: hospital.id,
  });
  const navegador = request.agent(app);
  const resposta = await navegador
    .post("/api/usuarios")
    .send({
      ...tutora,
      papel: "VETERINARIO",
      nomeCompleto: "Camila Rocha Duarte",
      cpf: gerarCpf("987654321"),
      email: "camila@example.com",
      tratamento: "DRA",
      convite: codigo,
    })
    .expect(201);
  navegador.codigo = resposta.body.usuario.codigo;
  return navegador;
}

// Uma liberação de contato dada a um tutor pelo Paulo, com a validade
// escolhida.
const liberar = (tutor, { expiraEm, encerradaEm = null }) =>
  banco.liberacaoContato.create({
    data: {
      tutorId: tutor.id,
      veterinarioId: paulo.id,
      duracaoHoras: 24,
      expiraEm,
      encerradaEm,
    },
  });

const HORA = 60 * 60 * 1000;

describe("perfil público", () => {
  test("qualquer um vê, sem e-mail, telefone ou CPF", async () => {
    const resposta = await request(app)
      .get(`/api/usuarios/${pedro.codigo}`)
      .expect(200);
    expect(resposta.body.usuario).toStrictEqual({
      codigo: pedro.codigo,
      papel: "TUTOR",
      nomeCompleto: "Pedro Alves",
      cidade: "Viçosa - MG",
      bairro: "Centro",
      fotoUrl: null,
      membroDesde: pedro.criadoEm.toISOString(),
      veterinario: null,
    });
    const texto = JSON.stringify(resposta.body);
    expect(texto).not.toContain("pedro@example.com");
    expect(texto).not.toContain("98123");
    expect(texto).not.toContain(pedro.id);
  });

  test("o veterinário mostra o registro, o local e as validações que assinou, sem ids internos", async () => {
    const victor = await criarVeterinario({
      nome: "Victor Hugo Martins",
      email: "victor@example.com",
      cpf: gerarCpf("555666777"),
      crmv: "78120",
      estabelecimentoId: hospital.id,
    });
    const animal = await banco.animal.create({
      data: {
        codigo: "ZEUS22",
        tutorId: pedro.id,
        nome: "Zeus",
        especie: "CAO",
        sexo: "MACHO",
        castrado: true,
        dataNascimento: paraDataDoBanco("2021-08-20"),
        pesoKg: 32,
      },
    });
    for (const dia of ["2026-01-10", "2026-06-10"]) {
      await banco.validacao.create({
        data: {
          animalId: animal.id,
          veterinarioId: victor.id,
          veterinarioNome: "Dr. Victor Martins",
          crmv: "78120",
          ufCrmv: "MG",
          realizadaEm: paraDataDoBanco(dia),
          validaAte: paraDataDoBanco("2027-01-10"),
        },
      });
    }

    const resposta = await request(app)
      .get(`/api/usuarios/${victor.codigo}`)
      .expect(200);
    expect(resposta.body.usuario.veterinario).toStrictEqual({
      crmv: "78120",
      ufCrmv: "MG",
      tratamento: "DR",
      estabelecimento: { nome: "Hospital Veterinário UFV" },
      validacoesRealizadas: 2,
    });
    expect(JSON.stringify(resposta.body)).not.toContain(hospital.id);
  });

  test("o código em minúsculas também acha; um código que não existe é 404", async () => {
    await request(app)
      .get(`/api/usuarios/${pedro.codigo.toLowerCase()}`)
      .expect(200);
    const resposta = await request(app).get("/api/usuarios/TZZZZZ").expect(404);
    expect(resposta.body.erro).toBe("Pessoa não encontrada.");
  });

  test("o 61º perfil aberto do mesmo endereço em um minuto é barrado", async () => {
    for (let i = 0; i < 60; i++) {
      await request(app).get(`/api/usuarios/${pedro.codigo}`).expect(200);
    }
    const barrado = await request(app)
      .get(`/api/usuarios/${pedro.codigo}`)
      .expect(429);
    expect(barrado.body.erro).toBe(
      "Muitos perfis abertos em pouco tempo. Espere um minuto e tente de novo.",
    );
  });
});

describe("contato", () => {
  const contatoDoPedro = (navegador) =>
    navegador.get(`/api/usuarios/${pedro.codigo}/contato`);

  test("o visitante sem conta precisa entrar", async () => {
    await contatoDoPedro(request(app)).expect(401);
  });

  test("o tutor sem liberação recebe o motivo e o que fazer", async () => {
    const resposta = await contatoDoPedro(await navegadorDaTutora()).expect(
      403,
    );
    expect(resposta.body.erro).toBe(
      "O contato aparece quando um veterinário libera o seu acesso. Peça a liberação a quem acompanha o seu caso.",
    );
    expect(JSON.stringify(resposta.body)).not.toContain("pedro@example.com");
  });

  test("o tutor com uma liberação em vigor vê o contato, que não fica em cache", async () => {
    const beatriz = await navegadorDaTutora();
    await liberar(beatriz.conta, { expiraEm: new Date(Date.now() + HORA) });

    const resposta = await contatoDoPedro(beatriz).expect(200);
    expect(resposta.body).toStrictEqual({
      contato: { email: "pedro@example.com", telefone: "(31) 98123-4567" },
    });
    expect(resposta.headers["cache-control"]).toBe("no-store");
  });

  test("liberação vencida ou encerrada pelo veterinário não vale mais", async () => {
    const beatriz = await navegadorDaTutora();
    await liberar(beatriz.conta, { expiraEm: new Date(Date.now() - HORA) });
    await contatoDoPedro(beatriz).expect(403);

    await liberar(beatriz.conta, {
      expiraEm: new Date(Date.now() + HORA),
      encerradaEm: new Date(),
    });
    await contatoDoPedro(beatriz).expect(403);
  });

  test("a liberação de outro tutor não serve", async () => {
    const beatriz = await navegadorDaTutora();
    await liberar(pedro, { expiraEm: new Date(Date.now() + HORA) });
    await contatoDoPedro(beatriz).expect(403);
  });

  test("o veterinário vê sempre", async () => {
    const resposta = await contatoDoPedro(
      await navegadorDaVeterinaria(),
    ).expect(200);
    expect(resposta.body.contato.email).toBe("pedro@example.com");
  });

  test("a própria pessoa vê o próprio contato", async () => {
    const beatriz = await navegadorDaTutora();
    const resposta = await beatriz
      .get(`/api/usuarios/${beatriz.codigo}/contato`)
      .expect(200);
    expect(resposta.body.contato.email).toBe("beatriz@example.com");
  });

  test("um código que não existe é 404", async () => {
    await (
      await navegadorDaVeterinaria()
    )
      .get("/api/usuarios/TZZZZZ/contato")
      .expect(404);
  });
});
