import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import dog1 from "../assets/dog1-image.jpg";
import dog1_1 from "../assets/dog1_1-image.jpg";
import dog1_2 from "../assets/dog1_2-image.jpg";
import dog2 from "../assets/dog2-image.jpg";

const VISUALIZANDO_PROPRIO_PERFIL = true;
const USUARIO_E_VETERINARIO = true;

const TUTOR_MOCK = {
  nome: "Lucas Delgado",
  nomeCompleto: "Lucas Silva Delgado",
  email: "lucas.vet@ufv.br",
  telefone: "(11) 94002-8922",
  crmv: "12345-SP",
  hospital: "Hospital Veterinário UFV",
  cep: "36570-000",
  cidade: "Viçosa - MG",
  bairro: "Centro",
  membroDesde: "24 Jan 2026",
  role: "vet",
};

const ANIMAIS_MOCK = [
  {
    id: 1,
    nome: "Zeus",
    fotos: [dog1, dog1_1, dog1_2],
    especie: "Cão",
    raca: "Golden Retr.",
    peso: "32kg",
    idade: "4 anos",
    tipo: "DEA 1.1+",
    sexo: "Macho",
    reprodutivo: "Castrado",
    medicamentos: "Não",
    transfusao: "Não",
    vacinas: "Em dia",
    ultimaDoacao: "15/10/2023",
    aptidao: "Apto para doação",
    disponivel: true,
    observacoes:
      "Zeus é um doador regular e se comporta muito bem durante a coleta.",
    validacao: {
      status: "validado",
      veterinario: "Dra. Marina Souza",
      crmv: "123",
      validadoEm: "15/10/2023",
      validoAte: "15/10/2024",
    },
    documentos: [
      { nome: "Hemograma completo", status: "validado" },
      { nome: "Sorologias", status: "pendente" },
      { nome: "Carteira de vacinação", status: "enviado" },
    ],
    historico: [
      {
        data: "15/10/2023",
        autor: "Dra. Marina Souza",
        texto:
          "Animal aprovado na triagem clínica. Hemograma dentro dos parâmetros.",
      },
      {
        data: "10/10/2023",
        autor: "Lucas Delgado",
        texto: "Documentos enviados para validação.",
      },
    ],
  },
  {
    id: 2,
    nome: "Luna",
    fotos: [dog2],
    especie: "Gato",
    raca: "SRD",
    peso: "4.5kg",
    idade: "2 anos",
    tipo: "TIPO A",
    sexo: "Fêmea",
    reprodutivo: "Castrada",
    medicamentos: "Não",
    transfusao: "Não",
    vacinas: "Próx: Mar/2024",
    ultimaDoacao: "Nunca doou",
    aptidao: "Apto para doação",
    disponivel: false,
    observacoes: "Luna é um pouco arisca com estranhos; requer contenção leve.",
    validacao: { status: "pendente" },
    documentos: [
      { nome: "Hemograma completo", status: "pendente" },
      { nome: "Sorologias", status: "pendente" },
      { nome: "Carteira de vacinação", status: "pendente" },
    ],
    historico: [],
  },
];

const CAMPOS_ANIMAL = [
  { icon: "pets", label: "Raça", key: "raca" },
  { icon: "monitor_weight", label: "Peso", key: "peso" },
  { icon: "event", label: "Idade", key: "idade" },
  { icon: "bloodtype", label: "Tipo Sanguíneo", key: "tipo", destaque: true },
  { icon: "male", label: "Sexo", key: "sexo" },
  { icon: "health_and_safety", label: "Reprodutivo", key: "reprodutivo" },
  { icon: "medication", label: "Medicamentos", key: "medicamentos" },
  { icon: "blood_pressure", label: "Transfusão?", key: "transfusao" },
  { icon: "vaccines", label: "Vacinas", key: "vacinas" },
  {
    icon: "history",
    label: "Última Doação",
    key: "ultimaDoacao",
    extra: "aptidao",
  },
];

