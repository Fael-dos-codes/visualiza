import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function AdminConfiguracoes() {
  const [form, setForm] = useState({
    nome_empresa: "",
    cor_principal: "#1d4ed8",
    texto_relatorio: "",
    logo_url: ""
  });

  const [mensagem, setMensagem] = useState("");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
  async function carregar() {
    const resposta = await fetch(`${API}/api/configuracoes`);
    const dados = await resposta.json();
    setForm(dados);
  }

  carregar();
}, []);
  
  async function salvar(e) {
    e.preventDefault();
    setMensagem("");

    const resposta = await fetch(`${API}/api/admin/configuracoes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (!resposta.ok) {
      setMensagem("Erro ao salvar configurações.");
      return;
    }

    setMensagem("Configurações salvas com sucesso.");
  }

  function alterar(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Configurações</h1>
        <p>Edite os dados usados no relatório e no painel.</p>

        <div className="admin-nav">
  <a href="/admin">Clientes</a>
  <a href="/admin/campanhas">Campanhas</a>
  <a href="/admin/metricas">Métricas</a>
  <a href="/admin/configuracoes">Configurações</a>
</div>
      </header>

      <form onSubmit={salvar} className="admin-config-form">
        <label>
          Nome da empresa
          <input
            value={form.nome_empresa}
            onChange={(e) => alterar("nome_empresa", e.target.value)}
          />
        </label>

        <label>
          Cor principal
          <input
            type="color"
            value={form.cor_principal}
            onChange={(e) => alterar("cor_principal", e.target.value)}
          />
        </label>

        <label>
          Texto do relatório
          <input
            value={form.texto_relatorio}
            onChange={(e) => alterar("texto_relatorio", e.target.value)}
          />
        </label>

        {form.logo_url && (
  <img
    src={form.logo_url}
    alt="Logo"
    style={{
      width: "120px",
      borderRadius: "12px",
      marginTop: "10px"
    }}
  />
)}

        <button type="submit">Salvar configurações</button>

        {mensagem && <p>{mensagem}</p>}
      </form>
    </main>
  );
}