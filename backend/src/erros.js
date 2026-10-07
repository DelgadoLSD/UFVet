import multer from "multer";
import { ZodError } from "zod";
import {
  MAXIMO_FOTOS_POR_ANIMAL,
  TAMANHO_MAXIMO_MB,
} from "./middlewares/envio.js";
import { registrar } from "./registro.js";

// O que dizer quando um envio de fotos passa dos limites, ou null quando o
// formulário veio fora do combinado (um campo de arquivo que não existe).
function mensagemDeEnvio({ code, field }) {
  if (code === "LIMIT_FILE_SIZE") {
    return `Cada foto pode ter no máximo ${TAMANHO_MAXIMO_MB} MB.`;
  }
  // Passar do total de arquivos só acontece com as fotos de um animal (a de
  // perfil é uma só, e a segunda já é barrada como inesperada); esse aviso
  // não diz o campo.
  if (
    code === "LIMIT_FILE_COUNT" ||
    (code === "LIMIT_UNEXPECTED_FILE" && field === "fotos")
  ) {
    return `Cada animal pode ter até ${MAXIMO_FOTOS_POR_ANIMAL} fotos.`;
  }
  if (code === "LIMIT_UNEXPECTED_FILE" && field === "foto") {
    return "Envie uma foto só.";
  }
  return null;
}

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
  // Limites do envio de fotos (middlewares/envio.js).
  if (erro instanceof multer.MulterError) {
    const mensagem = mensagemDeEnvio(erro);
    if (!mensagem) {
      return res
        .status(400)
        .json({ erro: "Os dados enviados estão mal formados." });
    }
    return res
      .status(erro.code === "LIMIT_FILE_SIZE" ? 413 : 400)
      .json({ erro: mensagem, campos: { [erro.field ?? "fotos"]: mensagem } });
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
