import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

export default function CriarSenha() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function criar(e) {
    e.preventDefault();
    setErro("");

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    const login = localStorage.getItem("login_temp");

    const resposta = await fetch(`${API}/api/criar-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha, lembrar }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Erro ao criar senha.");
      return;
    }

    if (lembrar) {
      localStorage.setItem("token", dados.token);
    } else {
      sessionStorage.setItem("token", dados.token);
    }

    if (dados.cliente?.admin) {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <main className="container">
      <form onSubmit={criar} className="card">
        <h1>Crie sua senha</h1>

        <div className="password-field">
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Crie uma senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <button
            type="button"
            className="show-password-btn"
            onClick={() => setMostrarSenha(!mostrarSenha)}
          >
            {mostrarSenha ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <div className="password-field">
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Confirme sua senha"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />

          <button
            type="button"
            className="show-password-btn"
            onClick={() => setMostrarSenha(!mostrarSenha)}
          >
            {mostrarSenha ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <label className="remember-row">
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => setLembrar(e.target.checked)}
          />
          <span>Manter senha ativa neste dispositivo</span>
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit">Entrar no painel</button>
      </form>
    </main>
  );
}