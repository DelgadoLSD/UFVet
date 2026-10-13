import { useState } from "react";
import { erroEmail } from "../regras/conta";
import { reenviarConfirmacao } from "../servicos/email";
import AvisoErro from "./AvisoErro";
import Botao from "./Botao";

// "Mandar o link de novo": manda outro link de confirmação para `email`. Fica
// na espera depois do cadastro e na página de entrar, quando a conta ainda
// não confirmou o e-mail. A API limita quantos e-mails um endereço recebe
// por hora, e a mensagem dela aparece aqui quando o limite chega.
//
// A API responde igual tendo ou não um cadastro esperando com esse e-mail.
// Quando a página não sabe se há um (a pessoa digitou o e-mail aqui), o
// aviso diz "se houver", em vez de garantir um envio que pode não existir.
function ReenvioDeConfirmacao({ email, seHouver = false }) {
  const [fase, setFase] = useState("pronto");
  const [erro, setErro] = useState("");
  const [enviadoPara, setEnviadoPara] = useState("");

  const mandar = async () => {
    const problema = erroEmail(email);
    if (problema) {
      setErro(problema);
      return;
    }
    setFase("enviando");
    setErro("");
    try {
      await reenviarConfirmacao(email.trim());
      setEnviadoPara(email.trim());
      setFase("enviado");
    } catch (falha) {
      setErro(falha.campos?.email ?? falha.message);
      setFase("pronto");
    }
  };

  return (
    <div className="space-y-3">
      {fase === "enviado" && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl bg-[#e6f4ea] px-3.5 py-3 text-sm text-[#17643a] leading-snug"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[18px] shrink-0"
          >
            forward_to_inbox
          </span>
          {seHouver ? (
            <span>
              Se houver um cadastro esperando confirmação com{" "}
              <strong className="font-semibold break-all">{enviadoPara}</strong>
              , mandamos outro link. Use o do e-mail mais recente: os anteriores
              deixam de valer.
            </span>
          ) : (
            <span>
              Mandamos outro link para{" "}
              <strong className="font-semibold break-all">{enviadoPara}</strong>
              . Use o do e-mail mais recente: os anteriores deixam de valer.
            </span>
          )}
        </p>
      )}
      <AvisoErro>{erro}</AvisoErro>
      <Botao
        variante="secundario"
        tamanho="lg"
        icone="forward_to_inbox"
        className="w-full"
        onClick={mandar}
        disabled={fase === "enviando"}
      >
        {fase === "enviando" ? "Mandando…" : "Mandar o link de novo"}
      </Botao>
    </div>
  );
}

export default ReenvioDeConfirmacao;
