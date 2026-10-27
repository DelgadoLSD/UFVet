import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import LayoutAutenticacao from "../components/LayoutAutenticacao";
import EnderecoDeEmail from "../components/EnderecoDeEmail";
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
          <h1 className="text-[2rem] leading-[1.1] md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">
            Confira <span className="whitespace-nowrap">seu e-mail</span>
          </h1>
          <div role="status" className="mt-4 text-[#5b403f] leading-relaxed">
            <p>Se houver uma conta com</p>
            <EnderecoDeEmail email={enviadoPara} />
            <p className="mt-1">mandamos um link para criar uma senha nova.</p>
          </div>
          <p className="mt-6 text-[#5b403f] leading-relaxed">
            O link vale por {VALIDADE_DO_LINK.senha}. Se ele não estiver na
            caixa de entrada, olhe no spam.
          </p>
          <div className="mt-8">
            <Botao
              as={Link}
              to="/login"
              state={{ email: enviadoPara }}
              tamanho="lg"
              className="w-full"
            >
              Voltar para entrar
            </Botao>
          </div>
          <p className="mt-10 text-sm leading-relaxed text-[#5f5e5e]">
            Digitou outro e-mail?{" "}
            <button
              type="button"
              onClick={() => setEnviadoPara("")}
              className="font-semibold text-[#9e0a24] hover:underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]/40"
            >
              Usar outro e-mail
            </button>
          </p>
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
                carregando={enviando}
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
