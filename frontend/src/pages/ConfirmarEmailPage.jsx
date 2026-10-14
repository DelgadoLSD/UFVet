import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AvisoDeSpam from "../components/AvisoDeSpam";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import LayoutAutenticacao from "../components/LayoutAutenticacao";
import { EnderecoDeEmail, PreviaDoEmail } from "../components/PreviaDoEmail";
import ReenvioDeConfirmacao from "../components/ReenvioDeConfirmacao";
import { codigoDoLink, temCodigo } from "../regras/link";
import { confirmarEmail } from "../servicos/email";
import { carregarSessao, useSessao } from "../servicos/sessao";
// Foto de santosh verma (Unsplash, uso livre)
import fotoGatoParede from "../assets/auth/gato-parede-vermelha.jpg";

// A confirmação do e-mail (/confirmar-email). Sem ela, ninguém entra no
// site: é o que garante que o e-mail da conta existe e é da pessoa. A
// página tem dois usos:
// - logo depois do cadastro, sem código: diz para onde o link foi, mostra o
//   e-mail como ele aparece na caixa de entrada, explica o spam e manda o
//   link de novo;
// - aberta pelo link do e-mail, com o código depois do "#": confirma na API
//   e diz o que fazer em seguida.

const TITULO =
  "text-[2rem] leading-[1.1] md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]";
const TEXTO = "text-[#5b403f] leading-relaxed";

