import { nomeCurto } from "../util/texto";

// Foto de uma pessoa, com as iniciais como reserva para quem ainda não subiu
// foto. Aparece no menu da conta, nos cartões de quem libera ou pede acesso aos
// contatos e na página da conta. `fotoPosicao` e `fotoZoom`, nos dados da
// pessoa, ajustam o enquadramento de cada retrato.
function Avatar({
  pessoa,
  tamanho = "w-9 h-9",
  fundo = "bg-white/15",
  formato = "rounded-full",
  textoIniciais = "text-sm",
}) {
  // "Victor Martins" -> "VM"
  const iniciais = nomeCurto(pessoa)
    .split(" ")
    .map((parte) => parte[0])
    .join("");

  return (
    <span
      className={`${tamanho} ${fundo} ${formato} overflow-hidden flex items-center justify-center shrink-0`}
    >
      {pessoa.foto ? (
        <img
          src={pessoa.foto}
          alt=""
          style={{
            objectPosition: pessoa.fotoPosicao,
            transform: `scale(${pessoa.fotoZoom || 1})`,
            transformOrigin: pessoa.fotoPosicao,
          }}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`${textoIniciais} font-bold text-white`}>
          {iniciais}
        </span>
      )}
    </span>
  );
}

export default Avatar;
