import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import LayoutAutenticacao from "../components/LayoutAutenticacao";
import { TAMANHO_MINIMO_SENHA, soComProblema } from "../regras/conta";
import { codigoDoLink, temCodigo } from "../regras/link";
import { criarSenhaNova } from "../servicos/email";
import { carregarSessao } from "../servicos/sessao";
// "Shelter dog ready for adoption", foto de Michael G (Unsplash, uso livre)
import fotoCaoVermelho from "../assets/auth/cao-vermelho.jpg";

// A senha nova (/nova-senha), aberta pelo link do e-mail de "Esqueceu a
// senha?" (F4). O código vem depois do "#". Criada a senha, a API tira a
// conta de todos os aparelhos, e a pessoa entra de novo com ela.

const TITULO =
  "text-[2rem] leading-[1.1] md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]";
const TEXTO = "mt-4 text-[#5b403f] leading-relaxed";

// O que fazer quando não há como criar a senha por este link.
const SEM_LINK = {
  semLink: {
    titulo: "Abra o link do e-mail",
    texto:
      "Para criar uma senha nova, peça o link em “Esqueceu a senha?” e abra o e-mail que chegar.",
  },
  incompleto: {
    titulo: "Este link está incompleto",
    texto:
      "Abra o link direto do e-mail, tocando em “Criar senha nova”. Se você copiou o endereço, confira se copiou até o fim.",
  },
};

function Conteudo({ hash }) {
  // Lidos uma vez: logo em seguida o código sai da barra de endereço.
  const [codigo] = useState(() => codigoDoLink(hash));
  const [veioDoLink] = useState(() => temCodigo(hash));
  const [dados, setDados] = useState({ senha: "", confirmacao: "" });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  // { fase: "criada", email } ou { fase: "invalido", mensagem }, no lugar
  // do formulário.
  const [resultado, setResultado] = useState(null);

  // O código sai da barra de endereço e do histórico assim que é lido.
  useEffect(() => {
    if (veioDoLink) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }
  }, [veioDoLink]);

  const mudar = (campo, valor) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: undefined, geral: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    const problemas = soComProblema({
      senha:
        dados.senha.length < TAMANHO_MINIMO_SENHA
          ? `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`
          : undefined,
      confirmacao:
        dados.confirmacao !== dados.senha
          ? "As duas senhas estão diferentes."
          : undefined,
    });
    if (Object.keys(problemas).length > 0) {
      setErros(problemas);
      return;
    }
    setEnviando(true);
    try {
      const { email } = await criarSenhaNova(codigo, dados.senha);
      // A API tirou a conta de todos os aparelhos, inclusive deste, se ela
      // estava aberta aqui: o site passa a tratar a pessoa como visitante.
      await carregarSessao();
      setResultado({ fase: "criada", email });
    } catch (falha) {
      if (falha.codigo === "LINK_INVALIDO") {
        setResultado({ fase: "invalido", mensagem: falha.message });
      } else {
        setErros(
          falha.campos?.senha
            ? { senha: falha.campos.senha }
            : { geral: falha.message },
        );
      }
    } finally {
      setEnviando(false);
    }
  };

  let conteudo;
  if (resultado?.fase === "criada") {
    conteudo = (
      <>
        <h1 className={TITULO}>Senha nova criada</h1>
        <p role="status" className={TEXTO}>
          Agora é só entrar com ela. Por segurança, a sua conta saiu de todos os
          aparelhos em que estava aberta.
        </p>
        <div className="mt-8">
          <Botao
            as={Link}
            to="/login"
            state={{ email: resultado.email }}
            tamanho="lg"
            className="w-full"
          >
            Entrar
          </Botao>
        </div>
      </>
    );
  } else if (resultado?.fase === "invalido" || !codigo) {
    const aviso =
      resultado?.fase === "invalido"
        ? {
            titulo: "Este link não vale mais",
            texto: resultado.mensagem,
          }
        : SEM_LINK[veioDoLink ? "incompleto" : "semLink"];
    conteudo = (
      <>
        <h1 className={TITULO}>{aviso.titulo}</h1>
        <p className={TEXTO}>{aviso.texto}</p>
        <div className="mt-8">
          <Botao
            as={Link}
            to="/esqueci-a-senha"
            tamanho="lg"
            className="w-full"
          >
            Pedir um link novo
          </Botao>
        </div>
      </>
    );
  } else {
    conteudo = (
      <>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a1c1c]">
          Crie uma senha nova
        </h1>
        <p className={TEXTO}>
          Depois de salvar, a sua conta sai de todos os aparelhos em que estava
          aberta, e você entra de novo com a senha nova.
        </p>
        <form onSubmit={enviar} noValidate className="mt-10 space-y-5">
          <Campo
            id="senha"
            rotulo="Senha nova"
            senha
            placeholder={`Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`}
            autoComplete="new-password"
            value={dados.senha}
            onChange={(e) => mudar("senha", e.target.value)}
            erro={erros.senha}
          />
          <Campo
            id="confirmacao-senha"
            rotulo="Confirmar a senha nova"
            senha
            placeholder="Digite a senha de novo"
            autoComplete="new-password"
            value={dados.confirmacao}
            onChange={(e) => mudar("confirmacao", e.target.value)}
            erro={erros.confirmacao}
          />
          <AvisoErro>{erros.geral}</AvisoErro>
          <div className="pt-3">
            <Botao
              type="submit"
              tamanho="lg"
              className="w-full"
              carregando={enviando}
            >
              {enviando ? "Salvando…" : "Salvar senha nova"}
            </Botao>
          </div>
        </form>
      </>
    );
  }

  return (
    <LayoutAutenticacao
      foto={fotoCaoVermelho}
      fotoPosicao="center 20%"
      corFundo="#a1050e"
    >
      {conteudo}
    </LayoutAutenticacao>
  );
}

// Um link aberto com a página já na tela (o e-mail aberto na mesma aba)
// muda só o que vem depois do "#", sem recarregar: a página começa de novo,
// com o código novo. Tirar o código da barra de endereço não conta como
// mudança (o roteador não fica sabendo).
function NovaSenhaPage() {
  const { hash } = useLocation();
  return <Conteudo key={hash} hash={hash} />;
}

export default NovaSenhaPage;
