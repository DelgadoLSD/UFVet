import { banco } from "../banco.js";
import { indiceConvite } from "../cifra.js";
import { sortearCodigoConvite } from "../codigos.js";

// Model (do MVC) dos convites de veterinário: criar, achar e usar.

export const DIAS_VALIDADE_CONVITE = 7;

// Cria um convite e devolve o código. O código só existe neste momento: no
// banco fica apenas a impressão digital dele, então quem perde o código pede
// um convite novo.
export async function criarConvite({
  nome,
  crmv,
  ufCrmv,
  estabelecimentoId,
  dias = DIAS_VALIDADE_CONVITE,
}) {
  const codigo = sortearCodigoConvite();
  const expiraEm = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  await banco.conviteVeterinario.create({
    data: {
      codigoIndice: indiceConvite(codigo),
      nome,
      crmv,
      ufCrmv,
      estabelecimentoId,
      expiraEm,
    },
  });
  return { codigo, expiraEm };
}

// O convite com este código, se ainda pode ser usado: existe, não foi usado
// e não venceu. Senão, null, sem dizer qual dos três motivos, para não ajudar
// quem tenta adivinhar códigos.
export async function acharConviteValido(codigo) {
  const convite = await banco.conviteVeterinario.findUnique({
    where: { codigoIndice: indiceConvite(codigo) },
    include: { estabelecimento: true },
  });
  if (!convite || convite.usadoEm || convite.expiraEm <= new Date()) {
    return null;
  }
  return convite;
}

// Marca o convite como usado, dentro da transação do cadastro (`tx`).
// Devolve false se ele já tinha sido usado: com dois cadastros simultâneos
// usando o mesmo convite, é o próprio banco que garante que só um consegue.
export async function usarConvite(tx, conviteId, usuarioId) {
  const { count } = await tx.conviteVeterinario.updateMany({
    where: { id: conviteId, usadoEm: null },
    data: { usadoEm: new Date(), usadoPorId: usuarioId },
  });
  return count === 1;
}
