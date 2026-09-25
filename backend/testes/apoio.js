import { banco } from "../src/banco.js";
import { cifrar, indiceCpf, indiceEmail } from "../src/cifra.js";

// Ferramentas que os testes usam para preparar o cenário.

// Esvazia todas as tabelas, mantendo a estrutura, para cada teste começar do
// zero. Confere de novo que está no banco de testes antes de apagar qualquer
// coisa.
export async function limparBanco() {
  const [{ nome }] = await banco.$queryRaw`select current_database() as nome`;
  if (!nome.endsWith("_test")) {
    throw new Error(`Recusado: limparBanco só roda no banco de testes, não em "${nome}".`);
  }
  const tabelas = await banco.$queryRaw`
    select tablename from pg_tables
    where schemaname = 'public' and tablename <> '_prisma_migrations'`;
  const lista = tabelas.map((t) => `"${t.tablename}"`).join(", ");
  await banco.$executeRawUnsafe(`truncate ${lista} cascade`);
}

// Códigos públicos (#T3M8P1) únicos dentro de uma rodada de testes.
let contador = 0;
const proximoCodigo = () =>
  (++contador).toString(36).toUpperCase().padStart(6, "0");

// Grava os dados pessoais do mesmo jeito que a API vai gravar: cifrados, com a
// impressão digital ao lado.
function dadosPessoais({ nome, email, cpf, telefone }) {
  return {
    codigo: proximoCodigo(),
    nomeCompleto: nome,
    cpfCifrado: cifrar(cpf),
    cpfIndice: indiceCpf(cpf),
    emailCifrado: cifrar(email),
    emailIndice: indiceEmail(email),
    telefoneCifrado: cifrar(telefone),
    senhaHash: "sem-senha-nos-testes",
    cidade: "Viçosa - MG",
    bairro: "Centro",
  };
}

export function criarTutor({ nome, email, cpf, telefone = "(31) 90000-0000" }) {
  return banco.usuario.create({
    data: { ...dadosPessoais({ nome, email, cpf, telefone }), papel: "TUTOR" },
  });
}

export function criarVeterinario({
  nome,
  email,
  cpf,
  crmv,
  estabelecimentoId,
  telefone = "(31) 90000-0001",
}) {
  return banco.usuario.create({
    data: {
      ...dadosPessoais({ nome, email, cpf, telefone }),
      papel: "VETERINARIO",
      veterinario: {
        create: { crmv, ufCrmv: "MG", tratamento: "DR", estabelecimentoId },
      },
    },
  });
}

export function criarAnimal({ tutorId, nome }) {
  return banco.animal.create({
    data: {
      codigo: proximoCodigo(),
      tutorId,
      nome,
      especie: "CAO",
      sexo: "MACHO",
      castrado: true,
      dataNascimento: new Date("2020-05-10"),
      pesoKg: 28.5,
    },
  });
}
