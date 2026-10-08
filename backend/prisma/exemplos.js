import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { guardarImagem } from "../src/armazenamento.js";
import { banco } from "../src/banco.js";
import { cifrar, indiceCpf, indiceEmail } from "../src/cifra.js";
import { paraDataDoBanco, somarAnos } from "../src/datas.js";
import { prepararFoto } from "../src/imagens.js";
import { assinaturaDe } from "../src/modelos/usuario.js";
import { gerarHashSenha } from "../src/senha.js";

// Contas e animais de exemplo, para desenvolver e demonstrar o site. São as
// mesmas pessoas e os mesmos animais dos dados de exemplo do front-end
// (frontend/src/dados/exemplos), com os mesmos códigos públicos e as mesmas
// fotos: entrando com essas contas, o site mostra os pedidos, as liberações e
// o histórico dos animais que as telas já têm.
//
// Roda com `npm run db:exemplos`, depois de `npm run db:seed`, e pode rodar
// de novo sem duplicar: só cria o que falta (uma conta, um animal ou as fotos
// deles). Nunca roda em produção: a senha está escrita aqui e é pública. Os
// CPFs são os dos dados de exemplo, que de propósito não passam na conta dos
// dígitos verificadores; assim não pertencem a ninguém.

const SENHA_DE_EXEMPLO = "ufvet-exemplo";
const VERSAO_DOS_TERMOS = "1";

// As fotos de exemplo são as imagens do próprio site.
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
];

// Os animais das contas acima, com os dados, os códigos e as fotos dos
// animais de exemplo do site (frontend/src/dados/exemplos/animais.js). O tipo
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

// O mesmo histórico dos animais de exemplo do site, pelo código do animal.
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

    if (!usuario.fotoUrl) {
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

    if (existente.fotos.length === 0) {
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
  console.log(`\nSenha das contas de exemplo: ${SENHA_DE_EXEMPLO}`);
}

try {
  await main();
} finally {
  await banco.$disconnect();
}
