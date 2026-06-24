import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

export default function LoginSenha() {
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  const nome =
    localStorage.getItem("nome_temp") || "Cliente";

  async function entrar(e) {
    e.preventDefault();

    const login =
      localStorage.getItem("login_temp");

    const resposta = await fetch(
      `${API}/api/login`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          login,
          senha,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro);
      return;
    }

    localStorage.setItem(
      "token",
      dados.token
    );

    if (dados.cliente.admin) {
  navigate("/admin");
} else {
  navigate("/dashboard");
}
  }

  return (
    <main className="container">
      <form
        onSubmit={entrar}
        className="card"
      >
        <h1>
          Seja bem-vindo, {nome}
        </h1>

        <div className="password-field">
  <input
    type={mostrarSenha ? "text" : "password"}
    placeholder="Senha"
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

        {erro && (
          <p className="erro">
            {erro}
          </p>
        )}

        <button type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}