import { useState } from "react";
import { login, cadastro } from "../services/api";

export default function Login({ onLogin, tema, toggleTema }) {
  const [modo, setModo]   = useState("login");
  const [nome, setNome]   = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !senha) { setErro("Preencha email e senha."); return; }
    if (modo === "cadastro" && !nome) { setErro("Preencha seu nome."); return; }
    setLoading(true); setErro("");
    try {
      const data = modo === "login"
        ? await login(email, senha)
        : await cadastro(nome, email, senha);
      onLogin(data.nome);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-art">
        <div className="login-art-content">
          <div className="login-art-pill">
            <span className="login-art-pill-dot" />
            Gestão agrícola inteligente
          </div>
          <h2 className="login-art-title">
            Cultive dados,<br />colha <mark>resultados.</mark>
          </h2>
          <p className="login-art-desc">
            Gerencie talhões, safras e insumos em um só lugar.
            Previsão climática em tempo real e análise financeira completa.
          </p>
          <div className="login-art-stats">
            <div><span className="stat-num">100%</span><span className="stat-label">Gratuito</span></div>
            <div><span className="stat-num">5d</span><span className="stat-label">Previsão clima</span></div>
            <div><span className="stat-num">∞</span><span className="stat-label">Talhões</span></div>
          </div>
        </div>
      </div>

      <div className="login-panel">
        {/* Toggle de tema */}
        <div className="login-theme-btn">
          <span>{tema === "dark" ? "🌙" : "☀️"}</span>
          <button className="theme-toggle" onClick={toggleTema} title="Alternar tema">
            <div className="theme-toggle-knob">{tema === "dark" ? "🌙" : "☀️"}</div>
          </button>
        </div>

        <div className="login-box">
          <div className="login-logotype">
            <div className="login-logotype-icon">🌾</div>
            <span className="login-logotype-name">SafraTerra</span>
          </div>

          <h1 className="login-heading">
            {modo === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
          </h1>
          <p className="login-subtext">
            {modo === "login"
              ? "Entre para acessar seu painel de gestão."
              : "Comece a gerenciar suas safras gratuitamente."}
          </p>

          <div className="login-tabs">
            <button className={`tab ${modo === "login" ? "active" : ""}`}
              onClick={() => { setModo("login"); setErro(""); }}>Entrar</button>
            <button className={`tab ${modo === "cadastro" ? "active" : ""}`}
              onClick={() => { setModo("cadastro"); setErro(""); }}>Criar conta</button>
          </div>

          <div className="login-fields">
            {modo === "cadastro" && (
              <div className="campo">
                <label>Nome completo</label>
                <input type="text" placeholder="João Silva" value={nome}
                  onChange={e => setNome(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              </div>
            )}
            <div className="campo">
              <label>Email</label>
              <input type="email" placeholder="joao@fazenda.com.br" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <div className="campo">
              <label>Senha</label>
              <input type="password" placeholder="••••••••" value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            {erro && <div className="erro"><span>⚠</span>{erro}</div>}
            <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
              {loading ? "Aguarde..." : modo === "login" ? "Entrar →" : "Criar conta →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
