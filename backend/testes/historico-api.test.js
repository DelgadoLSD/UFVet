import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import {
  deDataDoBanco,
  hojeISO,
  paraDataDoBanco,
  somarAnos,
  subtrairAnos,
} from "../src/datas.js";
import { criarConvite } from "../src/modelos/convite.js";
import { gerarCpf, limparBanco } from "./apoio.js";

// O histórico clínico de um animal pela API (F19 a F26): a validação dos
// critérios de doação, com o tipo sanguíneo, as doações realizadas e as
// observações sobre a coleta, que só o veterinário escreve, e a perda de
// efeito da validação quando o tutor muda o peso ou o nascimento (F21). Cada
// teste cria uma API nova (com os limites de tentativas zerados) sobre um
// banco vazio.

let app;
let hospital;
beforeEach(async () => {
  await limparBanco();
  app = criarApp();
  hospital = await banco.estabelecimento.create({
    data: { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
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

const veterinaria = {
  ...tutora,
  papel: "VETERINARIO",
  nomeCompleto: "Camila Rocha Duarte",
  cpf: gerarCpf("987654321"),
  email: "camila@example.com",
  tratamento: "DRA",
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

const todosAtendidos = {
  TIPAGEM: true,
  PESO_IDADE: true,
  VACINACAO: true,
  SOROLOGIAS: true,
  SEM_TRANSFUSAO: true,
};

// Um navegador logado: guarda os cookies entre um pedido e outro.
async function navegadorDaTutora() {
  const navegador = request.agent(app);
  const resposta = await navegador.post("/api/usuarios").send(tutora);
  navegador.codigo = resposta.body.usuario.codigo;
  return navegador;
}

// A veterinária entra pelo caminho de verdade: com um convite do hospital.
async function navegadorDaVeterinaria() {
  const { codigo } = await criarConvite({
    nome: "Camila Rocha Duarte",
    crmv: "45210",
    ufCrmv: "MG",
    estabelecimentoId: hospital.id,
  });
  const navegador = request.agent(app);
  await navegador
    .post("/api/usuarios")
    .send({ ...veterinaria, convite: codigo })
    .expect(201);
  return navegador;
}

// A tutora com o Zeus cadastrado, e a veterinária pronta para atender.
async function cenario(animal = zeus) {
  const tutor = await navegadorDaTutora();
  const { body } = await tutor.post("/api/animais").send(animal).expect(201);
  const vet = await navegadorDaVeterinaria();
  return { tutor, vet, codigo: body.animal.codigo };
}

const validar = (navegador, codigo, dados) =>
  navegador.post(`/api/animais/${codigo}/validacoes`).send(dados);

const registrarDoacao = (navegador, codigo, dados) =>
  navegador.post(`/api/animais/${codigo}/doacoes`).send(dados);

const observar = (navegador, codigo, texto) =>
  navegador.post(`/api/animais/${codigo}/observacoes`).send({ texto });

const doacaoDeHoje = () => ({
  dataColeta: hojeISO(),
  volumeMl: 450,
  estabelecimentoId: hospital.id,
});

// "AAAA-MM-DD" de amanhã, no calendário de Brasília.
const amanha = () =>
  deDataDoBanco(
    new Date(paraDataDoBanco(hojeISO()).getTime() + 24 * 60 * 60 * 1000),
  );

describe("validar um animal (F19 e F20)", () => {
  test("a veterinária valida, e a assinatura sai da conta dela, não do pedido", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
      nota: "Exames conferidos no prontuário.",
      // Tentativa de assinar como outra pessoa: o esquema descarta.
      veterinarioNome: "Dr. Falso",
      crmv: "00000",
    });

    expect(resposta.status).toBe(201);
    const { animal } = resposta.body;
    expect(animal.tipoSanguineo).toBe("DEA 1.1+");
    expect(animal.validacoes).toEqual([
      {
        realizadaEm: hojeISO(),
        // Vale por um ano (NF19.3).
        validaAte: somarAnos(hojeISO(), 1),
        veterinarioNome: "Dra. Camila Duarte",
        crmv: "45210-MG",
        criterios: todosAtendidos,
        tipoSanguineoConfirmado: "DEA 1.1+",
        nota: "Exames conferidos no prontuário.",
        invalidacao: null,
      },
    ]);
  });

  test("a conta da veterinária passa a contar a validação assinada", async () => {
    const { vet, codigo } = await cenario();
    await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 4",
    });

    const { body } = await vet.get("/api/sessao");

    expect(body.usuario.veterinario.validacoesRealizadas).toBe(1);
  });

  test("o tutor não valida, nem o próprio animal (NF19.1)", async () => {
    const { tutor, codigo } = await cenario();

    const resposta = await validar(tutor, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });

    expect(resposta.status).toBe(403);
    expect(await banco.validacao.count()).toBe(0);
    const animal = await banco.animal.findFirstOrThrow();
    expect(animal.tipoSanguineo).toBeNull();
  });

  test("quem não entrou na conta não valida", async () => {
    const { codigo } = await cenario();

    const resposta = await validar(request(app), codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });

    expect(resposta.status).toBe(401);
  });

  test("animal que não existe responde 404", async () => {
    const { vet } = await cenario();

    const resposta = await validar(vet, "ZZZZZZ", {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });

    expect(resposta.status).toBe(404);
  });

  test("pode ficar com pendências, com cada critério marcado como foi (NF19.5)", async () => {
    const { vet, codigo } = await cenario();
    const criterios = { ...todosAtendidos, TIPAGEM: false, SOROLOGIAS: false };

    const resposta = await validar(vet, codigo, { criterios });

    expect(resposta.status).toBe(201);
    expect(resposta.body.animal.validacoes[0].criterios).toEqual(criterios);
    expect(resposta.body.animal.tipoSanguineo).toBeNull();
  });

  test("com a tipagem conferida, o tipo do exame é obrigatório (NF20.1)", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await validar(vet, codigo, { criterios: todosAtendidos });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos.tipoSanguineo).toBe(
      "Informe o tipo que o exame de tipagem mostrou.",
    );
    expect(await banco.validacao.count()).toBe(0);
  });

  test("o tipo precisa ser da espécie do animal (NF20.2)", async () => {
    const { vet, codigo } = await cenario();

    const cao = await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "Tipo A",
    });

    expect(cao.status).toBe(400);
    expect(cao.body.campos.tipoSanguineo).toContain("DEA");
    expect(await banco.validacao.count()).toBe(0);
  });

  test("um gato só aceita os tipos A, B e AB (NF20.2)", async () => {
    const { vet, codigo } = await cenario({
      ...zeus,
      nome: "Luna",
      especie: "GATO",
      pesoKg: 4.5,
    });

    const errado = await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });
    const certo = await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "Tipo B",
    });

    expect(errado.status).toBe(400);
    expect(certo.status).toBe(201);
    expect(certo.body.animal.tipoSanguineo).toBe("Tipo B");
  });

  test("sem a tipagem conferida, não vale mandar um tipo", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await validar(vet, codigo, {
      criterios: { ...todosAtendidos, TIPAGEM: false },
      tipoSanguineo: "DEA 1.1+",
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos.tipoSanguineo).toBe(
      "O tipo sanguíneo só vale com a tipagem conferida.",
    );
  });

  test("critério faltando ou fora do formato não passa", async () => {
    const { vet, codigo } = await cenario();
    const { SEM_TRANSFUSAO: _fora, ...quatro } = todosAtendidos;

    const faltando = await validar(vet, codigo, {
      criterios: { ...quatro, TIPAGEM: false },
    });
    const texto = await validar(vet, codigo, {
      criterios: { ...todosAtendidos, TIPAGEM: "sim" },
    });

    expect(faltando.status).toBe(400);
    expect(faltando.body.campos).toHaveProperty("criterios.SEM_TRANSFUSAO");
    expect(texto.status).toBe(400);
    expect(await banco.validacao.count()).toBe(0);
  });

  test("nota longa demais não passa", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await validar(vet, codigo, {
      criterios: { ...todosAtendidos, TIPAGEM: false },
      nota: "a".repeat(501),
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toHaveProperty("nota");
  });

  test("revisar cria uma validação nova; a anterior fica como foi assinada, marcada como substituída (NF19.4)", async () => {
    const { vet, codigo } = await cenario();
    const primeira = { ...todosAtendidos, VACINACAO: false };
    await validar(vet, codigo, {
      criterios: primeira,
      tipoSanguineo: "DEA 1.1+",
    });

    const resposta = await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });

    const { validacoes } = resposta.body.animal;
    expect(validacoes).toHaveLength(2);
    // A mais recente primeiro: é a que vale.
    expect(validacoes[0].criterios).toEqual(todosAtendidos);
    expect(validacoes[0].invalidacao).toBeNull();
    expect(validacoes[1].criterios).toEqual(primeira);
    expect(validacoes[1].invalidacao).toEqual({
      em: expect.any(String),
      motivo: "NOVA_VALIDACAO",
    });
  });

  test("sem a tipagem na revisão, o tipo que o animal já tinha continua", async () => {
    const { vet, codigo } = await cenario();
    await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });

    const resposta = await validar(vet, codigo, {
      criterios: { ...todosAtendidos, TIPAGEM: false },
    });

    expect(resposta.body.animal.tipoSanguineo).toBe("DEA 1.1+");
    expect(
      resposta.body.animal.validacoes[0].tipoSanguineoConfirmado,
    ).toBeNull();
  });

  test("não existe rota para alterar ou apagar uma validação assinada", async () => {
    const { vet, codigo } = await cenario();
    await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });

    const alterar = await vet
      .patch(`/api/animais/${codigo}/validacoes`)
      .send({ criterios: { ...todosAtendidos, VACINACAO: false } });
    const apagar = await vet.delete(`/api/animais/${codigo}/validacoes`);

    expect(alterar.status).toBe(404);
    expect(apagar.status).toBe(404);
    expect(await banco.validacao.count()).toBe(1);
  });

  test("o tutor não grava o tipo sanguíneo pela edição do animal", async () => {
    const { tutor, codigo } = await cenario();

    const resposta = await tutor
      .patch(`/api/animais/${codigo}`)
      .send({ tipoSanguineo: "DEA 4", nome: "Zeus" });

    expect(resposta.status).toBe(200);
    expect(resposta.body.animal.tipoSanguineo).toBeNull();
  });
});

