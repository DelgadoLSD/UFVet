// Foto de uma pessoa, com as iniciais como reserva para quem ainda não subiu
// foto — usado no header, na confirmação de código e nos pedidos.
function Avatar({
  pessoa,
  tamanho = "w-9 h-9",
  fundo = "bg-white/15",
  formato = "rounded-full",
  textoIniciais = "text-sm",
}) {
  const iniciais = pessoa.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
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
