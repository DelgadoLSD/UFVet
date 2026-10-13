import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AvisoDeSpam from "../components/AvisoDeSpam";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import IconeDeEstado from "../components/IconeDeEstado";
import LayoutAutenticacao from "../components/LayoutAutenticacao";
import ReenvioDeConfirmacao from "../components/ReenvioDeConfirmacao";
import { codigoDoLink, temCodigo } from "../regras/link";
import { confirmarEmail } from "../servicos/email";
import { carregarSessao, useSessao } from "../servicos/sessao";
// Foto de santosh verma (Unsplash, uso livre)
import fotoGatoParede from "../assets/auth/gato-parede-vermelha.jpg";

// A confirmação do e-mail (/confirmar-email). Sem ela, ninguém entra no
// site: é o que garante que o e-mail da conta existe e é da pessoa. A
// página tem dois usos:
// - logo depois do cadastro, sem código: pede para a pessoa abrir o e-mail,
//   explica que ele pode ter ido para o spam e manda o link de novo;
// - aberta pelo link do e-mail, com o código depois do "#": confirma na API
//   e diz o que fazer em seguida.

const TITULO =
  "text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]";
const TEXTO = "mt-3 text-[#5b403f] leading-relaxed";

// O e-mail em destaque no meio de uma frase, quebrando onde for preciso
// (endereços longos não cabem numa linha do celular).
const Email = ({ children }) => (
  <strong className="font-semibold text-[#1a1c1c] break-all">{children}</strong>
);

// Logo depois do cadastro. Sem o e-mail (a pessoa abriu a página direto),
// pede o e-mail para mandar o link de novo.
function Espera({ email, enviado }) {
  const [digitado, setDigitado] = useState("");

  return (
    <>
      <IconeDeEstado nome="mail" />
      <h1 className={`mt-6 ${TITULO}`}>Confirme seu e-mail</h1>
      {email ? (
        <p className={TEXTO}>
          Mandamos um link para <Email>{email}</Email>. Abra o e-mail e toque em
          &ldquo;Confirmar meu e-mail&rdquo;: só depois disso dá para entrar no
          UFVet.
        </p>
      ) : (
        <p className={TEXTO}>
          Abra o link que mandamos para o seu e-mail quando você se cadastrou:
          só depois disso dá para entrar no UFVet.
        </p>
      )}
      {enviado === false && (
        <div className="mt-6">
          <AvisoErro>
            Não conseguimos mandar o e-mail agora. Espere alguns minutos e peça
            de novo no botão abaixo.
          </AvisoErro>
        </div>
      )}

      <div className="mt-8">
        <AvisoDeSpam />
      </div>
      <div className="mt-6 space-y-5">
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
        <ReenvioDeConfirmacao email={email ?? digitado} seHouver={!email} />
      </div>

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
        <IconeDeEstado nome="hourglass_top" tom="neutro" />
        <h1 className={`mt-6 ${TITULO}`}>Confirmando seu e-mail…</h1>
        <p className={TEXTO}>Só um instante.</p>
      </div>
    );
  }

  if (fase === "confirmado" || fase === "trocado" || fase === "jaConfirmado") {
    const textos = {
      confirmado: {
        titulo: "E-mail confirmado",
        texto: (
          <>
            Sua conta está pronta. Agora é só entrar com <Email>{email}</Email>{" "}
            e a sua senha.
          </>
        ),
      },
      trocado: {
        titulo: "E-mail trocado",
        texto: (
          <>
            A partir de agora, a sua conta usa <Email>{email}</Email> para
            entrar e para os contatos.
          </>
        ),
      },
      jaConfirmado: {
        titulo: "Seu e-mail já está confirmado",
        texto: (
          <>
            Não precisa fazer mais nada: é só entrar com <Email>{email}</Email>.
          </>
        ),
      },
    }[fase];
    return (
      <>
        <IconeDeEstado nome="check_circle" tom="sucesso" />
        <h1 className={`mt-6 ${TITULO}`}>{textos.titulo}</h1>
        <p role="status" className={TEXTO}>
          {textos.texto}
        </p>
        <div className="mt-8">
          <Seguir email={email} />
        </div>
      </>
    );
  }

  if (fase === "invalido" || fase === "incompleto") {
    return (
      <>
        <IconeDeEstado nome="link_off" tom="neutro" />
        <h1 className={`mt-6 ${TITULO}`}>
          {fase === "invalido"
            ? "Este link não vale mais"
            : "Este link está incompleto"}
        </h1>
        <p className={TEXTO}>
          {fase === "invalido"
            ? mensagem
            : "Abra o link direto do e-mail, tocando em “Confirmar meu e-mail”. Se você copiou o endereço, confira se copiou até o fim. Ou entre com seu e-mail e sua senha para receber outro link."}
        </p>
        <div className="mt-8">
          <Seguir />
        </div>
      </>
    );
  }

  // Sem conexão, ou o e-mail novo de uma troca passou a ser de outra conta.
  return (
    <>
      <IconeDeEstado nome="error" tom="neutro" />
      <h1 className={`mt-6 ${TITULO}`}>Não deu para confirmar</h1>
      <div className="mt-6">
        <AvisoErro>{mensagem}</AvisoErro>
      </div>
      <div className="mt-8">
        {estado.status === 409 ? (
          <Botao as={Link} to="/conta" tamanho="lg" className="w-full">
            Ir para a Minha conta
          </Botao>
        ) : (
          <Botao tamanho="lg" className="w-full" onClick={confirmar}>
            Tentar de novo
          </Botao>
        )}
      </div>
    </>
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
