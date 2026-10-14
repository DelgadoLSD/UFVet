// O endereço de e-mail em destaque, numa linha só dele. Se não couber, a
// quebra é logo depois do "@" (e, num endereço enorme, onde precisar), nunca
// no meio do ".com".
function EnderecoDeEmail({ email }) {
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

export default EnderecoDeEmail;
