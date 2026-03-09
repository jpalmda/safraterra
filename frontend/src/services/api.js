// ============================================================
//  api.js — camada de comunicação com o backend FastAPI
//  Pratique: adicione tratamento de erros, loading states, cache
// ============================================================

const BASE = "http://localhost:8000";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
  return res.json();
}

// Talhões
export const getTalhoes    = ()         => req("/talhoes");
export const criarTalhao   = (data)     => req("/talhoes", { method: "POST", body: JSON.stringify(data) });
export const deletarTalhao = (id)       => req(`/talhoes/${id}`, { method: "DELETE" });

// Safras
export const getSafras   = ()     => req("/safras");
export const criarSafra  = (data) => req("/safras", { method: "POST", body: JSON.stringify(data) });

// Insumos
export const getInsumos  = (safraId) => req(`/safras/${safraId}/insumos`);
export const criarInsumo = (data)    => req("/insumos", { method: "POST", body: JSON.stringify(data) });

// Dashboard
export const getDashboard = () => req("/dashboard");
