import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { guardarExame, guardarImagem } from "../src/armazenamento.js";
import { banco } from "../src/banco.js";
import { cifrar, indiceCpf, indiceEmail } from "../src/cifra.js";
import { paraDataDoBanco, somarAnos } from "../src/datas.js";
import { prepararFoto, prepararImagemDeExame } from "../src/imagens.js";
import { assinaturaDe } from "../src/modelos/usuario.js";
import { gerarHashSenha } from "../src/senha.js";

// Contas e animais de exemplo, para desenvolver e demonstrar o site: as
// pessoas, os animais delas (com fotos e exames), o histórico clínico e os
// pedidos e liberações de contato. Entrando com essas contas, a busca tem
// doadores de verdade para mostrar, e cada tela tem o que exibir.
//
// Roda com `npm run db:exemplos`, depois de `npm run db:seed`, e pode rodar
// de novo sem duplicar: só cria o que falta (uma conta, um animal, as fotos
// ou os exames deles). Nunca roda em produção: a senha está escrita aqui e é pública. Os
// CPFs são os dos dados de exemplo, que de propósito não passam na conta dos
// dígitos verificadores; assim não pertencem a ninguém.

const SENHA_DE_EXEMPLO = "ufvet-exemplo";
const VERSAO_DOS_TERMOS = "1";

// As fotos e os exames de exemplo são imagens do próprio site.
const PASTA_IMAGENS = new URL("../../frontend/src/assets/", import.meta.url);

const CONTAS = [
  {
    codigo: "V7H4M2",
    papel: "VETERINARIO",
    nomeCompleto: "Victor Hugo Martins",
    email: "victor@example.com",
    cpf: "08451233670",
    telefone: "(31) 99204-7715",
    cidade: "Viçosa - MG",
    bairro: "Centro",
    veterinario: { crmv: "78120", ufCrmv: "MG", tratamento: "DR" },
    // O rosto fica no alto do quadro e a foto foi tirada de longe: o
    // recorte aproxima, como o site fazia com os dados de exemplo.
    retrato: {
      arquivo: "people/man1_0-image.jpg",
      alturaDoRosto: 0.28,
      zoom: 1.7,
    },
  },
  // O segundo veterinário, do mesmo hospital: foi ele quem liberou a
  // Camila. Com duas contas de veterinário dá para ver que cada um cuida só
  // das liberações que deu, e que quem já tem acesso não recebe outro. Fica
  // sem foto, como o Pedro e a Camila.
  {
    codigo: "V9P3R7",
    papel: "VETERINARIO",
    nomeCompleto: "Paulo Rezende",
    email: "paulo@example.com",
    cpf: "50361284917",
    telefone: "(31) 99630-2214",
    cidade: "Viçosa - MG",
    bairro: "Clélia Bernardes",
    veterinario: { crmv: "88214", ufCrmv: "MG", tratamento: "DR" },
  },
  {
    codigo: "T3M8P1",
    papel: "TUTOR",
    nomeCompleto: "Beatriz dos Reis",
    email: "beatriz@example.com",
    cpf: "12944780655",
    telefone: "(31) 98871-4402",
    cidade: "Viçosa - MG",
    bairro: "Ramos",
    retrato: { arquivo: "people/women1_0-image.jpg", alturaDoRosto: 0.55 },
  },
  // Os outros tutores dos dados de exemplo, donos dos doadores que a busca
  // mostra. Pedro e Camila ficam sem foto, para a tela sem retrato também
  // aparecer.
  {
    codigo: "T7X9K2",
    papel: "TUTOR",
    nomeCompleto: "Lucas Silva Delgado",
    email: "lucas@example.com",
    cpf: "31452087611",
    telefone: "(31) 99715-2280",
    cidade: "Viçosa - MG",
    bairro: "Silvestre",
    retrato: { arquivo: "people/man2_0-image.jpg", alturaDoRosto: 0.25 },
  },
  {
    codigo: "T5K2W7",
    papel: "TUTOR",
    nomeCompleto: "Pedro Alves",
    email: "pedro@example.com",
    cpf: "27183918222",
    telefone: "(31) 98123-4567",
    cidade: "Viçosa - MG",
    bairro: "Belvedere",
  },
  {
    codigo: "T5W2K6",
    papel: "TUTOR",
    nomeCompleto: "Camila Nunes",
    email: "camila.nunes@example.com",
    cpf: "16180339833",
    telefone: "(31) 99452-1873",
    cidade: "Teixeiras - MG",
    bairro: "Centro",
  },
];