const TIPOS_SANGUINEOS = {
  cao: [
    "DEA 1.1 Universal",
    "DEA 1.1+",
    "DEA 1.1-",
    "DEA 4",
    "DEA 7",
    "Não sei",
  ],
  gato: ["Tipo A", "Tipo B", "Tipo AB", "Não sei"],
};

function DocBadge({ status }) {
  if (status === "validado")
    return (
      <span className="text-[10px] font-bold text-emerald-800 uppercase">
        Validado
      </span>
    );
  if (status === "enviado")
    return (
      <span className="text-[10px] font-bold text-blue-800 uppercase">
        Enviado
      </span>
    );
  return (
    <button className="flex items-center gap-1 text-[10px] font-bold border border-[#8e001b] text-[#8e001b] px-3 py-1 rounded-full hover:bg-[#8e001b] hover:text-white transition-colors">
      <span className="material-symbols-outlined text-sm">upload_file</span>{" "}
      Enviar
    </button>
  );
}

function docBg(status) {
  if (status === "validado") return "bg-emerald-100";
  if (status === "enviado") return "bg-blue-100";
  return "bg-[#eeeeee]";
}

// ─── Carrossel de fotos do animal ─────────────────────────────────────────────
function CarrosselFotos({ fotos, nome }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Placeholder quando não há fotos
  if (!fotos || fotos.length === 0) {
    return (
      <div className="w-full h-56 lg:h-full min-h-[240px] bg-[#faf0f0] border-2 border-dashed border-[#e4bebc] flex flex-col items-center justify-center gap-2 rounded-2xl">
        <span className="material-symbols-outlined text-[#c9a5a5] text-5xl">
          photo_camera
        </span>
        <span className="text-[#c9a5a5] text-xs font-semibold">
          Sem foto ainda
        </span>
      </div>
    );
  }

  // Auto-play a cada 3s, pausa no hover — só se tiver mais de uma foto
  useEffect(() => {
    if (fotos.length <= 1 || pausado) return;
    const timer = setInterval(() => {
      setAtual((prev) => (prev + 1) % fotos.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [fotos.length, pausado]);

  return (
    <div
      className="relative w-full h-56 lg:h-full min-h-[240px] rounded-2xl overflow-hidden border border-[#e4bebc] group"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Fotos empilhadas com fade */}
      {fotos.map((foto, i) => (
        <img
          key={i}
          src={foto}
          alt={`${nome} — foto ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
            i === atual ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Bolinhas indicadoras — só se tiver mais de uma foto */}
      {fotos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setAtual(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === atual ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Ir para foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModalCadastroAnimal({ onClose }) {
  const [form, setForm] = useState({
    nome: "",
    especie: "cao",
    raca: "",
    racaSRD: false,
    sexo: "",
    idadeConhecida: true,
    dataNascimento: "",
    idadeEstimada: "",
    peso: "",
    tipoSanguineo: "",
    reprodutivo: "",
    medicamentos: "",
    transfusao: "",
    vacinas: "",
    observacoes: "",
  });
  const [fotos, setFotos] = useState([]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFotos = (e) => {
    const arquivos = Array.from(e.target.files);
    const total = fotos.length + arquivos.length;
    const permitidos =
      total > 5 ? arquivos.slice(0, 5 - fotos.length) : arquivos;
    const novas = permitidos.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFotos((prev) => [...prev, ...novas]);
  };

  const removerFoto = (index) => {
    setFotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Animal cadastrado! (integração com back-end em breve)");
    fotos.forEach((f) => URL.revokeObjectURL(f.preview));
    onClose();
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-white border border-[#e4bebc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b] focus:border-[#8e001b] placeholder:text-gray-400";
  const labelClass =
    "block text-[11px] font-bold uppercase tracking-widest text-[#8e001b] mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#e4bebc] px-8 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-[#1a1c1c]">
              Cadastrar Novo Animal
            </h2>
            <p className="text-xs text-[#5f5e5e] mt-0.5">
              Preencha as informações do seu pet
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f3f3f3] flex items-center justify-center hover:bg-[#e4bebc] transition-colors"
          >
            <span className="material-symbols-outlined text-[#5f5e5e] text-xl">
              close
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {/* Nome */}
          <div>
            <label className={labelClass}>Nome do animal *</label>
            <input
              type="text"
              placeholder="Ex: Thor, Luna, Bolinha..."
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Espécie */}
          <div>
            <label className={labelClass}>Espécie *</label>
            <div className="flex gap-3">
              {[
                { val: "cao", label: "Cão" },
                { val: "gato", label: "Gato" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    handleChange("especie", item.val);
                    handleChange("tipoSanguineo", "");
                  }}
                  className={`flex-1 py-2.5 px-4 border-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${form.especie === item.val ? "bg-[#8e001b] text-white border-[#8e001b]" : "border-[#e4bebc] text-[#1a1c1c] hover:border-[#8e001b]"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    pets
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Raça */}
          <div>
            <label className={labelClass}>Raça</label>
            <input
              type="text"
              placeholder={
                form.racaSRD
                  ? "SRD (Sem Raça Definida)"
                  : "Ex: Golden Retriever, Labrador..."
              }
              value={form.racaSRD ? "SRD" : form.raca}
              onChange={(e) => handleChange("raca", e.target.value)}
              disabled={form.racaSRD}
              className={`${inputClass} ${form.racaSRD ? "bg-[#f3f3f3] text-[#5f5e5e]" : ""}`}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.racaSRD}
                onChange={(e) => {
                  handleChange("racaSRD", e.target.checked);
                  handleChange("raca", "");
                }}
                className="w-4 h-4 rounded accent-[#8e001b]"
              />
              <span className="text-xs text-[#5f5e5e] font-medium">
                SRD / Não sei a raça
              </span>
            </label>
          </div>

          {/* Sexo */}
          <div>
            <label className={labelClass}>Sexo *</label>
            <div className="flex gap-3">
              {["Macho", "Fêmea"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChange("sexo", s)}
                  className={`flex-1 py-2.5 px-4 border-2 rounded-xl text-sm font-semibold transition-all ${form.sexo === s ? "bg-[#8e001b] text-white border-[#8e001b]" : "border-[#e4bebc] text-[#1a1c1c] hover:border-[#8e001b]"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Idade */}
          <div>
            <label className={labelClass}>Idade</label>
            <div className="flex gap-3 mb-3">
              {[
                { val: true, label: "Sei a data de nascimento" },
                { val: false, label: "Vou estimar" },
              ].map((item) => (
                <button
                  key={String(item.val)}
                  type="button"
                  onClick={() => handleChange("idadeConhecida", item.val)}
                  className={`flex-1 py-2 px-3 border-2 rounded-xl text-xs font-semibold transition-all ${form.idadeConhecida === item.val ? "bg-[#8e001b] text-white border-[#8e001b]" : "border-[#e4bebc] text-[#1a1c1c] hover:border-[#8e001b]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {form.idadeConhecida ? (
              <input
                type="date"
                value={form.dataNascimento}
                onChange={(e) => handleChange("dataNascimento", e.target.value)}
                className={inputClass}
              />
            ) : (
              <input
                type="text"
                placeholder="Ex: aproximadamente 3 anos..."
                value={form.idadeEstimada}
                onChange={(e) => handleChange("idadeEstimada", e.target.value)}
                className={inputClass}
              />
            )}
          </div>

          {/* Peso */}
          <div>
            <label className={labelClass}>Peso (kg)</label>
            <input
              type="number"
              placeholder="Ex: 25"
              min="0"
              step="0.1"
              value={form.peso}
              onChange={(e) => handleChange("peso", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Tipo Sanguíneo */}
          <div>
            <label className={labelClass}>Tipo Sanguíneo</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_SANGUINEOS[form.especie].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleChange("tipoSanguineo", tipo)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${form.tipoSanguineo === tipo ? "bg-[#8e001b] text-white border-[#8e001b]" : "bg-[#f3f3f3] text-[#1a1c1c] border-transparent hover:border-[#8e001b]"}`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Reprodutivo */}
          <div>
            <label className={labelClass}>Status Reprodutivo</label>
            <div className="flex gap-3">
              {[
                {
                  val: "Castrado",
                  label: form.especie === "cao" ? "Castrado" : "Castrada",
                },
                {
                  val: "Inteiro",
                  label: form.especie === "cao" ? "Inteiro" : "Inteira",
                },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleChange("reprodutivo", item.val)}
                  className={`flex-1 py-2.5 px-4 border-2 rounded-xl text-sm font-semibold transition-all ${form.reprodutivo === item.val ? "bg-[#8e001b] text-white border-[#8e001b]" : "border-[#e4bebc] text-[#1a1c1c] hover:border-[#8e001b]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicamentos / Transfusão / Vacinas */}
          {[
            { field: "medicamentos", label: "Está tomando algum medicamento?" },
            { field: "transfusao", label: "Já recebeu transfusão de sangue?" },
            { field: "vacinas", label: "Vacinas em dia?" },
          ].map((item) => (
            <div key={item.field}>
              <label className={labelClass}>{item.label}</label>
              <div className="flex gap-3">
                {["Sim", "Não"].map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    onClick={() => handleChange(item.field, opcao)}
                    className={`flex-1 py-2.5 px-4 border-2 rounded-xl text-sm font-semibold transition-all ${form[item.field] === opcao ? "bg-[#8e001b] text-white border-[#8e001b]" : "border-[#e4bebc] text-[#1a1c1c] hover:border-[#8e001b]"}`}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Observações */}
          <div>
            <label className={labelClass}>Observações</label>
            <textarea
              placeholder="Comportamento durante exames..."
              value={form.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* ── Fotos do animal ── */}
          <div>
            <label className={labelClass}>
              Fotos do animal
              <span className="ml-2 text-[#5f5e5e] normal-case font-normal tracking-normal">
                ({fotos.length}/5)
              </span>
            </label>
            <p className="text-xs text-[#5f5e5e] mb-3">
              Adicione até 5 fotos do seu pet. A primeira foto será a principal
              exibida no perfil.
            </p>

            {/* Previews das fotos */}
            {fotos.length > 0 && (
              <div className="flex gap-3 flex-wrap mb-4">
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
                      onClick={() => removerFoto(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-white text-xl">
                        delete
                      </span>
                    </button>
                  </div>
                ))}

                {/* Slot de adicionar mais — aparece se ainda há espaço */}
                {fotos.length < 5 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#e4bebc] flex flex-col items-center justify-center cursor-pointer hover:border-[#8e001b] hover:bg-[#faf0f0] transition-all">
                    <span className="material-symbols-outlined text-[#c9a5a5] text-2xl">
                      add_photo_alternate
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFotos}
                    />
                  </label>
                )}
              </div>
            )}

            {/* Área de upload — aparece só se não tem nenhuma foto ainda */}
            {fotos.length === 0 && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#e4bebc] rounded-xl cursor-pointer hover:border-[#8e001b] hover:bg-[#faf0f0] transition-all">
                <span className="material-symbols-outlined text-[#c9a5a5] text-4xl mb-2">
                  photo_camera
                </span>
                <span className="text-sm font-semibold text-[#5f5e5e]">
                  Clique para adicionar fotos
                </span>
                <span className="text-xs text-[#c9a5a5] mt-1">
                  JPG, PNG — até 5 fotos
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFotos}
                />
              </label>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-[#e4bebc] text-[#5f5e5e] font-bold rounded-full text-sm hover:border-[#8e001b] hover:text-[#8e001b] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#8e001b] text-white font-bold rounded-full text-sm hover:brightness-110 transition-all active:scale-95"
            >
              Cadastrar Animal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnimalCard({ animal, isProprioTutor, isVet }) {
  const [disponivel, setDisponivel] = useState(animal.disponivel);
  const [docsAbertos, setDocsAbertos] = useState(false);
  const [obsVet, setObsVet] = useState("");
  const [historicoLocal, setHistoricoLocal] = useState(animal.historico);
  const [adicionandoObs, setAdicionandoObs] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const adicionarObservacao = () => {
    if (!obsVet.trim()) return;
    setHistoricoLocal((prev) => [
      {
        data: new Date().toLocaleDateString("pt-BR"),
        autor: "Veterinário (você)",
        texto: obsVet.trim(),
      },
      ...prev,
    ]);
    setObsVet("");
    setAdicionandoObs(false);
  };

  const btnBase =
    "flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95";

  return (
    <div className="bg-white rounded-2xl border border-[#8e001b]/20 shadow-sm overflow-hidden mb-6">
      {/* ── Cabeçalho ── */}
      <div className="px-8 pt-6 pb-4 flex justify-between items-center gap-4 flex-wrap border-b border-[#e4bebc]">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-extrabold text-2xl text-[#8e001b] leading-none">
            {animal.nome}
          </h3>
          <span className="text-xs font-bold text-[#5b403f] uppercase bg-[#eeeeee] px-2.5 py-1 rounded">
            {animal.especie}
          </span>
          {isProprioTutor ? (
            <button
              onClick={() => setDisponivel(!disponivel)}
              title="Clique para alterar a disponibilidade"
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all active:scale-95 ${
                disponivel
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-[#eeeeee] text-[#5f5e5e] hover:bg-[#e0e0e0]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${disponivel ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
              />
              {disponivel
                ? "Disponível para doação"
                : "Indisponível para doação"}
              <span className="material-symbols-outlined text-[14px] opacity-60">
                swap_horiz
              </span>
            </button>
          ) : (
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                disponivel
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-[#eeeeee] text-[#5f5e5e]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${disponivel ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
              />
              {disponivel
                ? "Disponível para doação"
                : "Indisponível para doação"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isVet && (
            <button
              onClick={() => setAdicionandoObs(true)}
              className={`${btnBase} bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white`}
            >
              <span className="material-symbols-outlined text-[16px]">
                fact_check
              </span>
              Auditar
            </button>
          )}
          {isProprioTutor && (
            <>
              <button
                className={`${btnBase} bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  edit
                </span>
                Editar
              </button>
              {confirmandoExclusao ? (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                  <span className="text-xs font-bold text-red-600">
                    Tem certeza?
                  </span>
                  <button
                    onClick={() => {
                      setConfirmandoExclusao(false);
                      alert(
                        "Animal excluído! (integração com back-end em breve)",
                      );
                    }}
                    className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full hover:bg-red-600"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setConfirmandoExclusao(false)}
                    className="text-[10px] font-bold text-red-500"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmandoExclusao(true)}
                  className={`${btnBase} bg-[#f5f5f5] text-[#5f5e5e] hover:bg-red-500 hover:text-white`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    delete
                  </span>
                  Excluir
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Corpo: foto alta à esquerda + todo o conteúdo à direita ── */}
      <div className="flex gap-6 flex-col lg:flex-row p-8">
        {/* Foto — ocupa toda a altura do corpo */}
        <div className="w-full lg:w-64 shrink-0">
          <CarrosselFotos fotos={animal.fotos} nome={animal.nome} />
        </div>

        {/* Coluna direita: dados + validação + documentos + histórico */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Grid de dados */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {CAMPOS_ANIMAL.map((campo) => (
              <div
                key={campo.key}
                className="bg-[#fafafa] border border-[#f0e6e6] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1.5"
              >
                <span className="text-[#8e001b] text-[11px] font-bold uppercase tracking-widest">
                  {campo.label}
                </span>
                {campo.destaque ? (
                  <span className="text-[#8e001b] text-lg font-extrabold leading-tight">
                    {animal[campo.key]}
                  </span>
                ) : campo.extra ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[#1a1c1c] font-bold text-[15px] leading-tight">
                      {animal[campo.key]}
                    </span>
                    <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-wider mt-0.5">
                      {animal[campo.extra]}
                    </span>
                  </div>
                ) : (
                  <span className="text-[#1a1c1c] font-semibold text-[15px] leading-tight">
                    {animal[campo.key]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Banner de validação */}
          {animal.validacao.status === "validado" ? (
            <div className="bg-emerald-50 border-l-4 border-emerald-600 px-6 py-4 flex items-center justify-between rounded-r-lg">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-emerald-600 text-[32px]">
                  verified_user
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-emerald-900 text-sm">
                    Validado clinicamente
                  </span>
                  <span className="text-emerald-800 text-xs">
                    {animal.validacao.veterinario} — CRMV{" "}
                    {animal.validacao.crmv}
                  </span>
                </div>
              </div>
              <div className="flex gap-8 text-xs text-emerald-800">
                <div className="flex flex-col items-end">
                  <span className="opacity-70 uppercase font-bold text-[10px]">
                    Validado em:
                  </span>
                  <span className="font-semibold">
                    {animal.validacao.validadoEm}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="opacity-70 uppercase font-bold text-[10px]">
                    Válido até:
                  </span>
                  <span className="font-semibold">
                    {animal.validacao.validoAte}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border-l-4 border-amber-500 px-6 py-4 flex items-center gap-4 rounded-r-lg">
              <span className="material-symbols-outlined text-amber-600 text-[32px]">
                schedule
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-amber-900 text-sm">
                  Informações não validadas
                </span>
                <span className="text-amber-800 text-xs">
                  Aguardando revisão veterinária
                </span>
              </div>
            </div>
          )}

          {/* Documentos */}
          <div>
            <button
              onClick={() => setDocsAbertos(!docsAbertos)}
              className="flex items-center gap-2 text-[#8e001b] font-bold text-sm mb-4"
            >
              {docsAbertos ? "Ocultar documentos ↑" : "Ver documentos ↓"}
            </button>
            {docsAbertos && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {animal.documentos.map((doc) => (
                  <div
                    key={doc.nome}
                    className={`${docBg(doc.status)} p-4 rounded-xl flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#8e001b]">
                        description
                      </span>
                      <span className="font-semibold text-sm">{doc.nome}</span>
                    </div>
                    <DocBadge status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário de observação */}
          {isVet && adicionandoObs && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm font-bold text-emerald-900 mb-3">
                Nova observação clínica
              </p>
              <textarea
                value={obsVet}
                onChange={(e) => setObsVet(e.target.value)}
                placeholder="Descreva sua observação clínica..."
                className="w-full border border-emerald-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3}
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={adicionarObservacao}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  Salvar observação
                </button>
                <button
                  onClick={() => {
                    setAdicionandoObs(false);
                    setObsVet("");
                  }}
                  className="text-sm font-bold text-[#5f5e5e] hover:text-[#1a1c1c]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Histórico */}
          {historicoLocal.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5f5e5e] mb-3">
                Histórico
              </p>
              <div className="space-y-3">
                {historicoLocal.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-sm border-l-2 border-[#e4bebc] pl-4"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-[#5f5e5e] uppercase tracking-wider">
                        {item.data} — {item.autor}
                      </p>
                      <p className="text-[#1a1c1c] mt-0.5">{item.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5f5e5e] mb-2">
                Histórico
              </p>
              <p className="text-sm text-[#5f5e5e] italic">
                Nenhuma observação registrada ainda.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Observações — largura total no rodapé ── */}
      <div className="border-t border-[#e4bebc] bg-white p-4 px-8 text-[#5b403f] text-sm">
        <p className="italic">
          <strong className="font-bold text-[#1a1c1c] not-italic">
            Observações:
          </strong>{" "}
          {animal.observacoes}
        </p>
      </div>
    </div>
  );
}
function DashboardPage() {
  const { id } = useParams();
  const [telefoneVisivel, setTelefoneVisivel] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const isProprioTutor = VISUALIZANDO_PROPRIO_PERFIL;
  const isVet = USUARIO_E_VETERINARIO;

  const infoGrid = [
    { icon: "person", label: "Nome Completo", valor: TUTOR_MOCK.nomeCompleto },
    { icon: "mail", label: "E-mail", valor: TUTOR_MOCK.email },
    {
      icon: "call",
      label: "Telefone",
      valor: telefoneVisivel ? TUTOR_MOCK.telefone : "•••••••••••••",
      toggle: true,
    },
    ...(TUTOR_MOCK.role === "vet"
      ? [
          { icon: "clinical_notes", label: "CRMV", valor: TUTOR_MOCK.crmv },
          { icon: "apartment", label: "Hospital", valor: TUTOR_MOCK.hospital },
        ]
      : []),
    { icon: "markunread_mailbox", label: "CEP", valor: TUTOR_MOCK.cep },
    { icon: "location_on", label: "Cidade", valor: TUTOR_MOCK.cidade },
    { icon: "home", label: "Bairro", valor: TUTOR_MOCK.bairro },
  ];

  return (
    <>
      <Header dark={true} />
      {modalAberto && (
        <ModalCadastroAnimal onClose={() => setModalAberto(false)} />
      )}

      <main className="pb-20 px-5 md:px-16 max-w-[1200px] mx-auto pt-28">
        <section className="mb-20">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden border-[#8e001b]/20">
            <div className="h-32 bg-gradient-to-r from-[#8e001b] to-[#b7102a]" />
            <div className="px-8 pb-6 pt-4 flex justify-between items-center flex-wrap gap-4 relative">
              <div className="flex items-center gap-6">
                <div className="relative -mt-16">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-sm bg-[#e2e2e2] flex items-center justify-center relative z-10">
                    <span className="material-symbols-outlined text-[#5f5e5e] text-5xl">
                      person
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <h1 className="text-2xl font-bold text-[#1a1c1c]">
                    {TUTOR_MOCK.nome}
                  </h1>
                  {TUTOR_MOCK.role === "vet" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#8e001b]/10 border border-[#8e001b]/20 rounded-full mt-2 inline-flex">
                      <span className="material-symbols-outlined text-[#8e001b] text-[14px]">
                        medical_services
                      </span>
                      <span className="text-[#8e001b] font-bold text-[10px] uppercase tracking-widest">
                        Veterinário Validado
                      </span>
                    </div>
                  )}
                  <p className="text-[#5f5e5e] text-[12px] flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">
                      calendar_month
                    </span>
                    Membro desde: {TUTOR_MOCK.membroDesde}
                  </p>
                </div>
              </div>
              {isProprioTutor && (
                <button className="border-2 border-[#8e001b] text-[#8e001b] font-bold hover:bg-[#8e001b] hover:text-white transition-colors px-6 py-2 rounded-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    edit
                  </span>
                  Editar perfil
                </button>
              )}
            </div>
            <div className="border-t mt-6 pt-6 mx-8 border-[#e4bebc]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-4 mt-6 pb-8 justify-items-center">
                {infoGrid.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center text-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[#8e001b]">
                      {item.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[#8e001b] text-[11px] font-bold uppercase tracking-widest">
                        {item.label}
                      </span>
                      {item.toggle ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[#1a1c1c] font-semibold text-sm">
                            {item.valor}
                          </span>
                          <button
                            onClick={() => setTelefoneVisivel(!telefoneVisivel)}
                            className="material-symbols-outlined text-[#8e001b] text-lg hover:opacity-70 transition-opacity"
                          >
                            {telefoneVisivel ? "visibility_off" : "visibility"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#1a1c1c] font-semibold text-sm">
                          {item.valor}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-[#1a1c1c]">
              {isProprioTutor
                ? "Meus Animais"
                : "Animais de " + TUTOR_MOCK.nome}
            </h2>
            <span className="text-xs font-semibold text-[#5f5e5e] uppercase">
              {ANIMAIS_MOCK.length} Animais Cadastrados
            </span>
          </div>
        </section>

        <section className="space-y-6">
          {ANIMAIS_MOCK.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              isProprioTutor={isProprioTutor}
              isVet={isVet}
            />
          ))}
          {isProprioTutor && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full py-20 flex flex-col items-center justify-center gap-4 hover:bg-[#f3f3f3] transition-colors group rounded-2xl"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%238F6F6EFF' stroke-width='2' stroke-dasharray='8%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
                borderRadius: "1rem",
              }}
            >
              <div className="w-12 h-12 rounded-full bg-[#ffdad8] flex items-center justify-center text-[#8e001b] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[32px]">
                  add
                </span>
              </div>
              <span className="text-sm font-bold text-[#8e001b] uppercase tracking-wider">
                + Cadastrar Novo Animal
              </span>
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export default DashboardPage;
