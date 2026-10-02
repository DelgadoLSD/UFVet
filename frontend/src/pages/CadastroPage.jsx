import { useState } from "react";
import { Link } from "react-router-dom";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import CampoBairro from "../components/CampoBairro";
import CampoCidade from "../components/CampoCidade";
import LayoutAutenticacao, {
  BotaoGoogle,
} from "../components/LayoutAutenticacao";
import { TAMANHO_MINIMO_SENHA } from "../regras/conta";
import { LIMITES } from "../regras/limites";
import { UFS } from "../util/localidades";
// Foto de santosh verma (Unsplash, uso livre)
import fotoGatoParede from "../assets/auth/gato-parede-vermelha.jpg";

// Criação de conta em etapas. O caminho depende do papel escolhido na
// primeira:
// - tutor: papel, dados, contato e localização, senha (4 etapas);
// - veterinário: as mesmas, com o registro profissional antes da senha (5).
//
// Os campos levam os nomes das colunas do banco (tabelas usuario, veterinario
// e aceite). Por enquanto o envio só avisa; na integração, ele passa a chamar
// a API.

// Título e explicação de cada etapa, pelo número dela. A etapa 4 (registro
// profissional) só existe para veterinários.
const ETAPAS = {
  1: { titulo: "Como você vai usar o UFVet?" },
  2: { titulo: "Seus dados" },
  3: {
    titulo: "Contato e localização",
    texto:
      "Para que quem precisa de um doador consiga falar com você. Na busca, aparecem só a cidade e o bairro.",
  },
  4: {
    titulo: "Registro profissional",
    texto: "Seu CRMV aparece nas validações que você assinar.",
  },
  5: { titulo: "Senha e termos" },
};

const ULTIMA_ETAPA = 5;

// Os dois papéis, com os valores do enum PapelUsuario do banco.
const PAPEIS = [
  {
    valor: "TUTOR",
    icone: "pets",
    titulo: "Sou tutor",
    texto: "Quero cadastrar meus animais como doadores ou buscar um doador.",
  },
  {
    valor: "VETERINARIO",
    icone: "stethoscope",
    titulo: "Sou veterinário",
    texto: "Quero conferir e validar os dados dos doadores.",
  },
];

const CLASSE_SELECT =
  "w-full h-12 pl-4 pr-10 bg-white border border-[#dccfcf] rounded-xl text-base text-[#1a1c1c] shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#b7102a] focus:ring-4 focus:ring-[#b7102a]/10";