// Os animais das contas acima, com os dados, os códigos e as fotos. O tipo
// sanguíneo não vem aqui: só uma validação assinada pode preenchê-lo (NF8.1),
// e ele sai do histórico abaixo.
const ANIMAIS = [
  {
    tutor: "T3M8P1",
    codigo: "Z7R2K4",
    nome: "Zeus",
    especie: "CAO",
    raca: "Golden Retriever",
    sexo: "MACHO",
    castrado: true,
    dataNascimento: "2021-08-20",
    pesoKg: 32,
    disponivel: true,
    fotos: [
      "dogs/dog1_0-image.jpg",
      "dogs/dog1_1-image.jpg",
      "dogs/dog1_2-image.jpg",
    ],
  },
  {
    tutor: "T3M8P1",
    codigo: "L4N8C1",
    nome: "Luna",
    especie: "GATO",
    raca: null,
    sexo: "FEMEA",
    castrado: true,
    dataNascimento: "2024-06-10",
    pesoKg: 4.5,
    disponivel: false,
    fotos: ["cats/cat1_0-image.jpg"],
  },
  {
    tutor: "V7H4M2",
    codigo: "B3L6D9",
    nome: "Bela",
    especie: "CAO",
    raca: "Labrador",
    sexo: "FEMEA",
    castrado: true,
    dataNascimento: "2023-05-10",
    pesoKg: 28,
    disponivel: true,
    fotos: ["dogs/dogs7_0-image.jpg"],
  },
  {
    tutor: "V7H4M2",
    codigo: "N9P2F5",
    nome: "Nina",
    especie: "GATO",
    raca: "Persa",
    sexo: "FEMEA",
    castrado: false,
    dataNascimento: "2022-02-14",
    pesoKg: 3.8,
    disponivel: false,
    fotos: ["cats/cat7_0-image.jpg"],
  },
  // Mais doadores, para a busca ter o que mostrar. Max fica pausado, para a
  // busca mostrar que ele sai dela; Bolt e Pipoca ficam sem foto.
  ...[
    [
      "T7X9K2",
      "H4R8T2",
      "Thor",
      "CAO",
      "Golden Retriever",
      "MACHO",
      true,
      "2022-04-12",
      32,
      true,
      ["dogs/dog2_0-image.jpg"],
    ],
    [
      "T7X9K2",
      "F6J3R9",
      "Frajola",
      "GATO",
      null,
      "MACHO",
      true,
      "2021-11-03",
      4.5,
      true,
      ["cats/cat5_0-image.jpg"],
    ],
    [
      "T7X9K2",
      "B7Q2M5",
      "Bolt",
      "CAO",
      "Dálmata",
      "MACHO",
      false,
      "2023-01-09",
      30,
      true,
      [],
    ],
    [
      "T5K2W7",
      "M5X3B8",
      "Max",
      "CAO",
      "Beagle",
      "MACHO",
      true,
      "2020-06-21",
      16,
      false,
      ["dogs/dog4_0-image.jpg"],
    ],
    [
      "T5K2W7",
      "B9R4N6",
      "Barão",
      "CAO",
      "Bernese",
      "MACHO",
      true,
      "2021-03-02",
      45,
      true,
      ["dogs/dog5_0-image.jpg"],
    ],
    [
      "T5K2W7",
      "G3Z7M2",
      "Gizmo",
      "GATO",
      null,
      "MACHO",
      true,
      "2022-09-15",
      5.3,
      true,
      ["cats/cat4_0-image.jpg"],
    ],
    [
      "T5K2W7",
      "D8Q4K7",
      "Duque",
      "CAO",
      "Rottweiler",
      "MACHO",
      true,
      "2020-11-20",
      41,
      true,
      ["dogs/dog3_0-image.jpg"],
    ],
    [
      "T5W2K6",
      "R2X6P9",
      "Rex",
      "CAO",
      "Pastor Alemão",
      "MACHO",
      true,
      "2021-07-30",
      38,
      true,
      ["dogs/dog6_0-image.jpg"],
    ],
    [
      "T5W2K6",
      "S6M9B3",
      "Simba",
      "GATO",
      "Maine Coon",
      "MACHO",
      true,
      "2022-05-05",
      6.1,
      true,
      ["cats/cat2_0-image.jpg"],
    ],
    [
      "T5W2K6",
      "A4M7R2",
      "Amora",
      "GATO",
      "Siamês",
      "FEMEA",
      true,
      "2023-03-12",
      3.9,
      true,
      ["cats/cat6_0-image.jpg"],
    ],
    [
      "T5W2K6",
      "P3C8K5",
      "Pipoca",
      "CAO",
      null,
      "FEMEA",
      true,
      "2022-08-08",
      26,
      true,
      [],
    ],
  ].map(
    ([
      tutor,
      codigo,
      nome,
      especie,
      raca,
      sexo,
      castrado,
      dataNascimento,
      pesoKg,
      disponivel,
      fotos,
    ]) => ({
      tutor,
      codigo,
      nome,
      especie,
      raca,
      sexo,
      castrado,
      dataNascimento,
      pesoKg,
      disponivel,
      fotos,
    }),
  ),
];

