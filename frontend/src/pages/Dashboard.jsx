import { useEffect, useState } from "react";
import { getDashboard, getTalhoes, getSafras, criarTalhao, criarSafra, getInsumos, criarInsumo } from "../services/api";
import Clima from "../components/Clima";
import Graficos from "../components/Graficos";
import { gerarRelatorio } from "../utils/GerarPDF";

const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard({ nomeUsuario, onLogout, tema, toggleTema }) {
  const [dash, setDash]       = useState(null);
  const [talhoes, setTalhoes] = useState([]);
  const [safras, setSafras]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [safraAtiva, setSafraAtiva]         = useState(null);
  const [insumos, setInsumos]               = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(false);
  const [aba, setAba]           = useState("dashboard");
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const [fT, setFT] = useState({ nome:"", area_ha:"", solo:"", latitude:"", longitude:"" });
  const [fS, setFS] = useState({ talhao_id:"", cultura:"", ciclo:"Safra (verão)", produtividade_sc_ha:"", preco_saca:"", status:"planejada" });
  const [fI, setFI] = useState({ descricao:"", quantidade:"", unidade:"L", custo_total:"", data_aplicacao:"" });
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
    setSafraAtiva(safra); setLoadingInsumos(true);
    setInsumos(await getInsumos(safra.id)); setLoadingInsumos(false);
  };

  const exportarPDF = async () => {
    setGerandoPDF(true);
    try {
      const ip = {};
      for (const s of safras) ip[s.id] = await getInsumos(s.id);
      gerarRelatorio({ dash, talhoes, safras, insumosPorSafra: ip, nomeUsuario });
    } catch { alert("Erro ao gerar PDF."); }
    finally { setGerandoPDF(false); }
  };

  const salvarTalhao = async () => {
    if (!fT.nome || !fT.area_ha) { setErro("Preencha nome e área."); return; }
    setSalvando(true); setErro("");
    try {
      await criarTalhao({ ...fT, area_ha: parseFloat(fT.area_ha), latitude: fT.latitude ? parseFloat(fT.latitude) : null, longitude: fT.longitude ? parseFloat(fT.longitude) : null });
      setFT({ nome:"", area_ha:"", solo:"", latitude:"", longitude:"" }); setModal(null); carregar();
    } catch { setErro("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const salvarSafra = async () => {
    if (!fS.talhao_id || !fS.cultura) { setErro("Selecione talhão e cultura."); return; }
    setSalvando(true); setErro("");
    try {
      await criarSafra({ ...fS, talhao_id: parseInt(fS.talhao_id), produtividade_sc_ha: fS.produtividade_sc_ha ? parseFloat(fS.produtividade_sc_ha) : null, preco_saca: fS.preco_saca ? parseFloat(fS.preco_saca) : null });
      setFS({ talhao_id:"", cultura:"", ciclo:"Safra (verão)", produtividade_sc_ha:"", preco_saca:"", status:"planejada" }); setModal(null); carregar();
    } catch { setErro("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const salvarInsumo = async () => {
    if (!fI.descricao || !fI.custo_total) { setErro("Preencha descrição e custo."); return; }
    setSalvando(true); setErro("");
    try {
      await criarInsumo({ ...fI, safra_id: safraAtiva.id, quantidade: fI.quantidade ? parseFloat(fI.quantidade) : null, custo_total: parseFloat(fI.custo_total) });
      setFI({ descricao:"", quantidade:"", unidade:"L", custo_total:"", data_aplicacao:"" }); setModal(null);
      setInsumos(await getInsumos(safraAtiva.id)); carregar();
    } catch { setErro("Erro ao salvar."); } finally { setSalvando(false); }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span>Carregando...</span>
    </div>
  );

  const totalInsumosSafra = insumos.reduce((s, i) => s + i.custo_total, 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="topbar-brand-icon">🌾</div>
            SafraTerra
          </div>
          <nav className="topbar-nav">
            <button className={`nav-btn ${aba==="dashboard"?"active":""}`} onClick={() => setAba("dashboard")}>⊞ Dashboard</button>
            <button className={`nav-btn ${aba==="graficos" ?"active":""}`} onClick={() => setAba("graficos")}>↗ Gráficos</button>
            <button className={`nav-btn ${aba==="clima"    ?"active":""}`} onClick={() => setAba("clima")}>◎ Clima</button>
          </nav>
        </div>
        <div className="topbar-right">
          <span className="topbar-user">Olá, {nomeUsuario}</span>

          {/* Toggle tema */}
          <button className="theme-toggle" onClick={toggleTema} title={tema === "dark" ? "Modo claro" : "Modo escuro"}>
            <div className="theme-toggle-knob">{tema === "dark" ? "🌙" : "☀️"}</div>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => { setErro(""); setModal("safra"); }}>+ Safra</button>
          <button className="btn btn-primary btn-sm"   onClick={() => { setErro(""); setModal("talhao"); }}>+ Talhão</button>
          <button className="btn btn-ghost btn-sm" onClick={exportarPDF} disabled={gerandoPDF} title="Exportar PDF">
            {gerandoPDF ? "⏳" : "📄"}
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>Sair</button>
        </div>
      </header>

      <main className="main-content">
        {aba === "dashboard" && (
          <>
            <div className="kpi-grid">
              {[
                { icon:"⬡", label:"Talhões",       value:dash.total_talhoes,          color:"green", i:0 },
                { icon:"◻", label:"Área total",    value:`${dash.total_area_ha} ha`,  color:"blue",  i:1 },
                { icon:"⊕", label:"Safras",        value:dash.total_safras,            color:"gold",  i:2 },
                { icon:"↓", label:"Custo insumos", value:fmt(dash.custo_insumos),      color:"red",   i:3 },
                { icon:"↑", label:"Receita est.",   value:fmt(dash.receita_estimada),  color:"green", i:4 },
                { icon:"◈", label:"Lucro est.",     value:fmt(dash.lucro_estimado),    color:dash.lucro_estimado>=0?"green":"red", i:5 },
              ].map(k => (
                <div key={k.label} className={`kpi-card kpi-${k.color} afu${k.i}`}>
                  <div className="kpi-icon">{k.icon}</div>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                </div>
              ))}
            </div>

            <div className="panels-grid">
              <div className="panel afu2">
                <div className="panel-header">
                  <span className="panel-title">Safras <span className="panel-hint">— clique para ver insumos</span></span>
                </div>
                <table>
                  <thead><tr><th>Cultura</th><th>Talhão</th><th>Status</th><th>Produt.</th><th>Receita</th></tr></thead>
                  <tbody>
                    {safras.length === 0 && <tr><td colSpan={5}><div className="empty-state">Nenhuma safra cadastrada</div></td></tr>}
                    {safras.map(s => {
                      const r = s.produtividade_sc_ha && s.preco_saca && s.area_ha ? s.produtividade_sc_ha * s.preco_saca * s.area_ha : null;
                      return (
                        <tr key={s.id} className={`tr-clickable ${safraAtiva?.id===s.id?"tr-active":""}`} onClick={() => abrirInsumos(s)}>
                          <td style={{color:"var(--text)",fontWeight:600}}>{s.cultura}</td>
                          <td>{s.talhao_nome}</td>
                          <td><span className={`badge badge-${s.status.replace(" ","-")}`}>{s.status}</span></td>
                          <td>{s.produtividade_sc_ha ? `${s.produtividade_sc_ha} sc/ha` : "—"}</td>
                          <td className="custo-val">{r ? fmt(r) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {safraAtiva ? (
                <div className="panel afu3">
                  <div className="panel-header">
                    <div>
                      <span className="panel-title">Insumos — {safraAtiva.cultura}</span>
                      <div className="insumos-sub">{safraAtiva.talhao_nome} · {safraAtiva.ciclo}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => { setErro(""); setModal("insumo"); }}>+ Adicionar</button>
                  </div>
                  {loadingInsumos ? <div className="empty-state">Carregando...</div> : (
                    <>
                      <table>
                        <thead><tr><th>Descrição</th><th>Qtd</th><th>Data</th><th>Custo</th></tr></thead>
                        <tbody>
                          {insumos.length === 0 && <tr><td colSpan={4}><div className="empty-state">Nenhum insumo</div></td></tr>}
                          {insumos.map(i => (
                            <tr key={i.id}>
                              <td style={{color:"var(--text)",fontWeight:500}}>{i.descricao}</td>
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
                </div>
              ) : (
                <div className="panel afu3" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div className="empty-state">← Selecione uma safra para ver insumos</div>
                </div>
              )}
            </div>

            <div className="panel afu4">
              <div className="panel-header"><span className="panel-title">Talhões</span></div>
              <table>
                <thead><tr><th>Nome</th><th>Área (ha)</th><th>Solo</th><th>Coordenadas</th></tr></thead>
                <tbody>
                  {talhoes.length === 0 && <tr><td colSpan={4}><div className="empty-state">Nenhum talhão cadastrado</div></td></tr>}
                  {talhoes.map(t => (
                    <tr key={t.id}>
                      <td style={{color:"var(--text)",fontWeight:600}}>{t.nome}</td>
                      <td>{t.area_ha}</td><td>{t.solo||"—"}</td>
                      <td>{t.latitude?`${t.latitude}, ${t.longitude}`:"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {aba === "graficos" && <Graficos safras={safras} dash={dash} />}
        {aba === "clima"    && <Clima talhoes={talhoes} />}
      </main>

      {modal === "talhao" && (
        <Modal titulo="Novo Talhão" onClose={() => setModal(null)} onSalvar={salvarTalhao} salvando={salvando} erro={erro}>
          <Campo label="Nome *"><input type="text" placeholder="Ex: Talhão Norte" value={fT.nome} onChange={e => setFT({...fT,nome:e.target.value})} /></Campo>
          <Campo label="Área (ha) *"><input type="number" placeholder="50" min="0" step="0.1" value={fT.area_ha} onChange={e => setFT({...fT,area_ha:e.target.value})} /></Campo>
          <Campo label="Tipo de solo"><input type="text" placeholder="Ex: Latossolo Vermelho" value={fT.solo} onChange={e => setFT({...fT,solo:e.target.value})} /></Campo>
          <div className="g2">
            <Campo label="Latitude"><input type="number" placeholder="-20.9374" step="0.0001" value={fT.latitude} onChange={e => setFT({...fT,latitude:e.target.value})} /></Campo>
            <Campo label="Longitude"><input type="number" placeholder="-48.4773" step="0.0001" value={fT.longitude} onChange={e => setFT({...fT,longitude:e.target.value})} /></Campo>
          </div>
          <p className="field-hint">💡 Coordenadas permitem clima automático. Encontre no Google Maps.</p>
        </Modal>
      )}

      {modal === "safra" && (
        <Modal titulo="Nova Safra" onClose={() => setModal(null)} onSalvar={salvarSafra} salvando={salvando} erro={erro}>
          <Campo label="Talhão *">
            <select value={fS.talhao_id} onChange={e => setFS({...fS,talhao_id:e.target.value})}>
              <option value="">Selecione...</option>
              {talhoes.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.area_ha} ha)</option>)}
            </select>
          </Campo>
          <Campo label="Cultura *">
            <select value={fS.cultura} onChange={e => setFS({...fS,cultura:e.target.value})}>
              <option value="">Selecione...</option>
              {["Soja","Milho","Algodão","Café","Cana-de-açúcar","Trigo","Arroz","Feijão","Outra"].map(c => <option key={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="Ciclo">
            <select value={fS.ciclo} onChange={e => setFS({...fS,ciclo:e.target.value})}>
              <option>Safra (verão)</option><option>Safrinha (inverno)</option><option>Anual</option>
            </select>
          </Campo>
          <div className="g2">
            <Campo label="Produtividade (sc/ha)"><input type="number" placeholder="60" min="0" value={fS.produtividade_sc_ha} onChange={e => setFS({...fS,produtividade_sc_ha:e.target.value})} /></Campo>
            <Campo label="Preço/saca (R$)"><input type="number" placeholder="130" min="0" step="0.01" value={fS.preco_saca} onChange={e => setFS({...fS,preco_saca:e.target.value})} /></Campo>
          </div>
          <Campo label="Status">
            <select value={fS.status} onChange={e => setFS({...fS,status:e.target.value})}>
              <option value="planejada">Planejada</option>
              <option value="em andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </Campo>
        </Modal>
      )}

      {modal === "insumo" && (
        <Modal titulo={`Insumo — ${safraAtiva.cultura}`} onClose={() => setModal(null)} onSalvar={salvarInsumo} salvando={salvando} erro={erro}>
          <Campo label="Descrição *"><input type="text" placeholder="Ex: Glifosato 480, Ureia..." value={fI.descricao} onChange={e => setFI({...fI,descricao:e.target.value})} /></Campo>
          <div className="g2">
            <Campo label="Quantidade"><input type="number" placeholder="10" min="0" value={fI.quantidade} onChange={e => setFI({...fI,quantidade:e.target.value})} /></Campo>
            <Campo label="Unidade">
              <select value={fI.unidade} onChange={e => setFI({...fI,unidade:e.target.value})}>
                <option>L</option><option>kg</option><option>sc</option><option>t</option><option>un</option>
              </select>
            </Campo>
          </div>
          <Campo label="Custo total (R$) *"><input type="number" placeholder="5000.00" min="0" step="0.01" value={fI.custo_total} onChange={e => setFI({...fI,custo_total:e.target.value})} /></Campo>
          <Campo label="Data de aplicação"><input type="date" value={fI.data_aplicacao} onChange={e => setFI({...fI,data_aplicacao:e.target.value})} /></Campo>
        </Modal>
      )}
    </div>
  );
}

function Modal({ titulo, onClose, onSalvar, salvando, erro, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{titulo}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
          {erro && <div className="erro"><span>⚠</span>{erro}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return <div className="campo"><label>{label}</label>{children}</div>;
}
