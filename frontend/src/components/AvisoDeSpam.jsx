// O aviso de procurar no spam, nas telas que esperam um e-mail do UFVet. O
// UFVet não tem domínio próprio: o e-mail sai de uma conta comum do Gmail, e
// alguns provedores o mandam para o spam.
function AvisoDeSpam() {
  return (
    <div className="rounded-2xl bg-[#f4efef] px-5 py-4">
      <p className="flex items-center gap-2 font-semibold text-[#1a1c1c]">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[20px] text-[#5f5e5e]"
        >
          search
        </span>
        Não chegou?
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-[#5b403f]">
        Procure no spam ou no lixo eletrônico. Como o UFVet não tem um endereço
        de e-mail próprio, a mensagem pode ter ido para lá. Ela também pode
        levar alguns minutos para chegar.
      </p>
    </div>
  );
}

export default AvisoDeSpam;
