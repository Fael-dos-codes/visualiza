import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

async function verificarAdmin(req, res, next) {
  const clienteId = req.cliente.id;

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("admin")
    .eq("id", clienteId)
    .single();

  if (error || !cliente || !cliente.admin) {
    return res.status(403).json({ erro: "Acesso negado." });
  }

  next();
}

function gerarToken(cliente) {
  return jwt.sign(
    { id: cliente.id, login: cliente.login },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.get("/", (req, res) => {
  res.send("Servidor funcionando!");
});

app.get("/clientes", async (req, res) => {
  const { data, error } = await supabase.from("clientes").select("*");

  if (error) {
    return res.status(500).json(error);
  }

  return res.json(data);
});

app.post("/api/verificar-login", async (req, res) => {
  const { login } = req.body;

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("login", login)
    .eq("ativo", true)
    .single();

  if (error || !cliente) {
    return res.status(404).json({ erro: "Login não encontrado." });
  }

  return res.json({
    primeiro_acesso: cliente.primeiro_acesso,
    nome_exibicao: cliente.nome_exibicao,
  });
});

app.post("/api/salvar-nome", async (req, res) => {
  const { login, nome } = req.body;

  const { error } = await supabase
    .from("clientes")
    .update({ nome_exibicao: nome })
    .eq("login", login);

  if (error) {
    return res.status(400).json({ erro: "Erro ao salvar nome." });
  }

  return res.json({ sucesso: true });
});

app.post("/api/criar-senha", async (req, res) => {
  const { login, senha, lembrar } = req.body;

  if (!senha || senha.length < 6) {
    return res.status(400).json({ erro: "A senha precisa ter pelo menos 6 caracteres." });
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const { data: cliente, error } = await supabase
    .from("clientes")
    .update({
      senha_hash,
      lembrar_sessao: lembrar,
      primeiro_acesso: false,
    })
    .eq("login", login)
    .select()
    .single();

  if (error || !cliente) {
    return res.status(400).json({ erro: "Erro ao criar senha." });
  }

  const token = gerarToken(cliente);

  return res.json({
    token,
    cliente: {
      id: cliente.id,
      nome: cliente.nome_exibicao,
    },
  });
});

function autenticar(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ erro: "Token ausente." });
  }

  try {
    const token = auth.replace("Bearer ", "");
    req.cliente = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido." });
  }
}


app.post("/api/login", async (req, res) => {
  const { login, senha } = req.body;

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("login", login)
    .eq("ativo", true)
    .single();

  if (error || !cliente) {
    return res.status(401).json({
      erro: "Usuário não encontrado",
    });
  }

  const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash);

  if (!senhaCorreta) {
    return res.status(401).json({
      erro: "Senha incorreta",
    });
  }

  const token = gerarToken(cliente);

  return res.json({
    token,
    cliente: {
      id: cliente.id,
      nome: cliente.nome_exibicao,
      login: cliente.login,
      admin: cliente.admin,
    },
  });
});

app.get("/api/meta/dados", autenticar, async (req, res) => {
  const periodo = req.query.periodo || "hoje";
  const clienteId = req.cliente.id;

  const { data: metricas } = await supabase
    .from("metricas_cliente")
    .select("*")
    .eq("cliente_id", clienteId)
    .single();

  const { data: campanhas, error: campanhasError } = await supabase
    .from("cliente_campanhas")
    .select("*")
    .eq("cliente_id", clienteId);

  if (campanhasError) {
    return res.status(400).json({ erro: "Erro ao buscar campanhas." });
  }

  const base = metricas || {
    periodo: "Últimos 30 dias",
    investimento: 0,
    alcance: 0,
    impressoes: 0,
    frequencia: 0,
    cliques: 0,
    cliques_link: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    cpp: 0,
    leads: 0,
    conversoes: 0,
    mensagens: 0,
    compras: 0,
    custo_por_lead: 0,
    custo_por_conversa: 0,
    custo_por_compra: 0,
    curtidas: 0,
    comentarios: 0,
    compartilhamentos: 0,
    salvamentos: 0,
    visualizacoes_video: 0,
    visualizacoes_25: 0,
    visualizacoes_50: 0,
    visualizacoes_75: 0,
    visualizacoes_100: 0,
  };

  return res.json({
   periodo,

    resumo: {
      investimento: base.investimento,
      alcance: base.alcance,
      impressoes: base.impressoes,
      frequencia: base.frequencia,
      cliques: base.cliques,
      cliques_link: base.cliques_link,
      ctr: base.ctr,
      cpc: base.cpc,
      cpm: base.cpm,
      cpp: base.cpp,
    },

    resultados: {
      leads: base.leads,
      conversoes: base.conversoes,
      mensagens: base.mensagens,
      compras: base.compras,
      custo_por_lead: base.custo_por_lead,
      custo_por_conversa: base.custo_por_conversa,
      custo_por_compra: base.custo_por_compra,
    },

    engajamento: {
      curtidas: base.curtidas,
      comentarios: base.comentarios,
      compartilhamentos: base.compartilhamentos,
      salvamentos: base.salvamentos,
      visualizacoes_video: base.visualizacoes_video,
      visualizacoes_25: base.visualizacoes_25,
      visualizacoes_50: base.visualizacoes_50,
      visualizacoes_75: base.visualizacoes_75,
      visualizacoes_100: base.visualizacoes_100,
    },

    campanhas: campanhas.map((campanha) => ({
  nome: campanha.nome_campanha || "Campanha sem nome",
  meta_campaign_id: campanha.meta_campaign_id,
  status: "Vinculada",

  investimento: campanha.investimento || 0,
  alcance: campanha.alcance || 0,
  impressoes: campanha.impressoes || 0,
  cliques: campanha.cliques || 0,
  leads: campanha.leads || 0,
  ctr: campanha.ctr || 0,
  cpc: campanha.cpc || 0,
  cpm: campanha.cpm || 0,
})),
  });
});

