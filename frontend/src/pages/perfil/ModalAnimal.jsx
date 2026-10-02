import { useState } from "react";
import Modal from "../../components/Modal";
import Ajuda from "../../components/Ajuda";
import Botao from "../../components/Botao";
import Segmentado from "../../components/Segmentado";
import {
  CRITERIOS_DOACAO,
  ESPECIES,
  REFERENCIA_DOADOR,
  SEXOS,
} from "../../regras/doacao";
import { LIMITES } from "../../regras/limites";
import { formatarData } from "../../util/datas";

// Cadastro e edição de um animal pelo tutor.
//
// Só o que o tutor sabe e o que importa para doação. Os critérios clínicos
// (sorologias, vacinação, transfusão) são conferidos pelo veterinário. O mesmo
// formulário cadastra e edita: são os mesmos campos, e manter um só evita que
// as duas telas se afastem com o tempo.
//
// O tipo sanguíneo não está aqui de propósito. É resultado de exame, e um
// palpite de tutor exibido com a mesma cara de um dado conferido engana tanto
// quem procura doador quanto o veterinário que dá a validação por feita.

const MAXIMO_FOTOS = 5;

const FORM_VAZIO = {
  nome: "",
  especie: "CAO",
  raca: "",
  racaSRD: false,
  sexo: "",
  castrado: "",
  idadeConhecida: true,
  dataNascimento: "",
  idadeEstimada: "",
  peso: "",
};

const formularioDoAnimal = (animal) => ({
  ...FORM_VAZIO,
  nome: animal.nome,
  especie: animal.especie,
  raca: animal.raca ?? "",
  racaSRD: !animal.raca,
  sexo: animal.sexo,
  castrado: animal.castrado ? "sim" : "nao",
  dataNascimento: animal.dataNascimento,
  peso: String(animal.pesoKg),
});

// Dados que o veterinário assinou: mudar um deles derruba o critério que ele
// confirmou, porque a conferência foi feita sobre o valor antigo. Peso muda de
// verdade ao longo da vida, e a data de nascimento pode ter sido digitada
// errada; nos dois casos o tutor corrige e a validação volta para a fila. No
// banco, são os motivos EDICAO_PESO e EDICAO_NASCIMENTO da invalidação.
const CRITERIO_POR_CAMPO = {
  peso: "PESO_IDADE",
  dataNascimento: "PESO_IDADE",
};

function criteriosAfetados(form, animal) {
  if (!animal?.validacao) return [];
  const original = formularioDoAnimal(animal);
  const chaves = new Set(
    Object.entries(CRITERIO_POR_CAMPO)
      .filter(([campo]) => form[campo] !== original[campo])
      .map(([, criterio]) => criterio),
  );
  return CRITERIOS_DOACAO.filter(
    (c) => chaves.has(c.chave) && animal.validacao.criterios[c.chave],
  );
}

const OPCOES_ESPECIE = Object.entries(ESPECIES).map(([valor, e]) => ({
  valor,
  rotulo: e.rotulo,
}));

const OPCOES_SEXO = Object.entries(SEXOS).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}));

const CLASSE_CAMPO =
  "w-full px-4 py-2.5 bg-white border border-[#e4bebc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b] focus:border-[#8e001b] placeholder:text-gray-400";
const CLASSE_TITULO = "text-sm font-semibold text-[#1a1c1c]";
const CLASSE_ROTULO = `block mb-1.5 ${CLASSE_TITULO}`;

