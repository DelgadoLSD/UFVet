import { banco } from "../banco.js";
import { decifrar, indiceEmail } from "../cifra.js";
import { sortearCodigoLivre, sortearCodigoPublico } from "../codigos.js";

// Model (do MVC) das contas: como achar uma conta no banco e o que dela pode
// sair da API. As tabelas em si estão em prisma/schema.prisma.

// Toda conta buscada já vem com o registro de veterinário, quando há, e o
// estabelecimento onde ele atua.
const COM_VETERINARIO = { veterinario: { include: { estabelecimento: true } } };

export const buscarUsuarioPorId = (id) =>
  banco.usuario.findUnique({ where: { id }, include: COM_VETERINARIO });

// O e-mail fica cifrado no banco; a busca é pela impressão digital dele.
export const buscarUsuarioPorEmail = (email) =>
  banco.usuario.findUnique({
    where: { emailIndice: indiceEmail(email) },
    include: COM_VETERINARIO,
  });

// Um código público que nenhuma conta usa (NF6.1).
export const codigoPublicoLivre = (papel) =>
  sortearCodigoLivre(
    () => sortearCodigoPublico(papel),
    async (codigo) =>
      !!(await banco.usuario.findUnique({
        where: { codigo },
        select: { id: true },
      })),
  );

// "12944780655" -> "•••.447.806-••": o bastante para a pessoa reconhecer o
// próprio CPF, sem o número inteiro aparecer na tela.
function mascararCpf(cpf) {
  const digitos = cpf.replace(/\D/g, "");
  return `•••.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-••`;
}

// A conta do jeito que a própria pessoa a recebe (topo do site, página da
// conta). E-mail e telefone vão abertos, porque são dela; o CPF vai
// mascarado. O hash da senha, os índices e os textos cifrados nunca saem da
// API.
export async function dadosDaConta(usuario) {
  const { veterinario } = usuario;
  return {
    codigo: usuario.codigo,
    papel: usuario.papel,
    nomeCompleto: usuario.nomeCompleto,
    email: decifrar(usuario.emailCifrado),
    telefone: decifrar(usuario.telefoneCifrado),
    cpfMascarado: mascararCpf(decifrar(usuario.cpfCifrado)),
    cidade: usuario.cidade,
    bairro: usuario.bairro,
    fotoUrl: usuario.fotoUrl,
    membroDesde: usuario.criadoEm,
    veterinario: veterinario && {
      crmv: veterinario.crmv,
      ufCrmv: veterinario.ufCrmv,
      tratamento: veterinario.tratamento,
      estabelecimento: {
        id: veterinario.estabelecimento.id,
        nome: veterinario.estabelecimento.nome,
      },
      validacoesRealizadas: await banco.validacao.count({
        where: { veterinarioId: usuario.id },
      }),
    },
  };
}
