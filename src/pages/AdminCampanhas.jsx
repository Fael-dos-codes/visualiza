import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function AdminCampanhas() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [campanhas, setCampanhas] = useState([]);
  const [campanhasMeta, setCampanhasMeta] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [carregandoMeta, setCarregandoMeta] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    async function carregarClientes() {
      const resposta = await fetch(`${API}/api/admin/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Erro ao carregar clientes.");
        return;
      }

      setClientes(dados);
    }

    carregarClientes();
  }, [token]);

  useEffect(() => {
    async function carregarCampanhas() {
      if (!clienteId) return;

      setCampanhas([]);
      setCampanhasMeta([]);
      setSelecionadas([]);

      const resposta = await fetch(`${API}/api/admin/clientes/${clienteId}/campanhas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Erro ao carregar campanhas.");
        return;
      }

      setCampanhas(dados);
    }

    carregarCampanhas();
  }, [clienteId, token]);

  async function importarCampanhasMeta() {
    setErro("");
    setMensagem("");
    setCarregandoMeta(true);

    const resposta = await fetch(`${API}/api/admin/meta/campanhas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
  setErro(dados.detalhes?.error?.message || dados.erro || "Erro ao importar campanhas da Meta.");
  setCarregandoMeta(false);
  return;
}

    const idsJaVinculados = campanhas.map((campanha) => campanha.meta_campaign_id);

    const campanhasDisponiveis = dados.filter(
      (campanha) => !idsJaVinculados.includes(campanha.id)
    );

    setCampanhasMeta(campanhasDisponiveis);
    setCarregandoMeta(false);
  }

  function alternarSelecionada(campanha) {
    const jaSelecionada = selecionadas.some((item) => item.id === campanha.id);

    if (jaSelecionada) {
      setSelecionadas((atual) => atual.filter((item) => item.id !== campanha.id));
    } else {
      setSelecionadas((atual) => [...atual, campanha]);
    }
  }

  async function salvarSelecionadas() {
    setErro("");
    setMensagem("");

    if (!clienteId) {
      setErro("Selecione um cliente primeiro.");
      return;
    }

    if (selecionadas.length === 0) {
      setErro("Selecione pelo menos uma campanha.");
      return;
    }

    const resposta = await fetch(`${API}/api/admin/clientes/${clienteId}/campanhas/importar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        campanhas: selecionadas,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Erro ao salvar campanhas.");
      return;
    }

    setCampanhas((atual) => [...dados, ...atual]);
    setSelecionadas([]);
    setCampanhasMeta([]);
    setMensagem("Campanhas vinculadas com sucesso.");
  }

  async function removerCampanha(id) {
    const confirmar = confirm("Remover esta campanha do cliente?");
    if (!confirmar) return;

    await fetch(`${API}/api/admin/campanhas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setCampanhas((atual) => atual.filter((campanha) => campanha.id !== id));
  }

  const clienteSelecionado = clientes.find((cliente) => cliente.id === clienteId);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Campanhas</h1>
        <p>Importe campanhas da Meta e vincule ao cliente correto.</p>

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
        <section className="importar-meta-box">
          <div className="importar-meta-header">
            <div>
              <h2>Cliente: {clienteSelecionado?.nome_exibicao || clienteSelecionado?.login}</h2>
              <p>Selecione as campanhas da Meta que pertencem a este cliente.</p>
            </div>

            <button type="button" onClick={importarCampanhasMeta}>
              {carregandoMeta ? "Importando..." : "Importar campanhas da Meta"}
            </button>
          </div>

          {campanhasMeta.length > 0 && (
            <div className="meta-campanhas-lista">
              <h3>Campanhas encontradas</h3>

              {campanhasMeta.map((campanha) => {
                const marcada = selecionadas.some((item) => item.id === campanha.id);

                return (
                  <label className="meta-campanha-item" key={campanha.id}>
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => alternarSelecionada(campanha)}
                    />

                    <div>
                      <strong>{campanha.name}</strong>
                      <span>ID: {campanha.id}</span>
                      <span>Status: {campanha.status || campanha.effective_status}</span>
                    </div>
                  </label>
                );
              })}

              <button type="button" onClick={salvarSelecionadas}>
                Salvar campanhas selecionadas
              </button>
            </div>
          )}

          {campanhasMeta.length === 0 && !carregandoMeta && (
            <p className="meta-info">
              Clique em “Importar campanhas da Meta” para listar as campanhas disponíveis.
            </p>
          )}
        </section>
      )}

      {erro && <p className="erro">{erro}</p>}
      {mensagem && <p className="sucesso">{mensagem}</p>}

      {clienteId && (
        <section className="admin-lista">
          <h2>Campanhas vinculadas</h2>

          {campanhas.length === 0 ? (
            <div className="empty-card">
              <h3>Nenhuma campanha vinculada</h3>
              <p>Importe campanhas da Meta e selecione quais pertencem a este cliente.</p>
            </div>
          ) : (
            campanhas.map((campanha) => (
              <div className="campanha-vinculada-card" key={campanha.id}>
                <div>
                  <h3>{campanha.nome_campanha || "Campanha sem nome"}</h3>
                  <p>ID Meta: {campanha.meta_campaign_id}</p>
                </div>

                <button type="button" onClick={() => removerCampanha(campanha.id)}>
                  Remover
                </button>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}