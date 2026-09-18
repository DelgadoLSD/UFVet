import { useSyncExternalStore } from "react";
import { daquiAHoras, horasAtras, expirou } from "./tempo";
import mulherFoto from "../assets/people/women1_0-image.jpg";

// Estado do acesso aos contatos enquanto não há back-end. Fica fora dos
// componentes para que liberações, pedidos e consultas sobrevivam à navegação
// entre páginas — é o que permite ver o registro logo depois de abrir um
// contato.

// Teto de contatos por liberação: o prazo evita o acesso eterno, o limite
// evita que uma liberação legítima vire coleta de telefones.
export const LIMITE_CONSULTAS = 10;

export const TUTORES_CADASTRADOS = [
  {
    codigo: "T3M8P1",
    nome: "Marina Souza Andrade",
    cidade: "Viçosa - MG",
    animais: "Zeus (cão) e Luna (gato)",
    membroDesde: "mar/2026",
    foto: mulherFoto,
    fotoPosicao: "center top",
  },
  {
    codigo: "T7X9K2",
    nome: "Lucas Delgado Ferreira",
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

export const acharTutor = (codigo) =>
  TUTORES_CADASTRADOS.find((t) => t.codigo === codigo);

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
      codigo: "T5K2W7",
      nome: "Pedro Alves",
      caso: "Max, cirurgia amanhã",
      horas: 24,
      expiraEm: daquiAHoras(6),
      consultas: 3,
      limite: LIMITE_CONSULTAS,
    },
    {
      id: 2,
      codigo: "T5W2K6",
      nome: "Camila Nunes",
      caso: "Amora, transfusão",
      horas: 72,
      expiraEm: daquiAHoras(50),
      consultas: 0,
      limite: LIMITE_CONSULTAS,
    },
  ],
  pedidos: [
    {
      id: 1,
      codigo: "T3M8P1",
      nome: "Marina Souza Andrade",
      caso: "Luna precisa de transfusão hoje",
      quando: horasAtras(0.4),
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
      nome: "Lucas Delgado Ferreira",
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
const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};
const definir = (novo) => {
  estado = novo;
  ouvintes.forEach((aviso) => aviso());
};

export function useAcessoContatos() {
  return useSyncExternalStore(assinar, () => estado);
}

// Liberações vencidas somem sozinhas: ninguém precisa lembrar de encerrar.
export const liberacoesAtivas = (liberacoes) =>
  liberacoes.filter((l) => !expirou(l.expiraEm));

// Regra única de quem vê contato: veterinário vê sempre; tutor só com
// liberação ativa e dentro do limite de consultas.
export function acessoDe(usuario, { liberacoes, pedidos }) {
  if (usuario.role === "vet") return { pode: true, motivo: "veterinario" };

  const liberacao = liberacoesAtivas(liberacoes).find(
    (l) => l.codigo === usuario.codigo,
  );
  const pedido = pedidos.find((p) => p.codigo === usuario.codigo);

  if (!liberacao) {
    return { pode: false, motivo: pedido ? "pedido-enviado" : "sem-liberacao" };
  }
  if (liberacao.consultas >= liberacao.limite) {
    return { pode: false, motivo: "limite", liberacao };
  }
  return { pode: true, motivo: "liberacao", liberacao };
}

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
        limite: LIMITE_CONSULTAS,
      },
      ...estado.liberacoes,
    ],
    // Um pedido pendente do mesmo tutor deixa de fazer sentido.
    pedidos: estado.pedidos.filter((p) => p.codigo !== tutor.codigo),
  });
}

// Renovar devolve prazo e limite: o veterinário reavaliou o caso.
export function renovarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.map((l) =>
      l.id === id
        ? { ...l, expiraEm: daquiAHoras(l.horas), consultas: 0 }
        : l,
    ),
  });
}

export function encerrarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.filter((l) => l.id !== id),
  });
}

export function pedirLiberacao({ usuario, caso }) {
  if (estado.pedidos.some((p) => p.codigo === usuario.codigo)) return;
  definir({
    ...estado,
    pedidos: [
      {
        id: Date.now(),
        codigo: usuario.codigo,
        nome: usuario.nomeCompleto || usuario.nome,
        caso,
        quando: new Date().toISOString(),
      },
      ...estado.pedidos,
    ],
  });
}

export function recusarPedido(id) {
  definir({ ...estado, pedidos: estado.pedidos.filter((p) => p.id !== id) });
}

// Registra a consulta e soma no contador da liberação de quem viu, para o
// veterinário acompanhar o uso do acesso que autorizou.
export function registrarConsulta({ nome, codigo, permissao, codigoQuemViu }) {
  definir({
    ...estado,
    consultas: [
      {
        id: Date.now(),
        nome,
        codigo,
        quando: new Date().toISOString(),
        permissao,
      },
      ...estado.consultas,
    ],
    liberacoes: estado.liberacoes.map((l) =>
      l.codigo === codigoQuemViu ? { ...l, consultas: l.consultas + 1 } : l,
    ),
  });
}
