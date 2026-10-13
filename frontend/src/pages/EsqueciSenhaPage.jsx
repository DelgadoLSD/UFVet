import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AvisoDeSpam from "../components/AvisoDeSpam";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import IconeDeEstado from "../components/IconeDeEstado";
import LayoutAutenticacao from "../components/LayoutAutenticacao";
import { erroEmail } from "../regras/conta";
import { VALIDADE_DO_LINK } from "../regras/link";
import { pedirSenhaNova } from "../servicos/email";
// "Shelter dog ready for adoption", foto de Michael G (Unsplash, uso livre)
import fotoCaoVermelho from "../assets/auth/cao-vermelho.jpg";

// "Esqueceu a senha?" (/esqueci-a-senha): a pessoa digita o e-mail e recebe
// um link para criar uma senha nova (F4). Como no login, a resposta não diz
// se o e-mail tem conta: a tela diz "se houver uma conta", sempre.
function EsqueciSenhaPage() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? "");
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    const problema = erroEmail(email);
    if (problema) {
      setErros({ email: problema });
      return;
    }
    setEnviando(true);
    setErros({});
    try {
      await pedirSenhaNova(email.trim());
      setEnviadoPara(email.trim());
    } catch (falha) {
      setErros(
        falha.campos?.email
          ? { email: falha.campos.email }
          : { geral: falha.message },
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutAutenticacao
      foto={fotoCaoVermelho}
      fotoPosicao="center 20%"
      corFundo="#a1050e"
    >
      {enviadoPara ? (
        <>
          <IconeDeEstado nome="mark_email_unread" />
          <h1 className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">
            Confira seu e-mail
          </h1>
          <p role="status" className="mt-3 text-[#5b403f] leading-relaxed">
            Se houver uma conta com{" "}
            <strong className="font-semibold text-[#1a1c1c] break-all">
              {enviadoPara}
            </strong>
            , mandamos um link para criar uma senha nova. Ele vale por{" "}
            {VALIDADE_DO_LINK.senha}.
          </p>
          <div className="mt-8">
            <AvisoDeSpam />
          </div>
          <div className="mt-8 space-y-3">
            <Botao
              as={Link}
              to="/login"
              state={{ email: enviadoPara }}
              tamanho="lg"
              className="w-full"
            >
              Voltar para entrar
            </Botao>
            <Botao
              variante="secundario"
              tamanho="lg"
              className="w-full"
              onClick={() => setEnviadoPara("")}
            >
              Usar outro e-mail
            </Botao>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a1c1c]">
            Esqueceu a senha?
          </h1>
          <p className="mt-3 text-[#5b403f] leading-relaxed">
            Digite o e-mail da sua conta. Mandamos para ele um link para você
            criar uma senha nova.
          </p>
          <form onSubmit={enviar} noValidate className="mt-10 space-y-5">
            <Campo
              id="email"
              rotulo="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erro={erros.email}
            />
            <AvisoErro>{erros.geral}</AvisoErro>
            <div className="pt-3">
              <Botao
                type="submit"
                tamanho="lg"
                className="w-full"
                disabled={enviando}
              >
                {enviando ? "Mandando…" : "Mandar o link"}
              </Botao>
            </div>
          </form>
          <p className="mt-10 text-sm text-[#5f5e5e]">
            Lembrou a senha?{" "}
            <Link
              to="/login"
              state={email.trim() ? { email: email.trim() } : undefined}
              className="font-semibold text-[#9e0a24] hover:underline"
            >
              Entrar
            </Link>
          </p>
        </>
      )}
    </LayoutAutenticacao>
  );
}

export default EsqueciSenhaPage;