// Etapa 1: escolher o papel já avança para a próxima.
function EtapaPapel({ onEscolher }) {
  return (
    <div className="space-y-3">
      {PAPEIS.map((papel) => (
        <button
          key={papel.valor}
          type="button"
          onClick={() => onEscolher(papel.valor)}
          className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#eadede] text-left transition-colors hover:border-[#b7102a] hover:bg-[#fffafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
        >
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-xl bg-[#fdecee] text-[#8e001b] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#b7102a] group-hover:text-white"
          >
            <span className="material-symbols-outlined">{papel.icone}</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[#1a1c1c]">
              {papel.titulo}
            </span>
            <span className="block text-sm text-[#5f5e5e] mt-0.5 leading-snug">
              {papel.texto}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[#b9a9a9] transition-colors group-hover:text-[#8e001b]"
          >
            chevron_right
          </span>
        </button>
      ))}
    </div>
  );
}

function EtapaDados({ dados, onMudar }) {
  return (
    <div className="space-y-5">
      <Campo
        id="nome-completo"
        rotulo="Nome completo"
        placeholder="Ex.: João Silva"
        autoComplete="name"
        maxLength={LIMITES.nomeCompleto}
        value={dados.nomeCompleto || ""}
        onChange={(e) => onMudar("nomeCompleto", e.target.value)}
      />
      <Campo
        id="cpf"
        rotulo="CPF"
        placeholder="000.000.000-00"
        inputMode="numeric"
        value={dados.cpf || ""}
        onChange={(e) => onMudar("cpf", e.target.value)}
      />
      <Campo
        id="email"
        rotulo="E-mail"
        type="email"
        placeholder="seu@email.com"
        autoComplete="email"
        value={dados.email || ""}
        onChange={(e) => onMudar("email", e.target.value)}
      />
    </div>
  );
}

// Cidade e bairro vêm de listas, um embaixo do outro: o bairro depende da
// cidade, e a lista aberta precisa da largura toda para nomes longos.
function EtapaContato({ dados, onMudar }) {
  return (
    <div className="space-y-5">
      <Campo
        id="telefone"
        rotulo="Telefone"
        type="tel"
        placeholder="(00) 00000-0000"
        autoComplete="tel"
        value={dados.telefone || ""}
        onChange={(e) => onMudar("telefone", e.target.value)}
      />
      <CampoCidade
        valor={dados.cidade || ""}
        onEscolher={(cidade) => {
          if (cidade === dados.cidade) return;
          onMudar("cidade", cidade);
          // O bairro escolhido era da cidade anterior.
          onMudar("bairro", "");
        }}
      />
      <CampoBairro
        cidade={dados.cidade}
        valor={dados.bairro || ""}
        onEscolher={(bairro) => onMudar("bairro", bairro)}
      />
    </div>
  );
}

// Só para veterinários. No banco, o CRMV e a UF ficam em colunas separadas.
function EtapaRegistro({ dados, onMudar }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1fr_7rem] gap-4">
        <Campo
          id="crmv"
          rotulo="Número do CRMV"
          placeholder="00000"
          inputMode="numeric"
          maxLength={LIMITES.crmv}
          value={dados.crmv || ""}
          onChange={(e) => onMudar("crmv", e.target.value)}
        />
        <div>
          <label
            htmlFor="uf-crmv"
            className="block text-sm font-semibold text-[#1a1c1c] mb-2"
          >
            UF
          </label>
          <select
            id="uf-crmv"
            value={dados.ufCrmv}
            onChange={(e) => onMudar("ufCrmv", e.target.value)}
            className={CLASSE_SELECT}
          >
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Campo
        id="local-atuacao"
        rotulo="Local de atuação"
        placeholder="Nome da clínica ou hospital"
        value={dados.localAtuacao || ""}
        onChange={(e) => onMudar("localAtuacao", e.target.value)}
      />
    </div>
  );
}

// Caixa de seleção com o texto ao lado, clicável.
function Confirmacao({ id, checked, onChange, children }) {
  return (
    <div className="flex gap-3 items-start">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 w-5 h-5 shrink-0 rounded-md border-[#cfbcbc] text-[#b7102a] cursor-pointer focus:ring-2 focus:ring-[#b7102a]/30 focus:ring-offset-0"
      />
      <label
        htmlFor={id}
        className="text-sm text-[#5b403f] leading-snug cursor-pointer"
      >
        {children}
      </label>
    </div>
  );
}

// Os dois aceites viram registros da tabela aceite no banco (TERMOS_DE_USO e
// CIENCIA_RESPONSABILIDADE), com a versão do texto aceito.
function EtapaSenha({ dados, onMudar }) {
  return (
    <div className="space-y-5">
      <Campo
        id="senha"
        rotulo="Senha"
        senha
        placeholder={`Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`}
        autoComplete="new-password"
        value={dados.senha || ""}
        onChange={(e) => onMudar("senha", e.target.value)}
      />
      <Campo
        id="confirmacao-senha"
        rotulo="Confirmar senha"
        senha
        placeholder="Digite a senha de novo"
        autoComplete="new-password"
        value={dados.confirmacaoSenha || ""}
        onChange={(e) => onMudar("confirmacaoSenha", e.target.value)}
      />
      <div className="space-y-4 pt-2">
        <Confirmacao
          id="aceite-termos"
          checked={dados.aceiteTermos || false}
          onChange={(e) => onMudar("aceiteTermos", e.target.checked)}
        >
          Li e aceito os{" "}
          <a href="#" className="font-semibold text-[#8e001b] hover:underline">
            Termos de uso
          </a>{" "}
          e a{" "}
          <a href="#" className="font-semibold text-[#8e001b] hover:underline">
            Política de privacidade
          </a>
          .
        </Confirmacao>
        <Confirmacao
          id="ciencia-responsabilidade"
          checked={dados.cienciaResponsabilidade || false}
          onChange={(e) => onMudar("cienciaResponsabilidade", e.target.checked)}
        >
          Estou ciente de que a doação é gratuita e assumo a responsabilidade
          financeira sobre os insumos hospitalares caso meu animal seja o
          receptor.
        </Confirmacao>
      </div>
    </div>
  );
}

function CadastroPage() {
  const [etapa, setEtapa] = useState(1);
  const [papel, setPapel] = useState(null);
  // A UF do CRMV já começa em Minas, onde está o Hospital Veterinário da UFV.
  const [dados, setDados] = useState({ ufCrmv: "MG" });

  const ehTutor = papel === "TUTOR";

  const mudar = (campo, valor) =>
    setDados((prev) => ({ ...prev, [campo]: valor }));

  const escolherPapel = (escolhido) => {
    setPapel(escolhido);
    setEtapa(2);
  };

  // O tutor não tem registro profissional: da etapa 3 vai direto para a 5, e
  // volta da 5 direto para a 3.
  const avancar = () =>
    setEtapa((atual) => (atual === 3 && ehTutor ? 5 : atual + 1));
  const voltar = () =>
    setEtapa((atual) => (atual === 5 && ehTutor ? 3 : atual - 1));

  // "Continuar" é o botão de envio do formulário: assim o Enter também avança
  // a etapa. Só a última etapa envia o cadastro de fato.
  const enviar = (e) => {
    e.preventDefault();
    if (etapa < ULTIMA_ETAPA) {
      avancar();
      return;
    }
    alert("Cadastro enviado! (integração com back-end em breve)");
  };

  // Para o tutor, a etapa 5 aparece como a 4ª (de 4). Antes de escolher o
  // papel, a contagem é a do tutor.
  const totalEtapas = papel === "VETERINARIO" ? 5 : 4;
  const etapaVisual = etapa === 5 && ehTutor ? 4 : etapa;
  const { titulo, texto } = ETAPAS[etapa];

  return (
    <LayoutAutenticacao
      foto={fotoGatoParede}
      fotoPosicao="right center"
      corFundo="#9d2d15"
      fotoAEsquerda
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-[#1a1c1c]">Criar conta</span>
        <span className="text-[#5f5e5e]">
          Etapa {etapaVisual} de {totalEtapas}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: totalEtapas }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < etapaVisual ? "bg-[#b7102a]" : "bg-[#eadede]"
            }`}
          />
        ))}
      </div>

      <h1 className="mt-10 text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">
        {titulo}
      </h1>
      {texto && <p className="mt-2 text-[#5b403f] leading-relaxed">{texto}</p>}

      <form onSubmit={enviar} className="mt-8">
        {etapa === 1 && <EtapaPapel onEscolher={escolherPapel} />}
        {etapa === 2 && <EtapaDados dados={dados} onMudar={mudar} />}
        {etapa === 3 && <EtapaContato dados={dados} onMudar={mudar} />}
        {etapa === 4 && <EtapaRegistro dados={dados} onMudar={mudar} />}
        {etapa === 5 && <EtapaSenha dados={dados} onMudar={mudar} />}

        {etapa > 1 && (
          <div className="mt-8 flex gap-3">
            <Botao
              variante="secundario"
              tamanho="lg"
              icone="arrow_back"
              onClick={voltar}
            >
              Voltar
            </Botao>
            <Botao type="submit" tamanho="lg" className="flex-1">
              {etapa < ULTIMA_ETAPA ? "Continuar" : "Finalizar cadastro"}
            </Botao>
          </div>
        )}
      </form>

      {etapa === 2 && <BotaoGoogle>Cadastrar com Google</BotaoGoogle>}

      <p className="mt-10 text-sm text-[#5f5e5e]">
        Já tem uma conta?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#8e001b] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </LayoutAutenticacao>
  );
}

export default CadastroPage;
