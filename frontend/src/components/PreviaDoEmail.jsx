// O e-mail do UFVet como ele aparece na caixa de entrada: quem manda, o
// assunto e o começo do texto. Mostra à pessoa exatamente o que procurar,
// inclusive no spam. Os textos são os dos e-mails de verdade
// (backend/src/emails.js): mudando lá, muda aqui.
const EMAILS = {
  confirmacao: {
    assunto: "Confirme seu e-mail no UFVet",
    previa:
      "Para terminar o seu cadastro no UFVet, confirme que este e-mail é seu.",
  },
  senha: {
    assunto: "Crie uma senha nova no UFVet",
    previa:
      "Recebemos um pedido para criar uma senha nova na sua conta do UFVet.",
  },
};

// "21:14", a hora em que o e-mail saiu, como a caixa de entrada mostra.
const horaDe = (data) =>
  data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// O ponto vermelho é o de "não lido", como nas caixas de entrada. `enviadoEm`
// pode faltar: quando a página não sabe a hora do envio, a linha vai sem.
export function PreviaDoEmail({ tipo, enviadoEm }) {
  const { assunto, previa } = EMAILS[tipo];
  return (
    <figure className="rounded-xl border border-[#e6dcdc] bg-white px-4 py-3.5">
      <figcaption className="sr-only">
        Como o e-mail aparece na sua caixa de entrada
      </figcaption>
      <p className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-bold text-[#1a1c1c]">
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-[#9e0a24] shrink-0"
          />
          UFVet
        </span>
        {enviadoEm && (
          <span className="text-xs text-[#5f5e5e] tabular-nums">
            {horaDe(enviadoEm)}
          </span>
        )}
      </p>
      <p className="mt-1 truncate text-[15px] font-semibold text-[#1a1c1c]">
        {assunto}
      </p>
      <p className="mt-0.5 truncate text-sm text-[#5f5e5e]">{previa}</p>
    </figure>
  );
}

// O endereço de e-mail em destaque, numa linha só dele. Se não couber, a
// quebra é logo depois do "@" (e, num endereço enorme, onde precisar), nunca
// no meio do ".com".
export function EnderecoDeEmail({ email }) {
  const arroba = email.lastIndexOf("@");
  return (
    <span className="block mt-1 text-xl font-semibold tracking-tight text-[#1a1c1c] [overflow-wrap:anywhere]">
      {arroba > 0 ? (
        <>
          {email.slice(0, arroba + 1)}
          <wbr />
          {email.slice(arroba + 1)}
        </>
      ) : (
        email
      )}
    </span>
  );
}
