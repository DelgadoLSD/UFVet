import { banco } from "../banco.js";

// Model (do MVC) do acesso aos contatos: os pedidos de liberação dos tutores
// e as liberações que os veterinários concedem (F27 a F34). As tabelas são
// pedido_liberacao e liberacao_contato (prisma/schema.prisma).
//
// Ninguém precisa encerrar uma liberação vencida (F32): ela simplesmente
// deixa de contar, porque toda consulta de "ativa" compara o prazo com o
// relógio na hora. Não existe rotina de limpeza.

// Uma liberação ativa: não foi encerrada pelo veterinário e o prazo não
// acabou. É uma função, e não uma constante, porque o "agora" muda.
export const LIBERACAO_ATIVA = () => ({
  encerradaEm: null,
  expiraEm: { gt: new Date() },
});

// O veterinário, com o local onde atua, para mostrar quem liberou ou quem
// recebeu um pedido.
const COM_VETERINARIO = {
  veterinario: {
    include: { veterinario: { include: { estabelecimento: true } } },
  },
};
const COM_TUTOR = {
  tutor: { select: { codigo: true, nomeCompleto: true, fotoUrl: true } },
};

// A liberação ativa de um tutor, de qualquer veterinário (NF28.4), ou null.
export const liberacaoAtivaDe = (tutorId) =>
  banco.liberacaoContato.findFirst({
    where: { tutorId, ...LIBERACAO_ATIVA() },
    include: { ...COM_VETERINARIO, ...COM_TUTOR, pedido: true },
  });

// O pedido de um tutor que ainda espera resposta (NF27.3: no máximo um), ou
// null.
export const pedidoPendenteDe = (tutorId) =>
  banco.pedidoLiberacao.findFirst({
    where: { tutorId, status: "PENDENTE" },
    include: { ...COM_VETERINARIO, ...COM_TUTOR },
  });

// Os pedidos que esperam resposta deste veterinário, do mais antigo para o
// mais novo: quem pediu primeiro é atendido primeiro.
export const pedidosPendentesPara = (veterinarioId) =>
  banco.pedidoLiberacao.findMany({
    where: { veterinarioId, status: "PENDENTE" },
    include: { ...COM_VETERINARIO, ...COM_TUTOR },
    orderBy: { criadoEm: "asc" },
  });

// As liberações ativas que este veterinário concedeu (NF28.5: cada um vê e
// administra só as suas), da que vence primeiro para a última.
export const liberacoesAtivasDe = (veterinarioId) =>
  banco.liberacaoContato.findMany({
    where: { veterinarioId, ...LIBERACAO_ATIVA() },
    include: { ...COM_VETERINARIO, ...COM_TUTOR, pedido: true },
    orderBy: { expiraEm: "asc" },
  });

export const buscarLiberacao = (id) =>
  banco.liberacaoContato.findUnique({
    where: { id },
    include: { ...COM_VETERINARIO, ...COM_TUTOR, pedido: true },
  });

export const buscarPedido = (id) =>
  banco.pedidoLiberacao.findUnique({
    where: { id },
    include: { ...COM_VETERINARIO, ...COM_TUTOR },
  });

// Dentro de uma transação, só consultas simples, sem os dados ligados (o
// veterinário, o local): o Prisma buscaria esses dados em consultas ao mesmo
// tempo na mesma conexão, o que o driver do Postgres não aceita dentro de
// uma transação. Os dados completos são buscados depois, fora dela.
export async function idDaLiberacaoAtiva(tutorId, tx) {
  const liberacao = await tx.liberacaoContato.findFirst({
    where: { tutorId, ...LIBERACAO_ATIVA() },
    select: { id: true },
  });
  return liberacao?.id ?? null;
}

export async function idDoPedidoPendente(tutorId, tx) {
  const pedido = await tx.pedidoLiberacao.findFirst({
    where: { tutorId, status: "PENDENTE" },
    select: { id: true },
  });
  return pedido?.id ?? null;
}

// Segura, até o fim da transação, as decisões sobre o acesso de um tutor:
// dois pedidos ou duas liberações chegando ao mesmo tempo para a mesma
// pessoa (dois veterinários clicando juntos, um clique duplo) são atendidos
// um depois do outro. Sem isso, os dois passariam pela conferência "ainda
// não tem" antes de qualquer um gravar (NF27.3, NF28.4). A trava é do
// próprio Postgres (advisory lock) e se solta sozinha no fim da transação.
export const travarAcessoDoTutor = (tx, tutorId) =>
  tx.$queryRaw`select pg_advisory_xact_lock(hashtext(${tutorId}::text))::text as trava`;

// O veterinário como as telas mostram, em quem liberou ou recebeu um pedido.
// Sem e-mail, telefone ou CPF.
export const dadosDoVeterinario = (usuario) => ({
  codigo: usuario.codigo,
  nomeCompleto: usuario.nomeCompleto,
  fotoUrl: usuario.fotoUrl,
  tratamento: usuario.veterinario.tratamento,
  crmv: usuario.veterinario.crmv,
  ufCrmv: usuario.veterinario.ufCrmv,
  estabelecimento: { nome: usuario.veterinario.estabelecimento.nome },
});

export const dadosDoPedido = (pedido) => ({
  id: pedido.id,
  tutor: pedido.tutor,
  veterinario: dadosDoVeterinario(pedido.veterinario),
  caso: pedido.caso,
  criadoEm: pedido.criadoEm,
});

// O caso de uma liberação dada a partir de um pedido fica no pedido (a
// liberação guarda só o pedido_id); a dada pelo código tem o próprio.
export const dadosDaLiberacao = (liberacao) => ({
  id: liberacao.id,
  tutor: liberacao.tutor,
  veterinario: dadosDoVeterinario(liberacao.veterinario),
  caso: liberacao.caso ?? liberacao.pedido?.caso ?? null,
  duracaoHoras: liberacao.duracaoHoras,
  concedidaEm: liberacao.concedidaEm,
  expiraEm: liberacao.expiraEm,
});
