import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { guardarImagem } from "../src/armazenamento.js";
import { banco } from "../src/banco.js";
import { cifrar, indiceCpf, indiceEmail } from "../src/cifra.js";
import { paraDataDoBanco } from "../src/datas.js";
import { prepararFoto } from "../src/imagens.js";
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
// animais de exemplo do site (frontend/src/dados/exemplos/animais.js).
// Validações, doações e o resto do histórico continuam saindo dos exemplos do
// site até cada parte ser ligada à API. O tipo sanguíneo fica vazio, porque
// só uma validação assinada pode preenchê-lo (NF8.1).
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

async function criarAnimais() {
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
  await criarAnimais();
  console.log(`\nSenha das contas de exemplo: ${SENHA_DE_EXEMPLO}`);
}

try {
  await main();
} finally {
  await banco.$disconnect();
}