app.get("/api/me", autenticar, async (req, res) => {
  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, nome_exibicao, login, admin")
    .eq("id", req.cliente.id)
    .single();

  if (error || !cliente) {
    return res.status(404).json({ erro: "Cliente não encontrado." });
  }

  return res.json(cliente);
});

app.get("/api/admin/clientes", autenticar, verificarAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome_exibicao, login, primeiro_acesso, ativo, admin, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({ erro: "Erro ao buscar clientes." });
  }

  return res.json(data);
});

app.post("/api/admin/clientes", autenticar, verificarAdmin, async (req, res) => {
  const { login } = req.body;

  if (!login) {
    return res.status(400).json({ erro: "Informe um login." });
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      login,
      primeiro_acesso: true,
      ativo: true,
      admin: false,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ erro: "Erro ao criar cliente." });
  }

  return res.json(data);
});

app.patch("/api/admin/clientes/:id/toggle-ativo", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: cliente } = await supabase
    .from("clientes")
    .select("ativo")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("clientes")
    .update({ ativo: !cliente.ativo })
    .eq("id", id);

  if (error) {
    return res.status(400).json({ erro: "Erro ao alterar status." });
  }

  return res.json({ sucesso: true });
});

app.patch("/api/admin/clientes/:id/resetar", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("clientes")
    .update({
      nome_exibicao: null,
      senha_hash: null,
      primeiro_acesso: true,
    })
    .eq("id", id);

  if (error) {
    return res.status(400).json({ erro: "Erro ao resetar cliente." });
  }

  return res.json({ sucesso: true });
});

app.get("/api/admin/clientes/:id/campanhas", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("cliente_campanhas")
    .select("*")
    .eq("cliente_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({ erro: "Erro ao buscar campanhas." });
  }

  return res.json(data);
});

app.post("/api/admin/clientes/:id/campanhas", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { meta_campaign_id, nome_campanha } = req.body;

  if (!meta_campaign_id) {
    return res.status(400).json({ erro: "Informe o ID da campanha." });
  }

  const { data, error } = await supabase
    .from("cliente_campanhas")
    .insert({
      cliente_id: id,
      meta_campaign_id,
      nome_campanha,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ erro: "Erro ao vincular campanha." });
  }

  return res.json(data);
});

app.delete("/api/admin/campanhas/:id", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("cliente_campanhas")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(400).json({ erro: "Erro ao remover campanha." });
  }

  return res.json({ sucesso: true });
});

app.put("/api/admin/configuracoes", autenticar, verificarAdmin, async (req, res) => {
  const { nome_empresa, cor_principal, texto_relatorio, logo_url } = req.body;

  const { data, error } = await supabase
    .from("configuracoes_empresa")
    .update({
      nome_empresa,
      cor_principal,
      texto_relatorio,
      logo_url,
    })
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ erro: "Erro ao atualizar configurações." });
  }

  return res.json(data);
});

app.put("/api/admin/configuracoes", autenticar, verificarAdmin, async (req, res) => {
  const { nome_empresa, cor_principal, texto_relatorio } = req.body;

  const { data, error } = await supabase
    .from("configuracoes_empresa")
    .update({
      nome_empresa,
      cor_principal,
      texto_relatorio,
    })
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ erro: "Erro ao atualizar configurações." });
  }

  return res.json(data);
});

app.get("/api/admin/clientes/:id/metricas", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("metricas_cliente")
    .select("*")
    .eq("cliente_id", id)
    .single();

  if (error) {
    return res.json(null);
  }

  return res.json(data);
});

app.post("/api/admin/clientes/:id/metricas", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const metricas = req.body;

  const { data: existente } = await supabase
    .from("metricas_cliente")
    .select("id")
    .eq("cliente_id", id)
    .single();

  if (existente) {
    const { data, error } = await supabase
      .from("metricas_cliente")
      .update({
        ...metricas,
        updated_at: new Date(),
      })
      .eq("cliente_id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ erro: "Erro ao atualizar métricas." });
    }

    return res.json(data);
  }

  const { data, error } = await supabase
    .from("metricas_cliente")
    .insert({
      cliente_id: id,
      ...metricas,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ erro: "Erro ao salvar métricas." });
  }

  return res.json(data);
});

