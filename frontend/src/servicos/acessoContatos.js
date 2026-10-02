import { useSyncExternalStore } from "react";
import { daquiAHoras, expirou } from "../util/datas";
import { idProvisorio } from "../util/ids";
import { ehVeterinario } from "../util/texto";
import {
  LIBERACOES_INICIAIS,
  PEDIDOS_INICIAIS,
} from "../dados/exemplos/acesso";

// Acesso aos contatos: quem pode ver o telefone e o e-mail dos tutores.
//
// Enquanto o site não está ligado à API, este serviço simula o back-end em
// memória. O estado fica fora dos componentes para que liberações e pedidos
// sobrevivam à navegação: é o que permite pedir numa tela e ver o resultado
// em outra. Na integração, cada função de escrita (liberar, renovar,
// encerrar, pedir, recusar) passa a chamar a API, e as telas continuam
// chamando as mesmas funções.

let estado = {
  liberacoes: LIBERACOES_INICIAIS,
  pedidos: PEDIDOS_INICIAIS,
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

// Estado atual ({ liberacoes, pedidos }); a tela volta a desenhar quando ele
// muda.
export function useAcessoContatos() {
  return useSyncExternalStore(assinar, () => estado);
}

// ─── Consultas ────────────────────────────────────────────────────────────────

// Liberações vencidas somem sozinhas: ninguém precisa lembrar de encerrar.
export const liberacoesAtivas = (liberacoes) =>
  liberacoes.filter((l) => !expirou(l.expiraEm));

// Cada veterinário administra só as liberações que ele mesmo concedeu: quem
// renova ou encerra é quem assumiu a responsabilidade por aquele acesso.
export const liberacoesDe = (codigoVeterinario, liberacoes) =>
  liberacoes.filter((l) => l.veterinarioCodigo === codigoVeterinario);

// Cada veterinário vê só os pedidos endereçados a ele.
export const pedidosPara = (codigoVeterinario, { pedidos }) =>
  pedidos.filter((p) => p.veterinarioCodigo === codigoVeterinario);

// Regra única de quem vê contato: veterinário vê sempre; tutor, só com
// liberação ativa de um veterinário. O "motivo" decide o texto da tela.
export function acessoDe(usuario, { liberacoes, pedidos }) {
  if (ehVeterinario(usuario)) return { pode: true, motivo: "veterinario" };

  const liberacao = liberacoesAtivas(liberacoes).find(
    (l) => l.tutorCodigo === usuario.codigo,
  );
  if (liberacao) return { pode: true, motivo: "liberacao", liberacao };

  const pedido = pedidos.find((p) => p.tutorCodigo === usuario.codigo);
  return pedido
    ? { pode: false, motivo: "pedido-enviado", pedido }
    : { pode: false, motivo: "sem-liberacao" };
}

// ─── Ações ────────────────────────────────────────────────────────────────────

export function liberarAcesso({
  tutorCodigo,
  tutorNome,
  veterinarioCodigo,
  duracaoHoras,
  caso,
}) {
  definir({
    liberacoes: [
      {
        id: idProvisorio(),
        tutorCodigo,
        tutorNome,
        veterinarioCodigo,
        caso,
        duracaoHoras,
        expiraEm: daquiAHoras(duracaoHoras),
      },
      ...estado.liberacoes,
    ],
    // Um pedido pendente do mesmo tutor deixa de fazer sentido.
    pedidos: estado.pedidos.filter((p) => p.tutorCodigo !== tutorCodigo),
  });
}

// Devolve o prazo cheio, contado a partir de agora.
export function renovarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.map((l) =>
      l.id === id ? { ...l, expiraEm: daquiAHoras(l.duracaoHoras) } : l,
    ),
  });
}

export function encerrarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.filter((l) => l.id !== id),
  });
}

// Cada tutor mantém no máximo um pedido pendente.
export function pedirLiberacao({ usuario, veterinario, caso }) {
  if (estado.pedidos.some((p) => p.tutorCodigo === usuario.codigo)) return;
  definir({
    ...estado,
    pedidos: [
      {
        id: idProvisorio(),
        tutorCodigo: usuario.codigo,
        tutorNome: usuario.nomeCompleto,
        veterinarioCodigo: veterinario.codigo,
        caso,
        criadoEm: new Date().toISOString(),
      },
      ...estado.pedidos,
    ],
  });
}

export function recusarPedido(id) {
  definir({ ...estado, pedidos: estado.pedidos.filter((p) => p.id !== id) });
}
