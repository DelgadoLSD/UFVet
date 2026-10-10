import { banco } from "../banco.js";
import { codigoDoEndereco } from "../codigos.js";
import { ErroApi } from "../erros.js";
import {
  buscarLiberacao,
  buscarPedido,
  dadosDaLiberacao,
  dadosDoPedido,
  dadosDoVeterinario,
  idDaLiberacaoAtiva,
  idDoPedidoPendente,
  liberacaoAtivaDe,
  liberacoesAtivasDe,
  pedidoPendenteDe,
  pedidosPendentesPara,
  travarAcessoDoTutor,
} from "../modelos/acesso.js";
import { buscarUsuarioPorCodigo, dadosPublicos } from "../modelos/usuario.js";
import { registrar } from "../registro.js";
import {
  esquemaLiberacao,
  esquemaPedido,
  esquemaRenovacao,
} from "../validacao.js";

// Controller (do MVC) do acesso aos contatos dos doadores (F27 a F34).
//
// O telefone e o e-mail de um tutor só aparecem para veterinários e para
// tutores com uma liberação ativa (F33, em controladores/perfis.js). Aqui
// ficam os caminhos até essa liberação: o tutor pede a um veterinário
// determinado (F27); o veterinário libera por um prazo (F28), recusa (F29),
// renova (F30) ou encerra antes (F31). A liberação vence sozinha (F32).
//
// Todas as rotas exigem login; as do veterinário passam também por
// exigirPapel("VETERINARIO") (NF28.1, ver rotas.js).

const HORA = 60 * 60 * 1000;

const campoInvalido = (campo, mensagem) =>
  new ErroApi(400, mensagem, { campos: { [campo]: mensagem } });

// "Dr. Victor", nas mensagens sobre quem liberou ou recebeu um pedido.
const nomeDoVeterinario = (usuario) =>
  `${usuario.veterinario.tratamento === "DRA" ? "Dra." : "Dr."} ${usuario.nomeCompleto.split(" ")[0]}`;

// O prazo de uma liberação, nas mensagens: "até 12/10, 14:30".
const ate = (data) =>
  `até ${data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })}`;

// ─── Quem está logado ─────────────────────────────────────────────────────────

// GET /api/acesso — a situação de quem está logado: a liberação ativa e o
// pedido que espera resposta, para o site dizer, antes de a pessoa abrir um
// perfil, se ela vai ver o contato. O veterinário vê sempre e não tem nem uma
// coisa nem outra.
export async function meuAcesso(req, res) {
  const { usuario } = req;
  if (usuario.papel === "VETERINARIO") {
    res.json({ veterinario: true, liberacao: null, pedido: null });
    return;
  }
  const liberacao = await liberacaoAtivaDe(usuario.id);
  const pedido = await pedidoPendenteDe(usuario.id);
  res.set("Cache-Control", "no-store");
  res.json({
    veterinario: false,
    liberacao: liberacao && dadosDaLiberacao(liberacao),
    pedido: pedido && dadosDoPedido(pedido),
  });
}

// ─── Pedidos (F27 e F29) ──────────────────────────────────────────────────────

