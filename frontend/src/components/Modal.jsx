function Modal({
  titulo,
  subtitulo,
  largura = "max-w-xl",
  onClose,
  children,
  rodape,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${largura} max-h-[90vh] flex flex-col`}
      >
        <div className="border-b border-[#e4bebc] px-8 py-5 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#1a1c1c]">{titulo}</h2>
            {subtitulo && (
              <p className="text-xs text-[#5f5e5e] mt-0.5">{subtitulo}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-[#f3f3f3] flex items-center justify-center hover:bg-[#e4bebc] transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[#5f5e5e] text-xl">
              close
            </span>
          </button>
        </div>

        <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0">{children}</div>

        {rodape && (
          <div className="border-t border-[#e4bebc] px-8 py-4 shrink-0">
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