app.patch("/api/admin/campanhas/:id", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const {
    nome_campanha,
    meta_campaign_id,
    investimento,
    alcance,
    impressoes,
    cliques,
    leads,
    ctr,
    cpc,
    cpm,
  } = req.body;

  const { data, error } = await supabase
    .from("cliente_campanhas")
    .update({
      nome_campanha,
      meta_campaign_id,
      investimento,
      alcance,
      impressoes,
      cliques,
      leads,
      ctr,
      cpc,
      cpm,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ erro: "Erro ao atualizar campanha." });
  }

  return res.json(data);
});

app.get("/api/admin/clientes/:id/relatorio", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id, nome_exibicao, login")
    .eq("id", id)
    .single();

  if (clienteError || !cliente) {
    return res.status(404).json({ erro: "Cliente não encontrado." });
  }

  const { data: campanhas, error: campanhasError } = await supabase
    .from("cliente_campanhas")
    .select("*")
    .eq("cliente_id", id);

  if (campanhasError) {
    return res.status(400).json({ erro: "Erro ao buscar campanhas." });
  }

  const { data: extras } = await supabase
    .from("metricas_cliente")
    .select("periodo, valor_faturado, quantidade_vendas, roi_real, observacoes")
    .eq("cliente_id", id)
    .single();

  const resumo = campanhas.reduce(
    (acc, campanha) => {
      acc.investimento += Number(campanha.investimento || 0);
      acc.alcance += Number(campanha.alcance || 0);
      acc.impressoes += Number(campanha.impressoes || 0);
      acc.cliques += Number(campanha.cliques || 0);
      acc.leads += Number(campanha.leads || 0);
      acc.conversoes += Number(campanha.conversoes || 0);
      return acc;
    },
    {
      investimento: 0,
      alcance: 0,
      impressoes: 0,
      cliques: 0,
      leads: 0,
      conversoes: 0,
      ctr: 0,
      cpc: 0,
    }
  );

  resumo.ctr =
    resumo.impressoes > 0
      ? Number(((resumo.cliques / resumo.impressoes) * 100).toFixed(2))
      : 0;

  resumo.cpc =
    resumo.cliques > 0
      ? Number((resumo.investimento / resumo.cliques).toFixed(2))
      : 0;

  return res.json({
    cliente,
    resumo,
    campanhas,
    extras: extras || {
      periodo: "Últimos 30 dias",
      valor_faturado: 0,
      quantidade_vendas: 0,
      roi_real: 0,
      observacoes: "",
    },
  });
});

app.patch("/api/trocar-senha", autenticar, async (req, res) => {
  const { senha_atual, nova_senha } = req.body;

  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ erro: "Preencha todos os campos." });
  }

  if (nova_senha.length < 6) {
    return res.status(400).json({ erro: "A nova senha precisa ter pelo menos 6 caracteres." });
  }

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", req.cliente.id)
    .single();

  if (error || !cliente) {
    return res.status(404).json({ erro: "Usuário não encontrado." });
  }

  const senhaCorreta = await bcrypt.compare(senha_atual, cliente.senha_hash);

  if (!senhaCorreta) {
    return res.status(401).json({ erro: "Senha atual incorreta." });
  }

  const novaSenhaHash = await bcrypt.hash(nova_senha, 10);

  const { error: updateError } = await supabase
    .from("clientes")
    .update({ senha_hash: novaSenhaHash })
    .eq("id", req.cliente.id);

  if (updateError) {
    return res.status(400).json({ erro: "Erro ao atualizar senha." });
  }

  return res.json({ sucesso: true });
});

app.post("/api/admin/clientes/:id/campanhas/importar", autenticar, verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { campanhas } = req.body;

  if (!Array.isArray(campanhas) || campanhas.length === 0) {
    return res.status(400).json({
      erro: "Selecione pelo menos uma campanha.",
    });
  }

  const registros = campanhas.map((campanha) => ({
    cliente_id: id,
    meta_campaign_id: campanha.id,
    nome_campanha: campanha.name,
    investimento: 0,
    alcance: 0,
    impressoes: 0,
    cliques: 0,
    leads: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
  }));

  const { data, error } = await supabase
    .from("cliente_campanhas")
    .insert(registros)
    .select();

  if (error) {
    return res.status(400).json({
      erro: "Erro ao importar campanhas.",
      detalhes: error.message,
    });
  }

  return res.json(data);
});

app.get("/api/admin/meta/campanhas", autenticar, verificarAdmin, async (req, res) => {
  try {
    const resposta = await axios.get(
      `https://graph.facebook.com/${process.env.META_API_VERSION}/act_${process.env.META_AD_ACCOUNT_ID}/campaigns`,
      {
        params: {
          access_token: process.env.META_ACCESS_TOKEN,
          fields: "id,name,status",
          limit: 500,
        },
      }
    );

    res.json(resposta.data.data);
  } catch (erro) {
    console.error(erro.response?.data || erro);
    res.status(500).json({
      erro: "Erro ao buscar campanhas da Meta",
    });
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});