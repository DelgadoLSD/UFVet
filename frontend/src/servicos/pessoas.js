import {
  HOSPITAIS,
  OUTRO_TUTOR,
  TUTORA_DE_EXEMPLO,
  TUTORES,
  VETERINARIOS,
} from "../dados/exemplos/pessoas";
import { ehVeterinario } from "../util/texto";

// Consultas sobre pessoas e locais de atendimento.
//
// Enquanto o site não está ligado à API, as respostas saem dos dados de
// exemplo. Na integração, cada função passa a consultar a API, e as telas
// continuam chamando as mesmas funções.

// Hospitais e clínicas atendidos pelo site.
export { HOSPITAIS };

// Tutor pelo código público, para o veterinário conferir quem vai liberar.
export const acharTutor = (codigo) => TUTORES.find((t) => t.codigo === codigo);

// Veterinário pelo código público, para o tutor endereçar um pedido.
export const acharVeterinario = (codigo) =>
  VETERINARIOS.find((v) => v.codigo === codigo);

// Veterinários de um hospital ou clínica: cada um atua em um local só.
export const veterinariosDe = (hospitalId) =>
  VETERINARIOS.filter((v) => v.hospitalId === hospitalId);

// Perfil aberto em /tutor/:codigo. Enquanto não há API, o código da rota não
// é consultado: o veterinário sempre visita a tutora de exemplo, e o tutor
// (ou o visitante, sem conta) visita outro tutor, que é quando o contato
// bloqueado aparece. Na integração, o perfil passa a ser buscado pelo código.
export const perfilVisitado = (usuario) =>
  ehVeterinario(usuario) ? TUTORA_DE_EXEMPLO : OUTRO_TUTOR;
