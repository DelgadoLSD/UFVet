import sharp from "sharp";
import { banco } from "../src/banco.js";
import { aguardarEnvios, caixaDeSaida } from "../src/carteiro.js";
import { cifrar, indiceEmail } from "../src/cifra.js";

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
  await aguardarEnvios();
  caixaDeSaida.length = 0;
  caixaDeSaida.foraDoAr = false;
}

// O código do link no último e-mail mandado para `email` (a caixa de saída
// dos testes, ver carteiro.js). `tipo`: "confirmacao", "troca" ou "senha".
export async function codigoDoUltimoEmail(email, tipo) {
  await aguardarEnvios();
  const mensagem = caixaDeSaida.findLast(
    (m) => m.para === email && (!tipo || m.tipo === tipo),
  );
  if (!mensagem) throw new Error(`Nenhum e-mail para ${email}.`);
  return mensagem.texto.match(/#([A-Za-z0-9_-]{43})/)[1];
}

// Cria a conta pela API, como o site faz, abre o link de confirmação do
// e-mail e entra. `navegador` é um request.agent(app), que guarda o cookie
// da sessão; `cabecalhos` vão em todos os pedidos. Devolve a conta, como o
// login responde.
export async function cadastrarEEntrar(navegador, dados, cabecalhos = {}) {
  await navegador.post("/api/usuarios").set(cabecalhos).send(dados).expect(201);
  const codigo = await codigoDoUltimoEmail(dados.email.trim().toLowerCase());
  await navegador
    .post("/api/email/confirmacao")
    .set(cabecalhos)
    .send({ codigo })
    .expect(200);
  const resposta = await navegador
    .post("/api/sessao")
    .set(cabecalhos)
    .send({ email: dados.email, senha: dados.senha })
    .expect(200);
  return resposta.body.usuario;
}

// Códigos públicos (#T3M8P1) únicos dentro de uma rodada de testes.
let contador = 0;
const proximoCodigo = () =>
  (++contador).toString(36).toUpperCase().padStart(6, "0");

// Grava os dados pessoais do mesmo jeito que a API vai gravar: cifrados, com a
// impressão digital ao lado.
function dadosPessoais({ nome, email, telefone }) {
  return {
    codigo: proximoCodigo(),
    nomeCompleto: nome,
    emailCifrado: cifrar(email),
    emailIndice: indiceEmail(email),
    telefoneCifrado: cifrar(telefone),
    senhaHash: "sem-senha-nos-testes",
    emailConfirmadoEm: new Date(),
    cidade: "Viçosa - MG",
    bairro: "Centro",
  };
}

export function criarTutor({ nome, email, telefone = "(31) 90000-0000" }) {
  return banco.usuario.create({
    data: { ...dadosPessoais({ nome, email, telefone }), papel: "TUTOR" },
  });
}

export function criarVeterinario({
  nome,
  email,
  crmv,
  estabelecimentoId,
  telefone = "(31) 90000-0001",
}) {
  return banco.usuario.create({
    data: {
      ...dadosPessoais({ nome, email, telefone }),
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

// Os ids das fotos guardadas no banco agora (limparBanco as apaga com o
// resto).
const guardados = async (tipo) =>
  (
    await banco.arquivo.findMany({
      where: { tipo },
      select: { id: true },
      orderBy: { criadoEm: "asc" },
    })
  ).map((arquivo) => arquivo.id);
export const arquivosGuardados = () => guardados("FOTO");

// O mesmo para os exames.
export const examesGuardados = () => guardados("EXAME");

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
