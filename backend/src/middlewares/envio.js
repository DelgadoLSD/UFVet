import multer from "multer";

// Recebe os arquivos enviados pelo site (fotos e exames), num formulário com
// arquivos (multipart). Eles ficam na memória só durante o pedido: nada é
// gravado antes de ser conferido e tratado (imagens.js e
// controladores/documentos.js). Pedido sem arquivos (JSON) passa direto.
//
// Os limites barram, antes de qualquer processamento, quem tentasse ocupar a
// memória da API com arquivos enormes ou com muitos campos.

export const MAXIMO_FOTOS_POR_ANIMAL = 5; // NF8.3
export const TAMANHO_MAXIMO_MB = 10;

const receber = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: TAMANHO_MAXIMO_MB * 1024 * 1024,
    files: MAXIMO_FOTOS_POR_ANIMAL,
    fields: 5,
    fieldSize: 20 * 1024,
  },
});

// As fotos de um animal, no campo "fotos"; os dados, no campo "dados".
export const receberFotos = receber.array("fotos", MAXIMO_FOTOS_POR_ANIMAL);

// A foto de perfil, no campo "foto".
export const receberFoto = receber.single("foto");

// O arquivo de um exame (imagem ou PDF), no campo "arquivo".
export const receberExame = receber.single("arquivo");
