// Conversa com a API do UFVet.
//
// O site chama sempre o próprio endereço, em /api. No computador, o Vite
// repassa esses pedidos para a API (vite.config.js); publicado, a hospedagem
// faz o mesmo. Por isso o navegador manda junto, sozinho, o cookie do crachá
// de sessão, e nenhum outro site consegue usá-lo.

// Erro devolvido pela API, com a mensagem para mostrar e, quando o problema
// é em dados enviados, a mensagem de cada campo ({ email: "..." }).
export class ErroApi extends Error {
  constructor(status, mensagem, campos = {}) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }
}

export async function chamarApi(caminho, { metodo = "GET", corpo } = {}) {
  let resposta;
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi(
      0,
      "Não foi possível falar com o servidor. Confira sua internet e tente de novo.",
    );
  }

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      dados?.erro ?? "Algo deu errado. Tente de novo em instantes.",
      dados?.campos,
    );
  }
  return dados;
}
