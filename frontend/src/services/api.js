const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Token ─────────────────────────────────────────────────────
export const getToken  = ()      => localStorage.getItem("token");
export const setToken  = (t)     => localStorage.setItem("token", t);
export const removeToken = ()    => localStorage.removeItem("token");
export const isLogado  = ()      => !!getToken();

// ── HTTP helper ───────────────────────────────────────────────
async function req(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    removeToken();
    window.location.href = "/";
    return;
  }
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(email, senha) {
  const form = new URLSearchParams({ username: email, password: senha });
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) throw new Error("Email ou senha incorretos");
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function cadastro(nome, email, senha) {
  const res = await fetch(`${BASE}/auth/cadastro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });
  if (!res.ok) throw new Error("Erro no cadastro. Email já utilizado?");
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export const logout = () => { removeToken(); window.location.href = "/"; };
export const getMe  = () => req("/auth/me");

// ── Talhões ───────────────────────────────────────────────────
export const getTalhoes    = ()     => req("/talhoes");
export const criarTalhao   = (data) => req("/talhoes", { method: "POST", body: JSON.stringify(data) });
export const deletarTalhao = (id)   => req(`/talhoes/${id}`, { method: "DELETE" });

// ── Safras ────────────────────────────────────────────────────
export const getSafras  = ()     => req("/safras");
export const criarSafra = (data) => req("/safras", { method: "POST", body: JSON.stringify(data) });

// ── Insumos ───────────────────────────────────────────────────
export const getInsumos  = (safraId) => req(`/safras/${safraId}/insumos`);
export const criarInsumo = (data)    => req("/insumos", { method: "POST", body: JSON.stringify(data) });

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboard = () => req("/dashboard");