import { useEffect, useState } from "react";
import { getDashboard, getTalhoes, getSafras, criarTalhao, criarSafra, getInsumos, criarInsumo } from "../services/api";
import Clima from "../components/Clima";
import Graficos from "../components/Graficos";

export default function Dashboard({ nomeUsuario, onLogout }) {
  const [dash, setDash]       = useState(null);
  const [talhoes, setTalhoes] = useState([]);
  const [safras, setSafras]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [safraAtiva, setSafraAtiva]         = useState(null);
  const [insumos, setInsumos]               = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(false);
  const [abaAtiva, setAbaAtiva]             = useState("dashboard");

  const [formTalhao, setFormTalhao] = useState({ nome: "", area_ha: "", solo: "", latitude: "", longitude: "" });
  const [formSafra, setFormSafra]   = useState({ talhao_id: "", cultura: "", ciclo: "Safra (verão)", produtividade_sc_ha: "", preco_saca: "", status: "planejada" });
  const [formInsumo, setFormInsumo] = useState({ descricao: "", quantidade: "", unidade: "L", custo_total: "", data_aplicacao: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  const carregar = () => {
    setLoading(true);
    Promise.all([getDashboard(), getTalhoes(), getSafras()])
      .then(([d, t, s]) => { setDash(d); setTalhoes(t); setSafras(s); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirInsumos = async (safra) => {
    setSafraAtiva(safra);
    setLoadingInsumos(true);
    const data = await getInsumos(safra.id);
    setInsumos(data);
    setLoadingInsumos(false);
  };

  const salvarTalhao = async () => {
    if (!formTalhao.nome || !formTalhao.area_ha) { setErro("Preencha nome e área."); return; }
    setSalvando(true); setErro("");
    try {
      await criarTalhao({ ...formTalhao, area_ha: parseFloat(formTalhao.area_ha), latitude: formTalhao.latitude ? parseFloat(formTalhao.latitude) : null, longitude: formTalhao.longitude ? parseFloat(formTalhao.longitude) : null });
      setFormTalhao({ nome: "", area_ha: "", solo: "", latitude: "", longitude: "" });
      setModal(null); carregar();
    } catch { setErro("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const salvarSafra = async () => {
    if (!formSafra.talhao_id || !formSafra.cultura) { setErro("Selecione talhão e cultura."); return; }
    setSalvando(true); setErro("");
    try {
      await criarSafra({ ...formSafra, talhao_id: parseInt(formSafra.talhao_id), produtividade_sc_ha: formSafra.produtividade_sc_ha ? parseFloat(formSafra.produtividade_sc_ha) : null, preco_saca: formSafra.preco_saca ? parseFloat(formSafra.preco_saca) : null });
      setFormSafra({ talhao_id: "", cultura: "", ciclo: "Safra (verão)", produtividade_sc_ha: "", preco_saca: "", status: "planejada" });
      setModal(null); carregar();
    } catch { setErro("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const salvarInsumo = async () => {
    if (!formInsumo.descricao || !formInsumo.custo_total) { setErro("Preencha descrição e custo."); return; }
    setSalvando(true); setErro("");
    try {
      await criarInsumo({ ...formInsumo, safra_id: safraAtiva.id, quantidade: formInsumo.quantidade ? parseFloat(formInsumo.quantidade) : null, custo_total: parseFloat(formInsumo.custo_total) });
      setFormInsumo({ descricao: "", quantidade: "", unidade: "L", custo_total: "", data_aplicacao: "" });
      setModal(null);
      const novosInsumos = await getInsumos(safraAtiva.id);
      setInsumos(novosInsumos);
      carregar();
    } catch { setErro("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalInsumosSafra = insumos.reduce((s, i) => s + i.custo_total, 0);

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h1>🌾 SafraTerra</h1>
          <p>Olá, {nomeUsuario}! Gestão de safras e talhões.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => { setErro(""); setModal("safra"); }}>+ Nova Safra</button>
          <button className="btn btn-primary"   onClick={() => { setErro(""); setModal("talhao"); }}>+ Novo Talhão</button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>Sair</button>
        </div>
      </header>

      <div className="abas">
        <button className={`aba ${abaAtiva === "dashboard" ? "aba-ativa" : ""}`} onClick={() => setAbaAtiva("dashboard")}>📊 Dashboard</button>
        <button className={`aba ${abaAtiva === "graficos"  ? "aba-ativa" : ""}`} onClick={() => setAbaAtiva("graficos")}>📈 Gráficos</button>
        <button className={`aba ${abaAtiva === "clima"     ? "aba-ativa" : ""}`} onClick={() => setAbaAtiva("clima")}>🌤️ Clima</button>
      </div>

      {/* ── Aba Dashboard ── */}
      {abaAtiva === "dashboard" && (
        <>
          <section className="cards-grid">
            <Card label="Talhões cadastrados" value={dash.total_talhoes} color="green" />
            <Card label="Área total"          value={`${dash.total_area_ha} ha`} color="earth" />
            <Card label="Safras registradas"  value={dash.total_safras} color="gold" />
            <Card label="Custo com insumos"   value={fmt(dash.custo_insumos)} color="red" />
            <Card label="Receita estimada"    value={fmt(dash.receita_estimada)} color="green" />
            <Card label="Lucro estimado"      value={fmt(dash.lucro_estimado)} color={dash.lucro_estimado >= 0 ? "green" : "red"} />
          </section>

          <div className="main-grid">
            <section className="section">
              <h2>Safras <span className="hint">— clique para ver insumos</span></h2>
              <table>
                <thead><tr><th>Cultura</th><th>Talhão</th><th>Status</th><th>Produt.</th><th>Preço/sc</th></tr></thead>
                <tbody>
                  {safras.length === 0 && <tr><td colSpan={5} className="empty">Nenhuma safra cadastrada</td></tr>}
                  {safras.map((s) => (
                    <tr key={s.id} className={`clickable ${safraAtiva?.id === s.id ? "row-ativa" : ""}`} onClick={() => abrirInsumos(s)}>
                      <td>{s.cultura}</td><td>{s.talhao_nome}</td>
                      <td><span className={`badge badge-${s.status.replace(" ","-")}`}>{s.status}</span></td>
                      <td>{s.produtividade_sc_ha ? `${s.produtividade_sc_ha} sc/ha` : "—"}</td>
                      <td>{s.preco_saca ? fmt(s.preco_saca) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {safraAtiva && (
              <section className="section insumos-painel">
                <div className="insumos-header">
                  <div>
                    <h2>Insumos — {safraAtiva.cultura}</h2>
                    <p className="insumos-sub">{safraAtiva.talhao_nome} · {safraAtiva.ciclo}</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => { setErro(""); setModal("insumo"); }}>+ Adicionar</button>
                </div>
                {loadingInsumos ? <p className="empty">Carregando...</p> : (
                  <>
                    <table>
                      <thead><tr><th>Descrição</th><th>Qtd</th><th>Data</th><th>Custo</th></tr></thead>
                      <tbody>
                        {insumos.length === 0 && <tr><td colSpan={4} className="empty">Nenhum insumo</td></tr>}
                        {insumos.map((i) => (
                          <tr key={i.id}>
                            <td>{i.descricao}</td>
                            <td>{i.quantidade ? `${i.quantidade} ${i.unidade}` : "—"}</td>
                            <td>{i.data_aplicacao || "—"}</td>
                            <td className="custo-val">{fmt(i.custo_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {insumos.length > 0 && (
                      <div className="insumos-total">
                        <span>Total de insumos</span>
                        <span className="custo-val">{fmt(totalInsumosSafra)}</span>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>

          <section className="section">
            <h2>Talhões</h2>
            <table>
              <thead><tr><th>Nome</th><th>Área (ha)</th><th>Solo</th><th>Coordenadas</th></tr></thead>
              <tbody>
                {talhoes.length === 0 && <tr><td colSpan={4} className="empty">Nenhum talhão cadastrado</td></tr>}
                {talhoes.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nome}</td><td>{t.area_ha}</td><td>{t.solo || "—"}</td>
                    <td>{t.latitude ? `${t.latitude}, ${t.longitude}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {abaAtiva === "graficos" && <Graficos safras={safras} dash={dash} />}
      {abaAtiva === "clima"    && <Clima talhoes={talhoes} />}

      {/* ── Modais ── */}
      {modal === "talhao" && (
        <Modal titulo="Novo Talhão" onClose={() => setModal(null)} onSalvar={salvarTalhao} salvando={salvando} erro={erro}>
          <Campo label="Nome *"><input type="text" placeholder="Ex: Talhão A" value={formTalhao.nome} onChange={e => setFormTalhao({ ...formTalhao, nome: e.target.value })} /></Campo>
          <Campo label="Área (ha) *"><input type="number" placeholder="50" min="0" step="0.1" value={formTalhao.area_ha} onChange={e => setFormTalhao({ ...formTalhao, area_ha: e.target.value })} /></Campo>
          <Campo label="Solo"><input type="text" placeholder="Ex: Latossolo Vermelho" value={formTalhao.solo} onChange={e => setFormTalhao({ ...formTalhao, solo: e.target.value })} /></Campo>
          <div className="g2">
            <Campo label="Latitude"><input type="number" placeholder="-20.9374" step="0.0001" value={formTalhao.latitude} onChange={e => setFormTalhao({ ...formTalhao, latitude: e.target.value })} /></Campo>
            <Campo label="Longitude"><input type="number" placeholder="-48.4773" step="0.0001" value={formTalhao.longitude} onChange={e => setFormTalhao({ ...formTalhao, longitude: e.target.value })} /></Campo>
          </div>
          <p style={{fontSize:'.75rem',color:'#3d6e4a'}}>💡 Coordenadas permitem clima automático. Use Google Maps para encontrar.</p>
        </Modal>
      )}

      {modal === "safra" && (
        <Modal titulo="Nova Safra" onClose={() => setModal(null)} onSalvar={salvarSafra} salvando={salvando} erro={erro}>
          <Campo label="Talhão *">
            <select value={formSafra.talhao_id} onChange={e => setFormSafra({ ...formSafra, talhao_id: e.target.value })}>
              <option value="">Selecione...</option>
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
          <div className="g2">
            <Campo label="Produtividade (sc/ha)"><input type="number" placeholder="60" min="0" value={formSafra.produtividade_sc_ha} onChange={e => setFormSafra({ ...formSafra, produtividade_sc_ha: e.target.value })} /></Campo>
            <Campo label="Preço/saca (R$)"><input type="number" placeholder="130" min="0" step="0.01" value={formSafra.preco_saca} onChange={e => setFormSafra({ ...formSafra, preco_saca: e.target.value })} /></Campo>
          </div>
          <Campo label="Status">
            <select value={formSafra.status} onChange={e => setFormSafra({ ...formSafra, status: e.target.value })}>
              <option value="planejada">Planejada</option>
              <option value="em andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </Campo>
        </Modal>
      )}

      {modal === "insumo" && (
        <Modal titulo={`Insumo — ${safraAtiva.cultura}`} onClose={() => setModal(null)} onSalvar={salvarInsumo} salvando={salvando} erro={erro}>
          <Campo label="Descrição *"><input type="text" placeholder="Ex: Glifosato, Ureia..." value={formInsumo.descricao} onChange={e => setFormInsumo({ ...formInsumo, descricao: e.target.value })} /></Campo>
          <div className="g2">
            <Campo label="Quantidade"><input type="number" placeholder="10" min="0" value={formInsumo.quantidade} onChange={e => setFormInsumo({ ...formInsumo, quantidade: e.target.value })} /></Campo>
            <Campo label="Unidade">
              <select value={formInsumo.unidade} onChange={e => setFormInsumo({ ...formInsumo, unidade: e.target.value })}>
                <option>L</option><option>kg</option><option>sc</option><option>t</option><option>un</option>
              </select>
            </Campo>
          </div>
          <Campo label="Custo total (R$) *"><input type="number" placeholder="5000.00" min="0" step="0.01" value={formInsumo.custo_total} onChange={e => setFormInsumo({ ...formInsumo, custo_total: e.target.value })} /></Campo>
          <Campo label="Data de aplicação"><input type="date" value={formInsumo.data_aplicacao} onChange={e => setFormInsumo({ ...formInsumo, data_aplicacao: e.target.value })} /></Campo>
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
        <div className="modal-body">{children}{erro && <div className="erro">{erro}</div>}</div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSalvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return <div className="campo"><label>{label}</label>{children}</div>;
}
