import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [login, setLogin] = useState("");
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const resposta = await fetch(`${API}/api/admin/clientes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Erro ao carregar clientes.");
      return;
    }

    setClientes(dados);
  }

  async function criarCliente(e) {
    e.preventDefault();
    setErro("");

    const resposta = await fetch(`${API}/api/admin/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ login }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Erro ao criar cliente.");
      return;
    }

    setLogin("");
    carregarClientes();
  }

  async function alternarAtivo(id) {
    await fetch(`${API}/api/admin/clientes/${id}/toggle-ativo`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    carregarClientes();
  }

  async function resetarCliente(id) {
    const confirmar = confirm("Tem certeza que deseja resetar esse cliente?");

    if (!confirmar) return;

    await fetch(`${API}/api/admin/clientes/${id}/resetar`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    carregarClientes();
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Painel Admin</h1>
          <p>Gerencie os clientes do sistema.</p>
          <div className="admin-nav">
  <a href="/admin">Clientes</a>
  <a href="/admin/campanhas">Campanhas</a>
  <a href="/admin/metricas">Métricas</a>
  
</div>
        </div>
      </header>

      <form onSubmit={criarCliente} className="admin-form">
        <input
          placeholder="Login do novo cliente. Ex: cliente-fernanda"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />

        <button type="submit">Criar cliente</button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      <section className="admin-lista">
        {clientes.map((cliente) => (
          <div className="admin-cliente-card" key={cliente.id}>
            <div>
              <h3>{cliente.nome_exibicao || "Sem nome definido"}</h3>
              <p>Login: {cliente.login}</p>
              <p>Primeiro acesso: {cliente.primeiro_acesso ? "Sim" : "Não"}</p>
              <p>Status: {cliente.ativo ? "Ativo" : "Bloqueado"}</p>
              <p>Admin: {cliente.admin ? "Sim" : "Não"}</p>
            </div>

            <div className="admin-actions">
              <button onClick={() => alternarAtivo(cliente.id)}>
                {cliente.ativo ? "Bloquear" : "Desbloquear"}
              </button>

              <button onClick={() => resetarCliente(cliente.id)}>
                Resetar senha
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}