describe("peso ou nascimento mudados depois da validação (F21)", () => {
  async function validado() {
    const dados = await cenario();
    await validar(dados.vet, dados.codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    }).expect(201);
    return dados;
  }

  test("mudar o peso tira o efeito da validação em vigor, com o motivo, sem mudar o que foi assinado", async () => {
    const { tutor, codigo } = await validado();

    const resposta = await tutor
      .patch(`/api/animais/${codigo}`)
      .send({ pesoKg: 30 });

    const [validacao] = resposta.body.animal.validacoes;
    expect(validacao.invalidacao).toEqual({
      em: expect.any(String),
      motivo: "EDICAO_PESO",
    });
    expect(validacao.criterios).toEqual(todosAtendidos);
  });

  test("mudar a data de nascimento também", async () => {
    const { tutor, codigo } = await validado();

    const resposta = await tutor
      .patch(`/api/animais/${codigo}`)
      .send({ dataNascimento: "2021-09-01" });

    expect(resposta.body.animal.validacoes[0].invalidacao.motivo).toBe(
      "EDICAO_NASCIMENTO",
    );
  });

  test("mandar o mesmo peso, ou mudar outro dado, não tira o efeito", async () => {
    const { tutor, codigo } = await validado();

    const resposta = await tutor
      .patch(`/api/animais/${codigo}`)
      .send({ pesoKg: 32, dataNascimento: "2021-08-20", nome: "Zeus Rei" });

    expect(resposta.body.animal.validacoes[0].invalidacao).toBeNull();
  });

  test("uma validação já vencida não é marcada", async () => {
    const { tutor, codigo } = await cenario();
    const animal = await banco.animal.findFirstOrThrow();
    const ha2anos = subtrairAnos(hojeISO(), 2);
    await banco.validacao.create({
      data: {
        animalId: animal.id,
        veterinarioNome: "Dr. Paulo Rezende",
        crmv: "88214",
        ufCrmv: "MG",
        realizadaEm: paraDataDoBanco(ha2anos),
        validaAte: paraDataDoBanco(somarAnos(ha2anos, 1)),
        criterios: {
          create: Object.keys(todosAtendidos).map((criterio) => ({
            criterio,
            atendido: true,
          })),
        },
      },
    });

    const resposta = await tutor
      .patch(`/api/animais/${codigo}`)
      .send({ pesoKg: 30 });

    expect(resposta.body.animal.validacoes[0].invalidacao).toBeNull();
  });
});

