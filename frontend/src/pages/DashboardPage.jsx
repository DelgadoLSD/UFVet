import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import dog1 from "../assets/dogs/dog1_0-image.jpg";
import dog1_1 from "../assets/dogs/dog1_1-image.jpg";
import dog1_2 from "../assets/dogs/dog1_2-image.jpg";
import cat1 from "../assets/cats/cat1_0-image.jpg";

const VISUALIZANDO_PROPRIO_PERFIL = false;
const USUARIO_E_VETERINARIO = true;

const USUARIO_LOGADO = {
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

const TUTOR_MOCK = {
  nome: "Marina Souza",
  nomeCompleto: "Marina Souza Andrade",
  email: "marina.souza@gmail.com",
  telefone: "(31) 98871-4402",
  cep: "36570-120",
  cidade: "Viçosa - MG",
  bairro: "Ramos",
  membroDesde: "08 Mar 2026",
  role: "tutor",
};

const validado = (por, crmv, em, nota = "") => ({
  status: "validado",
  por,
  crmv,
  em,
  nota,
});

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
    validacaoCampos: {
      raca: validado("Dr. Paulo Rezende", "88214-MG", "15/10/2025"),
      idade: validado("Dr. Paulo Rezende", "88214-MG", "15/10/2025"),
      tipo: validado(
        "Dr. Paulo Rezende",
        "88214-MG",
        "15/10/2025",
        "Tipagem confirmada por cartão de tipagem sanguínea.",
      ),
      sexo: validado("Dr. Paulo Rezende", "88214-MG", "15/10/2025"),
      reprodutivo: validado("Dr. Paulo Rezende", "88214-MG", "15/10/2025"),
      medicamentos: validado("Dr. Paulo Rezende", "88214-MG", "15/10/2025"),
      transfusao: validado("Dr. Paulo Rezende", "88214-MG", "15/10/2025"),
    },
    documentos: [
      { nome: "Hemograma completo", status: "validado" },
      { nome: "Sorologias", status: "pendente" },
      { nome: "Carteira de vacinação", status: "enviado" },
    ],
    historico: [
      {
        data: "15/10/2025",
        autor: "Dr. Paulo Rezende",
        texto:
          "Triagem clínica realizada. Hemograma dentro dos parâmetros. Peso e última doação pendentes de reconferência.",
      },
      {
        data: "10/10/2025",
        autor: "Marina Souza",
        texto: "Documentos enviados para validação.",
      },
    ],
  },
  {
    id: 2,
    nome: "Luna",
    fotos: [cat1],
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
    validacaoCampos: {},
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
  {
    icon: "bloodtype",
    label: "Tipo Sanguíneo",
    key: "tipo",
    destaque: true,
    opcoesPorEspecie: true,
  },
  { icon: "male", label: "Sexo", key: "sexo", opcoes: ["Macho", "Fêmea"] },
  {
    icon: "health_and_safety",
    label: "Reprodutivo",
    key: "reprodutivo",
    opcoes: ["Castrado", "Castrada", "Inteiro", "Inteira"],
  },
  {
    icon: "medication",
    label: "Medicamentos",
    key: "medicamentos",
    opcoes: ["Sim", "Não"],
  },
  {
    icon: "blood_pressure",
    label: "Transfusão?",
    key: "transfusao",
    opcoes: ["Sim", "Não"],
  },
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

const hoje = () => new Date().toLocaleDateString("pt-BR");

// Validação clínica vale por 1 ano a partir da data informada (dd/mm/aaaa)
const umAnoApos = (data) => {
  const [dia, mes, ano] = data.split("/");
  return `${dia}/${mes}/${Number(ano) + 1}`;
};

// Status geral do animal derivado dos selos individuais de cada campo
function resumoValidacao(validacoes) {
  const total = CAMPOS_ANIMAL.length;
  const entradas = CAMPOS_ANIMAL.map((c) => validacoes[c.key]).filter(Boolean);
  const validados = entradas.filter((v) => v.status === "validado");
  const contestados = entradas.filter((v) => v.status === "contestado");

  let status = "pendente";
  if (contestados.length > 0) status = "contestado";
  else if (validados.length === total) status = "validado";
  else if (validados.length > 0) status = "parcial";

  // O selo geral leva o nome do vet que fechou a validação (o mais recente)
  const ultimo = validados[validados.length - 1];

  return {
    status,
    total,
    validados: validados.length,
    contestados: contestados.length,
    veterinario: ultimo?.por,
    crmv: ultimo?.crmv,
    validadoEm: ultimo?.em,
    validoAte: ultimo ? umAnoApos(ultimo.em) : null,
  };
}

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
        Aguardando conferência
      </span>
    );
  if (status === "recusado")
    return (
      <span className="text-[10px] font-bold text-red-700 uppercase">
        Recusado
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
  if (status === "recusado") return "bg-red-100";
  return "bg-[#eeeeee]";
}

