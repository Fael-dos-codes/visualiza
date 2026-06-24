import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

export default function TrocarSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    const resposta = await fetch(`${API}/api/trocar-senha`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Erro ao trocar senha.");
      return;
    }

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmar("");
    setMensagem("Senha alterada com sucesso.");
  }

  return (
    <main className="container">
      <form onSubmit={salvar} className="card">
        <h1>Trocar senha</h1>

        <div className="password-field">
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
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
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
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
            placeholder="Confirmar nova senha"
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

        {erro && <p className="erro">{erro}</p>}
        {mensagem && <p>{mensagem}</p>}

        <button type="submit">
          Salvar nova senha
        </button>
      </form>
    </main>
  );
}