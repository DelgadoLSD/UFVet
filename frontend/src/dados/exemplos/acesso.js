import { daquiAHoras, horasAtras } from "../../util/datas";

// Liberações e pedidos de acesso aos contatos que já existem quando o site
// abre, enquanto ele não está ligado à API. Os campos seguem as tabelas
// liberacao_contato e pedido_liberacao do banco (com o código público no
// lugar do id interno).
//
// Os prazos são calculados a partir do momento em que o site abre, para os
// exemplos estarem sempre "em andamento".

export const LIBERACOES_INICIAIS = [
  {
    id: 1,
    tutorCodigo: "T5K2W7",
    tutorNome: "Pedro Alves",
    veterinarioCodigo: "V7H4M2",
    caso: "Max, cirurgia amanhã",
    duracaoHoras: 24,
    expiraEm: daquiAHoras(6),
  },
  {
    // De outra veterinária de propósito: é o caso que prova que o painel
    // mostra a cada veterinário só o que ele mesmo liberou.
    id: 2,
    tutorCodigo: "T5W2K6",
    tutorNome: "Camila Nunes",
    veterinarioCodigo: "V2C8D5",
    caso: "Amora, transfusão",
    duracaoHoras: 72,
    expiraEm: daquiAHoras(50),
  },
];

export const PEDIDOS_INICIAIS = [
  {
    id: 1,
    tutorCodigo: "T7X9K2",
    tutorNome: "Lucas Silva Delgado",
    veterinarioCodigo: "V7H4M2",
    caso: "Thor precisa de transfusão e o hospital pediu para achar um doador",
    criadoEm: horasAtras(0.6),
  },
];
