import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import { hojeISO, subtrairAnos } from "../src/datas.js";
import { gerarCpf, limparBanco } from "./apoio.js";

// F8 a F11 pela API: cadastrar, ver, editar, excluir e mudar a
// disponibilidade de um animal. Cada teste cria uma API nova (com os limites
// de tentativas zerados) sobre um banco vazio.

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

const outroTutor = {
  ...tutora,
  nomeCompleto: "Caio Ferreira",
  cpf: gerarCpf("222555888"),
  email: "caio@example.com",
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

// Zeus sem a data de nascimento, para informar a idade de outro jeito.
const { dataNascimento: _nascimento, ...zeusSemData } = zeus;

// Um navegador logado: guarda os cookies entre um pedido e outro.
async function navegadorComConta(dados = tutora) {
  const navegador = request.agent(app);
  const resposta = await navegador.post("/api/usuarios").send(dados);
  navegador.codigo = resposta.body.usuario.codigo;
  return navegador;
}

const cadastrar = (navegador, animal) =>
  navegador.post("/api/animais").send(animal);

async function comZeus() {
  const navegador = await navegadorComConta();
  const { body } = await cadastrar(navegador, zeus).expect(201);
  return { navegador, codigo: body.animal.codigo };
}

const animaisDe = (codigoTutor) =>
  request(app).get(`/api/usuarios/${codigoTutor}/animais`);

describe("cadastrar um animal (F8)", () => {
  test("cadastra para quem está logado e devolve o animal com o código público", async () => {
    const navegador = await navegadorComConta();

    const resposta = await cadastrar(navegador, zeus);

    expect(resposta.status).toBe(201);
    expect(resposta.body.animal).toEqual({
      codigo: expect.stringMatching(/^[2-9A-HJ-NP-Z]{6}$/),
      nome: "Zeus",
      especie: "CAO",
      raca: "Golden Retriever",
      sexo: "MACHO",
      castrado: true,
      dataNascimento: "2021-08-20",
      nascimentoAproximado: false,
      pesoKg: 32,
      tipoSanguineo: null,
      // Já nasce disponível para doação.
      disponivel: true,
      // Sem fotos enviadas, a lista vem vazia.
      fotos: [],
      criadoEm: expect.any(String),
    });
    const dono = await banco.usuario.findFirstOrThrow();
    const animal = await banco.animal.findFirstOrThrow();
    expect(animal.tutorId).toBe(dono.id);
  });

  test("sem entrar, ninguém cadastra", async () => {
    const resposta = await request(app).post("/api/animais").send(zeus);

    expect(resposta.status).toBe(401);
    expect(await banco.animal.count()).toBe(0);
  });

  test("arruma o que foi digitado: espaços, raça vazia vira SRD e peso com vírgula", async () => {
    const navegador = await navegadorComConta();

    const { body } = await cadastrar(navegador, {
      ...zeus,
      nome: "  Zeus   Junior ",
      raca: "   ",
      pesoKg: "4,567",
    }).expect(201);

    expect(body.animal).toMatchObject({
      nome: "Zeus Junior",
      raca: null,
      pesoKg: 4.57,
    });
  });

  test("a idade aproximada vira a data equivalente, marcada como aproximada (NF8.2)", async () => {
    const navegador = await navegadorComConta();

    const { body } = await cadastrar(navegador, {
      ...zeusSemData,
      idadeAproximada: 5,
    }).expect(201);

    expect(body.animal.dataNascimento).toBe(subtrairAnos(hojeISO(), 5));
    expect(body.animal.nascimentoAproximado).toBe(true);
  });

  test("a data sem hora é guardada no dia certo, sem escorregar pelo fuso", async () => {
    const navegador = await navegadorComConta();

    await cadastrar(navegador, {
      ...zeus,
      dataNascimento: "2024-01-01",
    }).expect(201);

    const [{ nascimento }] = await banco.$queryRaw`
      select to_char(data_nascimento, 'YYYY-MM-DD') as nascimento from animal`;
    expect(nascimento).toBe("2024-01-01");
  });

  test("o tipo sanguíneo, o dono e o código não vêm do pedido (NF8.1)", async () => {
    const outro = await navegadorComConta(outroTutor);
    const navegador = await navegadorComConta();
    const outroDono = await banco.usuario.findFirstOrThrow({
      where: { codigo: outro.codigo },
    });

    const { body } = await cadastrar(navegador, {
      ...zeus,
      tipoSanguineo: "DEA 1.1+",
      tutorId: outroDono.id,
      codigo: "AAAAAA",
      disponivel: false,
    }).expect(201);

    expect(body.animal.tipoSanguineo).toBeNull();
    expect(body.animal.codigo).not.toBe("AAAAAA");
    expect(body.animal.disponivel).toBe(true);
    const animal = await banco.animal.findFirstOrThrow();
    expect(animal.tutorId).not.toBe(outroDono.id);
  });

  test("aponta cada campo inválido com a sua mensagem", async () => {
    const navegador = await navegadorComConta();

    const resposta = await cadastrar(navegador, {
      nome: "",
      especie: "PASSARO",
      raca: "x".repeat(61),
      sexo: "",
      castrado: "sim",
      pesoKg: 0,
      dataNascimento: "2026-02-30",
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      nome: "Preencha este campo.",
      especie: "Escolha cão ou gato.",
      raca: "A raça pode ter no máximo 60 caracteres.",
      sexo: "Escolha macho ou fêmea.",
      castrado: "Responda se é castrado.",
      pesoKg: "Informe o peso em kg.",
      dataNascimento: "Informe uma data válida.",
    });
    expect(await banco.animal.count()).toBe(0);
  });

  test("recusa nascimento no futuro, idade fora do possível e peso impossível", async () => {
    const navegador = await navegadorComConta();
    const amanha = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const casos = [
      [
        { ...zeus, dataNascimento: amanha },
        "dataNascimento",
        "A data de nascimento não pode ser depois de hoje.",
      ],
      [
        { ...zeus, dataNascimento: "1980-01-01" },
        "dataNascimento",
        "Confira a data: mais de 30 anos atrás.",
      ],
      [
        { ...zeusSemData, idadeAproximada: 31 },
        "idadeAproximada",
        "Informe a idade em anos, de 0 a 30.",
      ],
      [
        { ...zeusSemData, idadeAproximada: 2.5 },
        "idadeAproximada",
        "Informe a idade em anos, de 0 a 30.",
      ],
      [{ ...zeus, pesoKg: 320 }, "pesoKg", "Confira o peso: mais de 150 kg."],
    ];
    for (const [animal, campo, mensagem] of casos) {
      const resposta = await cadastrar(navegador, animal);
      expect(resposta.status).toBe(400);
      expect(resposta.body.campos[campo]).toBe(mensagem);
    }
  });

  test("a idade vem de um jeito só: a data ou a idade aproximada", async () => {
    const navegador = await navegadorComConta();
    const mensagem = "Informe a data de nascimento ou a idade aproximada.";

    const nenhum = await cadastrar(navegador, zeusSemData);
    const osDois = await cadastrar(navegador, { ...zeus, idadeAproximada: 3 });

    expect(nenhum.body.campos).toEqual({ dataNascimento: mensagem });
    expect(osDois.body.campos).toEqual({ dataNascimento: mensagem });
    expect(await banco.animal.count()).toBe(0);
  });

  test("depois de 30 cadastros na mesma hora, a conta precisa esperar", async () => {
    const navegador = await navegadorComConta();
    const outro = await navegadorComConta(outroTutor);

    for (let i = 0; i < 30; i++) {
      await cadastrar(navegador, { ...zeus, nome: `Cão ${i}` }).expect(201);
    }
    const resposta = await cadastrar(navegador, zeus);

    expect(resposta.status).toBe(429);
    // O limite é da conta: as outras não são afetadas.
    await cadastrar(outro, zeus).expect(201);
  });
});

describe("ver os animais de uma pessoa", () => {
  test("qualquer um vê, mesmo sem entrar, do primeiro cadastrado ao último", async () => {
    const navegador = await navegadorComConta();
    await cadastrar(navegador, zeus).expect(201);
    await cadastrar(navegador, {
      ...zeus,
      nome: "Luna",
      especie: "GATO",
      raca: "",
      sexo: "FEMEA",
      pesoKg: 4.5,
    }).expect(201);

    // O código vale em minúsculas.
    const resposta = await animaisDe(navegador.codigo.toLowerCase());

    expect(resposta.status).toBe(200);
    expect(resposta.body.animais.map((a) => a.nome)).toEqual(["Zeus", "Luna"]);
  });

  test("não devolve nada interno: ids, dono ou a validação da tipagem", async () => {
    const { navegador } = await comZeus();

    const resposta = await animaisDe(navegador.codigo);

    const texto = JSON.stringify(resposta.body);
    expect(texto).not.toMatch(/"id"|tutorId|tipagemValidacaoId/);
  });

  test("pessoa que não existe", async () => {
    const resposta = await animaisDe("TZZZZZ");

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe("Pessoa não encontrada.");
  });
});

describe("editar um animal (F9) e mudar a disponibilidade (F11)", () => {
  test("muda só o que veio", async () => {
    const { navegador, codigo } = await comZeus();

    const resposta = await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ pesoKg: 33.5, raca: "" });

    expect(resposta.status).toBe(200);
    expect(resposta.body.animal).toMatchObject({
      nome: "Zeus",
      pesoKg: 33.5,
      raca: null,
      dataNascimento: "2021-08-20",
    });
  });

  test("o tutor tira o animal da busca e devolve depois", async () => {
    const { navegador, codigo } = await comZeus();

    const fora = await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ disponivel: false });
    const devolta = await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ disponivel: true });

    expect(fora.body.animal.disponivel).toBe(false);
    expect(devolta.body.animal.disponivel).toBe(true);
  });

  test("trocar a data exata por uma idade aproximada, e de volta", async () => {
    const { navegador, codigo } = await comZeus();

    const aproximada = await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ idadeAproximada: 4 });
    expect(aproximada.body.animal).toMatchObject({
      dataNascimento: subtrairAnos(hojeISO(), 4),
      nascimentoAproximado: true,
    });

    const exata = await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ dataNascimento: "2022-03-15" });
    expect(exata.body.animal).toMatchObject({
      dataNascimento: "2022-03-15",
      nascimentoAproximado: false,
    });
  });

  test("ninguém mexe no animal de outra pessoa, e nem fica sabendo se ele existe", async () => {
    const { codigo } = await comZeus();
    const outro = await navegadorComConta(outroTutor);

    const alheio = await outro
      .patch(`/api/animais/${codigo}`)
      .send({ nome: "Roubado", disponivel: false });
    const inexistente = await outro
      .patch("/api/animais/ZZZZZZ")
      .send({ nome: "Roubado" });

    expect(alheio.status).toBe(404);
    expect(alheio.body).toEqual(inexistente.body);
    const animal = await banco.animal.findFirstOrThrow();
    expect(animal.nome).toBe("Zeus");
    expect(animal.disponivel).toBe(true);
  });

  test("sem entrar, ninguém edita", async () => {
    const { codigo } = await comZeus();

    const resposta = await request(app)
      .patch(`/api/animais/${codigo}`)
      .send({ nome: "Outro" });

    expect(resposta.status).toBe(401);
  });

  test("o tipo sanguíneo não muda por aqui, e a espécie trava depois da tipagem", async () => {
    const { navegador, codigo } = await comZeus();

    // O tutor não preenche o tipo, nem editando (NF8.1).
    await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ tipoSanguineo: "DEA 1.1+" })
      .expect(200);
    expect((await banco.animal.findFirstOrThrow()).tipoSanguineo).toBeNull();

    // Antes da tipagem, a espécie ainda pode ser corrigida.
    await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ especie: "GATO" })
      .expect(200);

    // Confirmada a tipagem (o que, na etapa da validação, só o veterinário
    // faz), a espécie fica fixa.
    await banco.animal.updateMany({ data: { tipoSanguineo: "Tipo A" } });
    const resposta = await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ especie: "CAO" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      especie: "A espécie não muda depois da tipagem confirmada.",
    });
  });

  test("não aceita a data e a idade aproximada ao mesmo tempo", async () => {
    const { navegador, codigo } = await comZeus();

    const resposta = await navegador
      .patch(`/api/animais/${codigo}`)
      .send({ dataNascimento: "2022-03-15", idadeAproximada: 3 });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toEqual({
      dataNascimento:
        "Informe só um: a data de nascimento ou a idade aproximada.",
    });
  });
});

describe("excluir um animal (F10)", () => {
  test("apaga o animal e o que foi registrado sobre ele", async () => {
    const { navegador, codigo } = await comZeus();
    const animal = await banco.animal.findFirstOrThrow();
    await banco.observacao.create({
      data: {
        animalId: animal.id,
        autorNome: "Dr. Paulo Rezende",
        texto: "Calmo durante a coleta.",
      },
    });

    const resposta = await navegador.delete(`/api/animais/${codigo}`);

    expect(resposta.status).toBe(204);
    expect(await banco.animal.count()).toBe(0);
    expect(await banco.observacao.count()).toBe(0);
    expect((await animaisDe(navegador.codigo)).body.animais).toEqual([]);
  });

  test("ninguém exclui o animal de outra pessoa", async () => {
    const { codigo } = await comZeus();
    const outro = await navegadorComConta(outroTutor);

    const resposta = await outro.delete(`/api/animais/${codigo}`);

    expect(resposta.status).toBe(404);
    expect(await banco.animal.count()).toBe(1);
  });
});