const ESTILO_CAMPO = {
  validado: {
    card: "bg-emerald-50/60 border-emerald-200",
    icone: "verified",
    cor: "text-emerald-600",
  },
  contestado: {
    card: "bg-amber-50/70 border-amber-300",
    icone: "flag",
    cor: "text-amber-600",
  },
  pendente: {
    card: "bg-[#fafafa] border-[#f0e6e6]",
    icone: "schedule",
    cor: "text-[#c9a5a5]",
  },
};

// ─── Campo do animal: exibe o selo e, em auditoria, permite editar/validar ────
function CampoAuditavel({
  campo,
  animal,
  valor,
  validacao,
  auditando,
  onEditar,
  onValidar,
  onContestar,
  onReabrir,
}) {
  const [contestando, setContestando] = useState(false);
  const [nota, setNota] = useState("");

  const status = validacao?.status ?? "pendente";
  const estilo = ESTILO_CAMPO[status];

  const opcoes = campo.opcoesPorEspecie
    ? TIPOS_SANGUINEOS[animal.especie === "Gato" ? "gato" : "cao"]
    : campo.opcoes;

  const titulo =
    status === "validado"
      ? `Validado por ${validacao.por} (CRMV ${validacao.crmv}) em ${validacao.em}${validacao.nota ? ` — ${validacao.nota}` : ""}`
      : status === "contestado"
        ? `Contestado por ${validacao.por} em ${validacao.em} — ${validacao.nota}`
        : "Aguardando validação veterinária";

  const enviarContestacao = () => {
    if (!nota.trim()) return;
    onContestar(campo.key, nota.trim());
    setNota("");
    setContestando(false);
  };

  return (
    <div
      title={titulo}
      className={`relative border rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-colors ${estilo.card}`}
    >
      <span
        className={`material-symbols-outlined absolute top-1.5 right-1.5 text-[15px] ${estilo.cor}`}
      >
        {estilo.icone}
      </span>

      <span className="text-[#8e001b] text-[11px] font-bold uppercase tracking-widest">
        {campo.label}
      </span>

      {auditando ? (
        opcoes ? (
          <select
            value={valor}
            onChange={(e) => onEditar(campo.key, e.target.value)}
            className="w-full bg-white text-gray-900 [color-scheme:light] border border-[#e4bebc] rounded-lg px-2 py-1.5 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8e001b]"
          >
            {!opcoes.includes(valor) && <option value={valor}>{valor}</option>}
            {opcoes.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={valor}
            onChange={(e) => onEditar(campo.key, e.target.value)}
            className="w-full bg-white text-gray-900 [color-scheme:light] border border-[#e4bebc] rounded-lg px-2 py-1.5 text-[13px] font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#8e001b]"
          />
        )
      ) : campo.destaque ? (
        <span className="text-[#8e001b] text-lg font-extrabold leading-tight">
          {valor}
        </span>
      ) : campo.extra ? (
        <div className="flex flex-col items-center">
          <span className="text-[#1a1c1c] font-bold text-[15px] leading-tight">
            {valor}
          </span>
          <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-wider mt-0.5">
            {animal[campo.extra]}
          </span>
        </div>
      ) : (
        <span className="text-[#1a1c1c] font-semibold text-[15px] leading-tight">
          {valor}
        </span>
      )}

      {!auditando && status === "contestado" && (
        <span className="text-amber-800 text-[10px] font-semibold leading-snug">
          {validacao.nota}
        </span>
      )}

      {auditando &&
        (contestando ? (
          <div className="w-full mt-1">
            <textarea
              autoFocus
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="O que precisa ser corrigido?"
              rows={2}
              className="w-full bg-white text-gray-900 [color-scheme:light] border border-amber-300 rounded-lg p-2 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={enviarContestacao}
                className="flex-1 bg-amber-500 text-white text-[10px] font-bold py-1 rounded-full hover:bg-amber-600 transition-colors"
              >
                Contestar
              </button>
              <button
                onClick={() => {
                  setContestando(false);
                  setNota("");
                }}
                className="px-2 text-[10px] font-bold text-[#5f5e5e] hover:text-[#1a1c1c]"
              >
                ✕
              </button>
            </div>
          </div>
        ) : status === "pendente" ? (
          <div className="flex gap-1 w-full mt-1">
            <button
              onClick={() => onValidar(campo.key)}
              title="Validar este campo"
              className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white text-[10px] font-bold py-1.5 rounded-full hover:bg-emerald-700 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[13px]">
                check
              </span>
              Validar
            </button>
            <button
              onClick={() => setContestando(true)}
              title="Contestar este campo"
              className="w-8 flex items-center justify-center border border-amber-400 text-amber-600 rounded-full hover:bg-amber-500 hover:text-white transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[13px]">
                flag
              </span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onReabrir(campo.key)}
            className="w-full mt-1 text-[10px] font-bold text-[#5f5e5e] border border-[#e4bebc] py-1 rounded-full hover:border-[#8e001b] hover:text-[#8e001b] transition-colors"
          >
            Reabrir campo
          </button>
        ))}
    </div>
  );
}

