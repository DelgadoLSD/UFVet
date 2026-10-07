import { banco } from "../src/banco.js";
import { cifrar, indiceCpf, indiceEmail } from "../src/cifra.js";
import { gerarHashSenha } from "../src/senha.js";

// Contas de exemplo, para desenvolver e demonstrar o site. São as mesmas
// pessoas dos dados de exemplo do front-end (frontend/src/dados/exemplos),
// com os mesmos códigos públicos: entrando com elas, o site mostra os
// animais, pedidos e liberações de exemplo que as telas já têm.
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
  console.log(`\nSenha das contas de exemplo: ${SENHA_DE_EXEMPLO}`);
}

try {
  await main();
} finally {
  await banco.$disconnect();
}