// Os caminhos para quem errou o e-mail ou já confirmou, no fim da tela, como
// na página de entrar.
function Saidas({ email }) {
  return (
    <div className="mt-10 space-y-3 text-sm leading-relaxed text-[#5f5e5e]">
      <p>
        Digitou o e-mail errado?{" "}
        <Link
          to="/cadastrar"
          className="font-semibold text-[#9e0a24] hover:underline"
        >
          Cadastre-se de novo
        </Link>{" "}
        com o e-mail certo.
      </p>
      <p>
        Já confirmou?{" "}
        <Link
          to="/login"
          state={email ? { email } : undefined}
          className="font-semibold text-[#9e0a24] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

// Logo depois do cadastro. `enviado` diz se o primeiro link saiu. Se não
// saiu, a frase principal diz isso e o botão de tentar de novo vem primeiro;
// quando um envio dá certo, a tela passa a ser a de um link mandado, com a
// hora do envio. Sem o e-mail (a página aberta direto), pede o e-mail para
// mandar o link de novo.
function Espera({ email, enviado }) {
  const navegar = useNavigate();
  const [enviadoEm, setEnviadoEm] = useState(() =>
    email && enviado !== false ? new Date() : null,
  );
  const [digitado, setDigitado] = useState("");
  const falhou = !!email && !enviadoEm;

  // Um envio que deu certo fica guardado no histórico: recarregar a página
  // mostra o link mandado, e não a falha de antes.
  const enviou = (data) => {
    setEnviadoEm(data);
    navegar(".", { replace: true, state: { email, enviado: true } });
  };

  return (
    <>
      <h1 className={TITULO}>
        Confirme <span className="whitespace-nowrap">seu e-mail</span>
      </h1>
      <p aria-live="polite" className={`mt-4 ${TEXTO}`}>
        {!email
          ? "Mandamos um link para o seu e-mail quando você se cadastrou."
          : falhou
            ? "Não conseguimos mandar o link para"
            : "Mandamos um link para"}
        {email && <EnderecoDeEmail email={email} />}
      </p>

      {falhou ? (
        <>
          <p className={`mt-4 ${TEXTO}`}>
            O envio falhou do nosso lado, não no seu e-mail. Tente de novo daqui
            a alguns minutos.
          </p>
          <div className="mt-8">
            <ReenvioDeConfirmacao
              email={email}
              variante="primario"
              rotulo="Tentar mandar de novo"
              onEnviado={enviou}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mt-7">
            <PreviaDoEmail tipo="confirmacao" enviadoEm={enviadoEm} />
          </div>
          <p className={`mt-4 ${TEXTO}`}>
            Procure por esse e-mail e toque em{" "}
            <strong className="font-semibold text-[#1a1c1c] whitespace-nowrap">
              Confirmar meu e-mail
            </strong>
            . Só depois disso dá para entrar no UFVet.
          </p>

          <div className="mt-10 pt-8 border-t border-[#eadede] space-y-5">
            <AvisoDeSpam />
            {!email && (
              <Campo
                id="email"
                rotulo="E-mail do cadastro"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={digitado}
                onChange={(e) => setDigitado(e.target.value)}
              />
            )}
            <ReenvioDeConfirmacao
              email={email ?? digitado}
              seHouver={!email}
              onEnviado={email ? enviou : undefined}
            />
          </div>
        </>
      )}

      <Saidas email={email} />
    </>
  );
}

// O botão do fim de cada resultado: entrar com o e-mail já preenchido, ou
// voltar para a Minha conta, se a conta logada neste navegador é a do link.
function Seguir({ email }) {
  const usuario = useSessao();
  const daContaLogada =
    usuario && usuario.email.toLowerCase() === email?.toLowerCase();
  return daContaLogada ? (
    <Botao as={Link} to="/conta" tamanho="lg" className="w-full">
      Voltar para a Minha conta
    </Botao>
  ) : (
    <Botao
      as={Link}
      to="/login"
      state={email ? { email } : undefined}
      tamanho="lg"
      className="w-full"
    >
      Entrar
    </Botao>
  );
}

// Um resultado no lugar do formulário: título, o que aconteceu e o próximo
// passo. Sem ícone: o título já diz o estado, em palavras.
function Resultado({ titulo, children, acao, status = false }) {
  return (
    <>
      <h1 className={TITULO}>{titulo}</h1>
      <div role={status ? "status" : undefined} className={`mt-4 ${TEXTO}`}>
        {children}
      </div>
      <div className="mt-8">{acao}</div>
    </>
  );
}

// Aberta pelo link do e-mail: confirma assim que abre, uma vez só.
function Confirmacao({ codigo }) {
  const [estado, setEstado] = useState(
    codigo ? { fase: "confirmando" } : { fase: "incompleto" },
  );
  const pedido = useRef(false);

  const confirmar = async () => {
    setEstado({ fase: "confirmando" });
    try {
      const resposta = await confirmarEmail(codigo);
      // Numa troca, a conta logada passa a mostrar o e-mail novo.
      if (resposta.troca) await carregarSessao();
      const fase = resposta.jaConfirmado
        ? "jaConfirmado"
        : resposta.troca
          ? "trocado"
          : "confirmado";
      setEstado({ fase, email: resposta.email });
    } catch (falha) {
      setEstado(
        falha.codigo === "LINK_INVALIDO"
          ? { fase: "invalido", mensagem: falha.message }
          : { fase: "erro", mensagem: falha.message, status: falha.status },
      );
    }
  };

  // Uma vez só, mesmo que o React rode o efeito de novo (no modo de
  // desenvolvimento ele roda duas vezes, de propósito).
  useEffect(() => {
    if (!codigo || pedido.current) return;
    pedido.current = true;
    confirmar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  const { fase, email, mensagem } = estado;

  if (fase === "confirmando") {
    return (
      <div aria-busy="true">
        <h1 className={TITULO}>
          Confirmando <span className="whitespace-nowrap">seu e-mail…</span>
        </h1>
        <p className={`mt-4 ${TEXTO}`}>Só um instante.</p>
      </div>
    );
  }

  if (fase === "confirmado") {
    return (
      <Resultado
        titulo="E-mail confirmado"
        status
        acao={<Seguir email={email} />}
      >
        <p>Sua conta está pronta. Agora é só entrar com</p>
        <EnderecoDeEmail email={email} />
        <p className="mt-1">e a sua senha.</p>
      </Resultado>
    );
  }

  if (fase === "trocado") {
    return (
      <Resultado titulo="E-mail trocado" status acao={<Seguir email={email} />}>
        <p>A partir de agora, a sua conta usa</p>
        <EnderecoDeEmail email={email} />
        <p className="mt-1">para entrar e para os contatos.</p>
      </Resultado>
    );
  }

  if (fase === "jaConfirmado") {
    return (
      <Resultado
        titulo={
          <>
            Seu <span className="whitespace-nowrap">e-mail</span> já está
            confirmado
          </>
        }
        status
        acao={<Seguir email={email} />}
      >
        <p>Não precisa fazer mais nada: é só entrar com</p>
        <EnderecoDeEmail email={email} />
      </Resultado>
    );
  }

  if (fase === "invalido") {
    return (
      <Resultado titulo="Este link não vale mais" acao={<Seguir />}>
        <p>{mensagem}</p>
      </Resultado>
    );
  }

  if (fase === "incompleto") {
    return (
      <Resultado titulo="Este link está incompleto" acao={<Seguir />}>
        <p>
          Abra o link direto do e-mail, tocando em “Confirmar meu e-mail”. Se
          você copiou o endereço, confira se copiou até o fim. Ou entre com seu
          e-mail e sua senha para receber outro link.
        </p>
      </Resultado>
    );
  }

  // Sem conexão, ou o e-mail novo de uma troca passou a ser de outra conta.
  return (
    <Resultado
      titulo="Não deu para confirmar"
      acao={
        estado.status === 409 ? (
          <Botao as={Link} to="/conta" tamanho="lg" className="w-full">
            Ir para a Minha conta
          </Botao>
        ) : (
          <Botao tamanho="lg" className="w-full" onClick={confirmar}>
            Tentar de novo
          </Botao>
        )
      }
    >
      <AvisoErro>{mensagem}</AvisoErro>
    </Resultado>
  );
}

function Conteudo({ hash, state }) {
  // Lidos uma vez: logo em seguida o código sai da barra de endereço.
  const [codigo] = useState(() => codigoDoLink(hash));
  const [veioDoLink] = useState(() => temCodigo(hash));

  // O código sai da barra de endereço e do histórico assim que é lido:
  // quem olhar a tela, ou o histórico do navegador, não o copia.
  useEffect(() => {
    if (veioDoLink) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }
  }, [veioDoLink]);

  return (
    <LayoutAutenticacao
      foto={fotoGatoParede}
      fotoPosicao="right center"
      corFundo="#9d2d15"
      fotoAEsquerda
    >
      {veioDoLink ? (
        <Confirmacao codigo={codigo} />
      ) : (
        <Espera email={state?.email} enviado={state?.enviado} />
      )}
    </LayoutAutenticacao>
  );
}

// Um link aberto com a página já na tela (o e-mail aberto na mesma aba)
// muda só o que vem depois do "#", sem recarregar: a página começa de novo,
// com o código novo. Tirar o código da barra de endereço não conta como
// mudança (o roteador não fica sabendo).
function ConfirmarEmailPage() {
  const { hash, state } = useLocation();
  return <Conteudo key={hash} hash={hash} state={state} />;
}

export default ConfirmarEmailPage;
