import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import Ajuda from "../../components/Ajuda";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import Segmentado from "../../components/Segmentado";
import { ESPECIES, REFERENCIA_DOADOR, SEXOS } from "../../regras/doacao";
import {
  MAXIMO_FOTOS,
  TAMANHO_MAXIMO_MB,
  TIPOS_ACEITOS,
  erroDoArquivo,
  pedidoDasFotos,
  tornarPrincipal,
} from "../../regras/fotos";
import { LIMITES } from "../../regras/limites";
import { cadastrarAnimal, salvarAnimal } from "../../servicos/animais";
import { formatarData } from "../../util/datas";
import {
  FORM_VAZIO,
  IDADE_MAXIMA,
  criteriosAfetados,
  errosDoFormulario,
  formularioDoAnimal,
  pedidoDoFormulario,
} from "./formularioAnimal";

// Cadastro (F8) e edição (F9) de um animal pelo tutor.
//
// Só o que o tutor sabe e o que importa para doação. Os critérios clínicos
// (sorologias, vacinação, transfusão) são conferidos pelo veterinário. O mesmo
// formulário cadastra e edita: são os mesmos campos, e manter um só evita que
// as duas telas se afastem com o tempo. As regras do formulário estão em
// formularioAnimal.js.
//
// O tipo sanguíneo não está aqui de propósito. É resultado de exame, e um
// palpite de tutor exibido com a mesma cara de um dado conferido engana tanto
// quem procura doador quanto o veterinário que dá a validação por feita.

const OPCOES_ESPECIE = Object.entries(ESPECIES).map(([valor, e]) => ({
  valor,
  rotulo: e.rotulo,
}));

const OPCOES_SEXO = Object.entries(SEXOS).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}));

// Campo do formulário -> campo da API, onde caem as mensagens de erro.
const CAMPO_DA_API = {
  nome: ["nome"],
  especie: ["especie"],
  raca: ["raca"],
  racaSRD: ["raca"],
  sexo: ["sexo"],
  castrado: ["castrado"],
  idadeConhecida: ["dataNascimento", "idadeAproximada"],
  dataNascimento: ["dataNascimento"],
  idadeEstimada: ["idadeAproximada"],
  peso: ["pesoKg"],
  fotos: ["fotos"],
};

const CLASSE_CAMPO =
  "w-full px-4 py-2.5 bg-white border border-[#e4bebc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9e0a24] focus:border-[#9e0a24] placeholder:text-gray-400 aria-[invalid=true]:border-[#9e0a24]";
const CLASSE_TITULO = "text-sm font-semibold text-[#1a1c1c]";
const CLASSE_ROTULO = `block mb-1.5 ${CLASSE_TITULO}`;

// Mensagem de erro embaixo de um campo; o id liga a mensagem ao campo, para
// o leitor de tela ler as duas.
function Erro({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="text-xs text-[#9e0a24] mt-1.5">
      {children}
    </p>
  );
}

// Botão redondo sobre a miniatura de uma foto.
function BotaoMiniatura({ icone, rotulo, onClick, posicao }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className={`absolute ${posicao} w-6 h-6 rounded-full bg-white/95 text-[#1a1c1c] shadow flex items-center justify-center hover:text-[#7d0a1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]`}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[16px]"
      >
        {icone}
      </span>
    </button>
  );
}

