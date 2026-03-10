import { useEffect, useState } from "react";

const WMO = {
  0:{label:"Céu limpo",icon:"☀️"}, 1:{label:"Principalmente limpo",icon:"🌤️"},
  2:{label:"Parcialmente nublado",icon:"⛅"}, 3:{label:"Nublado",icon:"☁️"},
  45:{label:"Nevoeiro",icon:"🌫️"}, 48:{label:"Nevoeiro com gelo",icon:"🌫️"},
  51:{label:"Chuvisco leve",icon:"🌦️"}, 53:{label:"Chuvisco moderado",icon:"🌦️"},
  55:{label:"Chuvisco intenso",icon:"🌧️"}, 61:{label:"Chuva leve",icon:"🌧️"},
  63:{label:"Chuva moderada",icon:"🌧️"}, 65:{label:"Chuva forte",icon:"⛈️"},
  80:{label:"Pancadas leves",icon:"🌦️"}, 81:{label:"Pancadas moderadas",icon:"🌧️"},
  82:{label:"Pancadas fortes",icon:"⛈️"}, 95:{label:"Tempestade",icon:"⛈️"},
  99:{label:"Tempestade com granizo",icon:"🌩️"},
};

const getCond = (code) => WMO[code] || { label:"Condição desconhecida", icon:"🌡️" };
const DIAS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

async function buscarClima(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`
    + `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code`
    + `&timezone=America%2FSao_Paulo&forecast_days=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error();
  return res.json();
}

async function buscarCidade(cidade) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&countryCode=BR`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results?.length) throw new Error("Cidade não encontrada");
  return { lat: data.results[0].latitude, lon: data.results[0].longitude, nome: data.results[0].name };
}

export default function Clima({ talhoes }) {
  const [clima, setClima]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");
  const [busca, setBusca]     = useState("");
  const [localNome, setLocalNome] = useState("");
  const [coords, setCoords]   = useState(null);

  useEffect(() => {
    const t = talhoes?.find(t => t.latitude && t.longitude);
    if (t) { setCoords({ lat: t.latitude, lon: t.longitude }); setLocalNome(t.nome); }
  }, [talhoes]);

  useEffect(() => {
    if (coords) carregarClima(coords.lat, coords.lon);
  }, [coords]);

  const carregarClima = async (lat, lon) => {
    setLoading(true); setErro("");
    try { setClima(await buscarClima(lat, lon)); }
    catch { setErro("Não foi possível carregar o clima."); }
    finally { setLoading(false); }
  };

  const handleBusca = async () => {
    if (!busca.trim()) return;
    setLoading(true); setErro("");
    try {
      const { lat, lon, nome } = await buscarCidade(busca);
      setCoords({ lat, lon }); setLocalNome(nome);
    } catch (e) {
      setErro(e.message); setLoading(false);
    }
  };

  const atual = clima?.current;
  const diario = clima?.daily;
  const cond = atual ? getCond(atual.weather_code) : null;

  return (
    <div className="clima-wrap">
      <div className="clima-panel">
        <div className="clima-top">
          <div>
            <h2>Clima Agrícola</h2>
            <p className="clima-local">{localNome || "Nenhuma localização definida"}</p>
          </div>
          <div className="clima-search">
            <input type="text" placeholder="Buscar cidade..."
              value={busca} onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleBusca()} />
            <button className="btn btn-primary btn-sm" onClick={handleBusca}>Buscar</button>
          </div>
        </div>

        {erro && <div className="erro" style={{marginBottom:20}}><span>⚠</span>{erro}</div>}

        {loading && (
          <div className="clima-loading">
            <span className="spin">◌</span> Carregando dados climáticos...
          </div>
        )}

        {!loading && atual && (
          <>
            <div className="clima-now">
              <span className="clima-icon-big">{cond.icon}</span>
              <div className="clima-temp-big">{Math.round(atual.temperature_2m)}°C</div>
              <div className="clima-cond-label">{cond.label}</div>
              <div className="clima-chips">
                <span className="clima-chip">💧 {atual.relative_humidity_2m}% umidade</span>
                <span className="clima-chip">🌧️ {atual.precipitation} mm</span>
                <span className="clima-chip">💨 {atual.wind_speed_10m} km/h</span>
              </div>
            </div>

            <div className="clima-days">
              {diario.time.map((data, i) => {
                const d = new Date(data + "T12:00:00");
                const c = getCond(diario.weather_code[i]);
                return (
                  <div key={i} className="clima-day">
                    <span className="clima-day-name">{i === 0 ? "Hoje" : DIAS[d.getDay()]}</span>
                    <span className="clima-day-icon">{c.icon}</span>
                    <span className="clima-day-rain">{diario.precipitation_sum[i].toFixed(1)} mm</span>
                    <span className="clima-day-max">{Math.round(diario.temperature_2m_max[i])}°</span>
                    <span className="clima-day-min">{Math.round(diario.temperature_2m_min[i])}°</span>
                  </div>
                );
              })}
            </div>

            {atual.precipitation > 10 && (
              <div className="clima-alert alert-rain">⚠️ <strong>Chuva intensa.</strong> Evite aplicação de defensivos hoje.</div>
            )}
            {atual.wind_speed_10m > 20 && (
              <div className="clima-alert alert-wind">⚠️ <strong>Vento forte ({atual.wind_speed_10m} km/h).</strong> Risco de deriva na pulverização.</div>
            )}
            {atual.temperature_2m > 35 && (
              <div className="clima-alert alert-heat">🌡️ <strong>Calor extremo.</strong> Atenção ao estresse hídrico das plantas.</div>
            )}
          </>
        )}

        {!loading && !atual && !erro && (
          <div className="clima-empty">Busque uma cidade ou cadastre coordenadas no talhão para ver o clima.</div>
        )}
      </div>
    </div>
  );
}
