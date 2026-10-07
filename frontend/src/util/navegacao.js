// Para onde mandar a pessoa depois de entrar ou criar a conta.
//
// O destino chega na própria URL (/login?voltar=/conta), então qualquer um
// pode montar um link com outro valor. Só caminhos do próprio site são
// aceitos: um endereço de fora ("//site-falso.com") levaria a pessoa, logo
// depois de entrar, para uma página que imita o UFVet.
export function destinoSeguro(valor, padrao = "/meu-perfil") {
  if (typeof valor !== "string") return padrao;
  const interno =
    valor.startsWith("/") && !valor.startsWith("//") && !valor.includes("\\");
  return interno ? valor : padrao;
}
