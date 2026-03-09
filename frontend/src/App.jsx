import { useState } from "react";
import { isLogado, logout } from "./services/api";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  const [logado, setLogado] = useState(isLogado());
  const [nomeUsuario, setNomeUsuario] = useState(
    localStorage.getItem("nome") || ""
  );

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

  if (!logado) return <Login onLogin={handleLogin} />;
  return <Dashboard nomeUsuario={nomeUsuario} onLogout={handleLogout} />;
}
