// Linha com o resultado de uma ação, com ícone e texto (não só a cor).
function LinhaDeResultado({ erro = false, children }) {
  return (
    <p
      role={erro ? "alert" : "status"}
      className={`mt-3 flex items-start gap-2 text-sm leading-snug ${
        erro ? "text-[#9e0a24]" : "text-[#17643a]"
      }`}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[18px] shrink-0"
      >
        {erro ? "error" : "check_circle"}
      </span>
      <span>{children}</span>
    </p>
  );
}

export default LinhaDeResultado;
