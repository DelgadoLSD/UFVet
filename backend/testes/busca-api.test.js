import request from "supertest";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { criarApp } from "../src/app.js";
import { banco } from "../src/banco.js";
import {
  hojeISO,
  paraDataDoBanco,
  somarAnos,
  subtrairAnos,
  subtrairDias,
} from "../src/datas.js";
import { criarTutor, gerarCpf, limparBanco } from "./apoio.js";

// A busca de doadores pela API (F16 a F18): pública, só com quem pode doar
// agora, com os filtros, a situação da validação, a ordem e as páginas, e
// sem nenhum contato. Os animais são gravados direto no banco, com o
// histórico escolhido em cada teste. Cada teste cria uma API nova (com os
// limites de tentativas zerados) sobre um banco vazio.

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

const hoje = () => hojeISO();

// Um tutor morando em um lugar.
let pessoas = 0;
async function tutorEm(cidade = "Viçosa - MG", bairro = "Centro") {
  pessoas++;
  const tutor = await criarTutor({
    nome: `Tutor ${pessoas}`,
    email: `tutor${pessoas}@example.com`,
    cpf: gerarCpf(String(100000000 + pessoas)),
  });
  return banco.usuario.update({
    where: { id: tutor.id },
    data: { cidade, bairro },
  });
}

// Um animal de um tutor; por padrão, um cão disponível, sem tipo.
let animais = 0;
function doador(tutor, dados = {}) {
  animais++;
  return banco.animal.create({
    data: {
      codigo: `AN${String(animais).padStart(4, "0")}`,
      tutorId: tutor.id,
      nome: dados.nome ?? `Animal ${animais}`,
      especie: dados.especie ?? "CAO",
      raca: dados.raca === undefined ? "Labrador" : dados.raca,
      sexo: "MACHO",
      castrado: true,
      dataNascimento: paraDataDoBanco(dados.dataNascimento ?? "2021-05-10"),
      nascimentoAproximado: dados.nascimentoAproximado ?? false,
      pesoKg: dados.pesoKg ?? 30,
      tipoSanguineo: dados.tipoSanguineo ?? null,
      disponivel: dados.disponivel ?? true,
    },
  });
}

const CRITERIOS = [
  "TIPAGEM",
  "PESO_IDADE",
  "VACINACAO",
  "SOROLOGIAS",
  "SEM_TRANSFUSAO",
];

// Uma validação assinada, com os critérios em `faltando` não atendidos.
// `invalidada` é a marca do F21 (o tutor mudou o peso depois dela).
function validar(
  animal,
  { realizadaEm = hoje(), faltando = [], invalidada, criadoEm } = {},
) {
  return banco.validacao.create({
    data: {
      animalId: animal.id,
      veterinarioNome: "Dra. Camila Duarte",
      crmv: "45210",
      ufCrmv: "MG",
      realizadaEm: paraDataDoBanco(realizadaEm),
      validaAte: paraDataDoBanco(somarAnos(realizadaEm, 1)),
      invalidadaEm: invalidada ? new Date() : null,
      invalidadaMotivo: invalidada ?? null,
      ...(criadoEm && { criadoEm }),
      criterios: {
        create: CRITERIOS.map((criterio) => ({
          criterio,
          atendido: !faltando.includes(criterio),
        })),
      },
    },
  });
}

const doar = (animal, dataColeta) =>
  banco.doacao.create({
    data: {
      animalId: animal.id,
      estabelecimentoId: hospital.id,
      veterinarioNome: "Dr. Paulo Rezende",
      crmv: "88214",
      ufCrmv: "MG",
      dataColeta: paraDataDoBanco(dataColeta),
      volumeMl: 450,
    },
  });

// Busca como o site busca: os filtros no endereço, com os tipos repetidos
// (tipos=A&tipos=B). Cão, se o teste não disser outra espécie.
function buscar(filtros = {}) {
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries({ especie: "CAO", ...filtros })) {
    for (const item of [valor].flat()) parametros.append(chave, String(item));
  }
  return request(app).get(`/api/doadores?${parametros}`);
}

const nomes = (resposta) => resposta.body.doadores.map((d) => d.nome);