// ─── Histórico clínico de exemplo ──────────────────────────────────────────────

// Os veterinários que assinam o histórico de exemplo. Paulo e Camila não têm
// conta: como no banco de verdade, a assinatura fica copiada no registro e
// continua legível sem a conta de quem assinou. Victor tem conta, então assina
// como a API assina pela conta dele ("Dr. Victor Martins").
const PAULO = { nome: "Dr. Paulo Rezende", crmv: "88214", ufCrmv: "MG" };
const CAMILA = { nome: "Dra. Camila Duarte", crmv: "45210", ufCrmv: "MG" };
const VICTOR = assinaturaDe(CONTAS.find((conta) => conta.codigo === "V7H4M2"));

const TODOS_ATENDIDOS = {
  TIPAGEM: true,
  PESO_IDADE: true,
  VACINACAO: true,
  SOROLOGIAS: true,
  SEM_TRANSFUSAO: true,
};

// O histórico de exemplo, pelo código do animal.
// Validações da mais antiga para a mais recente: cada uma substitui a
// anterior. Os casos cobrem o que as telas precisam mostrar: validação
// vencida e substituída (Zeus), nunca validado (Luna), validado (Bela) e com
// pendências (Nina).
const HISTORICO = {
  Z7R2K4: {
    tipoSanguineo: "DEA 1.1+",
    validacoes: [
      {
        realizadaEm: "2024-07-15",
        veterinario: CAMILA,
        criterios: { ...TODOS_ATENDIDOS, VACINACAO: false },
        nota: "Vacina antirrábica vencida. Renovar antes da próxima coleta.",
      },
      {
        realizadaEm: "2025-08-10",
        veterinario: PAULO,
        criterios: TODOS_ATENDIDOS,
      },
    ],
    doacoes: [
      {
        dataColeta: "2026-09-05",
        volumeMl: 450,
        veterinario: PAULO,
        nota: "Coleta tranquila, sem necessidade de sedação.",
      },
      { dataColeta: "2026-03-10", volumeMl: 450, veterinario: CAMILA },
      { dataColeta: "2025-10-22", volumeMl: 420, veterinario: PAULO },
      { dataColeta: "2025-06-18", volumeMl: 450, veterinario: PAULO },
      { dataColeta: "2025-02-02", volumeMl: 430, veterinario: CAMILA },
      {
        dataColeta: "2023-10-15",
        volumeMl: 400,
        veterinario: PAULO,
        nota: "Primeira doação. Agitado no início, depois se acalmou.",
      },
    ],
    observacoes: [
      {
        criadoEm: "2023-10-15T09:30:00-03:00",
        autor: PAULO,
        texto:
          "Primeira doação. Ficou um pouco agitado no início, mas logo se acalmou.",
      },
      {
        criadoEm: "2025-10-22T16:40:00-03:00",
        autor: PAULO,
        texto: "Fica mais calmo com a presença da tutora durante a coleta.",
      },
      {
        criadoEm: "2026-03-10T10:05:00-03:00",
        autor: CAMILA,
        texto:
          "Acesso venoso fácil pela jugular; procedimento levou cerca de 10 minutos.",
      },
      {
        criadoEm: "2026-09-05T14:20:00-03:00",
        autor: PAULO,
        texto:
          "Dócil e muito colaborativo. Coleta tranquila, sem necessidade de sedação.",
      },
    ],
  },
  B3L6D9: {
    tipoSanguineo: "DEA 1.1-",
    validacoes: [
      {
        realizadaEm: "2026-08-20",
        veterinario: CAMILA,
        criterios: TODOS_ATENDIDOS,
      },
    ],
    doacoes: [
      {
        dataColeta: "2026-06-10",
        volumeMl: 440,
        veterinario: CAMILA,
        nota: "Bastante tranquila; já doou três vezes sem intercorrências.",
      },
      { dataColeta: "2025-12-28", volumeMl: 440, veterinario: VICTOR },
      { dataColeta: "2025-08-14", volumeMl: 430, veterinario: VICTOR },
    ],
    observacoes: [
      {
        criadoEm: "2026-06-10T11:10:00-03:00",
        autor: CAMILA,
        texto:
          "Bastante tranquila durante a coleta; já doou 3 vezes sem intercorrências.",
      },
    ],
  },
  N9P2F5: {
    tipoSanguineo: "Tipo B",
    validacoes: [
      {
        realizadaEm: "2026-09-05",
        veterinario: CAMILA,
        criterios: {
          ...TODOS_ATENDIDOS,
          PESO_IDADE: false,
          SOROLOGIAS: false,
        },
        nota: "Peso abaixo do mínimo para gatas doadoras e sorologia de FeLV/FIV ainda não apresentada.",
      },
    ],
    doacoes: [],
    observacoes: [
      {
        criadoEm: "2026-09-05T15:40:00-03:00",
        autor: CAMILA,
        texto:
          "Receosa no manuseio; recomenda-se ambiente silencioso e contenção leve.",
      },
    ],
  },
  // Os doadores validados da busca: uma validação completa cada, dentro do
  // prazo, e algumas doações antigas, de mais de 90 dias, para eles estarem
  // fora da recuperação e aparecerem.
  ...Object.fromEntries(
    [
      ["H4R8T2", "DEA 1.1+", "2026-07-22", CAMILA, ["2026-02-14", PAULO]],
      ["F6J3R9", "Tipo A", "2026-08-30", PAULO],
      [
        "B9R4N6",
        "DEA 1.1 Universal",
        "2026-04-18",
        CAMILA,
        ["2026-05-02", CAMILA],
      ],
      ["G3Z7M2", "Tipo A", "2026-06-12", PAULO],
      ["D8Q4K7", "DEA 4", "2026-03-05", CAMILA],
      ["R2X6P9", "DEA 1.1-", "2026-09-01", CAMILA],
      ["S6M9B3", "Tipo B", "2026-05-20", CAMILA],
    ].map(([codigo, tipoSanguineo, realizadaEm, veterinario, doacao]) => [
      codigo,
      {
        tipoSanguineo,
        validacoes: [{ realizadaEm, veterinario, criterios: TODOS_ATENDIDOS }],
        doacoes: doacao
          ? [{ dataColeta: doacao[0], volumeMl: 450, veterinario: doacao[1] }]
          : [],
        observacoes: [],
      },
    ]),
  ),
};

