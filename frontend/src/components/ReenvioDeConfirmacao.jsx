import { useState } from "react";
import { erroEmail } from "../regras/conta";
import { reenviarConfirmacao } from "../servicos/email";
import Botao from "./Botao";

// "Mandar o link de novo": manda outro link de confirmação para `email`. Fica
// na espera depois do cadastro e na página de entrar, quando a conta ainda
// não confirmou o e-mail. O resultado aparece numa linha logo abaixo do
// botão, com ícone e texto (não só a cor): deu certo, ou o que deu errado. A
// API diz quando o e-mail não saiu e quando o limite de e-mails por hora
// chegou.
//
// Para o e-mail sem cadastro esperando confirmação, a API responde como se
// tivesse mandado (ela não conta quem tem conta). Quando a página não sabe
// se há um cadastro (a pessoa digitou o e-mail aqui), a linha diz "se
// houver", em vez de garantir um envio que pode não existir.
//
// `onEnviado(data)` avisa a página que o link saiu, com a hora.
function ReenvioDeConfirmacao({
  email,
  seHouver = false,
  variante = "secundario",
  rotulo = "Mandar o link de novo",
  onEnviado,
}) {
  const [fase, setFase] = useState("pronto");
  const [erro, setErro] = useState("");
  const [enviadoEm, setEnviadoEm] = useState(null);

  const mandar = async () => {
    const problema = erroEmail(email);
    if (problema) {
      setErro(problema);
      setFase("pronto");
      return;
    }
    setFase("enviando");
    setErro("");
    try {
      await reenviarConfirmacao(email.trim());
      const agora = new Date();
      setEnviadoEm(agora);
      setFase("enviado");
      onEnviado?.(agora);
    } catch (falha) {
      setErro(falha.campos?.email ?? falha.message);
      setFase("pronto");
    }
  };

  const hora = enviadoEm?.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <Botao
        variante={variante}
        tamanho="lg"
        className="w-full"
        onClick={mandar}
        disabled={fase === "enviando"}
      >
        {fase === "enviando" ? "Mandando…" : rotulo}
      </Botao>
      {fase === "enviado" && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 text-sm leading-snug text-[#17643a]"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[18px] shrink-0"
          >
            check_circle
          </span>
          <span>
            {seHouver
              ? "Se houver um cadastro esperando confirmação com esse e-mail, mandamos outro link."
              : `Mandamos outro link às ${hora}.`}{" "}
            Use o do e-mail mais recente: os anteriores deixam de valer.
          </span>
        </p>
      )}
      {erro && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-sm leading-snug text-[#9e0a24]"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[18px] shrink-0"
          >
            error
          </span>
          <span>{erro}</span>
        </p>
      )}
    </div>
  );
}

export default ReenvioDeConfirmacao;