// POST /api/pedidos — o tutor pede liberação a um veterinário (F27). Vai
// para um veterinário determinado, pelo código (NF27.1), com o caso contado
// (NF27.4). Cada tutor tem no máximo um pedido esperando resposta (NF27.3), e
// quem já está com o acesso liberado não precisa pedir.
export async function pedirLiberacao(req, res) {
  const tutor = req.usuario;
  if (tutor.papel === "VETERINARIO") {
    throw new ErroApi(
      403,
      "Veterinários já veem os contatos dos tutores, sem precisar de liberação.",
    );
  }
  const dados = esquemaPedido.parse(req.body ?? {});
  const veterinario = await buscarUsuarioPorCodigo(dados.veterinario);
  if (!veterinario || veterinario.papel !== "VETERINARIO") {
    throw campoInvalido(
      "veterinario",
      `Nenhum veterinário com o código #${dados.veterinario}. Confira o código ou procure pelo local do atendimento.`,
    );
  }

  // A conferência e a gravação ficam juntas, sob a trava do tutor; o que
  // impediu o pedido é detalhado depois, fora da transação.
  const resultado = await banco.$transaction(async (tx) => {
    await travarAcessoDoTutor(tx, tutor.id);
    const liberacaoId = await idDaLiberacaoAtiva(tutor.id, tx);
    if (liberacaoId) return { liberacaoId };
    const pendenteId = await idDoPedidoPendente(tutor.id, tx);
    if (pendenteId) return { pendenteId };
    const criado = await tx.pedidoLiberacao.create({
      data: {
        tutorId: tutor.id,
        veterinarioId: veterinario.id,
        caso: dados.caso,
      },
      select: { id: true },
    });
    return { pedidoId: criado.id };
  });

  if (resultado.liberacaoId) {
    const liberacao = await buscarLiberacao(resultado.liberacaoId);
    throw new ErroApi(
      409,
      `Seu acesso aos contatos já está liberado, ${ate(liberacao.expiraEm)}. Não é preciso pedir de novo.`,
    );
  }
  if (resultado.pendenteId) {
    const pendente = await buscarPedido(resultado.pendenteId);
    throw new ErroApi(
      409,
      `Você já tem um pedido esperando resposta de ${nomeDoVeterinario(pendente.veterinario)}. Espere a resposta antes de pedir de novo.`,
    );
  }
  const pedido = await buscarPedido(resultado.pedidoId);
  registrar("pedido_liberacao", { pedido: pedido.id });
  res.status(201).json({ pedido: dadosDoPedido(pedido) });
}

// GET /api/pedidos — os pedidos que esperam resposta do veterinário logado.
// Cada um vê só os endereçados a ele.
export async function listarPedidos(req, res) {
  const pedidos = await pedidosPendentesPara(req.usuario.id);
  res.set("Cache-Control", "no-store");
  res.json({ pedidos: pedidos.map(dadosDoPedido) });
}

// Por que um pedido não pode mais ser respondido.
const pedidoJaRespondido = (status) =>
  new ErroApi(
    409,
    status === "RECUSADO"
      ? "Esse pedido já foi recusado."
      : "Esse pedido já foi atendido: o tutor recebeu a liberação.",
  );

// O pedido do endereço, se for deste veterinário e ainda esperar resposta.
// O pedido de outro veterinário responde "não encontrado", como se não
// existisse: ninguém descobre pedidos alheios tentando ids.
async function pedidoPendenteDoVeterinario(id, veterinario) {
  const pedido = /^[0-9a-f-]{36}$/i.test(id) ? await buscarPedido(id) : null;
  if (!pedido || pedido.veterinarioId !== veterinario.id) {
    throw new ErroApi(404, "Pedido não encontrado.");
  }
  if (pedido.status !== "PENDENTE") throw pedidoJaRespondido(pedido.status);
  return pedido;
}

// POST /api/pedidos/:id/recusa — o veterinário recusa um pedido endereçado a
// ele (F29). O pedido fica guardado como recusado, e o tutor pode pedir de
// novo, a este ou a outro veterinário.
export async function recusarPedido(req, res) {
  const pedido = await pedidoPendenteDoVeterinario(req.params.id, req.usuario);
  await banco.pedidoLiberacao.update({
    where: { id: pedido.id },
    data: { status: "RECUSADO", respondidoEm: new Date() },
  });
  registrar("pedido_recusado", { pedido: pedido.id });
  res.status(204).end();
}

// ─── Liberações (F28, F30, F31, F34) ──────────────────────────────────────────

// GET /api/liberacoes — as liberações ativas que o veterinário logado
// concedeu (NF28.5). As vencidas e as encerradas não aparecem.
export async function listarLiberacoes(req, res) {
  const liberacoes = await liberacoesAtivasDe(req.usuario.id);
  res.set("Cache-Control", "no-store");
  res.json({ liberacoes: liberacoes.map(dadosDaLiberacao) });
}