// ─── Carrossel de fotos do animal ─────────────────────────────────────────────
function CarrosselFotos({ fotos, nome }) {
  const [atual, setAtual] = useState(0);
  const temFotos = fotos && fotos.length > 0;
  const temVarias = temFotos && fotos.length > 1;

  const anterior = () =>
    setAtual((prev) => (prev - 1 + fotos.length) % fotos.length);
  const proxima = () => setAtual((prev) => (prev + 1) % fotos.length);

  // Placeholder quando não há fotos
  if (!temFotos) {
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

  return (
    <div className="relative w-full h-56 lg:h-full min-h-[240px] rounded-2xl overflow-hidden border border-[#e4bebc] group">
      {/* Fotos empilhadas com fade — a troca só acontece por ação do usuário */}
      {fotos.map((foto, i) => (
        <img
          key={i}
          src={foto}
          alt={`${nome} — foto ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
            i === atual ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {temVarias && (
        <>
          {/* Setas de navegação — maior área de clique, aparecem no hover */}
          <button
            onClick={anterior}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-black/60"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_left
            </span>
          </button>
          <button
            onClick={proxima}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-black/60"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_right
            </span>
          </button>

          {/* Contador — indica quantas fotos existem, sempre visível */}
          <div className="absolute top-2 right-2 z-10 bg-black/40 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {atual + 1}/{fotos.length}
          </div>

          {/* Bolinhas indicadoras — mantidas como referência visual da posição */}
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
        </>
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

const HISTORICO_VISIVEL = 3;

function ModalHistorico({ animal, historico, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#e4bebc] px-8 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-[#1a1c1c]">
              Histórico completo — {animal.nome}
            </h2>
            <p className="text-xs text-[#5f5e5e] mt-0.5">
              {historico.length} registro{historico.length !== 1 ? "s" : ""}
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

        <div className="px-8 py-6 space-y-3">
          {historico.map((item, i) => (
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
    </div>
  );
}

function BannerValidacao({ resumo }) {
  const pct = Math.round((resumo.validados / resumo.total) * 100);

  if (resumo.status === "validado") {
    return (
      <div className="bg-emerald-50 border-l-4 border-emerald-600 px-6 py-4 flex items-center justify-between gap-4 flex-wrap rounded-r-lg">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-emerald-600 text-[32px]">
            verified_user
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-emerald-900 text-sm">
              Validado clinicamente — {resumo.total} de {resumo.total} campos
            </span>
            <span className="text-emerald-800 text-xs">
              {resumo.veterinario} — CRMV {resumo.crmv}
            </span>
          </div>
        </div>
        <div className="flex gap-8 text-xs text-emerald-800">
          <div className="flex flex-col items-end">
            <span className="opacity-70 uppercase font-bold text-[10px]">
              Validado em:
            </span>
            <span className="font-semibold">{resumo.validadoEm}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="opacity-70 uppercase font-bold text-[10px]">
              Válido até:
            </span>
            <span className="font-semibold">{resumo.validoAte}</span>
          </div>
        </div>
      </div>
    );
  }

  if (resumo.status === "contestado") {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 px-6 py-4 flex items-center justify-between gap-4 flex-wrap rounded-r-lg">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-red-600 text-[32px]">
            report
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-red-900 text-sm">
              {resumo.contestados} campo(s) contestado(s) pelo veterinário
            </span>
            <span className="text-red-800 text-xs">
              O tutor precisa corrigir as informações sinalizadas antes de o
              animal ser liberado como doador.
            </span>
          </div>
        </div>
        <span className="text-red-800 text-xs font-semibold">
          {resumo.validados}/{resumo.total} validados
        </span>
      </div>
    );
  }

  if (resumo.status === "parcial") {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 px-6 py-4 flex flex-col gap-3 rounded-r-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-blue-600 text-[32px]">
              pending_actions
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-blue-900 text-sm">
                Validação parcial — {resumo.validados} de {resumo.total} campos
              </span>
              <span className="text-blue-800 text-xs">
                Última conferência por {resumo.veterinario} — CRMV {resumo.crmv}{" "}
                em {resumo.validadoEm}
              </span>
            </div>
          </div>
          <span className="text-blue-800 text-xs font-bold">{pct}%</span>
        </div>
        <div className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 px-6 py-4 flex items-center gap-4 rounded-r-lg">
      <span className="material-symbols-outlined text-amber-600 text-[32px]">
        schedule
      </span>
      <div className="flex flex-col">
        <span className="font-bold text-amber-900 text-sm">
          Informações não validadas
        </span>
        <span className="text-amber-800 text-xs">
          Nenhum campo conferido ainda — aguardando revisão veterinária.
        </span>
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
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  const [auditando, setAuditando] = useState(false);
  // valoresSalvos = o que já foi confirmado; valores = o rascunho em edição
  const [valoresSalvos, setValoresSalvos] = useState(() =>
    Object.fromEntries(CAMPOS_ANIMAL.map((c) => [c.key, animal[c.key]])),
  );
  const [valores, setValores] = useState(valoresSalvos);
  const [validacoes, setValidacoes] = useState(animal.validacaoCampos);
  const [documentos, setDocumentos] = useState(animal.documentos);

  const resumo = resumoValidacao(validacoes);
  const assinatura = {
    por: USUARIO_LOGADO.nome,
    crmv: USUARIO_LOGADO.crmv,
  };

  const registrar = (texto) =>
    setHistoricoLocal((prev) => [
      { data: hoje(), autor: `${USUARIO_LOGADO.nome} (você)`, texto },
      ...prev,
    ]);

  const rotulo = (key) => CAMPOS_ANIMAL.find((c) => c.key === key).label;

  const editarCampo = (key, valor) =>
    setValores((prev) => ({ ...prev, [key]: valor }));

  // Ao validar, o vet assume o valor que está em tela — se ele corrigiu, a
  // correção entra no histórico junto com o selo.
  const validarCampo = (key, silencioso = false) => {
    const original = valoresSalvos[key];
    const atual = valores[key];
    setValidacoes((prev) => ({
      ...prev,
      [key]: { status: "validado", ...assinatura, em: hoje(), nota: "" },
    }));
    setValoresSalvos((prev) => ({ ...prev, [key]: atual }));
    if (silencioso) return;
    registrar(
      atual !== original
        ? `${rotulo(key)} corrigido de "${original}" para "${atual}" e validado.`
        : `${rotulo(key)} validado.`,
    );
  };

  const contestarCampo = (key, nota) => {
    setValidacoes((prev) => ({
      ...prev,
      [key]: { status: "contestado", ...assinatura, em: hoje(), nota },
    }));
    registrar(`${rotulo(key)} contestado: ${nota}`);
  };

  const reabrirCampo = (key) => {
    setValidacoes((prev) => {
      const copia = { ...prev };
      delete copia[key];
      return copia;
    });
    registrar(`${rotulo(key)} reaberto para revisão.`);
  };

  const validarRestantes = () => {
    const pendentes = CAMPOS_ANIMAL.filter(
      (c) => !validacoes[c.key] || validacoes[c.key].status !== "validado",
    );
    if (pendentes.length === 0) return;
    pendentes.forEach((c) => validarCampo(c.key, true));
    registrar(
      `${pendentes.length} campo(s) validado(s) em lote: ${pendentes.map((c) => c.label).join(", ")}.`,
    );
  };

  const avaliarDocumento = (nome, status) => {
    setDocumentos((prev) =>
      prev.map((d) => (d.nome === nome ? { ...d, status } : d)),
    );
    registrar(
      status === "validado"
        ? `Documento "${nome}" conferido e validado.`
        : `Documento "${nome}" recusado — reenvio necessário.`,
    );
  };

  // Rascunhos não validados são descartados ao sair do modo auditoria
  const encerrarAuditoria = () => {
    setAuditando(false);
    setValores(valoresSalvos);
  };

  const adicionarObservacao = () => {
    if (!obsVet.trim()) return;
    registrar(obsVet.trim());
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
            <>
              <button
                onClick={() => setAdicionandoObs(true)}
                className={`${btnBase} bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  stylus_note
                </span>
                Observação
              </button>
              <button
                onClick={() =>
                  auditando ? encerrarAuditoria() : setAuditando(true)
                }
                className={`${btnBase} ${
                  auditando
                    ? "bg-[#8e001b] text-white hover:brightness-110"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {auditando ? "close" : "fact_check"}
                </span>
                {auditando ? "Encerrar auditoria" : "Auditar dados"}
              </button>
            </>
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
          {/* Barra de auditoria */}
          {auditando && (
            <div className="bg-[#8e001b] text-white rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[26px]">
                  fact_check
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Modo auditoria</span>
                  <span className="text-white/80 text-xs">
                    Confira cada campo, corrija o que estiver errado e aplique o
                    selo. Tudo fica registrado no histórico em seu nome.
                  </span>
                </div>
              </div>
              <button
                onClick={validarRestantes}
                disabled={resumo.validados === resumo.total}
                className="flex items-center gap-1.5 bg-white text-[#8e001b] px-4 py-2 rounded-full text-xs font-bold hover:bg-white/90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">
                  done_all
                </span>
                Validar restantes ({resumo.total - resumo.validados})
              </button>
            </div>
          )}

          {/* Grid de dados */}
          <div
            className={`grid gap-3 ${
              auditando
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            }`}
          >
            {CAMPOS_ANIMAL.map((campo) => (
              <CampoAuditavel
                key={campo.key}
                campo={campo}
                animal={animal}
                valor={valores[campo.key]}
                validacao={validacoes[campo.key]}
                auditando={auditando}
                onEditar={editarCampo}
                onValidar={validarCampo}
                onContestar={contestarCampo}
                onReabrir={reabrirCampo}
              />
            ))}
          </div>

          {/* Banner de validação — reflete os selos de cada campo */}
          <BannerValidacao resumo={resumo} />

          {/* Documentos */}
          <div>
            <button
              onClick={() => setDocsAbertos(!docsAbertos)}
              className="flex items-center gap-2 text-[#8e001b] font-bold text-sm mb-4"
            >
              {docsAbertos ? "Ocultar documentos ↑" : "Ver documentos ↓"}
              <span className="text-[10px] font-bold text-[#5f5e5e] bg-[#eeeeee] px-2 py-0.5 rounded-full uppercase">
                {documentos.filter((d) => d.status === "validado").length}/
                {documentos.length} validados
              </span>
            </button>
            {docsAbertos && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {documentos.map((doc) => (
                  <div
                    key={doc.nome}
                    className={`${docBg(doc.status)} p-4 rounded-xl flex flex-col gap-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="material-symbols-outlined text-[#8e001b]">
                          description
                        </span>
                        <span className="font-semibold text-sm truncate">
                          {doc.nome}
                        </span>
                      </div>
                      <DocBadge status={doc.status} />
                    </div>

                    {isVet && doc.status === "enviado" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            avaliarDocumento(doc.nome, "validado")
                          }
                          className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white text-[10px] font-bold py-1.5 rounded-full hover:bg-emerald-700 transition-colors active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            check
                          </span>
                          Validar
                        </button>
                        <button
                          onClick={() =>
                            avaliarDocumento(doc.nome, "recusado")
                          }
                          className="flex-1 flex items-center justify-center gap-1 border border-red-300 text-red-600 text-[10px] font-bold py-1.5 rounded-full hover:bg-red-500 hover:text-white transition-colors active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            close
                          </span>
                          Recusar
                        </button>
                      </div>
                    )}

                    {doc.status !== "pendente" && (
                      <button className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#8e001b] hover:underline">
                        <span className="material-symbols-outlined text-[13px]">
                          open_in_new
                        </span>
                        Abrir documento
                      </button>
                    )}
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
                className="w-full bg-white text-gray-900 [color-scheme:light] border border-emerald-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
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
                {historicoLocal.slice(0, HISTORICO_VISIVEL).map((item, i) => (
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
              {historicoLocal.length > HISTORICO_VISIVEL && (
                <button
                  onClick={() => setModalHistoricoAberto(true)}
                  className="flex items-center gap-1.5 text-[#8e001b] font-bold text-xs mt-4 hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    unfold_more
                  </span>
                  Ver histórico completo (
                  {historicoLocal.length - HISTORICO_VISIVEL} mais)
                </button>
              )}
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

      {modalHistoricoAberto && (
        <ModalHistorico
          animal={animal}
          historico={historicoLocal}
          onClose={() => setModalHistoricoAberto(false)}
        />
      )}
    </div>
  );
}
function DashboardPage() {
  const { id } = useParams();
  const [telefoneVisivel, setTelefoneVisivel] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const isProprioTutor = VISUALIZANDO_PROPRIO_PERFIL;
  const isVet = USUARIO_E_VETERINARIO;
  const perfil = isProprioTutor ? USUARIO_LOGADO : TUTOR_MOCK;

  const infoGrid = [
    { icon: "person", label: "Nome Completo", valor: perfil.nomeCompleto },
    { icon: "mail", label: "E-mail", valor: perfil.email },
    {
      icon: "call",
      label: "Telefone",
      valor: telefoneVisivel ? perfil.telefone : "•••••••••••••",
      toggle: true,
    },
    ...(perfil.role === "vet"
      ? [
          { icon: "clinical_notes", label: "CRMV", valor: perfil.crmv },
          { icon: "apartment", label: "Hospital", valor: perfil.hospital },
        ]
      : []),
    { icon: "markunread_mailbox", label: "CEP", valor: perfil.cep },
    { icon: "location_on", label: "Cidade", valor: perfil.cidade },
    { icon: "home", label: "Bairro", valor: perfil.bairro },
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
                    {perfil.nome}
                  </h1>
                  {perfil.role === "vet" && (
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
                    Membro desde: {perfil.membroDesde}
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
          {isVet && !isProprioTutor && (
            <div className="mb-6 bg-[#faf0f0] border border-[#e4bebc] rounded-2xl px-6 py-4 flex items-center gap-4">
              <span className="material-symbols-outlined text-[#8e001b] text-[28px]">
                medical_services
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-[#8e001b] text-sm">
                  Você está acessando como veterinário
                </span>
                <span className="text-[#5b403f] text-xs">
                  {USUARIO_LOGADO.nomeCompleto} — CRMV {USUARIO_LOGADO.crmv}. As
                  validações e observações que você registrar ficam assinadas em
                  seu nome e visíveis ao tutor.
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-[#1a1c1c]">
              {isProprioTutor ? "Meus Animais" : "Animais de " + perfil.nome}
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