// Grava o histórico de exemplo de um animal, parte por parte: só cria o que
// ainda não existe, para poder rodar de novo sem duplicar.
async function criarHistorico(animal, hospital) {
  const historico = HISTORICO[animal.codigo];
  if (!historico) return;
  const contar = (tabela) =>
    banco[tabela].count({ where: { animalId: animal.id } });

  if (historico.validacoes.length && (await contar("validacao")) === 0) {
    let anterior = null;
    for (const v of historico.validacoes) {
      // Cada validação nova tira o efeito da anterior (NOVA_VALIDACAO), na
      // data em que foi feita.
      if (anterior) {
        await banco.validacao.update({
          where: { id: anterior.id },
          data: {
            invalidadaEm: new Date(`${v.realizadaEm}T12:00:00-03:00`),
            invalidadaMotivo: "NOVA_VALIDACAO",
          },
        });
      }
      anterior = await banco.validacao.create({
        data: {
          animalId: animal.id,
          veterinarioNome: v.veterinario.nome,
          crmv: v.veterinario.crmv,
          ufCrmv: v.veterinario.ufCrmv,
          realizadaEm: paraDataDoBanco(v.realizadaEm),
          validaAte: paraDataDoBanco(somarAnos(v.realizadaEm, 1)),
          tipoSanguineoConfirmado: v.criterios.TIPAGEM
            ? historico.tipoSanguineo
            : null,
          nota: v.nota ?? null,
          criadoEm: new Date(`${v.realizadaEm}T12:00:00-03:00`),
          criterios: {
            create: Object.entries(v.criterios).map(([criterio, atendido]) => ({
              criterio,
              atendido,
            })),
          },
        },
      });
    }
    // O tipo do animal é o da validação mais recente que conferiu a tipagem.
    const tipagem = await banco.validacao.findFirst({
      where: { animalId: animal.id, tipoSanguineoConfirmado: { not: null } },
      orderBy: { criadoEm: "desc" },
    });
    if (tipagem) {
      await banco.animal.update({
        where: { id: animal.id },
        data: {
          tipoSanguineo: tipagem.tipoSanguineoConfirmado,
          tipagemValidacaoId: tipagem.id,
        },
      });
    }
    console.log(`  com ${historico.validacoes.length} validação(ões)`);
  }

  if (historico.doacoes.length && (await contar("doacao")) === 0) {
    for (const d of historico.doacoes) {
      await banco.doacao.create({
        data: {
          animalId: animal.id,
          estabelecimentoId: hospital.id,
          veterinarioNome: d.veterinario.nome,
          crmv: d.veterinario.crmv,
          ufCrmv: d.veterinario.ufCrmv,
          dataColeta: paraDataDoBanco(d.dataColeta),
          volumeMl: d.volumeMl,
          nota: d.nota ?? null,
        },
      });
    }
    console.log(`  com ${historico.doacoes.length} doação(ões)`);
  }

  if (historico.observacoes.length && (await contar("observacao")) === 0) {
    for (const o of historico.observacoes) {
      await banco.observacao.create({
        data: {
          animalId: animal.id,
          autorNome: o.autor.nome,
          texto: o.texto,
          criadoEm: new Date(o.criadoEm),
        },
      });
    }
    console.log(`  com ${historico.observacoes.length} observação(ões)`);
  }
}