// O tutor a liberar, pelo código digitado pelo veterinário.
async function tutorPeloCodigo(codigo) {
  const tutor = await buscarUsuarioPorCodigo(codigo);
  if (!tutor) {
    throw campoInvalido(
      "tutor",
      `Nenhum tutor com o código #${codigo}. Confira o código com a pessoa.`,
    );
  }
  if (tutor.papel === "VETERINARIO") {
    throw campoInvalido(
      "tutor",
      `O código #${codigo} é de um veterinário, que já vê os contatos sem liberação.`,
    );
  }
  return tutor;
}

// POST /api/liberacoes — o veterinário libera o acesso de um tutor por 24
// horas, 3 dias ou 7 dias (F28, NF28.2): pelo código do tutor ou aceitando
// um pedido que chegou para ele. Quem já tem liberação ativa, ainda que dada
// por outro veterinário, não recebe outra (NF28.4). Liberado o acesso, o
// pedido que o tutor tinha esperando perde a finalidade e fica como atendido
// (F34), seja para este ou para outro veterinário.
export async function liberarAcesso(req, res) {
  const veterinario = req.usuario;
  const dados = esquemaLiberacao.parse(req.body ?? {});
  const pedidoId = dados.pedido ?? null;
  const tutorId = pedidoId
    ? (await pedidoPendenteDoVeterinario(pedidoId, veterinario)).tutorId
    : (await tutorPeloCodigo(dados.tutor)).id;

  // A conferência e a gravação ficam juntas, sob a trava do tutor; o que
  // impediu a liberação é detalhado depois, fora da transação.
  const resultado = await banco.$transaction(async (tx) => {
    await travarAcessoDoTutor(tx, tutorId);
    // Conferido de novo dentro da trava: o pedido pode ter sido respondido
    // um instante antes (um clique duplo, outra aba aberta).
    if (pedidoId) {
      const { status } = await tx.pedidoLiberacao.findUnique({
        where: { id: pedidoId },
        select: { status: true },
      });
      if (status !== "PENDENTE") return { pedidoRespondido: status };
    }
    const ativaId = await idDaLiberacaoAtiva(tutorId, tx);
    if (ativaId) return { ativaId };

    const agora = new Date();
    const criada = await tx.liberacaoContato.create({
      data: {
        tutorId,
        veterinarioId: veterinario.id,
        pedidoId,
        caso: pedidoId ? null : dados.caso || null,
        concedidaEm: agora,
        duracaoHoras: dados.duracaoHoras,
        expiraEm: new Date(agora.getTime() + dados.duracaoHoras * HORA),
      },
      select: { id: true },
    });
    await tx.pedidoLiberacao.updateMany({
      where: { tutorId, status: "PENDENTE" },
      data: { status: "ATENDIDO", respondidoEm: agora },
    });
    return { liberacaoId: criada.id };
  });

  if (resultado.pedidoRespondido) {
    throw pedidoJaRespondido(resultado.pedidoRespondido);
  }
  if (resultado.ativaId) {
    const ativa = await buscarLiberacao(resultado.ativaId);
    const deQuem =
      ativa.veterinarioId === veterinario.id
        ? "por você"
        : `por ${nomeDoVeterinario(ativa.veterinario)}`;
    throw new ErroApi(
      409,
      `${ativa.tutor.nomeCompleto} já está com o acesso liberado ${deQuem}, ${ate(ativa.expiraEm)}. Não é preciso liberar de novo.`,
    );
  }
  const liberacao = await buscarLiberacao(resultado.liberacaoId);
  registrar("liberacao_concedida", {
    liberacao: liberacao.id,
    horas: liberacao.duracaoHoras,
  });
  res.status(201).json({ liberacao: dadosDaLiberacao(liberacao) });
}

