import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API = import.meta.env.VITE_API_URL;


export default function Dashboard() {
  const relatorioRef = useRef(null);
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState(null);
  const [nome, setNome] = useState(() => localStorage.getItem("nome_temp") || "Cliente");

  const dataAtual = new Date().toLocaleDateString("pt-BR");

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const respostaMe = await fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!respostaMe.ok) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        window.location.href = "/";
        return;
      }

      const cliente = await respostaMe.json();
      setNome(cliente.nome_exibicao || "Cliente");
      localStorage.setItem("nome_temp", cliente.nome_exibicao || "Cliente");

      const resposta = await fetch(`${API}/api/meta/dados`, {
  headers: { Authorization: `Bearer ${token}` },
});

      const json = await resposta.json();
      setDados(json);
      setCarregando(false);
    }

    carregarDados();
  }, []);

  async function salvarPDF() {
  if (!relatorioRef.current) return;

  const canvas = await html2canvas(relatorioRef.current, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#12121a",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`relatorio-${nome}-${dataAtual}.pdf`);
}

  function sair() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/";
  }

  if (carregando || !dados) {
    return (
      <main className="dashboard-page">
        <p>Carregando dados...</p>
      </main>
    );
  }

  const periodoSelecionado = dados.periodo || "Histórico disponível";

  const resumo = dados.resumo || {};
  const resultados = dados.resultados || {};
  const campanhas = dados.campanhas || [];
  const extras = dados.extras || null;

  const graficoCampanhas = campanhas.map((campanha) => ({
    nome: campanha.nome,
    investimento: Number(campanha.investimento || 0),
    leads: Number(campanha.leads || 0),
    cliques: Number(campanha.cliques || 0),
  }));


  const temResultadosExtras =
    extras &&
    (Number(extras.valor_faturado || 0) > 0 ||
      Number(extras.quantidade_vendas || 0) > 0 ||
      Number(extras.roi_real || 0) > 0 ||
      extras.observacoes);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Olá, {nome}</h1>
          <p>Meta Ads • Período selecionado: {periodoSelecionado}</p>
        </div>

        <div className="dashboard-actions">
          <button onClick={salvarPDF}>Salvar em PDF</button>

          

          <button onClick={sair} className="danger">
            Sair
          </button>
        </div>
      </header>

      <section className="periodo-box">
  <div>
    <h2>Acompanhe seus resultados</h2>
    <p>Os dados abaixo representam o histórico disponível das campanhas vinculadas à sua conta.</p>
  </div>
</section>

      <section ref={relatorioRef} className="relatorio-pdf">
        <div className="report-title">
          <h2>Relatório de Performance</h2>
          <p>Empresa: Designer Fácil</p>
          <p>Cliente: {nome}</p>
          <p>Período: {periodoSelecionado}</p>
          <p>Gerado em: {dataAtual}</p>
        </div>

        <h2>Resumo Executivo</h2>

        <section className="dashboard-grid dashboard-grid-destaque">
          <Card titulo="Investimento" valor={moeda(resumo.investimento)} destaque />
          <Card titulo="Leads" valor={numero(resultados.leads)} destaque />
          <Card titulo="Conversões" valor={numero(resultados.conversoes)} destaque />
          <Card titulo="CTR" valor={`${resumo.ctr || 0}%`} destaque />
        </section>

        <p className="dashboard-subtitulo">
          Dados atualizados conforme o período selecionado.
        </p>

        <h2>Alcance e tráfego</h2>
        <section className="dashboard-grid">
          <Card titulo="Alcance" valor={numero(resumo.alcance)} />
          <Card titulo="Impressões" valor={numero(resumo.impressoes)} />
          <Card titulo="Cliques no link" valor={numero(resumo.cliques_link)} />
        </section>

        <h2>Custos e desempenho</h2>
        <section className="dashboard-grid">
          <Card titulo="CTR" valor={`${resumo.ctr || 0}%`} />
          <Card titulo="CPC" valor={moeda(resumo.cpc)} />
          <Card titulo="CPM" valor={moeda(resumo.cpm)} />
          <Card titulo="Custo por lead" valor={moeda(resultados.custo_por_lead)} />
          <Card titulo="Custo por conversa" valor={moeda(resultados.custo_por_conversa)} />
          <Card titulo="Custo por compra" valor={moeda(resultados.custo_por_compra)} />
        </section>

        <h2>Resultados</h2>
        <section className="dashboard-grid">
          <Card titulo="Mensagens" valor={numero(resultados.mensagens)} />
          <Card titulo="Compras" valor={numero(resultados.compras)} />
          <Card titulo="Conversões" valor={numero(resultados.conversoes)} />
        </section>

        <h2>Análise por campanha</h2>

<p className="dashboard-subtitulo">
  Compare quanto foi investido e quantos resultados cada campanha gerou no período selecionado.
</p>
        <section className="charts-grid">
          <div className="chart-card">
            <h3>Investimento por campanha (R$)</h3>

            {graficoCampanhas.length === 0 ? (
              <p className="chart-empty">Nenhuma campanha para exibir neste período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={graficoCampanhas}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="investimento" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
  <h3>Leads gerados por campanha</h3>

  {graficoCampanhas.length === 0 ? (
    <p className="chart-empty">Nenhuma campanha para exibir neste período.</p>
  ) : (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={graficoCampanhas}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="leads" fill="#7c3aed" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )}
</div>
        </section>

       <h2>Campanhas do período</h2>

<p className="dashboard-subtitulo">
  Veja quais campanhas estão vinculadas ao seu painel e os principais resultados de cada uma.
</p>

        {campanhas.length === 0 ? (
          <div className="empty-card">
            <h3>Painel em configuração</h3>
<p>
  Suas campanhas ainda estão sendo vinculadas. Assim que a configuração for concluída,
  os indicadores serão exibidos automaticamente neste painel.
</p>
          </div>
        ) : (
          <div className="campanhas-lista">
            {campanhas.map((campanha, index) => (
              <div className="campanha-card" key={index}>
                <div className="campanha-topo">
                  <h3>{campanha.nome}</h3>
                  <span>{campanha.status || "Ativa"}</span>
                </div>

                <div className="campanha-metricas">
                  <p>Investimento: <strong>{moeda(campanha.investimento)}</strong></p>
                  <p>Alcance: <strong>{numero(campanha.alcance)}</strong></p>
                  <p>Impressões: <strong>{numero(campanha.impressoes)}</strong></p>
                  <p>Cliques: <strong>{numero(campanha.cliques)}</strong></p>
                  <p>Leads: <strong>{numero(campanha.leads)}</strong></p>
                  <p>CTR: <strong>{campanha.ctr || 0}%</strong></p>
                  <p>CPC: <strong>{moeda(campanha.cpc)}</strong></p>
                  <p>CPM: <strong>{moeda(campanha.cpm)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {temResultadosExtras && (
          <>
            <h2>Resultados comerciais</h2>

            <section className="dashboard-grid">
              <Card titulo="Valor faturado" valor={moeda(extras.valor_faturado)} />
              <Card titulo="Vendas" valor={numero(extras.quantidade_vendas)} />
              <Card titulo="ROI real" valor={`${numero(extras.roi_real)}%`} />
            </section>

            {extras.observacoes && (
              <div className="executivo-box">
                <h3>Observações da agência</h3>
                <p>{extras.observacoes}</p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Card({ titulo, valor, destaque = false }) {
  return (
    <div className={destaque ? "metric-card metric-card-destaque" : "metric-card"}>
      <div className="metric-card-top">
        <span>{titulo}</span>
      </div>

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