// As fotos escolhidas, da principal em diante, e o botão de adicionar, até o
// limite. Cada miniatura tem remover e, fora a primeira, tornar principal.
function CampoFotos({ fotos, onEscolher, onRemover, onTornarPrincipal }) {
  const entrada = useRef(null);
  return (
    <div className="flex gap-3 flex-wrap">
      {fotos.map((foto, i) => (
        <div
          key={foto.url}
          className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#e4bebc]"
        >
          <img
            src={foto.url}
            alt={`Foto ${i + 1}`}
            className="w-full h-full object-cover"
          />
          {i === 0 ? (
            <span className="absolute bottom-1 left-1 bg-[#9e0a24] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              Principal
            </span>
          ) : (
            <BotaoMiniatura
              icone="star"
              rotulo={`Tornar a foto ${i + 1} a principal`}
              onClick={() => onTornarPrincipal(i)}
              posicao="bottom-1 left-1"
            />
          )}
          <BotaoMiniatura
            icone="close"
            rotulo={`Remover a foto ${i + 1}`}
            onClick={() => onRemover(i)}
            posicao="top-1 right-1"
          />
        </div>
      ))}

      {fotos.length < MAXIMO_FOTOS && (
        <button
          type="button"
          onClick={() => entrada.current.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-[#e4bebc] flex flex-col items-center justify-center gap-0.5 text-[#8f6f6e] hover:border-[#7d0a1d] hover:bg-[#faf0f0] hover:text-[#7d0a1d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-2xl"
          >
            add_photo_alternate
          </span>
          <span className="text-[10px] font-semibold">Adicionar</span>
        </button>
      )}
      <input
        ref={entrada}
        id="animal-fotos"
        type="file"
        accept={TIPOS_ACEITOS.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          onEscolher(Array.from(e.target.files));
          // Para a mesma foto poder ser escolhida de novo depois de removida.
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Sem `animal`, cadastra um novo; com ele, edita. `onSalvo` recebe o animal
// como a API gravou.
function ModalAnimal({ animal, onFechar, onSalvo }) {
  const editando = !!animal;
  const [form, setForm] = useState(() =>
    editando ? formularioDoAnimal(animal) : FORM_VAZIO,
  );
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  // As fotos na tela: { id, url } das salvas e { arquivo, url } das escolhidas
  // agora, que só vão para a API ao salvar (ver regras/fotos.js).
  const [fotos, setFotos] = useState(() => animal?.fotos ?? []);
  // As URLs temporárias das fotos escolhidas, liberadas ao fechar a janela.
  const previas = useRef(new Set());
  useEffect(() => {
    const abertas = previas.current;
    return () => abertas.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const ref = REFERENCIA_DOADOR[form.especie];
  const afetados = criteriosAfetados(form, animal);
  const validacao = animal?.validacao;
  // Tipo sanguíneo não muda ao longo da vida: depois que o exame de tipagem
  // confirma, o valor é resultado de laboratório assinado por um veterinário,
  // e o tutor deixa de poder sobrescrever. É o dado mais perigoso do sistema
  // para ficar aberto; quem discorda pede revisão ao veterinário.
  const tipagemConfirmada = !!validacao?.criterios.TIPAGEM;

  // Mudar um campo apaga o erro dele.
  const mudar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => {
      const sem = { ...prev };
      for (const chave of CAMPO_DA_API[campo]) delete sem[chave];
      return sem;
    });
    setErroGeral("");
  };

  const mudarFotos = (novas) => {
    setFotos(novas);
    setErros((prev) => {
      const sem = { ...prev };
      delete sem.fotos;
      return sem;
    });
    setErroGeral("");
  };

  // Entram as que cabem e passam na conferência; a primeira recusada diz por
  // quê.
  const escolherFotos = (arquivos) => {
    const cabem = MAXIMO_FOTOS - fotos.length;
    const aceitas = [];
    let problema;
    for (const arquivo of arquivos) {
      const erro = erroDoArquivo(arquivo);
      if (erro) problema ??= erro;
      else if (aceitas.length < cabem) aceitas.push(arquivo);
      else problema ??= `Cada animal pode ter até ${MAXIMO_FOTOS} fotos.`;
    }
    const novas = aceitas.map((arquivo) => {
      const url = URL.createObjectURL(arquivo);
      previas.current.add(url);
      return { arquivo, url };
    });
    mudarFotos([...fotos, ...novas]);
    if (problema) setErros((prev) => ({ ...prev, fotos: problema }));
  };

  // Atributos de um campo de texto com erro.
  const comErro = (chave) =>
    erros[chave]
      ? { "aria-invalid": true, "aria-describedby": `erro-${chave}` }
      : {};

  const salvar = async (e) => {
    e.preventDefault();
    const problemas = errosDoFormulario(form);
    if (Object.keys(problemas).length > 0) {
      setErros(problemas);
      return;
    }
    const pedido = pedidoDoFormulario(form, animal);
    const { arquivos, ordem } = pedidoDasFotos(fotos, animal?.fotos);
    if (editando && ordem) pedido.fotos = ordem;
    // Editando sem ter mudado nada, não há o que gravar.
    if (editando && Object.keys(pedido).length === 0) {
      onFechar();
      return;
    }

    setEnviando(true);
    setErroGeral("");
    try {
      // Dados e fotos vão juntos: ou tudo é gravado, ou nada.
      const salvo = editando
        ? await salvarAnimal(animal.codigo, pedido, arquivos)
        : await cadastrarAnimal(pedido, arquivos);
      onSalvo(salvo);
    } catch (falha) {
      // Problema num campo aparece embaixo dele; o resto, acima dos botões.
      if (falha.campos) setErros(falha.campos);
      else setErroGeral(falha.message);
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo={editando ? `Editar ${animal.nome}` : "Cadastrar novo animal"}
      subtitulo={
        editando
          ? "O que mudar aqui aparece na busca na hora"
          : "Dados básicos para o perfil de doador"
      }
      largura="max-w-2xl"
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col gap-3">
          {/* O aviso fica colado no botão porque é sobre o que salvar provoca:
              no meio do formulário ele passa despercebido. */}
          {afetados.length > 0 && (
            <div className="flex items-start gap-2 bg-[#fdecee] border border-[#9e0a24]/25 rounded-lg px-3 py-2.5">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[#9e0a24] text-[18px] shrink-0"
              >
                release_alert
              </span>
              <p className="text-xs text-[#5b403f] leading-relaxed">
                Salvar desfaz a validação de{" "}
                <strong className="font-semibold text-[#9e0a24]">
                  {afetados.map((c) => c.rotulo.toLowerCase()).join(" e ")}
                </strong>
                , assinada por {validacao.veterinarioNome} em{" "}
                {formatarData(validacao.realizadaEm)}. Um veterinário precisa
                conferir de novo.
              </p>
            </div>
          )}
          <AvisoErro>{erroGeral}</AvisoErro>
          <div className="flex justify-end gap-2">
            <Botao variante="secundario" onClick={onFechar} disabled={enviando}>
              Cancelar
            </Botao>
            <Botao
              type="submit"
              form="form-cadastro-animal"
              icone={editando ? undefined : "add"}
              disabled={enviando}
            >
              {enviando
                ? "Salvando…"
                : editando
                  ? "Salvar alterações"
                  : "Cadastrar animal"}
            </Botao>
          </div>
        </div>
      }
    >
      <form
        id="form-cadastro-animal"
        onSubmit={salvar}
        noValidate
        className="space-y-6"
      >
        {!editando && (
          <div className="flex gap-3 bg-[#faf0f0] border border-[#e4bebc] rounded-xl p-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[#9e0a24] text-[22px] shrink-0"
            >
              verified_user
            </span>
            <p className="text-xs text-[#5b403f] leading-relaxed">
              Seu animal já pode aparecer como doador logo após o cadastro. O
              tipo sanguíneo não é pedido aqui: ele sai do exame de tipagem, e
              quem registra é o veterinário. Envie os exames depois no perfil —
              com eles, um veterinário <strong>valida</strong> os critérios de
              doação e o hospital não precisa refazer tudo no dia da coleta.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="animal-nome" className={CLASSE_ROTULO}>
            Nome do animal *
          </label>
          <input
            id="animal-nome"
            type="text"
            placeholder="Ex: Thor, Luna, Bolinha..."
            maxLength={LIMITES.nomeAnimal}
            value={form.nome}
            onChange={(e) => mudar("nome", e.target.value)}
            className={CLASSE_CAMPO}
            {...comErro("nome")}
          />
          <Erro id="erro-nome">{erros.nome}</Erro>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className={CLASSE_ROTULO}>Espécie *</p>
            <Segmentado
              rotulo="Espécie"
              opcoes={OPCOES_ESPECIE}
              valor={form.especie}
              onEscolher={(valor) => mudar("especie", valor)}
            />
            <Erro id="erro-especie">{erros.especie}</Erro>
          </div>

          <div>
            <p className={CLASSE_ROTULO}>Sexo *</p>
            <Segmentado
              rotulo="Sexo"
              opcoes={OPCOES_SEXO}
              valor={form.sexo}
              onEscolher={(valor) => mudar("sexo", valor)}
            />
            <Erro id="erro-sexo">{erros.sexo}</Erro>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="animal-raca" className={CLASSE_ROTULO}>
              Raça
            </label>
            <input
              id="animal-raca"
              type="text"
              placeholder={
                form.racaSRD ? "SRD (Sem Raça Definida)" : "Ex: Labrador..."
              }
              maxLength={LIMITES.raca}
              value={form.racaSRD ? "SRD" : form.raca}
              onChange={(e) => mudar("raca", e.target.value)}
              disabled={form.racaSRD}
              className={`${CLASSE_CAMPO} ${form.racaSRD ? "bg-[#f3f3f3] text-[#5f5e5e]" : ""}`}
              {...comErro("raca")}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.racaSRD}
                onChange={(e) => {
                  mudar("racaSRD", e.target.checked);
                  mudar("raca", "");
                }}
                className="w-4 h-4 rounded accent-[#9e0a24]"
              />
              <span className="text-xs text-[#5f5e5e] font-medium">
                SRD / Não sei a raça
              </span>
            </label>
            <Erro id="erro-raca">{erros.raca}</Erro>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={CLASSE_TITULO}>Castrado(a)? *</span>
              <Ajuda titulo="Por que perguntamos?">
                <p>
                  A castração não é obrigatória para doar. Mas fêmeas não
                  castradas não podem doar durante o cio, a gestação e a
                  amamentação.
                </p>
                <p>
                  Depois da cirurgia de castração, é preciso esperar 30 dias
                  antes de doar.
                </p>
              </Ajuda>
            </div>
            <Segmentado
              rotulo="Castrado(a)?"
              opcoes={[
                { valor: "sim", rotulo: "Sim" },
                { valor: "nao", rotulo: "Não" },
              ]}
              valor={form.castrado}
              onEscolher={(valor) => mudar("castrado", valor)}
            />
            <Erro id="erro-castrado">{erros.castrado}</Erro>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor={
                form.idadeConhecida ? "animal-nascimento" : "animal-idade"
              }
              className={CLASSE_ROTULO}
            >
              Idade *
            </label>
            <div className="mb-2">
              <Segmentado
                rotulo="Como informar a idade"
                opcoes={[
                  { valor: true, rotulo: "Data de nascimento" },
                  { valor: false, rotulo: "Estimar" },
                ]}
                valor={form.idadeConhecida}
                onEscolher={(valor) => mudar("idadeConhecida", valor)}
              />
            </div>
            {form.idadeConhecida ? (
              <>
                <input
                  id="animal-nascimento"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => mudar("dataNascimento", e.target.value)}
                  className={CLASSE_CAMPO}
                  {...comErro("dataNascimento")}
                />
                <Erro id="erro-dataNascimento">{erros.dataNascimento}</Erro>
              </>
            ) : (
              <>
                {/* Vira uma data aproximada, que envelhece junto com o
                    animal; a tela mostra "cerca de N anos". */}
                <input
                  id="animal-idade"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={IDADE_MAXIMA}
                  step="1"
                  placeholder="Anos, ex.: 3"
                  value={form.idadeEstimada}
                  onChange={(e) => mudar("idadeEstimada", e.target.value)}
                  className={CLASSE_CAMPO}
                  {...comErro("idadeAproximada")}
                />
                <Erro id="erro-idadeAproximada">{erros.idadeAproximada}</Erro>
              </>
            )}
            <p className="text-[11px] text-[#5f5e5e] mt-1.5">
              Doadores têm entre {ref.idadeMin} e {ref.idadeMax} anos.
            </p>
          </div>

          <div>
            <label htmlFor="animal-peso" className={CLASSE_ROTULO}>
              Peso (kg) *
            </label>
            {/* Espaço do tamanho do seletor ao lado, para os dois campos
                ficarem na mesma linha. */}
            <div className="h-11 mb-2" aria-hidden="true" />
            <input
              id="animal-peso"
              type="number"
              inputMode="decimal"
              placeholder={`Ex: ${form.especie === "CAO" ? "30" : "4,5"}`}
              min="0"
              step="0.1"
              value={form.peso}
              onChange={(e) => mudar("peso", e.target.value)}
              className={CLASSE_CAMPO}
              {...comErro("pesoKg")}
            />
            <Erro id="erro-pesoKg">{erros.pesoKg}</Erro>
            <p className="text-[11px] text-[#5f5e5e] mt-1.5">
              Peso mínimo para doar: {ref.pesoMin} kg.
            </p>
          </div>
        </div>

        {/* Só leitura, nos dois estados: quem preenche esse campo é o
            veterinário, no momento em que assina a tipagem. */}
        {editando && (
          <div>
            <span className={CLASSE_ROTULO}>Tipo sanguíneo</span>
            <div className="flex items-start gap-3 bg-[#faf6f6] border border-[#eadede] rounded-xl p-4">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[20px] text-[#8f6f6e] shrink-0"
              >
                {tipagemConfirmada ? "lock" : "labs"}
              </span>
              <div>
                <p className="text-sm font-bold text-[#1a1c1c]">
                  {tipagemConfirmada
                    ? animal.tipoSanguineo
                    : "Ainda não tipado"}
                </p>
                <p className="text-xs text-[#5f5e5e] leading-relaxed mt-1">
                  {tipagemConfirmada
                    ? `Confirmado no exame de tipagem por ${validacao.veterinarioNome} em ${formatarData(validacao.realizadaEm)}. Se algo não confere, peça ao veterinário para revisar a validação.`
                    : `O tipo sanguíneo vem do exame de tipagem e quem registra é o veterinário. Enviar os exames de ${animal.nome} no perfil é o que faz esse campo ser preenchido.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="animal-fotos" className={CLASSE_ROTULO}>
            Fotos do animal
            <span className="ml-2 text-[#5f5e5e] font-normal">
              ({fotos.length}/{MAXIMO_FOTOS})
            </span>
          </label>
          <CampoFotos
            fotos={fotos}
            onEscolher={escolherFotos}
            onRemover={(indice) =>
              mudarFotos(fotos.filter((_, i) => i !== indice))
            }
            onTornarPrincipal={(indice) =>
              mudarFotos(tornarPrincipal(fotos, indice))
            }
          />
          <Erro id="erro-fotos">{erros.fotos}</Erro>
          <p className="text-[11px] text-[#5f5e5e] mt-1.5">
            JPG, PNG ou WebP, até {TAMANHO_MAXIMO_MB} MB cada. A primeira é a
            principal. A localização guardada na foto pelo celular é apagada.
          </p>
        </div>
      </form>
    </Modal>
  );
}

export default ModalAnimal;
