import { useSyncExternalStore } from "react";
import { ErroApi, chamarApi, definirContaDaAba } from "./api";
import { confirmar } from "../hooks/confirmacoes";
import { nomeCurto } from "../util/texto";

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
//
// O navegador guarda um login só por site, o mesmo para todas as abas: sair
// numa aba e entrar com outra conta muda o login de todas. Por isso cada aba
// acompanha a conta do navegador (ver "Várias abas", abaixo), e cada pedido
// diz à API qual conta a aba está mostrando (servicos/api.js).

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

const logar = (conta, aviso = "") => {
  definirContaDaAba(conta?.codigo ?? null);
  definir({ usuario: paraUsuario(conta), carregando: false, aviso });
};

// ─── Várias abas ──────────────────────────────────────────────────────────────
//
// Quem entra, sai ou cria a conta numa aba avisa as outras abas abertas do
// site, pelo canal do navegador (BroadcastChannel). Cada uma pergunta de novo
// à API quem está logado e, se a conta mudou, passa para a nova, com um aviso
// embaixo da tela. A mesma conferência acontece quando a pessoa volta para
// uma aba (uma rede de segurança, para o que o canal não pegou). Fora do
// navegador (nos testes), não há canal nem abas.

const noNavegador = typeof window !== "undefined";
const canal =
  noNavegador && "BroadcastChannel" in window
    ? new BroadcastChannel("ufvet-sessao")
    : null;

const avisarOutrasAbas = () => canal?.postMessage("conta-mudou");

// Pergunta à API quem está logado e, se não é a conta que esta aba mostra,
// passa para a conta certa, com um aviso embaixo da tela. `acaoRecusada`:
// a conferência veio de uma ação que a API recusou por isso, e o aviso diz
// que ela não foi feita. Uma falha de rede não muda nada: a próxima
// conferência tenta de novo.
let conferindo = null;
export function conferirSessao({ acaoRecusada = false } = {}) {
  conferindo ??= (async () => {
    if (estado.carregando) return null;
    let conta;
    try {
      ({ usuario: conta } = await chamarApi("/sessao"));
    } catch {
      return null;
    }
    const antes = estado.usuario;
    if ((conta?.codigo ?? null) === (antes?.codigo ?? null)) return null;
    if (conta) {
      logar(conta);
      confirmar(
        `Esta aba passou para a conta de ${nomeCurto(estado.usuario)}`,
        acaoRecusada
          ? "Você entrou com ela em outra aba, e a última ação não foi feita. Confira a conta antes de continuar."
          : "Você entrou com ela em outra aba. O navegador guarda um login por vez.",
      );
    } else {
      logar(null, "Você saiu da conta em outra aba.");
      confirmar(
        "Você saiu da conta em outra aba",
        acaoRecusada ? "A última ação não foi feita." : undefined,
      );
    }
  })().finally(() => {
    conferindo = null;
  });
  return conferindo;
}

if (noNavegador) {
  canal?.addEventListener("message", () => conferirSessao());
  window.addEventListener("focus", () => conferirSessao());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") conferirSessao();
  });
}

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
  avisarOutrasAbas();
}

// Cria a conta; a API já deixa a pessoa logada.
export async function cadastrar(dados) {
  const { usuario } = await chamarApi("/usuarios", {
    metodo: "POST",
    corpo: dados,
  });
  logar(usuario);
  avisarOutrasAbas();
}

export async function sair() {
  try {
    await chamarApi("/sessao", { metodo: "DELETE" });
  } finally {
    logar(null);
    avisarOutrasAbas();
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
// aviso do porquê. Se o login do navegador já é de outra conta (alguém saiu
// e entrou com outra em outra aba), a API não faz nada e responde
// CONTA_TROCADA: a aba passa para a conta certa, e a mensagem diz o que
// aconteceu. Os outros serviços (animais, acesso aos contatos) também passam
// por aqui.
export async function chamarComLogin(caminho, opcoes) {
  try {
    return await chamarApi(caminho, opcoes);
  } catch (falha) {
    if (falha.status === 401) {
      logar(null, "Sua sessão terminou. Entre de novo para continuar.");
    }
    if (falha.codigo === "CONTA_TROCADA") {
      await conferirSessao({ acaoRecusada: true });
      const agora = estado.usuario;
      throw new ErroApi(
        falha.status,
        agora
          ? `Nada foi feito: este navegador agora está na conta de ${nomeCurto(agora)}, que entrou em outra aba. A página passou para essa conta; confira antes de continuar.`
          : "Nada foi feito: você saiu da conta em outra aba. Entre de novo para continuar.",
        null,
        falha.codigo,
      );
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
  avisarOutrasAbas();
}

// Não tem volta: a API apaga a conta e o que é só dela.
export async function encerrarConta(senhaAtual) {
  await chamarComLogin("/conta", { metodo: "DELETE", corpo: { senhaAtual } });
  logar(null);
  avisarOutrasAbas();
}
