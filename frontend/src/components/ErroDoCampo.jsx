// Mensagem de erro embaixo de um campo que não é um Campo (lista, botões). O
// resto das propriedades vai para o parágrafo: `id`, para o leitor de tela
// ligar a mensagem ao campo, e marcações como `data-erro`.
function ErroDoCampo({ children, className = "mt-2", ...resto }) {
  if (!children) return null;
  return (
    <p {...resto} className={`text-xs text-[#9e0a24] ${className}`}>
      {children}
    </p>
  );
}

export default ErroDoCampo;
