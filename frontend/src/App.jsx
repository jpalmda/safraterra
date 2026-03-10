import { useState, useEffect } from "react";
import { isLogado, logout } from "./services/api";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  const [logado, setLogado]       = useState(isLogado());
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem("nome") || "");
  const [tema, setTema]           = useState(localStorage.getItem("tema") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem("tema", tema);
  }, [tema]);

  const toggleTema = () => setTema(t => t === "dark" ? "light" : "dark");

  const handleLogin = (nome) => {
    localStorage.setItem("nome", nome);
    setNomeUsuario(nome);
    setLogado(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("nome");
    logout();
    setLogado(false);
  };

  if (!logado) return <Login onLogin={handleLogin} tema={tema} toggleTema={toggleTema} />;
  return <Dashboard nomeUsuario={nomeUsuario} onLogout={handleLogout} tema={tema} toggleTema={toggleTema} />;
}
