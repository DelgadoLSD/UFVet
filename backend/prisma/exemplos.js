import { banco } from "../src/banco.js";
import { cifrar, indiceCpf, indiceEmail } from "../src/cifra.js";
import { paraDataDoBanco } from "../src/datas.js";
import { gerarHashSenha } from "../src/senha.js";

// Contas e animais de exemplo, para desenvolver e demonstrar o site. São as
// mesmas pessoas e os mesmos animais dos dados de exemplo do front-end
// (frontend/src/dados/exemplos), com os mesmos códigos públicos: entrando com
// essas contas, o site mostra os pedidos, as liberações e o histórico dos
// animais que as telas já têm.
//
// Roda com `npm run db:exemplos`, depois de `npm run db:seed`, e pode rodar
// de novo sem duplicar. Nunca roda em produção: a senha está escrita aqui e
// é pública. Os CPFs são os dos dados de exemplo, que de propósito não passam
// na conta dos dígitos verificadores; assim não pertencem a ninguém.

const SENHA_DE_EXEMPLO = "ufvet-exemplo";
const VERSAO_DOS_TERMOS = "1";

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
  },
];

// Os animais das contas acima, com os dados e os códigos dos animais de
// exemplo do site (frontend/src/dados/exemplos/animais.js). Só os dados do
// animal: fotos, validações, doações e o resto do histórico continuam saindo
// dos exemplos do site até cada parte ser ligada à API. O tipo sanguíneo
// fica vazio, porque só uma validação assinada pode preenchê-lo (NF8.1).
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
  },
];

async function criarAnimais() {
  for (const { tutor, ...animal } of ANIMAIS) {
    const existente = await banco.animal.findUnique({
      where: { codigo: animal.codigo },
    });
    if (existente) {
      console.log(`Já existia: ${animal.nome} (#${animal.codigo})`);
      continue;
    }
    const dono = await banco.usuario.findUnique({ where: { codigo: tutor } });
    await banco.animal.create({
      data: {
        ...animal,
        tutorId: dono.id,
        dataNascimento: paraDataDoBanco(animal.dataNascimento),
      },
    });
    console.log(`Criado: ${animal.nome} (#${animal.codigo})`);
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

  const senhaHash = await gerarHashSenha(SENHA_DE_EXEMPLO);
  for (const conta of CONTAS) {
    const existente = await banco.usuario.findUnique({
      where: { codigo: conta.codigo },
    });
    if (existente) {
      console.log(`Já existia: ${conta.nomeCompleto} (${conta.email})`);
      continue;
    }
    await banco.usuario.create({
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
  await criarAnimais();
  console.log(`\nSenha das contas de exemplo: ${SENHA_DE_EXEMPLO}`);
}

try {
  await main();
} finally {
  await banco.$disconnect();
}
