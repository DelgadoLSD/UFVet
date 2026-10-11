// Conversa com a API do UFVet.
//
// O site chama sempre o próprio endereço, em /api. No computador, o Vite
// repassa esses pedidos para a API (vite.config.js); publicado, a hospedagem
// faz o mesmo. Por isso o navegador manda junto, sozinho, o cookie do crachá
// de sessão, e nenhum outro site consegue usá-lo.

// Erro devolvido pela API, com a mensagem para mostrar e, quando o problema
// é em dados enviados, a mensagem de cada campo ({ email: "..." }). Sem
// problema de campo, `campos` é null: é assim que os formulários separam o
// erro de um campo, mostrado embaixo dele, do erro geral (sem conexão, limite
// de tentativas), mostrado acima do botão. Um objeto vazio no lugar do null
// fazia o erro geral sumir.
//
// `codigo` marca os erros que o site trata de um jeito próprio (por exemplo,
// "CONTA_TROCADA", ver servicos/sessao.js).
export class ErroApi extends Error {
  constructor(status, mensagem, campos = null, codigo = null) {
    super(mensagem);
    this.status = status;
    this.campos = campos && Object.keys(campos).length > 0 ? campos : null;
    this.codigo = codigo;
  }
}

// O código da conta que esta aba está mostrando, ou null (o visitante). Vai
// em todo pedido, no cabeçalho X-Conta: a API recusa a ação quando o login
// do navegador já é de outra conta (alguém saiu e entrou com outra em outra
// aba), em vez de agir em nome de quem não aparece na tela. Quem atualiza é
// servicos/sessao.js, a cada entrada e saída.
let contaDaAba = null;
export const definirContaDaAba = (codigo) => {
  contaDaAba = codigo;
};

// `corpo` vai em JSON; com arquivos (fotos, exames), é um FormData, que o
// navegador envia como formulário com arquivos e com o cabeçalho certo. Com
// `comoArquivo`, a resposta volta como arquivo (Blob), e não como JSON: é
// assim que o site abre um exame. Os erros chegam em JSON do mesmo jeito.
export async function chamarApi(
  caminho,
  { metodo = "GET", corpo, comoArquivo = false } = {},
) {
  const comArquivos = corpo instanceof FormData;
  let resposta;
  try {
    const cabecalhos = {};
    if (corpo && !comArquivos) cabecalhos["Content-Type"] = "application/json";
    if (contaDaAba) cabecalhos["X-Conta"] = contaDaAba;
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo && !comArquivos ? JSON.stringify(corpo) : corpo,
    });
  } catch {
    throw new ErroApi(
      0,
      "Não foi possível falar com o servidor. Confira sua internet e tente de novo.",
    );
  }

  if (resposta.status === 204) return null;
  if (comoArquivo && resposta.ok) return resposta.blob();
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      dados?.erro ?? "Algo deu errado. Tente de novo em instantes.",
      dados?.campos,
      dados?.codigo ?? null,
    );
  }
  return dados;
}
