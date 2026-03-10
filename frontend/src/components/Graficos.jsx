import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const fmt     = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtComp = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });

const CORES = ["#5cba7d","#c9a84c","#5b9bd5","#e05555","#a78bfa"];

function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#141f14", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"10px 14px" }}>
      <p style={{ color:"#5cba7d", marginBottom:6, fontSize:".78rem", fontWeight:600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:p.color, fontSize:".82rem" }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

function TooltipPizza({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#141f14", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"10px 14px" }}>
      <p style={{ color:payload[0].payload.fill, fontSize:".82rem", fontWeight:600 }}>
        {payload[0].name}: {fmt(payload[0].value)}
      </p>
    </div>
  );
}

export default function Graficos({ safras, dash }) {
  if (!safras?.length) {
    return <div className="graficos-vazio">📊 Cadastre safras com produtividade e preço para ver os gráficos.</div>;
  }

  const dadosBarras = safras
    .filter(s => s.produtividade_sc_ha && s.preco_saca)
    .map(s => ({
      nome: `${s.cultura} · ${s.talhao_nome}`,
      receita: s.produtividade_sc_ha * s.preco_saca * s.area_ha,
    }));

  const porCultura = safras.reduce((acc, s) => {
    if (!acc[s.cultura]) acc[s.cultura] = { name: s.cultura, value: 0 };
    acc[s.cultura].value += s.area_ha || 0;
    return acc;
  }, {});
  const dadosPizza = Object.values(porCultura);

  const dadosFinanceiro = [
    { name: "Lucro",   value: Math.max(dash.lucro_estimado, 0) },
    { name: "Insumos", value: dash.custo_insumos },
  ].filter(d => d.value > 0);

  return (
    <div className="graficos-wrap">
      <h2>Análise Financeira</h2>

      <div className="resumo-row">
        <div className="resumo-item">
          <span className="resumo-label">Receita Total</span>
          <span className="resumo-val verde">{fmt(dash.receita_estimada)}</span>
        </div>
        <div className="resumo-item">
          <span className="resumo-label">Custo Insumos</span>
          <span className="resumo-val vermelho">{fmt(dash.custo_insumos)}</span>
        </div>
        <div className="resumo-item">
          <span className="resumo-label">Lucro Estimado</span>
          <span className={`resumo-val ${dash.lucro_estimado >= 0 ? "verde" : "vermelho"}`}>{fmt(dash.lucro_estimado)}</span>
        </div>
        <div className="resumo-item">
          <span className="resumo-label">Margem</span>
          <span className={`resumo-val ${dash.lucro_estimado >= 0 ? "verde" : "vermelho"}`}>
            {dash.receita_estimada > 0 ? ((dash.lucro_estimado / dash.receita_estimada) * 100).toFixed(1) + "%" : "—"}
          </span>
        </div>
      </div>

      {dadosBarras.length > 0 && (
        <div className="grafico-panel">
          <h3>Receita por Safra</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosBarras} margin={{ top:8, right:16, left:8, bottom:50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="nome" tick={{ fill:"#3d5a3d", fontSize:11 }} angle={-15} textAnchor="end" />
              <YAxis tickFormatter={fmtComp} tick={{ fill:"#3d5a3d", fontSize:11 }} />
              <Tooltip content={<TooltipCustom />} cursor={{ fill:"rgba(92,186,125,.05)" }} />
              <Bar dataKey="receita" name="Receita" fill="#5cba7d" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="pizzas-row">
        {dadosPizza.length > 1 && (
          <div className="grafico-panel">
            <h3>Área por Cultura (ha)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosPizza} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value"
                  label={({name, value}) => `${name} (${value}ha)`} labelLine={{ stroke:"#3d5a3d" }}>
                  {dadosPizza.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip content={<TooltipPizza />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosFinanceiro.length > 1 && (
          <div className="grafico-panel">
            <h3>Distribuição Financeira</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosFinanceiro} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value"
                  label={({name, percent}) => `${name} (${(percent*100).toFixed(0)}%)`} labelLine={{ stroke:"#3d5a3d" }}>
                  <Cell fill="#5cba7d" />
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
