import { ANIMAIS_POR_TUTOR } from "../dados/exemplos/animais";

// Animais de um tutor, mostrados no perfil dele.
//
// Enquanto o site não está ligado à API, a lista sai dos dados de exemplo, e
// o que muda nos cartões (validação, doação, observação, documento) vale só
// até recarregar a página. Na integração, esta consulta e cada uma dessas
// alterações passam a chamar a API.
export const animaisDe = (codigoTutor) => ANIMAIS_POR_TUTOR[codigoTutor] ?? [];
