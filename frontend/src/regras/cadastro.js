// As etapas da criação de conta, na ordem de cada papel. A etapa 4 (o convite)
// só existe para veterinários. Antes de a pessoa escolher o papel, vale a
// contagem do tutor.
const ETAPAS = {
  TUTOR: [1, 2, 3, 5],
  VETERINARIO: [1, 2, 3, 4, 5],
};

const etapasDe = (papel) => ETAPAS[papel] ?? ETAPAS.TUTOR;

export const totalDeEtapas = (papel) => etapasDe(papel).length;

// A posição que a etapa ocupa para quem está vendo: a etapa 5 do tutor aparece
// como a 4ª de 4.
export const numeroDaEtapa = (papel, etapa) =>
  etapasDe(papel).indexOf(etapa) + 1;

export function proximaEtapa(papel, etapa) {
  const etapas = etapasDe(papel);
  return etapas[etapas.indexOf(etapa) + 1];
}

export function etapaAnterior(papel, etapa) {
  const etapas = etapasDe(papel);
  return etapas[etapas.indexOf(etapa) - 1];
}
