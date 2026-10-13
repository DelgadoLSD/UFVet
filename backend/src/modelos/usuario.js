import { enderecoDaFoto } from "../armazenamento.js";
import { banco } from "../banco.js";
import { decifrar, indiceEmail } from "../cifra.js";
import { sortearCodigoLivre, sortearCodigoPublico } from "../codigos.js";
import { LIBERACAO_ATIVA } from "./acesso.js";
import { emailNovoPendente } from "./links.js";

// Model (do MVC) das contas: como achar uma conta no banco e o que dela pode
// sair da API. As tabelas em si estão em prisma/schema.prisma.

// Toda conta buscada já vem com o registro de veterinário, quando há, e o
// estabelecimento onde ele atua.
const COM_VETERINARIO = { veterinario: { include: { estabelecimento: true } } };

// Filtro das contas com o e-mail confirmado. Um cadastro pendente não
// aparece para ninguém: nem no perfil, nem na lista de veterinários de um
// hospital.
export const CONTA_CONFIRMADA = { emailConfirmadoEm: { not: null } };

export const buscarUsuarioPorId = (id) =>
  banco.usuario.findUnique({ where: { id }, include: COM_VETERINARIO });

// Pelo código público (#T3M8P1), como o perfil aparece no endereço do site.
export const buscarUsuarioPorCodigo = (codigo) =>
  banco.usuario.findUnique({
    where: { codigo, ...CONTA_CONFIRMADA },
    include: COM_VETERINARIO,
  });

// Quanto tempo um cadastro pode ficar esperando a confirmação do e-mail.
const DIAS_CADASTRO_PENDENTE = 7;

// Apaga os cadastros pendentes (e-mail nunca confirmado) que ocupariam o
// lugar de um cadastro ou de uma troca de e-mail: os com o mesmo e-mail e,
// para um veterinário, os com o mesmo CRMV. Um cadastro pendente não segura
// nada: a pessoa pode ter digitado o e-mail errado e começado de novo. Saem
// junto os pendentes mais antigos que o prazo, que ninguém vai confirmar.
// O convite que um deles usou volta a valer (até vencer). Roda dentro da
// transação de quem chama (`tx`). Um cadastro pendente nunca entrou no site,
// então não tem foto, animal nem nada além da própria linha.
export async function apagarCadastrosPendentes(tx, { emailIndice, crmv }) {
  const limite = new Date(
    Date.now() - DIAS_CADASTRO_PENDENTE * 24 * 60 * 60 * 1000,
  );
  const pendentes = await tx.usuario.findMany({
    where: {
      emailConfirmadoEm: null,
      OR: [
        { emailIndice },
        ...(crmv ? [{ veterinario: crmv }] : []),
        { criadoEm: { lt: limite } },
      ],
    },
    select: { id: true },
  });
  const ids = pendentes.map((p) => p.id);
  if (ids.length === 0) return;
  await tx.conviteVeterinario.updateMany({
    where: { usadoPorId: { in: ids } },
    data: { usadoEm: null, usadoPorId: null },
  });
  await tx.usuario.deleteMany({ where: { id: { in: ids } } });
}

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

// Quantas validações um veterinário já assinou, o número do perfil dele.
const validacoesAssinadas = (usuario) =>
  banco.validacao.count({ where: { veterinarioId: usuario.id } });

// O perfil de uma pessoa do jeito que qualquer um o vê, inclusive o visitante
// sem conta, que chega pela busca (NF16.4). Não leva e-mail nem telefone: o
// contato tem endereço próprio, só para quem pode ver (podeVerContato).
// Do local do veterinário vai só o nome, sem o id interno.
export async function dadosPublicos(usuario) {
  const { veterinario } = usuario;
  return {
    codigo: usuario.codigo,
    papel: usuario.papel,
    nomeCompleto: usuario.nomeCompleto,
    cidade: usuario.cidade,
    bairro: usuario.bairro,
    fotoUrl: enderecoDaFoto(usuario.fotoId),
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
    where: { tutorId: quem.id, ...LIBERACAO_ATIVA() },
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
// conta). E-mail e telefone vão abertos, porque são dela. O hash da senha, os
// índices e os textos cifrados nunca saem da API.
export async function dadosDaConta(usuario) {
  const { veterinario } = usuario;
  return {
    codigo: usuario.codigo,
    papel: usuario.papel,
    nomeCompleto: usuario.nomeCompleto,
    email: decifrar(usuario.emailCifrado),
    telefone: decifrar(usuario.telefoneCifrado),
    // O e-mail de uma troca pedida e ainda não confirmada, para a Minha conta
    // avisar que ela está esperando a confirmação.
    emailNovo: await emailNovoPendente(usuario),
    cidade: usuario.cidade,
    bairro: usuario.bairro,
    fotoUrl: enderecoDaFoto(usuario.fotoId),
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