describe("registrar uma doação (F24)", () => {
  test("a veterinária registra a coleta, assinada por ela, e ela entra no histórico", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await registrarDoacao(vet, codigo, {
      ...doacaoDeHoje(),
      nota: "Coleta tranquila.",
      veterinarioNome: "Dr. Falso",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.animal.doacoes).toEqual([
      {
        dataColeta: hojeISO(),
        volumeMl: 450,
        estabelecimento: "Hospital Veterinário UFV",
        veterinarioNome: "Dra. Camila Duarte",
        crmv: "45210-MG",
        nota: "Coleta tranquila.",
      },
    ]);
  });

  test("a data não pode ser depois de hoje (NF24.2)", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await registrarDoacao(vet, codigo, {
      ...doacaoDeHoje(),
      dataColeta: amanha(),
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos.dataColeta).toBe(
      "A data da coleta não pode ser depois de hoje.",
    );
    expect(await banco.doacao.count()).toBe(0);
  });

  test("a data não pode ser antes do nascimento do animal", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await registrarDoacao(vet, codigo, {
      ...doacaoDeHoje(),
      dataColeta: "2020-01-10",
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos.dataColeta).toContain("nascimento");
  });

  test("o volume precisa ser um número inteiro de mL, dentro do possível", async () => {
    const { vet, codigo } = await cenario();

    for (const volumeMl of [0, 1001, 450.5, "450"]) {
      const resposta = await registrarDoacao(vet, codigo, {
        ...doacaoDeHoje(),
        volumeMl,
      });
      expect(resposta.status).toBe(400);
      expect(resposta.body.campos).toHaveProperty("volumeMl");
    }
    expect(await banco.doacao.count()).toBe(0);
  });

  test("o local precisa ser um estabelecimento cadastrado", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await registrarDoacao(vet, codigo, {
      ...doacaoDeHoje(),
      estabelecimentoId: "4f7c1b9e-2d3a-4c5b-8e6f-1a2b3c4d5e6f",
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos.estabelecimentoId).toBe(
      "Escolha onde a coleta foi feita.",
    );
  });

  test("o tutor não registra doação (NF24.1)", async () => {
    const { tutor, codigo } = await cenario();

    const resposta = await registrarDoacao(tutor, codigo, doacaoDeHoje());

    expect(resposta.status).toBe(403);
    expect(await banco.doacao.count()).toBe(0);
  });

  test("a lista vem da coleta mais recente para a mais antiga, e o total sai dela (F25 e F26)", async () => {
    const { vet, codigo } = await cenario();
    await registrarDoacao(vet, codigo, {
      ...doacaoDeHoje(),
      dataColeta: "2026-01-15",
    });
    await registrarDoacao(vet, codigo, {
      ...doacaoDeHoje(),
      dataColeta: "2025-06-02",
    });

    const { body } = await request(app).get(
      `/api/usuarios/${(await banco.usuario.findFirstOrThrow({ where: { papel: "TUTOR" } })).codigo}/animais`,
    );

    const { doacoes } = body.animais[0];
    expect(doacoes.map((d) => d.dataColeta)).toEqual([
      "2026-01-15",
      "2025-06-02",
    ]);
    expect(body.animais[0]).not.toHaveProperty("totalDoacoes");
  });
});

