// O aviso de procurar no spam, nas telas que esperam um e-mail do UFVet. O
// UFVet não tem domínio próprio: o e-mail sai de uma conta comum do Gmail, e
// alguns provedores o mandam para o spam. É um parágrafo, e não uma caixa:
// a tela já tem a prévia do e-mail e o botão, e uma caixa a mais só competiria
// com eles.
function AvisoDeSpam() {
  return (
    <p className="text-[15px] leading-relaxed text-[#5b403f]">
      <strong className="font-semibold text-[#1a1c1c]">Não chegou?</strong>{" "}
      Procure no spam ou no lixo eletrônico. Como o UFVet não tem um endereço de
      e-mail próprio, a mensagem pode ter ido para lá. Ela também pode levar
      alguns minutos para chegar.
    </p>
  );
}

export default AvisoDeSpam;