describe("quem aparece na busca", () => {
  test("é pública: sem entrar, o visitante vê os doadores", async () => {
    await doador(await tutorEm(), { nome: "Thor" });
    const resposta = await buscar().expect(200);
    expect(nomes(resposta)).toEqual(["Thor"]);
    expect(resposta.body.total).toBe(1);
  });

  test("o animal que o tutor pausou fica de fora (F11)", async () => {
    const tutor = await tutorEm();
    await doador(tutor, { nome: "Thor" });
    await doador(tutor, { nome: "Max", disponivel: false });
    expect(nomes(await buscar())).toEqual(["Thor"]);
  });

  test("quem doou há menos de 90 dias fica de fora; no 90º dia, volta (F13)", async () => {
    const tutor = await tutorEm();
    await doar(
      await doador(tutor, { nome: "Doou há 10 dias" }),
      subtrairDias(hoje(), 10),
    );
    await doar(
      await doador(tutor, { nome: "Doou há 89 dias" }),
      subtrairDias(hoje(), 89),
    );
    await doar(
      await doador(tutor, { nome: "Doou há 90 dias" }),
      subtrairDias(hoje(), 90),
    );
    await doar(
      await doador(tutor, { nome: "Doou há 2 anos" }),
      subtrairAnos(hoje(), 2),
    );
    await doador(tutor, { nome: "Nunca doou" });

    expect(nomes(await buscar({ ordem: "nome" }))).toEqual([
      "Doou há 2 anos",
      "Doou há 90 dias",
      "Nunca doou",
    ]);
  });

  test("só a espécie pedida", async () => {
    const tutor = await tutorEm();
    await doador(tutor, { nome: "Thor" });
    await doador(tutor, { nome: "Mia", especie: "GATO", pesoKg: 4.2 });
    expect(nomes(await buscar())).toEqual(["Thor"]);
    expect(nomes(await buscar({ especie: "GATO" }))).toEqual(["Mia"]);
  });
});

describe("filtros", () => {
  test("com tipo escolhido, só quem tem a tipagem confirmada e de um dos tipos (F18)", async () => {
    const tutor = await tutorEm();
    await doador(tutor, { nome: "Sem tipo" });
    await doador(tutor, { nome: "Quatro", tipoSanguineo: "DEA 4" });
    await doador(tutor, { nome: "Sete", tipoSanguineo: "DEA 7" });
    await doador(tutor, { nome: "Positivo", tipoSanguineo: "DEA 1.1+" });

    const resposta = await buscar({ tipos: ["DEA 4", "DEA 7"], ordem: "nome" });
    expect(nomes(resposta)).toEqual(["Quatro", "Sete"]);
    expect(nomes(await buscar({ tipos: "DEA 1.1+" }))).toEqual(["Positivo"]);
    // Sem tipo escolhido, todos aparecem, inclusive quem não tem tipagem.
    expect((await buscar()).body.total).toBe(4);
  });

  test("não há filtro de peso: um pesoMax no endereço é ignorado, e ninguém some", async () => {
    const tutor = await tutorEm();
    await doador(tutor, { nome: "Leve", pesoKg: 20 });
    await doador(tutor, { nome: "Pesado", pesoKg: 45.5 });
    expect(nomes(await buscar({ pesoMax: 30, ordem: "nome" }))).toEqual([
      "Leve",
      "Pesado",
    ]);
  });

  test("cidade e bairro são os do tutor, e o bairro depende da cidade (NF16.2)", async () => {
    await doador(await tutorEm("Viçosa - MG", "Centro"), { nome: "Centro" });
    await doador(await tutorEm("Viçosa - MG", "Ramos"), { nome: "Ramos" });
    await doador(await tutorEm("Teixeiras - MG", "Centro"), {
      nome: "Teixeiras",
    });

    expect(
      nomes(await buscar({ cidade: "Viçosa - MG", ordem: "nome" })),
    ).toEqual(["Centro", "Ramos"]);
    expect(
      nomes(await buscar({ cidade: "Viçosa - MG", bairro: "Centro" })),
    ).toEqual(["Centro"]);

    const semCidade = await buscar({ bairro: "Centro" }).expect(400);
    expect(semCidade.body.campos.bairro).toBe(
      "Escolha a cidade antes do bairro.",
    );
  });

  test("o texto procura no nome, na raça, no código e no bairro, sem diferenciar maiúsculas", async () => {
    const ramos = await tutorEm("Viçosa - MG", "Ramos");
    const thor = await doador(ramos, {
      nome: "Thor",
      raca: "Golden Retriever",
    });
    await doador(await tutorEm("Viçosa - MG", "Centro"), {
      nome: "Pipoca",
      raca: null,
    });

    expect(nomes(await buscar({ busca: "THOR" }))).toEqual(["Thor"]);
    expect(nomes(await buscar({ busca: "golden" }))).toEqual(["Thor"]);
    expect(
      nomes(await buscar({ busca: `#${thor.codigo.toLowerCase()}` })),
    ).toEqual(["Thor"]);
    expect(nomes(await buscar({ busca: "ramos" }))).toEqual(["Thor"]);
    // Sem raça definida, o animal aparece como SRD, e a busca acha assim.
    expect(nomes(await buscar({ busca: "srd" }))).toEqual(["Pipoca"]);
    expect(nomes(await buscar({ busca: "ninguém" }))).toEqual([]);
  });
});