describe("observações sobre a coleta (F23)", () => {
  test("a veterinária escreve, com o nome dela e a hora", async () => {
    const { vet, codigo } = await cenario();

    const resposta = await observar(
      vet,
      codigo,
      "  Dócil, coleta tranquila.  ",
    );

    expect(resposta.status).toBe(201);
    expect(resposta.body.animal.observacoes).toEqual([
      {
        criadoEm: expect.any(String),
        autorNome: "Dra. Camila Duarte",
        texto: "Dócil, coleta tranquila.",
      },
    ]);
  });

  test("vazia ou longa demais não passa", async () => {
    const { vet, codigo } = await cenario();

    const vazia = await observar(vet, codigo, "   ");
    const longa = await observar(vet, codigo, "a".repeat(1001));

    expect(vazia.status).toBe(400);
    expect(vazia.body.campos.texto).toBe("Escreva a observação.");
    expect(longa.status).toBe(400);
    expect(await banco.observacao.count()).toBe(0);
  });

  test("o tutor não escreve observação", async () => {
    const { tutor, codigo } = await cenario();

    const resposta = await observar(tutor, codigo, "Ele é calmo.");

    expect(resposta.status).toBe(403);
  });

  test("registros em excesso são barrados: 60 por hora para cada veterinário", async () => {
    const { vet, codigo } = await cenario();
    for (let i = 0; i < 60; i++) {
      await observar(vet, codigo, `Observação ${i}`).expect(201);
    }

    const resposta = await observar(vet, codigo, "Mais uma.");

    expect(resposta.status).toBe(429);
  });
});

