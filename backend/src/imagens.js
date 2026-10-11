import sharp from "sharp";
import { ErroApi } from "./erros.js";

// O tratamento de toda imagem que chega à API (NF8.5), antes de ela ser
// guardada: as fotos e os exames fotografados.
// - abre o arquivo para conferir que é mesmo uma imagem, em vez de confiar
//   no nome ou no tipo que o navegador declara;
// - recusa imagens gigantes em pixels, que pesam pouco mas ocupariam
//   gigabytes de memória ao abrir;
// - endireita a imagem pela orientação da câmera e a reduz ao tamanho em que
//   o site a mostra (uma foto de celular tem de 3 a 8 MB; a reduzida, poucas
//   centenas de KB);
// - grava a imagem de novo, em WebP. Os metadados da original não passam,
//   inclusive a localização GPS que o celular guarda em cada foto: uma foto
//   tirada em casa revelaria o endereço do tutor (NF16.1). Regravar também
//   desmonta arquivos disfarçados, que são imagem e outra coisa ao mesmo
//   tempo.

const FORMATOS_ACEITOS = ["jpeg", "png", "webp"];
// Mais que o dobro de qualquer câmera de celular.
const PIXELS_MAXIMOS = 50_000_000;

export const MENSAGEM_FORMATO = "Envie a foto em JPG, PNG ou WebP.";

// A foto de um animal ou de perfil: o tamanho em que o site a mostra.
const FOTO = {
  ladoMaximo: 1600, // px
  qualidade: 80,
  mensagemFormato: MENSAGEM_FORMATO,
  mensagemPixels: "A foto tem resolução grande demais. Envie uma menor.",
};

// O exame fotografado (um laudo, a carteira de vacinação) fica maior e mais
// nítido: as letras miúdas de um laudo precisam continuar legíveis.
const EXAME = {
  ladoMaximo: 2400, // px
  qualidade: 85,
  mensagemFormato: "Envie o exame em PDF, JPG, PNG ou WebP.",
  mensagemPixels: "A imagem tem resolução grande demais. Envie uma menor.",
};

// Devolve a imagem tratada, pronta para guardar. `campo` é o nome do campo
// do formulário, para a mensagem de erro aparecer no lugar certo.
async function regravar(conteudo, campo, perfil) {
  const recusar = (mensagem) =>
    new ErroApi(400, mensagem, { campos: { [campo]: mensagem } });

  const imagem = sharp(conteudo, {
    limitInputPixels: PIXELS_MAXIMOS,
    failOn: "error",
  });
  try {
    const { format } = await imagem.metadata();
    if (!FORMATOS_ACEITOS.includes(format)) {
      throw recusar(perfil.mensagemFormato);
    }
    return await imagem
      .rotate()
      .resize({
        width: perfil.ladoMaximo,
        height: perfil.ladoMaximo,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: perfil.qualidade })
      .toBuffer();
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro;
    // Qualquer outra falha é do arquivo: corrompido, ou não é uma imagem.
    throw recusar(
      /pixel limit/i.test(erro.message)
        ? perfil.mensagemPixels
        : perfil.mensagemFormato,
    );
  }
}

export const prepararFoto = (conteudo, campo) =>
  regravar(conteudo, campo, FOTO);

export const prepararImagemDeExame = (conteudo, campo) =>
  regravar(conteudo, campo, EXAME);
