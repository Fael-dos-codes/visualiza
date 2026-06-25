import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

const campos = [
  {
    nome: "valor_faturado",
    label: "Valor faturado",
    tipo: "number",
  },
  {
    nome: "quantidade_vendas",
    label: "Quantidade de vendas",
    tipo: "number",
  },
  {
    nome: "roi_real",
    label: "ROI real",
    tipo: "number",
  },
  {
    nome: "observacoes",
    label: "Observações",
    tipo: "textarea",
  },
];

export default function AdminMetricas() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [form, setForm] = useState({
    periodo: "Últimos 30 dias",
    valor_faturado: 0,
    quantidade_vendas: 0,
    roi_real: 0,
    observacoes: "",
  });
  const [mensagem, setMensagem] = useState("");

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    async function carregarClientes() {
      const resposta = await fetch(`${API}/api/admin/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json();
      setClientes(dados);
    }

    carregarClientes();
  }, [token]);

  useEffect(() => {
    async function carregarMetricas() {
      if (!clienteId) return;

      const resposta = await fetch(`${API}/api/admin/clientes/${clienteId}/metricas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json();

      if (dados) {
        setForm({
          periodo: dados.periodo || "Últimos 30 dias",
          valor_faturado: dados.valor_faturado || 0,
          quantidade_vendas: dados.quantidade_vendas || 0,
          roi_real: dados.roi_real || 0,
          observacoes: dados.observacoes || "",
        });
      } else {
        setForm({
          periodo: "Últimos 30 dias",
          valor_faturado: 0,
          quantidade_vendas: 0,
          roi_real: 0,
          observacoes: "",
        });
      }
    }

    carregarMetricas();
  }, [clienteId, token]);

  async function salvar(e) {
    e.preventDefault();
    setMensagem("");

    const resposta = await fetch(`${API}/api/admin/clientes/${clienteId}/metricas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (!resposta.ok) {
      setMensagem("Erro ao salvar resultados extras.");
      return;
    }

    setMensagem("Resultados extras salvos com sucesso.");
  }

  function alterar(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]:
        campo === "periodo" || campo === "observacoes"
          ? valor
          : Number(valor),
    }));
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Resultados Extras</h1>
        <p>Adicione dados que a Meta não fornece automaticamente.</p>

        <div className="admin-nav">
          <a href="/admin">Clientes</a>
          <a href="/admin/campanhas">Campanhas</a>
          <a href="/admin/metricas">Resultados Extras</a>
        </div>
      </header>

      <section className="admin-form">
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Selecione um cliente</option>

          {clientes
  .filter((cliente) => !cliente.admin)
  .map((cliente) => (
    <option key={cliente.id} value={cliente.id}>
      {cliente.nome_exibicao || cliente.login}
    </option>
  ))}
        </select>
      </section>

      {clienteId && (
        <form onSubmit={salvar} className="metricas-form">
          <label>
            Período
            <input
              value={form.periodo || ""}
              onChange={(e) => alterar("periodo", e.target.value)}
            />
          </label>

          {campos.map((campo) => (
            <label key={campo.nome}>
              {campo.label}

              {campo.tipo === "textarea" ? (
                <div className="observacoes-box">
  <textarea
    value={form[campo.nome] || ""}
    onChange={(e) => alterar(campo.nome, e.target.value)}
    placeholder="Ex: Cliente informou vendas fechadas pelo WhatsApp..."
    maxLength={500}
  />

  <div className="observacoes-footer">
    <span>Essas observações aparecerão no relatório executivo.</span>
    <strong>{(form[campo.nome] || "").length}/500</strong>
  </div>
</div>
              ) : (
                <input
                  type="number"
                  step="0.01"
                  value={form[campo.nome] ?? 0}
                  onChange={(e) => alterar(campo.nome, e.target.value)}
                />
              )}
            </label>
          ))}

          <button type="submit">Salvar resultados extras</button>

          {mensagem && <p>{mensagem}</p>}
        </form>
      )}
    </main>
  );
}