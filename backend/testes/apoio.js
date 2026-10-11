import { readdir, rm } from "node:fs/promises";
import sharp from "sharp";
import { banco } from "../src/banco.js";
import { cifrar, indiceCpf, indiceEmail } from "../src/cifra.js";
import { config } from "../src/config.js";

// Ferramentas que os testes usam para preparar o cenário.

// Esvazia todas as tabelas, mantendo a estrutura, para cada teste começar do
// zero. Confere de novo que está no banco de testes antes de apagar qualquer
// coisa.
export async function limparBanco() {
  const [{ nome }] = await banco.$queryRaw`select current_database() as nome`;
  if (!nome.endsWith("_test")) {
    throw new Error(
      `Recusado: limparBanco só roda no banco de testes, não em "${nome}".`,
    );
  }
  const tabelas = await banco.$queryRaw`
    select tablename from pg_tables
    where schemaname = 'public' and tablename <> '_prisma_migrations'`;
  const lista = tabelas.map((t) => `"${t.tablename}"`).join(", ");
  await banco.$executeRawUnsafe(`truncate ${lista} cascade`);
}

// CPF válido (com os dígitos verificadores certos) a partir de 9 números.
// Os testes da API precisam de CPFs que passem na validação.
export function gerarCpf(nove) {
  const digito = (numeros) => {
    let soma = 0;
    for (let i = 0; i < numeros.length; i++) {
      soma += Number(numeros[i]) * (numeros.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const dez = nove + digito(nove);
  return dez + digito(dez);
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

// ─── Fotos ────────────────────────────────────────────────────────────────────

// Esvazia a pasta temporária das fotos dos testes (ver vitest.config.js).
export async function limparArquivos() {
  await rm(config.pastaArquivos, { recursive: true, force: true });
}

// Os arquivos que estão na pasta das fotos agora.
export const arquivosGuardados = () =>
  readdir(config.pastaArquivos).catch(() => []);

// O mesmo para a pasta dos exames.
export async function limparExames() {
  await rm(config.pastaExames, { recursive: true, force: true });
}
export const examesGuardados = () =>
  readdir(config.pastaExames).catch(() => []);

// Um PDF pequeno, como o laudo que um laboratório manda. Para a API, o que
// conta é a assinatura do formato no começo ("%PDF-").
export const pdfDeExame = (texto = "Hemograma completo") =>
  Buffer.from(
    `%PDF-1.4\n1 0 obj << /Title (${texto}) >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`,
    "latin1",
  );

// Uma foto JPEG como as de celular: com os dados da câmera e a localização
// GPS de onde foi tirada (no bloco EXIF, que vai dentro do arquivo).
export const fotoDeCelular = ({ largura = 400, altura = 300 } = {}) =>
  sharp({
    create: {
      width: largura,
      height: altura,
      channels: 3,
      background: { r: 183, g: 16, b: 42 },
    },
  })
    .jpeg()
    .withExif({
      IFD0: { Make: "Celular de teste" },
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "20/1 45/1 14/1",
        GPSLongitudeRef: "W",
        GPSLongitude: "42/1 52/1 55/1",
      },
    })
    .toBuffer();
