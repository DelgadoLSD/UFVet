import { DOADORES } from "../dados/exemplos/doadores";

// Doadores mostrados na página de busca.
//
// Enquanto o site não está ligado à API, a lista inteira sai dos dados de
// exemplo, e a página filtra e ordena na hora. Na integração, os filtros
// passam a ir para a API, que devolve só os doadores que interessam.
export const listarDoadores = () => DOADORES;