// A liberação do endereço, se foi este veterinário quem a concedeu (NF28.5)
// e ela ainda vale. A de outro veterinário responde "não encontrada".
async function liberacaoAtivaDoVeterinario(id, veterinario) {
  const liberacao = /^[0-9a-f-]{36}$/i.test(id)
    ? await buscarLiberacao(id)
    : null;
  if (!liberacao || liberacao.veterinarioId !== veterinario.id) {
    throw new ErroApi(404, "Liberação não encontrada.");
  }
  if (liberacao.encerradaEm || liberacao.expiraEm <= new Date()) {
    throw new ErroApi(
      409,
      "Essa liberação já terminou. Para o tutor ver os contatos de novo, libere outra vez.",
    );
  }
  return liberacao;
}

// POST /api/liberacoes/:id/renovacao — dá um prazo novo, contado de agora,
// quando o atendimento se estende (F30). O veterinário escolhe o prazo (24
// horas, 3 dias ou 7 dias); sem escolha, vale o da própria liberação (o
// "prazo integral"). Renovar só estende: um prazo que terminaria antes do
// atual é recusado, e para tirar o acesso antes existe o encerramento.
export async function renovarLiberacao(req, res) {
  const liberacao = await liberacaoAtivaDoVeterinario(
    req.params.id,
    req.usuario,
  );
  const dados = esquemaRenovacao.parse(req.body ?? {});
  const duracaoHoras = dados.duracaoHoras ?? liberacao.duracaoHoras;
  const expiraEm = new Date(Date.now() + duracaoHoras * HORA);
  if (expiraEm <= liberacao.expiraEm) {
    throw campoInvalido(
      "duracaoHoras",
      `Esse prazo terminaria antes do atual (${ate(liberacao.expiraEm)}). Escolha um prazo maior, ou encerre a liberação.`,
    );
  }
  await banco.liberacaoContato.update({
    where: { id: liberacao.id },
    data: { expiraEm, duracaoHoras },
  });
  registrar("liberacao_renovada", { liberacao: liberacao.id });
  res.json({
    liberacao: dadosDaLiberacao(await buscarLiberacao(liberacao.id)),
  });
}

// DELETE /api/liberacoes/:id — encerra antes do prazo (F31). A liberação não
// some do banco: fica com a data de encerramento, como registro de quem
// liberou e até quando valeu.
export async function encerrarLiberacao(req, res) {
  const liberacao = await liberacaoAtivaDoVeterinario(
    req.params.id,
    req.usuario,
  );
  await banco.liberacaoContato.update({
    where: { id: liberacao.id },
    data: { encerradaEm: new Date() },
  });
  registrar("liberacao_encerrada", { liberacao: liberacao.id });
  res.status(204).end();
}

// ─── Conferência e escolha ────────────────────────────────────────────────────

// GET /api/usuarios/:codigo/acesso — antes de liberar, o veterinário confere
// de quem é o código digitado (NF28.3): o nome, a cidade, a foto, os animais
// e se a pessoa já está com acesso liberado, por ele ou por outro
// veterinário (NF28.4). Sem contato.
export async function conferirTutor(req, res) {
  const tutor = await tutorPeloCodigo(codigoDoEndereco(req.params.codigo));
  const animais = await banco.animal.findMany({
    where: { tutorId: tutor.id },
    select: { nome: true, especie: true },
    orderBy: { criadoEm: "asc" },
  });
  const liberacao = await liberacaoAtivaDe(tutor.id);
  res.set("Cache-Control", "no-store");
  res.json({
    tutor: { ...(await dadosPublicos(tutor)), animais },
    liberacao: liberacao && dadosDaLiberacao(liberacao),
  });
}

// GET /api/estabelecimentos/:id/veterinarios — os veterinários de um
// hospital ou clínica, para o tutor escolher a quem pedir quando não sabe o
// código (NF27.2).
export async function veterinariosDoEstabelecimento(req, res) {
  const id = req.params.id;
  const veterinarios = /^[0-9a-f-]{36}$/i.test(id)
    ? await banco.usuario.findMany({
        where: { veterinario: { estabelecimentoId: id } },
        include: { veterinario: { include: { estabelecimento: true } } },
        orderBy: { nomeCompleto: "asc" },
      })
    : [];
  res.json({ veterinarios: veterinarios.map(dadosDoVeterinario) });
}
