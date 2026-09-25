import { banco } from "../src/banco.js";

// Carga inicial: o que o sistema precisa para funcionar e que nenhuma tela
// cadastra. Todo veterinário é ligado a um estabelecimento, então, sem ao
// menos um hospital no banco, nenhum veterinário consegue se cadastrar.
//
// Roda com `npm run db:seed`. Pode ser executada quantas vezes for preciso:
// o que já existe não é duplicado.

const ESTABELECIMENTOS = [
  { nome: "Hospital Veterinário UFV", cidade: "Viçosa", uf: "MG" },
];

async function main() {
  for (const dados of ESTABELECIMENTOS) {
    const existente = await banco.estabelecimento.findFirst({ where: dados });
    if (existente) {
      console.log(`Já existia: ${dados.nome}`);
      continue;
    }
    await banco.estabelecimento.create({ data: dados });
    console.log(`Cadastrado: ${dados.nome}`);
  }
}

try {
  await main();
} finally {
  await banco.$disconnect();
}
