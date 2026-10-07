import { useSyncExternalStore } from "react";
import { chamarApi } from "./api";

// Quem está usando o site: a conta logada, ou ninguém (o visitante). Também
// as ações sobre a própria conta: entrar, criar, mudar os dados, trocar a
// senha, sair e encerrar.
//
// A sessão de verdade fica na API, num cookie que o site nem consegue ler.
// Aqui fica só uma cópia dos dados da conta, para as telas desenharem. O
// site pergunta à API quem está logado assim que abre (carregarSessao, em
// main.jsx); até a resposta chegar, `carregando` fica verdadeiro e as páginas
// que exigem login esperam. `aviso` diz, na página de entrar, por que a
// pessoa saiu da conta sem ter clicado em "Sair" (a sessão venceu, por
// exemplo).

let estado = { usuario: null, carregando: true, aviso: "" };
const ouvintes = new Set();

const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};

const definir = (novo) => {
  estado = novo;
  ouvintes.forEach((aviso) => aviso());
};

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
    ...(veterinario && {
      tratamento: veterinario.tratamento,
      crmv: `${veterinario.crmv}-${veterinario.ufCrmv}`,
      hospitalId: veterinario.estabelecimento.id,
      hospital: veterinario.estabelecimento.nome,
      validacoesRealizadas: veterinario.validacoesRealizadas,
    }),
  };
}

const logar = (conta, aviso = "") =>
  definir({ usuario: paraUsuario(conta), carregando: false, aviso });

// ─── Leitura, para as telas ───────────────────────────────────────────────────

// A conta logada, ou null para o visitante.
export function useSessao() {
  return useSyncExternalStore(assinar, () => estado).usuario;
}

// { usuario, carregando, aviso }, para quem precisa saber se a resposta já
// chegou ou por que a pessoa saiu.
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

// A página de entrar apaga o aviso assim que o mostra, para ele não
// reaparecer numa próxima visita.
export function apagarAviso() {
  if (estado.aviso) definir({ ...estado, aviso: "" });
}

// ─── A própria conta (F3, F4 e F5) ────────────────────────────────────────────

// Pedido que só vale com login. Se a sessão venceu (8 horas) ou foi
// derrubada em outro aparelho, a API responde 401: o site passa a tratar a
// pessoa como visitante, e a página protegida a leva para "Entrar", com o
// aviso do porquê. Os outros serviços (animais) também passam por aqui.
export async function chamarComLogin(caminho, opcoes) {
  try {
    return await chamarApi(caminho, opcoes);
  } catch (falha) {
    if (falha.status === 401) {
      logar(null, "Sua sessão terminou. Entre de novo para continuar.");
    }
    throw falha;
  }
}

// Grava os dados da conta. Trocar o e-mail pede também `senhaAtual`.
// Devolve a conta atualizada, do jeito que as telas usam.
export async function salvarConta(dados) {
  const { usuario } = await chamarComLogin("/conta", {
    metodo: "PATCH",
    corpo: dados,
  });
  logar(usuario);
  return estado.usuario;
}

// Troca a foto de perfil. A API confere a imagem, reduz e apaga a
// localização guardada pelo celular.
export async function trocarFotoDePerfil(arquivo) {
  const formulario = new FormData();
  formulario.append("foto", arquivo);
  const { usuario } = await chamarComLogin("/conta/foto", {
    metodo: "PUT",
    corpo: formulario,
  });
  logar(usuario);
}

// Volta para as iniciais no lugar da foto.
export async function removerFotoDePerfil() {
  const { usuario } = await chamarComLogin("/conta/foto", {
    metodo: "DELETE",
  });
  logar(usuario);
}

// Os outros aparelhos saem da conta; este continua.
export async function trocarSenha(senhaAtual, senhaNova) {
  await chamarComLogin("/conta/senha", {
    metodo: "PUT",
    corpo: { senhaAtual, senhaNova },
  });
}

// Inclusive neste aparelho.
export async function sairDeTodosOsAparelhos() {
  await chamarComLogin("/sessoes", { metodo: "DELETE" });
  logar(null, "Você saiu da conta em todos os aparelhos, inclusive neste.");
}

// Não tem volta: a API apaga a conta e o que é só dela.
export async function encerrarConta(senhaAtual) {
  await chamarComLogin("/conta", { metodo: "DELETE", corpo: { senhaAtual } });
  logar(null);
}