describe("estabelecimentos e leitura do histórico", () => {
  test("a lista de estabelecimentos é só para quem entrou na conta", async () => {
    const { vet } = await cenario();

    const visitante = await request(app).get("/api/estabelecimentos");
    const logada = await vet.get("/api/estabelecimentos");

    expect(visitante.status).toBe(401);
    expect(logada.body.estabelecimentos).toEqual([
      {
        id: hospital.id,
        nome: "Hospital Veterinário UFV",
        cidade: "Viçosa",
        uf: "MG",
      },
    ]);
  });

  test("o histórico aparece no perfil público, sem ids internos nem dados da conta de quem assinou", async () => {
    const { tutor, vet, codigo } = await cenario();
    await validar(vet, codigo, {
      criterios: todosAtendidos,
      tipoSanguineo: "DEA 1.1+",
    });
    await registrarDoacao(vet, codigo, doacaoDeHoje());
    await observar(vet, codigo, "Calmo.");

    const { body } = await request(app).get(
      `/api/usuarios/${tutor.codigo}/animais`,
    );

    const [animal] = body.animais;
    expect(Object.keys(animal.validacoes[0]).sort()).toEqual(
      [
        "criterios",
        "crmv",
        "invalidacao",
        "nota",
        "realizadaEm",
        "tipoSanguineoConfirmado",
        "validaAte",
        "veterinarioNome",
      ].sort(),
    );
    expect(Object.keys(animal.doacoes[0]).sort()).toEqual(
      [
        "crmv",
        "dataColeta",
        "estabelecimento",
        "nota",
        "veterinarioNome",
        "volumeMl",
      ].sort(),
    );
    expect(Object.keys(animal.observacoes[0]).sort()).toEqual(
      ["autorNome", "criadoEm", "texto"].sort(),
    );
  });
});