// ─── Exames de exemplo ─────────────────────────────────────────────────────────

// Os exames de exemplo, pelo código do animal: de cada tipo, os dias em que
// cada versão foi enviada, da primeira à última. Quem envia é o dono do
// animal, como na tela. O Zeus tem um hemograma refeito, para a janela do
// exame mostrar as duas versões.
const DOCUMENTOS = {
  Z7R2K4: {
    HEMOGRAMA: ["2025-10-10", "2026-03-02"],
    VACINACAO: ["2025-10-10"],
  },
  L4N8C1: { SOROLOGIA: ["2026-03-01"] },
  B3L6D9: {
    HEMOGRAMA: ["2026-08-20"],
    SOROLOGIA: ["2026-08-20"],
    VACINACAO: ["2026-08-20"],
  },
  N9P2F5: { HEMOGRAMA: ["2026-08-28"], VACINACAO: ["2026-09-05"] },
};

// A imagem de cada tipo de exame.
const IMAGEM_DO_DOCUMENTO = {
  HEMOGRAMA: "documents/hemograma.png",
  SOROLOGIA: "documents/sorologia.png",
  VACINACAO: "documents/carteira_vacinacao.jpg",
};

// Grava os exames de exemplo de um animal, se ele ainda não tem nenhum. Cada
// imagem passa pelo mesmo tratamento de um exame enviado pela tela, e cada
// versão ganha o próprio arquivo.
async function criarDocumentos(animal) {
  const documentos = DOCUMENTOS[animal.codigo];
  if (!documentos) return;
  const enviados = await banco.documentoVersao.count({
    where: { documento: { animalId: animal.id } },
  });
  if (enviados > 0) return;

  const dono = await banco.usuario.findUnique({
    where: { id: animal.tutorId },
    select: { id: true, nomeCompleto: true },
  });
  let total = 0;
  for (const [tipo, dias] of Object.entries(documentos)) {
    const imagem = await prepararImagemDeExame(
      await readFile(new URL(IMAGEM_DO_DOCUMENTO[tipo], PASTA_IMAGENS)),
      "arquivo",
    );
    const versoes = [];
    for (const dia of dias) {
      versoes.push({
        arquivoUrl: await guardarExame(imagem, "webp"),
        enviadoPorId: dono.id,
        enviadoPorNome: dono.nomeCompleto,
        enviadoEm: new Date(`${dia}T10:00:00-03:00`),
      });
    }
    await banco.documento.create({
      data: { animalId: animal.id, tipo, versoes: { create: versoes } },
    });
    total += dias.length;
  }
  console.log(`  com ${total} exame(s)`);
}

