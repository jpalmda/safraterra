// ============================================================
//  Clima.jsx — Painel de clima por localização da fazenda
//  API: Open-Meteo (gratuita, sem cadastro, sem chave)
// ============================================================

import { useEffect, useState } from "react";

const WMO_CODES = {
  0: { label: "Céu limpo", icon: "☀️" },
  1: { label: "Principalmente limpo", icon: "🌤️" },
  2: { label: "Parcialmente nublado", icon: "⛅" },
  3: { label: "Nublado", icon: "☁️" },
  45: { label: "Nevoeiro", icon: "🌫️" },
  48: { label: "Nevoeiro com gelo", icon: "🌫️" },
  51: { label: "Chuvisco leve", icon: "🌦️" },
  53: { label: "Chuvisco moderado", icon: "🌦️" },
  55: { label: "Chuvisco intenso", icon: "🌧️" },
  61: { label: "Chuva leve", icon: "🌧️" },
  63: { label: "Chuva moderada", icon: "🌧️" },
  65: { label: "Chuva forte", icon: "⛈️" },
  80: { label: "Pancadas leves", icon: "🌦️" },
  81: { label: "Pancadas moderadas", icon: "🌧️" },
  82: { label: "Pancadas fortes", icon: "⛈️" },
  95: { label: "Tempestade", icon: "⛈️" },
  99: { label: "Tempestade com granizo", icon: "🌩️" },
};

function getCondicao(code) {
  return WMO_CODES[code] || { label: "Condição desconhecida", icon: "🌡️" };
}

async function buscarClima(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
    `&timezone=America%2FSao_Paulo&forecast_days=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar clima");
  return res.json();
}

async function buscarCoordenadas(cidade) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&countryCode=BR`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results?.length) throw new Error("Cidade não encontrada");
  return { lat: data.results[0].latitude, lon: data.results[0].longitude, nome: data.results[0].name };
}

export default function Clima({ talhoes }) {
  const [clima, setClima]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [erro, setErro]           = useState("");
  const [busca, setBusca]         = useState("");
  const [localNome, setLocalNome] = useState("");
  const [coords, setCoords]       = useState(null);

  // Tenta usar coordenadas do primeiro talhão com lat/lon
  useEffect(() => {
    const talhaoComCoords = talhoes?.find(t => t.latitude && t.longitude);
    if (talhaoComCoords) {
      setCoords({ lat: talhaoComCoords.latitude, lon: talhaoComCoords.longitude });
      setLocalNome(talhaoComCoords.nome);
    }
  }, [talhoes]);

  useEffect(() => {
    if (coords) carregarClima(coords.lat, coords.lon);
  }, [coords]);

  const carregarClima = async (lat, lon) => {
    setLoading(true); setErro("");
    try {
      const data = await buscarClima(lat, lon);
      setClima(data);
    } catch (e) {
      setErro("Não foi possível carregar o clima.");
    } finally {
      setLoading(false);
    }
  };

  const buscarPorCidade = async () => {
    if (!busca.trim()) return;
    setLoading(true); setErro("");
    try {
      const { lat, lon, nome } = await buscarCoordenadas(busca);
      setCoords({ lat, lon });
      setLocalNome(nome);
    } catch (e) {
      setErro("Cidade não encontrada. Tente outra busca.");
      setLoading(false);
    }
  };

  const atual = clima?.current;
  const diario = clima?.daily;
  const cond   = atual ? getCondicao(atual.weather_code) : null;

  const dias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  return (
    <div className="clima-painel">
      <div className="clima-header">
        <div>
          <h2>🌤️ Clima Agrícola</h2>
          <p className="clima-local">{localNome || "Nenhuma localização definida"}</p>
        </div>
        <div className="clima-busca">
          <input
            type="text"
            placeholder="Buscar cidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === "Enter" && buscarPorCidade()}
          />
          <button className="btn btn-primary btn-sm" onClick={buscarPorCidade}>
            Buscar
          </button>
        </div>
      </div>

      {erro && <div className="erro" style={{marginBottom: 16}}>{erro}</div>}

      {loading && (
        <div className="clima-loading">
          <span className="spin">⟳</span> Carregando dados climáticos...
        </div>
      )}

      {!loading && atual && (
        <>
          {/* Atual */}
          <div className="clima-atual">
            <div className="clima-icon">{cond.icon}</div>
            <div className="clima-temp">{Math.round(atual.temperature_2m)}°C</div>
            <div className="clima-cond">{cond.label}</div>
            <div className="clima-detalhes">
              <span>💧 {atual.relative_humidity_2m}% umidade</span>
              <span>🌧️ {atual.precipitation} mm chuva</span>
              <span>💨 {atual.wind_speed_10m} km/h vento</span>
            </div>
          </div>

          {/* Previsão 5 dias */}
          <div className="clima-previsao">
            {diario.time.map((data, i) => {
              const d = new Date(data + "T12:00:00");
              const condDia = getCondicao(diario.weather_code[i]);
              return (
                <div key={i} className="clima-dia">
                  <span className="clima-dia-nome">
                    {i === 0 ? "Hoje" : dias[d.getDay()]}
                  </span>
                  <span className="clima-dia-icon">{condDia.icon}</span>
                  <span className="clima-dia-chuva">
                    {diario.precipitation_sum[i].toFixed(1)} mm
                  </span>
                  <span className="clima-dia-max">
                    {Math.round(diario.temperature_2m_max[i])}°
                  </span>
                  <span className="clima-dia-min">
                    {Math.round(diario.temperature_2m_min[i])}°
                  </span>
                </div>
              );
            })}
          </div>

          {/* Alerta agrícola */}
          {atual.precipitation > 10 && (
            <div className="clima-alerta alerta-chuva">
              ⚠️ <strong>Chuva intensa detectada.</strong> Evite aplicação de defensivos e fertilizantes hoje.
            </div>
          )}
          {atual.wind_speed_10m > 20 && (
            <div className="clima-alerta alerta-vento">
              ⚠️ <strong>Vento forte ({atual.wind_speed_10m} km/h).</strong> Risco de deriva na pulverização.
            </div>
          )}
          {atual.temperature_2m > 35 && (
            <div className="clima-alerta alerta-calor">
              🌡️ <strong>Calor extremo ({Math.round(atual.temperature_2m)}°C).</strong> Atenção ao estresse hídrico das plantas.
            </div>
          )}
        </>
      )}

      {!loading && !atual && !erro && (
        <div className="clima-vazio">
          <p>Busque uma cidade ou cadastre coordenadas no talhão para ver o clima.</p>
        </div>
      )}
    </div>
  );
}
