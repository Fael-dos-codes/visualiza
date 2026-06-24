import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function PrimeiroNome() {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    const login = localStorage.getItem("login_temp");

    const resposta = await fetch(`${API}/api/salvar-nome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, nome }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Erro ao salvar nome.");
      return;
    }

    localStorage.setItem("nome_temp", nome);
    navigate("/primeiro-acesso/senha");
  }

  return (
    <main className="container">
      <form onSubmit={salvar} className="card">
        <h1>Olá, seja bem-vindo!</h1>
        <p>Como podemos te chamar?</p>

        <input
          placeholder="Digite seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        {erro && <p className="erro">{erro}</p>}

        <button type="submit">Continuar</button>
      </form>
    </main>
  );
}