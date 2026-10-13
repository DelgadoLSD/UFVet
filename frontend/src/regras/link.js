// O código dos links que o UFVet manda por e-mail (confirmar o e-mail, criar
// uma senha nova) vem depois do "#" do endereço: 43 letras, números, "-" e
// "_" (ver backend/src/modelos/links.js). A parte depois do "#" não vai a
// nenhum servidor, então o código não fica nos registros de acesso.

const FORMATO = /^[A-Za-z0-9_-]{43}$/;

// Quanto tempo cada link vale, como as telas dizem. Os mesmos prazos da API
// (VALIDADE_HORAS, em backend/src/modelos/links.js).
export const VALIDADE_DO_LINK = { confirmacao: "24 horas", senha: "1 hora" };

// "#Ab3...": o código, ou null quando o endereço traz algo que não é um
// código inteiro (o leitor de e-mail cortou o link, ou a pessoa copiou só
// um pedaço).
export function codigoDoLink(hash = "") {
  const codigo = hash.replace(/^#/, "").trim();
  return FORMATO.test(codigo) ? codigo : null;
}

// Se o endereço traz alguma coisa depois do "#". Sem nada, a pessoa chegou
// à página sem o link (vindo do cadastro, por exemplo).
export const temCodigo = (hash = "") => hash.replace(/^#/, "").trim() !== "";
