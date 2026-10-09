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

// Pelo código público (#T3M8P1), como o perfil aparece no endereço do site.
export const buscarUsuarioPorCodigo = (codigo) =>
  banco.usuario.findUnique({ where: { codigo }, include: COM_VETERINARIO });

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

// Quantas validações um veterinário já assinou, o número do perfil dele.
const validacoesAssinadas = (usuario) =>
  banco.validacao.count({ where: { veterinarioId: usuario.id } });

// O perfil de uma pessoa do jeito que qualquer um o vê, inclusive o visitante
// sem conta, que chega pela busca (NF16.4). Não leva e-mail, telefone nem
// CPF: o contato tem endereço próprio, só para quem pode ver (podeVerContato).
// Do local do veterinário vai só o nome, sem o id interno.
export async function dadosPublicos(usuario) {
  const { veterinario } = usuario;
  return {
    codigo: usuario.codigo,
    papel: usuario.papel,
    nomeCompleto: usuario.nomeCompleto,
    cidade: usuario.cidade,
    bairro: usuario.bairro,
    fotoUrl: usuario.fotoUrl,
    membroDesde: usuario.criadoEm,
    veterinario: veterinario && {
      crmv: veterinario.crmv,
      ufCrmv: veterinario.ufCrmv,
      tratamento: veterinario.tratamento,
      estabelecimento: { nome: veterinario.estabelecimento.nome },
      validacoesRealizadas: await validacoesAssinadas(usuario),
    },
  };
}

// Quem vê o contato de outra pessoa (F33): a própria pessoa; o veterinário,
// sempre; o tutor, só enquanto houver uma liberação dada a ele por um
// veterinário, que não venceu nem foi encerrada. O visitante sem conta nunca
// chega aqui (a rota exige login).
export async function podeVerContato(quem, dono) {
  if (quem.id === dono.id || quem.papel === "VETERINARIO") return true;
  const liberacao = await banco.liberacaoContato.findFirst({
    where: {
      tutorId: quem.id,
      encerradaEm: null,
      expiraEm: { gt: new Date() },
    },
    select: { id: true },
  });
  return !!liberacao;
}

// O contato aberto, para quem passou por podeVerContato.
export const contatoDe = (usuario) => ({
  email: decifrar(usuario.emailCifrado),
  telefone: decifrar(usuario.telefoneCifrado),
});

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
      validacoesRealizadas: await validacoesAssinadas(usuario),
    },
  };
}

// "Victor Hugo Martins" -> "Victor Martins": o primeiro e o último nome.
function nomeCurto(nomeCompleto) {
  const partes = nomeCompleto.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes.at(-1)}` : partes[0];
}

// Como o veterinário logado assina o que registra num animal (validações,
// doações, observações): "Dr. Victor Martins", CRMV 78120-MG. Sai sempre da
// conta, nunca do pedido: ninguém assina com o nome ou o CRMV de outra
// pessoa. Os registros guardam uma cópia, para a assinatura continuar
// legível mesmo que a conta mude ou seja encerrada.
export function assinaturaDe(usuario) {
  const { tratamento, crmv, ufCrmv } = usuario.veterinario;
  return {
    nome: `${tratamento === "DRA" ? "Dra." : "Dr."} ${nomeCurto(usuario.nomeCompleto)}`,
    crmv,
    ufCrmv,
  };
}