// Escolha de fotos: os quadradinhos das que já estão escolhidas (a primeira é
// a principal) e o botão de adicionar, até o limite.
function CampoFotos({ fotos, onAdicionar, onRemover }) {
  const entrada = (
    <input
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={onAdicionar}
    />
  );

  if (fotos.length === 0) {
    return (
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#e4bebc] rounded-xl cursor-pointer hover:border-[#8e001b] hover:bg-[#faf0f0] transition-all">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[#c9a5a5] text-4xl mb-2"
        >
          photo_camera
        </span>
        <span className="text-sm font-semibold text-[#5f5e5e]">
          Clique para adicionar fotos
        </span>
        <span className="text-xs text-[#c9a5a5] mt-1">
          JPG, PNG — até {MAXIMO_FOTOS} fotos. A primeira é a principal.
        </span>
        {entrada}
      </label>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {fotos.map((foto, i) => (
        <div
          key={i}
          className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#e4bebc] group"
        >
          <img
            src={foto.preview}
            alt={`Foto ${i + 1}`}
            className="w-full h-full object-cover"
          />
          {i === 0 && (
            <div className="absolute top-1 left-1 bg-[#8e001b] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
              Principal
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemover(i)}
            aria-label={`Remover foto ${i + 1}`}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-white text-xl"
            >
              delete
            </span>
          </button>
        </div>
      ))}

      {fotos.length < MAXIMO_FOTOS && (
        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#e4bebc] flex items-center justify-center cursor-pointer hover:border-[#8e001b] hover:bg-[#faf0f0] transition-all">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[#c9a5a5] text-2xl"
          >
            add_photo_alternate
          </span>
          {entrada}
        </label>
      )}
    </div>
  );
}

// Sem `animal`, cadastra um novo; com ele, edita.
function ModalAnimal({ animal, onFechar }) {
  const editando = !!animal;
  const [form, setForm] = useState(() =>
    editando ? formularioDoAnimal(animal) : FORM_VAZIO,
  );
  // Cada foto é { preview, existente } (já estava no perfil) ou
  // { preview, file } (escolhida agora, com uma URL temporária para mostrar).
  const [fotos, setFotos] = useState(() =>
    (animal?.fotos || []).map((preview) => ({ preview, existente: true })),
  );

  const ref = REFERENCIA_DOADOR[form.especie];
  const afetados = criteriosAfetados(form, animal);
  const validacao = animal?.validacao;
  // Tipo sanguíneo não muda ao longo da vida: depois que o exame de tipagem
  // confirma, o valor é resultado de laboratório assinado por um veterinário,
  // e o tutor deixa de poder sobrescrever. É o dado mais perigoso do sistema
  // para ficar aberto; quem discorda pede revisão ao veterinário.
  const tipagemConfirmada = !!validacao?.criterios.TIPAGEM;

  const mudar = (campo, valor) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const adicionarFotos = (e) => {
    const arquivos = Array.from(e.target.files);
    const permitidos = arquivos.slice(0, MAXIMO_FOTOS - fotos.length);
    const novas = permitidos.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFotos((prev) => [...prev, ...novas]);
  };

  // Foto que já estava no perfil não tem URL temporária para liberar.
  const removerFoto = (indice) => {
    setFotos((prev) => {
      if (!prev[indice].existente) URL.revokeObjectURL(prev[indice].preview);
      return prev.filter((_, i) => i !== indice);
    });
  };

  // Sem API, salvar só avisa e fecha.
  const salvar = (e) => {
    e.preventDefault();
    alert(
      editando
        ? "Alterações salvas! (integração com back-end em breve)"
        : "Animal cadastrado! (integração com back-end em breve)",
    );
    fotos.forEach((f) => !f.existente && URL.revokeObjectURL(f.preview));
    onFechar();
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
            <div className="flex items-start gap-2 bg-[#fdecee] border border-[#b7102a]/25 rounded-lg px-3 py-2.5">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[#8e001b] text-[18px] shrink-0"
              >
                release_alert
              </span>
              <p className="text-xs text-[#5b403f] leading-relaxed">
                Salvar desfaz a validação de{" "}
                <strong className="font-semibold text-[#8e001b]">
                  {afetados.map((c) => c.rotulo.toLowerCase()).join(" e ")}
                </strong>
                , assinada por {validacao.veterinarioNome} em{" "}
                {formatarData(validacao.realizadaEm)}. Um veterinário precisa
                conferir de novo.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Botao variante="secundario" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao
              type="submit"
              form="form-cadastro-animal"
              icone={editando ? undefined : "add"}
            >
              {editando ? "Salvar alterações" : "Cadastrar animal"}
            </Botao>
          </div>
        </div>
      }
    >
      <form id="form-cadastro-animal" onSubmit={salvar} className="space-y-6">
        {!editando && (
          <div className="flex gap-3 bg-[#faf0f0] border border-[#e4bebc] rounded-xl p-4">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[#8e001b] text-[22px] shrink-0"
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
            required
            className={CLASSE_CAMPO}
          />
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
          </div>

          <div>
            <p className={CLASSE_ROTULO}>Sexo *</p>
            <Segmentado
              rotulo="Sexo"
              opcoes={OPCOES_SEXO}
              valor={form.sexo}
              onEscolher={(valor) => mudar("sexo", valor)}
            />
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
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.racaSRD}
                onChange={(e) => {
                  mudar("racaSRD", e.target.checked);
                  mudar("raca", "");
                }}
                className="w-4 h-4 rounded accent-[#8e001b]"
              />
              <span className="text-xs text-[#5f5e5e] font-medium">
                SRD / Não sei a raça
              </span>
            </label>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={CLASSE_TITULO}>Castrado(a)?</span>
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
              Idade
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
              <input
                id="animal-nascimento"
                type="date"
                value={form.dataNascimento}
                onChange={(e) => mudar("dataNascimento", e.target.value)}
                className={CLASSE_CAMPO}
              />
            ) : (
              <input
                id="animal-idade"
                type="text"
                placeholder="Ex: cerca de 3 anos"
                value={form.idadeEstimada}
                onChange={(e) => mudar("idadeEstimada", e.target.value)}
                className={CLASSE_CAMPO}
              />
            )}
            <p className="text-[11px] text-[#5f5e5e] mt-1.5">
              Doadores têm entre {ref.idadeMin} e {ref.idadeMax} anos.
            </p>
          </div>

          <div>
            <label htmlFor="animal-peso" className={CLASSE_ROTULO}>
              Peso (kg)
            </label>
            {/* Espaço do tamanho do seletor ao lado, para os dois campos
                ficarem na mesma linha. */}
            <div className="h-11 mb-2" aria-hidden="true" />
            <input
              id="animal-peso"
              type="number"
              placeholder={`Ex: ${form.especie === "CAO" ? "30" : "4,5"}`}
              min="0"
              step="0.1"
              value={form.peso}
              onChange={(e) => mudar("peso", e.target.value)}
              className={CLASSE_CAMPO}
            />
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
          <p className={CLASSE_ROTULO}>
            Fotos do animal
            <span className="ml-2 text-[#5f5e5e] normal-case font-normal tracking-normal">
              ({fotos.length}/{MAXIMO_FOTOS})
            </span>
          </p>
          <CampoFotos
            fotos={fotos}
            onAdicionar={adicionarFotos}
            onRemover={removerFoto}
          />
        </div>
      </form>
    </Modal>
  );
}

export default ModalAnimal;
