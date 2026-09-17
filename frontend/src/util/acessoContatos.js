import { useSyncExternalStore } from "react";
import { daquiAHoras, horasAtras, expirou } from "./tempo";

// Estado do acesso aos contatos enquanto não há back-end. Fica fora dos
// componentes para que liberações e consultas sobrevivam à navegação entre as
// páginas — é o que permite ver o registro logo depois de abrir um contato.

export const TUTORES_CADASTRADOS = [
  {
    codigo: "T3M8P1",
    nome: "Marina Souza Andrade",
    cidade: "Viçosa - MG",
    animais: "Zeus (cão) e Luna (gato)",
  },
  {
    codigo: "T7X9K2",
    nome: "Lucas Delgado",
    cidade: "Viçosa - MG",
    animais: "Thor (cão)",
    membroDesde: "jan/2026",
  },
  {
    codigo: "T5K2W7",
    nome: "Pedro Alves",
    cidade: "Viçosa - MG",
    animais: "Max (cão)",
    membroDesde: "set/2025",
  },
  {
    codigo: "T5W2K6",
    nome: "Camila Nunes",
    cidade: "Teixeiras - MG",
    animais: "Amora (gato)",
    membroDesde: "jun/2026",
  },
];

// Quem já viu o contato do usuário logado.
export const CONSULTAS_RECEBIDAS = [
  {
    id: 1,
    nome: "Marina Souza Andrade",
    codigo: "T3M8P1",
    papel: "Tutora",
    quando: horasAtras(20),
    permissao: "Dr. Paulo Rezende",
  },
  {
    id: 2,
    nome: "Dra. Camila Duarte",
    codigo: "V2C8D5",
    papel: "Veterinária",
    quando: horasAtras(96),
    permissao: "veterinario",
  },
];

let estado = {
  liberacoes: [
    {
      id: 1,
      codigo: "T3M8P1",
      nome: "Marina Souza Andrade",
      caso: "Luna, transfusão hoje",
      horas: 72,
      expiraEm: daquiAHoras(50),
      consultas: 2,
    },
    {
      id: 2,
      codigo: "T5K2W7",
      nome: "Pedro Alves",
      caso: "Max, cirurgia amanhã",
      horas: 24,
      expiraEm: daquiAHoras(6),
      consultas: 0,
    },
  ],
  consultas: [
    {
      id: 1,
      nome: "Camila Nunes",
      codigo: "T5W2K6",
      quando: horasAtras(5),
      permissao: "veterinario",
    },
    {
      id: 2,
      nome: "Lucas Delgado",
      codigo: "T7X9K2",
      quando: horasAtras(30),
      permissao: "veterinario",
    },
    {
      id: 3,
      nome: "Marina Souza Andrade",
      codigo: "T3M8P1",
      quando: horasAtras(76),
      permissao: "veterinario",
    },
  ],
};

const ouvintes = new Set();
const ler = () => estado;
const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};
const definir = (novo) => {
  estado = novo;
  ouvintes.forEach((aviso) => aviso());
};

export function useAcessoContatos() {
  return useSyncExternalStore(assinar, ler);
}

// Liberações vencidas somem sozinhas: ninguém precisa lembrar de encerrar.
export const liberacoesAtivas = (liberacoes) =>
  liberacoes.filter((l) => !expirou(l.expiraEm));

export function liberarAcesso({ tutor, horas, caso }) {
  definir({
    ...estado,
    liberacoes: [
      {
        id: Date.now(),
        codigo: tutor.codigo,
        nome: tutor.nome,
        caso,
        horas,
        expiraEm: daquiAHoras(horas),
        consultas: 0,
      },
      ...estado.liberacoes,
    ],
  });
}

export function renovarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.map((l) =>
      l.id === id ? { ...l, expiraEm: daquiAHoras(l.horas) } : l,
    ),
  });
}

export function encerrarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.filter((l) => l.id !== id),
  });
}

// Registra a consulta e, quando quem consultou é um tutor liberado, soma no
// contador da liberação — assim o veterinário acompanha o uso que autorizou.
export function registrarConsulta({ nome, codigo, permissao, codigoQuemViu }) {
  definir({
    ...estado,
    consultas: [
      { id: Date.now(), nome, codigo, quando: new Date().toISOString(), permissao },
      ...estado.consultas,
    ],
    liberacoes: estado.liberacoes.map((l) =>
      l.codigo === codigoQuemViu ? { ...l, consultas: l.consultas + 1 } : l,
    ),
  });
}
