import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = import.meta.env.VITE_API_URL;

export default function AdminRelatorios() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const relatorioRef = useRef(null);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    async function carregarClientes() {
      const resposta = await fetch(`${API}/api/admin/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await resposta.json();
      setClientes(json);
    }

    carregarClientes();
  }, [token]);

  async function carregarRelatorio(id) {
    setClienteId(id);
    setDados(null);
    setErro("");

    if (!id) return;

    const resposta = await fetch(`${API}/api/admin/clientes/${id}/relatorio`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await resposta.json();

    if (!resposta.ok) {
      setErro(json.erro || "Erro ao carregar relatório.");
      return;
    }

    setDados(json);
  }

 async function baixarPDF() {
  if (!dados || !relatorioRef.current) return;

  const canvas = await html2canvas(relatorioRef.current, { scale: 2 });
    const imagem = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const largura = pdf.internal.pageSize.getWidth();
    const altura = (canvas.height * largura) / canvas.width;

    pdf.addImage(imagem, "PNG", 0, 0, largura, altura);
    pdf.save(`relatorio-executivo-${dados?.cliente?.login || "cliente"}.pdf`);
  }

  const investimento = Number(dados?.resumo?.investimento || 0);
  const leads = Number(dados?.resumo?.leads || 0);
  const conversoes = Number(dados?.resumo?.conversoes || 0);
  const ctr = Number(dados?.resumo?.ctr || 0);
  const cpc = Number(dados?.resumo?.cpc || 0);
  const valorFaturado = Number(dados?.extras?.valor_faturado || 0);

  const roas =
    investimento > 0 ? valorFaturado / investimento : 0;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Relatórios</h1>
        <p>Gere uma visão executiva dos resultados de cada cliente.</p>

        <div className="admin-nav">
          <a href="/admin">Clientes</a>
          <a href="/admin/campanhas">Campanhas</a>
          <a href="/admin/metricas">Resultados Extras</a>
          <a href="/admin/relatorios">Relatórios</a>
        </div>
      </header>

      <section className="admin-form">
        <select value={clienteId} onChange={(e) => carregarRelatorio(e.target.value)}>
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

      {erro && <p className="erro">{erro}</p>}

      {dados && (
        <section className="relatorio-admin-card" ref={relatorioRef}>
          <div className="relatorio-executivo-header">
            <div>
              <h2>Relatório Executivo</h2>
              <p>Cliente: {dados.cliente.nome_exibicao || dados.cliente.login}</p>
              <p>Período: {dados.extras?.periodo || "Últimos 30 dias"}</p>
            </div>

            <button type="button" onClick={baixarPDF}>
              Baixar PDF
            </button>
          </div>

          <div className="dashboard-grid">
            <Card titulo="Investimento" valor={moeda(investimento)} />
            <Card titulo="Leads" valor={numero(leads)} />
            <Card titulo="Conversões" valor={numero(conversoes)} />
            <Card titulo="CTR" valor={`${ctr}%`} />
            <Card titulo="CPC" valor={moeda(cpc)} />
            <Card titulo="ROAS" valor={`${roas.toFixed(2)}x`} />
          </div>

          <h3>Resumo executivo</h3>

          <div className="executivo-box">
            <p>
              Este relatório apresenta uma visão resumida dos principais indicadores
              de performance do cliente no período selecionado.
            </p>

            <p>
              Valor faturado informado: <strong>{moeda(valorFaturado)}</strong>
            </p>

            {dados.extras?.observacoes && (
              <p>
                Observações: <strong>{dados.extras.observacoes}</strong>
              </p>
            )}
          </div>

          <h3>Campanhas vinculadas</h3>

          {dados.campanhas.length === 0 ? (
            <p>Nenhuma campanha vinculada.</p>
          ) : (
            <div className="campanhas-lista">
              {dados.campanhas.map((campanha) => (
                <div className="campanha-card" key={campanha.id}>
                  <h3>{campanha.nome_campanha}</h3>
                  <p>ID Meta: {campanha.meta_campaign_id}</p>
                  <p>Investimento: {moeda(campanha.investimento)}</p>
                  <p>Alcance: {numero(campanha.alcance)}</p>
                  <p>Cliques: {numero(campanha.cliques)}</p>
                  <p>Leads: {numero(campanha.leads)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function Card({ titulo, valor }) {
  return (
    <div className="metric-card">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR");
}