import { useState } from "react";
import { login, cadastro } from "../services/api";

export default function Login({ onLogin }) {
  const [modo, setModo]     = useState("login"); // 'login' | 'cadastro'
  const [nome, setNome]     = useState("");
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  const [erro, setErro]     = useState("");
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
      <div className="login-box">
        <div className="login-logo">🌾</div>
        <h1 className="login-title">Safra Terra</h1>
        <p className="login-sub">Gestão inteligente de safras</p>

        <div className="login-tabs">
          <button className={`tab ${modo === "login" ? "active" : ""}`} onClick={() => { setModo("login"); setErro(""); }}>
            Entrar
          </button>
          <button className={`tab ${modo === "cadastro" ? "active" : ""}`} onClick={() => { setModo("cadastro"); setErro(""); }}>
            Criar conta
          </button>
        </div>

        <div className="login-form">
          {modo === "cadastro" && (
            <div className="campo">
              <label>Seu nome</label>
              <input type="text" placeholder="João Silva" value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          )}
          <div className="campo">
            <label>Email</label>
            <input type="email" placeholder="joao@fazenda.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div className="campo">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          {erro && <div className="erro">{erro}</div>}

          <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
