import Header from "./Header";

// Tela dividida das páginas de entrar e criar conta: formulário de um lado,
// foto do outro, sem texto sobre a imagem.
function LayoutAutenticacao({
  foto,
  fotoPosicao = "center",
  corFundo,
  fotoAEsquerda = false,
  children,
}) {
  const painelFoto = (
    <section
      className="hidden md:block relative overflow-hidden"
      style={{ backgroundColor: corFundo }}
    >
      <img
        src={foto}
        alt=""
        style={{ objectPosition: fotoPosicao }}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </section>
  );

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 max-md:pt-16 grid md:grid-cols-2 bg-white">
        {fotoAEsquerda && painelFoto}
        <section className="flex items-start md:items-center justify-center px-5 py-10 md:py-12 md:px-12 min-w-0">
          {/* min-w-0 aqui e na seção: a coluna encolhe até a largura da tela
              mesmo com uma linha que não quebra (um endereço de e-mail
              longo); sem isso, a coluna crescia e a página rolava de lado. */}
          <div className="w-full max-w-[420px] min-w-0">{children}</div>
        </section>
        {!fotoAEsquerda && painelFoto}
      </main>
    </>
  );
}

export default LayoutAutenticacao;
