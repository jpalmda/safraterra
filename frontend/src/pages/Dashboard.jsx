// ============================================================
//  Dashboard.jsx — com formulários de talhão, safra e insumos
// ============================================================

import { useEffect, useState } from "react";
import {
  getDashboard, getTalhoes, getSafras,
  criarTalhao, criarSafra, getInsumos, criarInsumo
} from "../services/api";

export default function Dashboard() {
  const [dash, setDash]         = useState(null);
  const [talhoes, setTalhoes]   = useState([]);
  const [safras, setSafras]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  // Painel de insumos
  const [safraAtiva, setSafraAtiva]         = useState(null);
  const [insumos, setInsumos]               = useState([]);
  const [loadInsumos, setLoadInsumos]       = useState(false);
  const [salvandoInsumo, setSalvandoInsumo] = useState(false);
  const [formInsumo, setFormInsumo]         = useState({
    descricao: "", quantidade: "", unidade: "kg", custo_total: "", data_aplicacao: ""
  });

  const [formTalhao, setFormTalhao] = useState({ nome: "", area_ha: "", solo: "" });
  const [formSafra, setFormSafra]   = useState({
    talhao_id: "", cultura: "", ciclo: "Safra (verão)",
    produtividade_sc_ha: "", preco_saca: "", status: "planejada"
  });

  const carregar = () => {
    setLoading(true);
    Promise.all([getDashboard(), getTalhoes(), getSafras()])
      .then(([d, t, s]) => { setDash(d); setTalhoes(t); setSafras(s); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirInsumos = (safra) => {
    setSafraAtiva(safra);
    setLoadInsumos(true);
    getInsumos(safra.id).then(setInsumos).finally(() => setLoadInsumos(false));
  };

  const salvarInsumo = async () => {
    if (!formInsumo.descricao || !formInsumo.custo_total) return;
    setSalvandoInsumo(true);
    try {
      await criarInsumo({
        safra_id: safraAtiva.id,
        descricao: formInsumo.descricao,
        quantidade: formInsumo.quantidade ? parseFloat(formInsumo.quantidade) : null,
        unidade: formInsumo.unidade,
        custo_total: parseFloat(formInsumo.custo_total),
        data_aplicacao: formInsumo.data_aplicacao || null,
      });
      setFormInsumo({ descricao: "", quantidade: "", unidade: "kg", custo_total: "", data_aplicacao: "" });
      getInsumos(safraAtiva.id).then(setInsumos);
      getDashboard().then(setDash);
    } finally { setSalvandoInsumo(false); }
  };

  const salvarTalhao = async () => {
    if (!formTalhao.nome || !formTalhao.area_ha) { setErro("Preencha nome e área."); return; }
    setSalvando(true); setErro("");
    try {
      await criarTalhao({ ...formTalhao, area_ha: parseFloat(formTalhao.area_ha) });
      setFormTalhao({ nome: "", area_ha: "", solo: "" });
      setModal(null); carregar();
    } catch { setErro("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  const salvarSafra = async () => {
    if (!formSafra.talhao_id || !formSafra.cultura) { setErro("Selecione talhão e cultura."); return; }
    setSalvando(true); setErro("");
    try {
      await criarSafra({
        ...formSafra,
        talhao_id: parseInt(formSafra.talhao_id),
        produtividade_sc_ha: formSafra.produtividade_sc_ha ? parseFloat(formSafra.produtividade_sc_ha) : null,
        preco_saca: formSafra.preco_saca ? parseFloat(formSafra.preco_saca) : null,
      });
      setFormSafra({ talhao_id: "", cultura: "", ciclo: "Safra (verão)", produtividade_sc_ha: "", preco_saca: "", status: "planejada" });
      setModal(null); carregar();
    } catch { setErro("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  const fmt          = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalInsumos = insumos.reduce((s, i) => s + i.custo_total, 0);

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="dashboard">

      <header className="dash-header">
        <div>
          <h1>🌾 AgroSafra</h1>
          <p>Gestão de safras e talhões</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => { setErro(""); setModal("safra"); }}>+ Nova Safra</button>
          <button className="btn btn-primary"   onClick={() => { setErro(""); setModal("talhao"); }}>+ Novo Talhão</button>
        </div>
      </header>

      <section className="cards-grid">
        <Card label="Talhões cadastrados" value={dash.total_talhoes}         color="green" />
        <Card label="Área total"          value={`${dash.total_area_ha} ha`} color="earth" />
        <Card label="Safras registradas"  value={dash.total_safras}          color="gold"  />
        <Card label="Custo com insumos"   value={fmt(dash.custo_insumos)}    color="red"   />
        <Card label="Receita estimada"    value={fmt(dash.receita_estimada)} color="green" />
        <Card label="Lucro estimado"      value={fmt(dash.lucro_estimado)}   color={dash.lucro_estimado >= 0 ? "green" : "red"} />
      </section>

      <div className={`main-layout ${safraAtiva ? "com-painel" : ""}`}>
        <div className="tabelas">

          <section className="section">
            <h2>Talhões</h2>
            <table>
              <thead><tr><th>Nome</th><th>Área (ha)</th><th>Solo</th></tr></thead>
              <tbody>
                {talhoes.length === 0 && <tr><td colSpan={3} className="empty">Nenhum talhão cadastrado</td></tr>}
                {talhoes.map(t => (
                  <tr key={t.id}><td>{t.nome}</td><td>{t.area_ha}</td><td>{t.solo || "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="section">
            <h2>Safras <span className="hint">— clique para ver insumos</span></h2>
            <table>
              <thead>
                <tr><th>Cultura</th><th>Talhão</th><th>Status</th><th>Produtividade</th><th>Preço/sc</th></tr>
              </thead>
              <tbody>
                {safras.length === 0 && <tr><td colSpan={5} className="empty">Nenhuma safra cadastrada</td></tr>}
                {safras.map(s => (
                  <tr key={s.id}
                    className={`row-clicavel ${safraAtiva?.id === s.id ? "row-ativa" : ""}`}
                    onClick={() => abrirInsumos(s)}>
                    <td>{s.cultura}</td>
                    <td>{s.talhao_nome}</td>
                    <td><span className={`badge badge-${s.status.replace(" ", "-")}`}>{s.status}</span></td>
                    <td>{s.produtividade_sc_ha ? `${s.produtividade_sc_ha} sc/ha` : "—"}</td>
                    <td>{s.preco_saca ? fmt(s.preco_saca) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* Painel lateral de insumos */}
        {safraAtiva && (
          <aside className="painel-insumos">
            <div className="painel-header">
              <div>
                <h3>Insumos</h3>
                <p className="painel-sub">{safraAtiva.cultura} · {safraAtiva.talhao_nome}</p>
              </div>
              <button className="modal-close" onClick={() => setSafraAtiva(null)}>×</button>
            </div>

            <div className="insumo-form">
              <div className="campo">
                <label>Descrição *</label>
                <input type="text" placeholder="Ex: Herbicida Roundup"
                  value={formInsumo.descricao}
                  onChange={e => setFormInsumo({ ...formInsumo, descricao: e.target.value })} />
              </div>
              <div className="insumo-row">
                <div className="campo">
                  <label>Qtd</label>
                  <input type="number" placeholder="0" min="0"
                    value={formInsumo.quantidade}
                    onChange={e => setFormInsumo({ ...formInsumo, quantidade: e.target.value })} />
                </div>
                <div className="campo">
                  <label>Unidade</label>
                  <select value={formInsumo.unidade}
                    onChange={e => setFormInsumo({ ...formInsumo, unidade: e.target.value })}>
                    {["kg","L","sc","t","un"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="campo">
                <label>Custo total (R$) *</label>
                <input type="number" placeholder="0,00" min="0" step="0.01"
                  value={formInsumo.custo_total}
                  onChange={e => setFormInsumo({ ...formInsumo, custo_total: e.target.value })} />
              </div>
              <div className="campo">
                <label>Data de aplicação</label>
                <input type="date" value={formInsumo.data_aplicacao}
                  onChange={e => setFormInsumo({ ...formInsumo, data_aplicacao: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{width:"100%", marginTop:"4px"}}
                onClick={salvarInsumo} disabled={salvandoInsumo}>
                {salvandoInsumo ? "Salvando..." : "+ Adicionar Insumo"}
              </button>
            </div>

            <div className="insumo-lista">
              {loadInsumos && <p className="empty">Carregando...</p>}
              {!loadInsumos && insumos.length === 0 && <p className="empty">Nenhum insumo ainda.</p>}
              {insumos.map(i => (
                <div className="insumo-item" key={i.id}>
                  <div className="insumo-info">
                    <span className="insumo-nome">{i.descricao}</span>
                    {i.quantidade && <span className="insumo-detalhe">{i.quantidade} {i.unidade}</span>}
                    {i.data_aplicacao && <span className="insumo-detalhe">📅 {i.data_aplicacao}</span>}
                  </div>
                  <span className="insumo-custo">{fmt(i.custo_total)}</span>
                </div>
              ))}
            </div>

            {insumos.length > 0 && (
              <div className="insumo-total">
                <span>Total de insumos</span>
                <span>{fmt(totalInsumos)}</span>
              </div>
            )}
          </aside>
        )}
      </div>

      {modal === "talhao" && (
        <Modal titulo="Novo Talhão" onClose={() => setModal(null)} onSalvar={salvarTalhao} salvando={salvando} erro={erro}>
          <Campo label="Nome do talhão *">
            <input type="text" placeholder="Ex: Talhão A" value={formTalhao.nome}
              onChange={e => setFormTalhao({ ...formTalhao, nome: e.target.value })} />
          </Campo>
          <Campo label="Área (hectares) *">
            <input type="number" placeholder="Ex: 50" min="0" step="0.1" value={formTalhao.area_ha}
              onChange={e => setFormTalhao({ ...formTalhao, area_ha: e.target.value })} />
          </Campo>
          <Campo label="Tipo de solo">
            <input type="text" placeholder="Ex: Latossolo Vermelho" value={formTalhao.solo}
              onChange={e => setFormTalhao({ ...formTalhao, solo: e.target.value })} />
          </Campo>
        </Modal>
      )}

      {modal === "safra" && (
        <Modal titulo="Nova Safra" onClose={() => setModal(null)} onSalvar={salvarSafra} salvando={salvando} erro={erro}>
          <Campo label="Talhão *">
            <select value={formSafra.talhao_id} onChange={e => setFormSafra({ ...formSafra, talhao_id: e.target.value })}>
              <option value="">Selecione o talhão...</option>
              {talhoes.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.area_ha} ha)</option>)}
            </select>
          </Campo>
          <Campo label="Cultura *">
            <select value={formSafra.cultura} onChange={e => setFormSafra({ ...formSafra, cultura: e.target.value })}>
              <option value="">Selecione...</option>
              {["Soja","Milho","Algodão","Café","Cana-de-açúcar","Trigo","Arroz","Feijão","Outra"].map(c => <option key={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="Ciclo">
            <select value={formSafra.ciclo} onChange={e => setFormSafra({ ...formSafra, ciclo: e.target.value })}>
              <option>Safra (verão)</option><option>Safrinha (inverno)</option><option>Anual</option>
            </select>
          </Campo>
          <Campo label="Produtividade esperada (sc/ha)">
            <input type="number" placeholder="Ex: 60" min="0" value={formSafra.produtividade_sc_ha}
              onChange={e => setFormSafra({ ...formSafra, produtividade_sc_ha: e.target.value })} />
          </Campo>
          <Campo label="Preço por saca (R$)">
            <input type="number" placeholder="Ex: 130.00" min="0" step="0.01" value={formSafra.preco_saca}
              onChange={e => setFormSafra({ ...formSafra, preco_saca: e.target.value })} />
          </Campo>
          <Campo label="Status">
            <select value={formSafra.status} onChange={e => setFormSafra({ ...formSafra, status: e.target.value })}>
              <option value="planejada">Planejada</option>
              <option value="em andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </Campo>
        </Modal>
      )}
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div className={`card card-${color}`}>
      <span className="card-label">{label}</span>
      <span className="card-value">{value}</span>
    </div>
  );
}

function Modal({ titulo, onClose, onSalvar, salvando, erro, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
          {erro && <div className="erro">{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div className="campo">
      <label>{label}</label>
      {children}
    </div>
  );
}
