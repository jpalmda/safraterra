// ============================================================
//  Graficos.jsx — Gráficos de receita x custo por safra
//  Biblioteca: Recharts
// ============================================================

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const CORES = ["#7BBD8E", "#D4A843", "#5b9bd5", "#e05555", "#C8A96E"];

const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });
const fmtFull = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Tooltip customizado
function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#152515", border: "1px solid #2a4a2a", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ color: "#7BBD8E", marginBottom: 6, fontSize: ".82rem", fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: ".82rem" }}>
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
}

function TooltipPizza({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#152515", border: "1px solid #2a4a2a", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ color: payload[0].payload.fill, fontSize: ".82rem", fontWeight: 600 }}>
        {payload[0].name}: {fmtFull(payload[0].value)}
      </p>
    </div>
  );
}

export default function Graficos({ safras, dash }) {
  if (!safras?.length) {
    return (
      <div className="graficos-vazio">
        <p>📊 Cadastre safras com produtividade e preço para ver os gráficos.</p>
      </div>
    );
  }

  // Dados para gráfico de barras — receita x custo por safra
  const dadosBarras = safras
    .filter(s => s.produtividade_sc_ha && s.preco_saca)
    .map(s => ({
      nome: `${s.cultura} (${s.talhao_nome})`,
      receita: s.produtividade_sc_ha * s.preco_saca * s.area_ha,
      lucro: (s.produtividade_sc_ha * s.preco_saca * s.area_ha),
    }));

  // Dados para pizza — distribuição por cultura
  const porCultura = safras.reduce((acc, s) => {
    const key = s.cultura;
    if (!acc[key]) acc[key] = { name: key, value: 0 };
    acc[key].value += s.area_ha || 0;
    return acc;
  }, {});
  const dadosPizza = Object.values(porCultura);

  // Dados para pizza financeira
  const dadosFinanceiro = [
    { name: "Lucro estimado", value: Math.max(dash.lucro_estimado, 0) },
    { name: "Custo insumos",  value: dash.custo_insumos },
  ].filter(d => d.value > 0);

  return (
    <div className="graficos-painel">
      <h2>📊 Análise Financeira</h2>

      {/* ── Receita por safra ── */}
      {dadosBarras.length > 0 && (
        <div className="grafico-bloco">
          <h3>Receita por Safra</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosBarras} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1e" />
              <XAxis dataKey="nome" tick={{ fill: "#555", fontSize: 11 }} angle={-20} textAnchor="end" />
              <YAxis tickFormatter={fmt} tick={{ fill: "#555", fontSize: 11 }} />
              <Tooltip content={<TooltipCustom />} />
              <Legend wrapperStyle={{ color: "#555", fontSize: ".82rem", paddingTop: 16 }} />
              <Bar dataKey="receita" name="Receita" fill="#7BBD8E" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Linha de resumo ── */}
      <div className="graficos-resumo">
        <div className="resumo-card">
          <span className="resumo-label">Receita Total</span>
          <span className="resumo-val verde">{fmtFull(dash.receita_estimada)}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Custo Insumos</span>
          <span className="resumo-val vermelho">{fmtFull(dash.custo_insumos)}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Lucro Estimado</span>
          <span className={`resumo-val ${dash.lucro_estimado >= 0 ? "verde" : "vermelho"}`}>
            {fmtFull(dash.lucro_estimado)}
          </span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Margem</span>
          <span className={`resumo-val ${dash.lucro_estimado >= 0 ? "verde" : "vermelho"}`}>
            {dash.receita_estimada > 0
              ? ((dash.lucro_estimado / dash.receita_estimada) * 100).toFixed(1) + "%"
              : "—"}
          </span>
        </div>
      </div>

      {/* ── Pizzas ── */}
      <div className="graficos-pizzas">
        {dadosPizza.length > 1 && (
          <div className="grafico-bloco">
            <h3>Área por Cultura (ha)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosPizza} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value}ha)`} labelLine={{ stroke: "#3d6e4a" }}>
                  {dadosPizza.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip content={<TooltipPizza />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosFinanceiro.length > 1 && (
          <div className="grafico-bloco">
            <h3>Distribuição Financeira</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosFinanceiro} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: "#3d6e4a" }}>
                  <Cell fill="#7BBD8E" />
                  <Cell fill="#e05555" />
                </Pie>
                <Tooltip content={<TooltipPizza />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
