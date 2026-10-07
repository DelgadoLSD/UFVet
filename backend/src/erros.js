import { ZodError } from "zod";
import { registrar } from "./registro.js";

// Respostas de erro da API, todas no mesmo formato:
//
//   { "erro": "Mensagem para a pessoa ler",
//     "campos": { "email": "Mensagem sobre este campo" } }
//
// `campos` só aparece quando o problema é num dado enviado, para o site
// mostrar a mensagem embaixo do campo certo.

// Erro previsto pelas regras (dado inválido, sem permissão, não encontrado).
// Os controladores lançam este erro, e o tratador abaixo o transforma em
// resposta.
export class ErroApi extends Error {
  constructor(status, mensagem, { campos } = {}) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }
}

// As mensagens do Zod (validação), uma por campo: a primeira de cada um.
function camposDoZod(erro) {
  const campos = {};
  for (const problema of erro.issues) {
    const campo = problema.path.join(".") || "corpo";
    campos[campo] ??= problema.message;
  }
  return campos;
}

export function rotaInexistente(req, res) {
  res.status(404).json({ erro: "Endereço não encontrado." });
}

// Último passo de todo pedido que deu errado. Erros previstos viram a
// mensagem certa; erros imprevistos viram uma mensagem genérica, sem
// detalhes internos (que ajudariam quem tenta atacar), e ficam registrados.
// O Express só reconhece um tratador de erros pelos quatro parâmetros, por
// isso o `next` fica na assinatura mesmo sem uso.
export function tratarErros(erro, req, res, next) {
  if (erro instanceof ErroApi) {
    return res
      .status(erro.status)
      .json({ erro: erro.message, campos: erro.campos });
  }
  if (erro instanceof ZodError) {
    return res.status(400).json({
      erro: "Confira os campos destacados.",
      campos: camposDoZod(erro),
    });
  }
  // Corpo que não é JSON válido, ou grande demais (o limite fica em app.js).
  if (erro.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ erro: "Os dados enviados estão mal formados." });
  }
  if (erro.type === "entity.too.large") {
    return res
      .status(413)
      .json({ erro: "Os dados enviados são grandes demais." });
  }
  // Duas pessoas cadastrando o mesmo e-mail no mesmo instante: a checagem
  // dos controladores passa para as duas, e o banco barra a segunda.
  if (erro.code === "P2002") {
    return res
      .status(409)
      .json({ erro: "Já existe um cadastro com estes dados." });
  }

  registrar("erro_inesperado", {
    metodo: req.method,
    caminho: req.path,
    mensagem: erro.message,
    pilha: erro.stack,
  });
  res.status(500).json({
    erro: "Algo deu errado do nosso lado. Tente de novo em instantes.",
  });
}