// Um quadrado em volta do rosto, com a altura do rosto no quadro (de 0, o
// topo, a 1, a base) e o quanto aproximar.
async function recortarRetrato(conteudo, { alturaDoRosto, zoom = 1 }) {
  const { width, height } = await sharp(conteudo).metadata();
  const quadrado = Math.min(width, height);
  const lado = Math.round(quadrado / zoom);
  const esquerda = Math.round((width - lado) / 2);
  const topo = Math.round(
    (height - quadrado) * alturaDoRosto + (quadrado - lado) * alturaDoRosto,
  );
  return sharp(conteudo)
    .extract({ left: esquerda, top: topo, width: lado, height: lado })
    .jpeg({ quality: 95 })
    .toBuffer();
}

// Envia uma imagem do site como se fosse uma foto enviada pela tela: passa
// pelo mesmo tratamento (imagens.js) e vai para o mesmo armazenamento.
async function enviarImagem(arquivo, recorte) {
  let conteudo = await readFile(new URL(arquivo, PASTA_IMAGENS));
  if (recorte) conteudo = await recortarRetrato(conteudo, recorte);
  return guardarImagem(await prepararFoto(conteudo, "foto"));
}

async function criarContas(hospital) {
  const senhaHash = await gerarHashSenha(SENHA_DE_EXEMPLO);
  for (const { retrato, ...conta } of CONTAS) {
    let usuario = await banco.usuario.findUnique({
      where: { codigo: conta.codigo },
    });
    if (usuario) {
      console.log(`Já existia: ${conta.nomeCompleto} (${conta.email})`);
    } else {
      usuario = await banco.usuario.create({
        data: {
          codigo: conta.codigo,
          papel: conta.papel,
          nomeCompleto: conta.nomeCompleto,
          cpfCifrado: cifrar(conta.cpf),
          cpfIndice: indiceCpf(conta.cpf),
          emailCifrado: cifrar(conta.email),
          emailIndice: indiceEmail(conta.email),
          telefoneCifrado: cifrar(conta.telefone),
          senhaHash,
          cidade: conta.cidade,
          bairro: conta.bairro,
          aceites: {
            create: [
              { tipo: "TERMOS_DE_USO", versao: VERSAO_DOS_TERMOS },
              { tipo: "CIENCIA_RESPONSABILIDADE", versao: VERSAO_DOS_TERMOS },
            ],
          },
          veterinario: conta.veterinario
            ? {
                create: {
                  ...conta.veterinario,
                  estabelecimentoId: hospital.id,
                },
              }
            : undefined,
        },
      });
      console.log(`Criada: ${conta.nomeCompleto} (${conta.email})`);
    }

    if (!usuario.fotoUrl && retrato) {
      await banco.usuario.update({
        where: { id: usuario.id },
        data: { fotoUrl: await enviarImagem(retrato.arquivo, retrato) },
      });
      console.log(`  com a foto de perfil`);
    }
  }
}

async function criarAnimais(hospital) {
  for (const { tutor, fotos, ...animal } of ANIMAIS) {
    let existente = await banco.animal.findUnique({
      where: { codigo: animal.codigo },
      include: { fotos: true },
    });
    if (existente) {
      console.log(`Já existia: ${animal.nome} (#${animal.codigo})`);
    } else {
      const dono = await banco.usuario.findUnique({
        where: { codigo: tutor },
      });
      existente = await banco.animal.create({
        data: {
          ...animal,
          tutorId: dono.id,
          dataNascimento: paraDataDoBanco(animal.dataNascimento),
        },
        include: { fotos: true },
      });
      console.log(`Criado: ${animal.nome} (#${animal.codigo})`);
    }

    if (existente.fotos.length === 0 && fotos.length > 0) {
      for (const [ordem, arquivo] of fotos.entries()) {
        await banco.animalFoto.create({
          data: {
            animalId: existente.id,
            url: await enviarImagem(arquivo),
            ordem,
          },
        });
      }
      console.log(`  com ${fotos.length} foto(s)`);
    }

    await criarHistorico(existente, hospital);
    await criarDocumentos(existente);
  }
}

