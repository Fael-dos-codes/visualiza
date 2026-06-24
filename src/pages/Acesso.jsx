import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function Acesso() {
  const [login, setLogin] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function continuar(e) {
    e.preventDefault();
    setErro("");

    const resposta = await fetch(`${API}/api/verificar-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Login não encontrado.");
      return;
    }

    localStorage.setItem("login_temp", login);

    if (dados.primeiro_acesso) {
      navigate("/primeiro-acesso/nome");
    } else {
      localStorage.setItem("nome_temp", dados.nome_exibicao);
      navigate("/login-senha");
    }
  }

  return (
    <main className="container">
      <form onSubmit={continuar} className="card">
        <h1>Acesso do cliente</h1>
        <p>Digite seu código de acesso.</p>

        <input
          placeholder="Ex: cliente-teste"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />

        {erro && <p className="erro">{erro}</p>}

        <button type="submit">Continuar</button>
      </form>
    </main>
  );
}