import { parseArgs } from "node:util";
import { banco } from "../src/banco.js";
import { DIAS_VALIDADE_CONVITE, criarConvite } from "../src/modelos/convite.js";
import { campos } from "../src/validacao.js";

// Cria um convite de veterinário. É assim que um veterinário entra no
// sistema: a direção do hospital informa nome e CRMV, este comando gera o
// código, e a pessoa usa o código ao criar a conta.

const AJUDA = `
Cria um convite para um veterinário criar a conta no UFVet.

  npm run convite -- --nome "Ana Souza" --crmv 12345 --uf MG

Opções:
  --nome    nome do veterinário (só para referência de quem administra)
  --crmv    número do CRMV, só os números
  --uf      UF do conselho (MG, SP...)
  --local   nome do hospital ou clínica; obrigatório quando houver mais de um
  --dias    por quantos dias o convite vale (padrão: ${DIAS_VALIDADE_CONVITE})
`;

// Para o comando com uma mensagem, sem a pilha de erro do Node.
class ErroDeUso extends Error {}

function validar(esquema, valor, nomeDaOpcao) {
  const resultado = esquema.safeParse(valor);
  if (!resultado.success) {
    throw new ErroDeUso(
      `--${nomeDaOpcao}: ${resultado.error.issues[0].message}`,
    );
  }
  return resultado.data;
}

// O estabelecimento pelo nome; se houver um só cadastrado, ele mesmo.
async function escolherEstabelecimento(nome) {
  const todos = await banco.estabelecimento.findMany({
    orderBy: { nome: "asc" },
  });
  if (todos.length === 0) {
    throw new ErroDeUso(
      "Nenhum estabelecimento cadastrado. Rode antes: npm run db:seed",
    );
  }
  if (!nome && todos.length === 1) return todos[0];

  const achado = todos.find(
    (e) => e.nome.toLowerCase() === (nome ?? "").trim().toLowerCase(),
  );
  if (!achado) {
    const lista = todos.map((e) => `  - ${e.nome}`).join("\n");
    throw new ErroDeUso(
      `Diga em qual local o veterinário atua, com --local. Locais cadastrados:\n${lista}`,
    );
  }
  return achado;
}

async function main() {
  const { values } = parseArgs({
    options: {
      nome: { type: "string" },
      crmv: { type: "string" },
      uf: { type: "string" },
      local: { type: "string" },
      dias: { type: "string" },
      ajuda: { type: "boolean", short: "h" },
    },
  });
  if (values.ajuda || !values.nome || !values.crmv || !values.uf) {
    console.log(AJUDA);
    process.exitCode = values.ajuda ? 0 : 1;
    return;
  }

  const nome = validar(campos.nomeCompleto, values.nome, "nome");
  const crmv = validar(campos.crmv, values.crmv, "crmv");
  const ufCrmv = validar(campos.uf, values.uf, "uf");
  const dias = Number(values.dias ?? DIAS_VALIDADE_CONVITE);
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) {
    throw new ErroDeUso("--dias: use um número de 1 a 30.");
  }
  const estabelecimento = await escolherEstabelecimento(values.local);

  const jaTemConta = await banco.veterinario.findUnique({
    where: { crmv_ufCrmv: { crmv, ufCrmv } },
  });
  if (jaTemConta) {
    throw new ErroDeUso(`Já existe uma conta com o CRMV ${crmv}-${ufCrmv}.`);
  }

  const { codigo, expiraEm } = await criarConvite({
    nome,
    crmv,
    ufCrmv,
    estabelecimentoId: estabelecimento.id,
    dias,
  });

  const validade = expiraEm.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
  console.log(`
Convite criado para ${nome} (CRMV ${crmv}-${ufCrmv}), ${estabelecimento.nome}.

  Código: ${codigo}
  Vale até ${validade}, uma única vez.

Envie o código agora: ele não fica guardado e não aparece de novo. Para
usar, a pessoa entra em "Criar conta", escolhe "Sou veterinário" e digita o
código na etapa do registro profissional.
`);
}

try {
  await main();
} catch (erro) {
  if (!(erro instanceof ErroDeUso)) throw erro;
  console.error(`\n${erro.message}\n`);
  process.exitCode = 1;
} finally {
  await banco.$disconnect();
}