// Os pedidos e as liberações de contato de exemplo, os mesmos que o site
// mostrava antes de estar ligado à API. Os prazos
// contam a partir de quando o script roda, para os exemplos estarem sempre
// "em andamento". A Beatriz fica de fora de propósito: é com ela que se testa
// pedir uma liberação do zero.
const HORA = 60 * 60 * 1000;
const ACESSOS = [
  // O Pedro, liberado pelo Victor há 18 horas, por 24: faltam 6.
  {
    tutor: "T5K2W7",
    veterinario: "V7H4M2",
    liberacao: { caso: "Max, cirurgia amanhã", horas: 24, haHoras: 18 },
  },
  // A Camila, liberada pelo Paulo, por 3 dias.
  {
    tutor: "T5W2K6",
    veterinario: "V9P3R7",
    liberacao: { caso: "Amora, transfusão", horas: 72, haHoras: 22 },
  },
  // O Lucas, esperando a resposta do Victor.
  {
    tutor: "T7X9K2",
    veterinario: "V7H4M2",
    pedido: {
      caso: "Thor precisa de transfusão e o hospital pediu para achar um doador",
      haHoras: 0.6,
    },
  },
];

// Cria o exemplo de cada tutor que não tem nem liberação ativa nem pedido
// esperando: rodar de novo depois de testar (encerrar, recusar) devolve os
// exemplos, sem duplicar os que ainda valem.
async function criarAcessos() {
  const agora = Date.now();
  for (const exemplo of ACESSOS) {
    const tutor = await banco.usuario.findUnique({
      where: { codigo: exemplo.tutor },
    });
    const veterinario = await banco.usuario.findUnique({
      where: { codigo: exemplo.veterinario },
    });
    const ativa = await banco.liberacaoContato.findFirst({
      where: {
        tutorId: tutor.id,
        encerradaEm: null,
        expiraEm: { gt: new Date() },
      },
    });
    const pendente = await banco.pedidoLiberacao.findFirst({
      where: { tutorId: tutor.id, status: "PENDENTE" },
    });
    if (ativa || pendente) {
      console.log(`Já existia: o acesso de ${tutor.nomeCompleto}`);
      continue;
    }

    if (exemplo.liberacao) {
      const { caso, horas, haHoras } = exemplo.liberacao;
      const concedidaEm = new Date(agora - haHoras * HORA);
      await banco.liberacaoContato.create({
        data: {
          tutorId: tutor.id,
          veterinarioId: veterinario.id,
          caso,
          concedidaEm,
          duracaoHoras: horas,
          expiraEm: new Date(concedidaEm.getTime() + horas * HORA),
        },
      });
      console.log(
        `Criada: a liberação de ${tutor.nomeCompleto}, por ${veterinario.nomeCompleto}`,
      );
    } else {
      await banco.pedidoLiberacao.create({
        data: {
          tutorId: tutor.id,
          veterinarioId: veterinario.id,
          caso: exemplo.pedido.caso,
          criadoEm: new Date(agora - exemplo.pedido.haHoras * HORA),
        },
      });
      console.log(
        `Criado: o pedido de ${tutor.nomeCompleto} para ${veterinario.nomeCompleto}`,
      );
    }
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("As contas de exemplo não podem ser criadas em produção.");
  }
  const hospital = await banco.estabelecimento.findFirst({
    where: { nome: "Hospital Veterinário UFV" },
  });
  if (!hospital) {
    throw new Error("Rode antes a carga inicial: npm run db:seed");
  }

  await criarContas(hospital);
  await criarAnimais(hospital);
  await criarAcessos();
  console.log(`\nSenha das contas de exemplo: ${SENHA_DE_EXEMPLO}`);
}

try {
  await main();
} finally {
  await banco.$disconnect();
}