describe("validação na busca", () => {
  test("validado é ter uma validação em vigor, no prazo e sem pendências", async () => {
    const tutor = await tutorEm();
    await validar(await doador(tutor, { nome: "Completa" }));
    await validar(await doador(tutor, { nome: "Pendente" }), {
      faltando: ["SOROLOGIAS"],
    });
    await validar(await doador(tutor, { nome: "Vencida" }), {
      realizadaEm: subtrairAnos(hoje(), 2),
    });
    // O tutor mudou o peso depois da validação: peso e idade perderam o
    // efeito (F21).
    await validar(await doador(tutor, { nome: "Peso mudou" }), {
      invalidada: "EDICAO_PESO",
    });
    // A antiga tinha pendência, mas a nova, que a substituiu, não tem.
    const revisada = await doador(tutor, { nome: "Revisada" });
    await validar(revisada, {
      faltando: ["VACINACAO"],
      invalidada: "NOVA_VALIDACAO",
      criadoEm: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    await validar(revisada);
    await doador(tutor, { nome: "Nunca validada" });

    const resposta = await buscar({ ordem: "nome" });
    const validado = Object.fromEntries(
      resposta.body.doadores.map((d) => [d.nome, d.validado]),
    );
    expect(validado).toEqual({
      Completa: true,
      Pendente: false,
      Vencida: false,
      "Peso mudou": false,
      Revisada: true,
      "Nunca validada": false,
    });

    expect(
      nomes(await buscar({ apenasValidados: true, ordem: "nome" })),
    ).toEqual(["Completa", "Revisada"]);
  });
});

describe("ordem e páginas", () => {
  test("validados primeiro (padrão), depois pelo nome; maior peso; nome com acento no lugar certo (F17)", async () => {
    const tutor = await tutorEm();
    await doador(tutor, { nome: "Bidu", pesoKg: 40 });
    await validar(await doador(tutor, { nome: "Zeca", pesoKg: 25 }));
    await validar(await doador(tutor, { nome: "Ágata", pesoKg: 32 }));

    expect(nomes(await buscar())).toEqual(["Ágata", "Zeca", "Bidu"]);
    expect(nomes(await buscar({ ordem: "peso" }))).toEqual([
      "Bidu",
      "Ágata",
      "Zeca",
    ]);
    expect(nomes(await buscar({ ordem: "nome" }))).toEqual([
      "Ágata",
      "Bidu",
      "Zeca",
    ]);
  });

  test("vem de 6 em 6, com o total, sem repetir ninguém entre as páginas (NF16.3)", async () => {
    const tutor = await tutorEm();
    for (let i = 1; i <= 8; i++) await doador(tutor, { nome: `Cão ${i}` });

    const primeira = await buscar({ ordem: "nome" }).expect(200);
    const segunda = await buscar({ ordem: "nome", pagina: 2 }).expect(200);
    expect(primeira.body).toMatchObject({ total: 8, pagina: 1, porPagina: 6 });
    expect(primeira.body.doadores).toHaveLength(6);
    expect(segunda.body.doadores).toHaveLength(2);
    expect(new Set([...nomes(primeira), ...nomes(segunda)]).size).toBe(8);
    expect(nomes(await buscar({ pagina: 3 }))).toEqual([]);
  });
});

describe("o que sai de cada doador", () => {
  test("só o que o cartão mostra: sem contato, sem nome do tutor, sem ids internos", async () => {
    const tutor = await tutorEm("Viçosa - MG", "Ramos");
    const thor = await doador(tutor, {
      nome: "Thor",
      raca: "Golden Retriever",
      dataNascimento: "2022-04-12",
      pesoKg: 32.5,
      tipoSanguineo: "DEA 1.1+",
    });
    await banco.animalFoto.createMany({
      data: [
        { animalId: thor.id, url: "/api/arquivos/segunda.webp", ordem: 1 },
        { animalId: thor.id, url: "/api/arquivos/principal.webp", ordem: 0 },
      ],
    });
    await validar(thor);

    const resposta = await buscar().expect(200);
    expect(resposta.body.doadores[0]).toStrictEqual({
      codigo: thor.codigo,
      nome: "Thor",
      especie: "CAO",
      raca: "Golden Retriever",
      dataNascimento: "2022-04-12",
      nascimentoAproximado: false,
      pesoKg: 32.5,
      tipoSanguineo: "DEA 1.1+",
      validado: true,
      foto: "/api/arquivos/principal.webp",
      cidade: "Viçosa - MG",
      bairro: "Ramos",
      tutorCodigo: tutor.codigo,
    });
    const texto = JSON.stringify(resposta.body);
    expect(texto).not.toContain("@example.com");
    expect(texto).not.toContain(tutor.nomeCompleto);
    expect(texto).not.toContain(thor.id);
  });
});

describe("pedidos com problema", () => {
  test("espécie, tipos de outra espécie e página fora do lugar são recusados com o motivo", async () => {
    const semEspecie = await request(app).get("/api/doadores").expect(400);
    expect(semEspecie.body.campos.especie).toBe("Escolha cão ou gato.");

    const tipoDeGato = await buscar({ tipos: "Tipo A" }).expect(400);
    expect(tipoDeGato.body.campos.tipos).toBe(
      "Escolha tipos da classificação DEA, a dos cães.",
    );

    const paginaZero = await buscar({ pagina: 0 }).expect(400);
    expect(paginaZero.body.campos.pagina).toBe("Página inválida.");
  });

  test("a 61ª busca do mesmo endereço em um minuto é barrada", async () => {
    for (let i = 0; i < 60; i++) await buscar().expect(200);
    const barrada = await buscar().expect(429);
    expect(barrada.body.erro).toBe(
      "Muitas buscas em pouco tempo. Espere um minuto e tente de novo.",
    );
  });

  test("quem está logado tem a própria cota: outra conta e o visitante no mesmo endereço continuam buscando", async () => {
    const entrar = async (n) => {
      const navegador = request.agent(app);
      await navegador
        .post("/api/usuarios")
        .send({
          papel: "TUTOR",
          nomeCompleto: `Pessoa ${n}`,
          cpf: gerarCpf(String(400000000 + n)),
          email: `pessoa${n}@example.com`,
          telefone: "(31) 98871-4402",
          cidade: "Viçosa - MG",
          bairro: "Centro",
          senha: "senha-da-pessoa",
          aceiteTermos: true,
          cienciaResponsabilidade: true,
        })
        .expect(201);
      return navegador;
    };
    const ana = await entrar(1);
    const bruno = await entrar(2);

    for (let i = 0; i < 60; i++) {
      await ana.get("/api/doadores?especie=CAO").expect(200);
    }
    await ana.get("/api/doadores?especie=CAO").expect(429);
    await bruno.get("/api/doadores?especie=CAO").expect(200);
    await buscar().expect(200);
  });
});

describe("cidades e bairros dos filtros", () => {
  test("só onde há doadores da espécie que podem doar agora, cada cidade com os bairros", async () => {
    await doador(await tutorEm("Viçosa - MG", "Ramos"));
    await doador(await tutorEm("Viçosa - MG", "Centro"));
    await doador(await tutorEm("Teixeiras - MG", "Centro"));
    // Pausado, em recuperação ou de outra espécie: o lugar não entra.
    await doador(await tutorEm("Viçosa - MG", "Silvestre"), {
      disponivel: false,
    });
    await doar(
      await doador(await tutorEm("Ubá - MG", "Centro")),
      subtrairDias(hoje(), 5),
    );
    await doador(await tutorEm("Coimbra - MG", "Centro"), {
      especie: "GATO",
      pesoKg: 4,
    });

    const resposta = await request(app)
      .get("/api/doadores/locais?especie=CAO")
      .expect(200);
    expect(resposta.body.cidades).toEqual([
      { nome: "Teixeiras - MG", bairros: ["Centro"] },
      { nome: "Viçosa - MG", bairros: ["Centro", "Ramos"] },
    ]);
  });
});
