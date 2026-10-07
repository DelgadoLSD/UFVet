import { useSyncExternalStore } from "react";
import { PESSOAS } from "../dados/exemplos/pessoas";
import { chamarApi } from "./api";

// Quem está usando o site: a conta logada, ou ninguém (o visitante).
//
// A sessão de verdade fica na API, num cookie que o site nem consegue ler.
// Aqui fica só uma cópia dos dados da conta, para as telas desenharem. O
// site pergunta à API quem está logado assim que abre (carregarSessao, em
// main.jsx); até a resposta chegar, `carregando` fica verdadeiro e as páginas
// que exigem login esperam.

let estado = { usuario: null, carregando: true };
const ouvintes = new Set();

const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};

const definir = (novo) => {
  estado = novo;
  ouvintes.forEach((aviso) => aviso());
};

// Enquanto as fotos não podem ser enviadas, as contas de exemplo mostram o
// retrato dos dados de exemplo de mesmo código.
function retratoDeExemplo(codigo) {
  const pessoa = PESSOAS.find((p) => p.codigo === codigo);
  return pessoa?.foto
    ? {
        foto: pessoa.foto,
        fotoPosicao: pessoa.fotoPosicao,
        fotoZoom: pessoa.fotoZoom,
      }
    : {};
}

// A conta como a API manda -> a conta como as telas usam (os mesmos campos
// dos dados de exemplo).
function paraUsuario(conta) {
  if (!conta) return null;
  const { veterinario } = conta;
  return {
    codigo: conta.codigo,
    papel: conta.papel,
    nomeCompleto: conta.nomeCompleto,
    email: conta.email,
    telefone: conta.telefone,
    cpf: conta.cpfMascarado,
    cidade: conta.cidade,
    bairro: conta.bairro,
    membroDesde: conta.membroDesde,
    foto: conta.fotoUrl,
    ...(!conta.fotoUrl && retratoDeExemplo(conta.codigo)),
    ...(veterinario && {
      tratamento: veterinario.tratamento,
      crmv: `${veterinario.crmv}-${veterinario.ufCrmv}`,
      hospitalId: veterinario.estabelecimento.id,
      hospital: veterinario.estabelecimento.nome,
      validacoesRealizadas: veterinario.validacoesRealizadas,
    }),
  };
}

const logar = (conta) =>
  definir({ usuario: paraUsuario(conta), carregando: false });

// ─── Leitura, para as telas ───────────────────────────────────────────────────

// A conta logada, ou null para o visitante.
export function useSessao() {
  return useSyncExternalStore(assinar, () => estado).usuario;
}

// { usuario, carregando }, para quem precisa saber se a resposta já chegou.
export function useEstadoSessao() {
  return useSyncExternalStore(assinar, () => estado);
}

// ─── Ações ────────────────────────────────────────────────────────────────────

// Pergunta à API quem está logado. Sem resposta (API fora do ar), o site
// segue como visitante.
export async function carregarSessao() {
  try {
    const { usuario } = await chamarApi("/sessao");
    logar(usuario);
  } catch {
    logar(null);
  }
}

// Erros (senha errada, dados inválidos) chegam como ErroApi, para a tela
// mostrar a mensagem.
export async function entrar(email, senha) {
  const { usuario } = await chamarApi("/sessao", {
    metodo: "POST",
    corpo: { email, senha },
  });
  logar(usuario);
}

// Cria a conta; a API já deixa a pessoa logada.
export async function cadastrar(dados) {
  const { usuario } = await chamarApi("/usuarios", {
    metodo: "POST",
    corpo: dados,
  });
  logar(usuario);
}

export async function sair() {
  try {
    await chamarApi("/sessao", { metodo: "DELETE" });
  } finally {
    logar(null);
  }
}

// Pergunta à API se o e-mail ou o CPF já têm conta. Devolve a mensagem de
// cada campo repetido ({ email: "Já existe..." }), ou {} se estão livres.
export async function conferirDisponibilidade(dados) {
  const { campos } = await chamarApi("/usuarios/disponibilidade", {
    metodo: "POST",
    corpo: dados,
  });
  return campos;
}

// Confere um código de convite de veterinário antes do fim do cadastro.
export async function consultarConvite(codigo) {
  const { convite } = await chamarApi(
    `/convites/${encodeURIComponent(codigo)}`,
  );
  return convite;
}

// Edição do próprio cadastro. Por enquanto vale só até recarregar a página:
// gravar na API é a próxima etapa (F3).
export function atualizarConta(dados) {
  definir({ ...estado, usuario: { ...estado.usuario, ...dados } });
}
