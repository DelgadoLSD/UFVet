import { randomBytes } from "node:crypto";
import { banco } from "../banco.js";
import { cifrar, decifrar, indiceEmail, indiceLink } from "../cifra.js";

// Model (do MVC) dos links que o UFVet manda por e-mail (tabela link_email):
// o de confirmar o e-mail e o de criar uma senha nova.

const HORA = 60 * 60 * 1000;

// Quanto tempo cada link vale. O de senha nova vale pouco, porque abre a
// conta: quem pegar o e-mail de outra pessoa depois de uma hora não usa
// mais o link.
export const VALIDADE_HORAS = { CONFIRMAR_EMAIL: 24, NOVA_SENHA: 1 };

// Links usados ou vencidos ficam uma semana (para quem abre de novo um link
// já usado ver "seu e-mail já está confirmado", e não um erro) e depois
// saem, com o e-mail cifrado que alguns guardam.
const DIAS_GUARDADOS = 7;

// Cria um link e devolve o código que vai nele: 32 bytes sorteados, que
// ninguém adivinha. O código só existe neste momento; no banco fica a
// impressão digital dele. Os links anteriores da mesma conta e finalidade
// deixam de valer: vale sempre o do e-mail mais recente. `email` é o e-mail
// que o link confirma (no link de senha nova, nenhum).
export async function criarLink({ usuarioId, finalidade, email = null }) {
  const agora = new Date();
  const codigo = randomBytes(32).toString("base64url");
  await banco.$transaction([
    banco.linkEmail.deleteMany({
      where: {
        criadoEm: { lt: new Date(agora - DIAS_GUARDADOS * 24 * HORA) },
      },
    }),
    banco.linkEmail.updateMany({
      where: { usuarioId, finalidade, usadoEm: null, expiraEm: { gt: agora } },
      data: { expiraEm: agora },
    }),
    banco.linkEmail.create({
      data: {
        usuarioId,
        finalidade,
        codigoIndice: indiceLink(codigo),
        emailCifrado: email && cifrar(email),
        emailIndice: email && indiceEmail(email),
        criadoEm: agora,
        expiraEm: new Date(agora.getTime() + VALIDADE_HORAS[finalidade] * HORA),
      },
    }),
  ]);
  return codigo;
}

// O link deste código, com a conta, se ele é da finalidade pedida; senão,
// null. Se ainda vale, quem decide é linkValeAgora.
export async function acharLink(codigo, finalidade) {
  const link = await banco.linkEmail.findUnique({
    where: { codigoIndice: indiceLink(codigo) },
    include: { usuario: true },
  });
  return link?.finalidade === finalidade ? link : null;
}

export const linkValeAgora = (link) =>
  !link.usadoEm && link.expiraEm > new Date();

// Marca o link como usado, dentro da transação de quem o usa (`tx`).
// Devolve false se ele já não valia: com o mesmo link aberto duas vezes no
// mesmo instante, é o próprio banco que garante que só uma abertura conta.
export async function usarLink(tx, id) {
  const { count } = await tx.linkEmail.updateMany({
    where: { id, usadoEm: null, expiraEm: { gt: new Date() } },
    data: { usadoEm: new Date() },
  });
  return count === 1;
}

// O e-mail novo de uma troca que a pessoa pediu e ainda não confirmou, ou
// null. É o link de confirmação ainda válido para um e-mail diferente do
// atual.
export async function emailNovoPendente(usuario) {
  const link = await banco.linkEmail.findFirst({
    where: {
      usuarioId: usuario.id,
      finalidade: "CONFIRMAR_EMAIL",
      usadoEm: null,
      expiraEm: { gt: new Date() },
      NOT: { emailIndice: usuario.emailIndice },
    },
    orderBy: { criadoEm: "desc" },
    select: { emailCifrado: true },
  });
  return link ? decifrar(link.emailCifrado) : null;
}
