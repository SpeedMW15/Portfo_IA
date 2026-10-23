import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchPortfolioAssets,
  fetchAIInsights,
  fetchStellarAccount,
  fetchMarketOpportunities
} from './services/api';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';

const LIGHT_COLORS = ['#B58A42', '#059669', '#64748B', '#2563EB'];
const DARK_COLORS = ['#D6B36A', '#10B981', '#64748B', '#60A5FA'];

const DISPLAY_FONT = "'Fraunces', 'Iowan Old Style', 'Georgia', serif";

const REFRESH_INTERVAL_MS = 45000;

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setValue(target);
      return undefined;
    }

    let frame;
    let start = null;

    function tick(timestamp) {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const ACTION_LABELS = { buy: 'Comprar', sell: 'Vender', hold: 'Mantener' };

function AiActionBadge({ action, isDark }) {
  if (!action) return null;
  const key = ACTION_LABELS[action.action] ? action.action : 'hold';
  const palette = {
    buy: isDark
      ? 'text-emerald-400 bg-emerald-400/[0.06] border-emerald-400/15'
      : 'text-emerald-600 bg-emerald-500/[0.06] border-emerald-500/15',
    sell: isDark
      ? 'text-rose-400 bg-rose-400/[0.06] border-rose-400/15'
      : 'text-rose-600 bg-rose-500/[0.06] border-rose-500/15',
    hold: isDark
      ? 'text-[#D6B36A] bg-[#D6B36A]/[0.06] border-[#D6B36A]/15'
      : 'text-[#8A6A32] bg-[#B58A42]/[0.07] border-[#B58A42]/20'
  }[key];

  return (
    <span
      className={`group/badge relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-medium uppercase tracking-[0.1em] cursor-help ${palette}`}
      title={action.reason || ''}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {ACTION_LABELS[key]}
      {typeof action.confidence === 'number' && (
        <span className="opacity-60 font-mono normal-case tracking-normal">{action.confidence}%</span>
      )}
    </span>
  );
}

export default function PortfolioDashboard() {
  const [assets, setAssets] = useState([]);
  const [insights, setInsights] = useState(null);
  const [stellar, setStellar] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [insightsLoading, setInsightsLoading] = useState(false);

  // THEME
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('portfolio-theme', theme);
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  // FONTS
  useEffect(() => {
    if (document.getElementById('portfolio-font-link')) return;
    const link = document.createElement('link');
    link.id = 'portfolio-font-link';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap';
    document.head.appendChild(link);
  }, []);

  // DATA LOADING
  const loadData = useCallback(async (isInitial) => {
    try {
      if (isInitial) setLoading(true);

      const [liveAssets, liveStellar, liveOpps] = await Promise.all([
        fetchPortfolioAssets(),
        fetchStellarAccount(),
        fetchMarketOpportunities()
      ]);

      setAssets(liveAssets);
      setStellar(liveStellar);
      setOpportunities(liveOpps);
      if (liveOpps.length > 0 && !selectedAsset) {
        setSelectedAsset(liveOpps[0]);
      }
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error al cargar el portafolio:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [selectedAsset]);

  const handleAnalyzeWithAI = async () => {
    if (insightsLoading) return;
    setInsightsLoading(true);
    try {
      const liveInsights = await fetchAIInsights();
      setInsights(liveInsights);
    } catch (error) {
      console.error('Error al consultar la IA:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  // CALCULATIONS
  const totalPortfolioValue = useMemo(
    () => assets.reduce((acc, item) => acc + item.value, 0),
    [assets]
  );

  const animatedTotal = useCountUp(totalPortfolioValue);
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

  const actionsBySymbol = useMemo(() => {
    const map = {};
    (insights?.actions || []).forEach((a) => {
      map[a.symbol] = a;
    });
    return map;
  }, [insights]);

  const filteredOpportunities = useMemo(() => {
    if (selectedCategory === 'Todos') return opportunities;
    return opportunities.filter((opp) => opp.category === selectedCategory);
  }, [opportunities, selectedCategory]);

  const secondsSinceUpdate = lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null;
  const updatedLabel =
    secondsSinceUpdate === null
      ? '—'
      : secondsSinceUpdate < 5
        ? 'justo ahora'
        : secondsSinceUpdate < 60
          ? `hace ${secondsSinceUpdate}s`
          : `hace ${Math.round(secondsSinceUpdate / 60)} min`;

  // THEME CLASSES
  const pageBg = isDark ? 'bg-[#080A0C]' : 'bg-[#F5F4F0]';
  const primaryText = isDark ? 'text-white' : 'text-[#17191A]';
  const secondaryText = isDark ? 'text-white/50' : 'text-slate-500';
  const mutedText = isDark ? 'text-white/25' : 'text-slate-400';
  const subtleBorder = isDark ? 'border-white/[0.08]' : 'border-slate-200/80';
  const cardBg = isDark ? 'bg-[#0D1012]' : 'bg-white';

  const motionStyles = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmerLine {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes driftGlow {
      0%, 100% { transform: translate3d(0,0,0) scale(1); }
      50% { transform: translate3d(0,-14px,0) scale(1.04); }
    }
    .reveal {
      opacity: 0;
      animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .shimmer-line {
      background-size: 200% 100%;
      animation: shimmerLine 4.5s linear infinite;
    }
    .drift {
      animation: driftGlow 12s ease-in-out infinite;
    }
    .drift-slow {
      animation: driftGlow 18s ease-in-out infinite;
      animation-delay: -4s;
    }
  `;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#080A0C] text-white' : 'bg-[#F6F5F1] text-slate-900'}`}>
        <style>{motionStyles}</style>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl transition-colors duration-500 ${isDark ? 'border border-white/10 bg-white/[0.035] shadow-2xl' : 'border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,.08)]'}`}>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#F2D18A] via-[#D6B36A] to-[#8A6A32] text-2xl font-black" style={{ fontFamily: DISPLAY_FONT }}>
                Π
              </span>
            </div>
            <div className="absolute inset-0 rounded-2xl border border-emerald-400/20 animate-ping" />
          </div>

          <div className="text-center reveal" style={{ animationDelay: '120ms' }}>
            <p className={`text-[10px] uppercase tracking-[0.45em] mb-3 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              Plataforma de Banca Privada
            </p>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-500 font-medium">
              Estableciendo conexión segura
            </p>
          </div>

          <div className={`mt-7 w-32 h-px overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg} ${primaryText} relative overflow-hidden transition-colors duration-500 selection:bg-emerald-400 selection:text-black`}>
      <style>{motionStyles}</style>

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`drift absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] ${isDark ? 'bg-emerald-500/[0.035]' : 'bg-emerald-500/[0.035]'}`} />
        <div className={`drift-slow absolute top-[35%] -right-60 w-[650px] h-[650px] rounded-full blur-[160px] ${isDark ? 'bg-amber-400/[0.025]' : 'bg-amber-400/[0.045]'}`} />
        <div className={`absolute bottom-[-300px] left-[25%] w-[600px] h-[600px] rounded-full blur-[160px] ${isDark ? 'bg-blue-500/[0.025]' : 'bg-blue-500/[0.02]'}`} />
      </div>

      {/* CONTAINER */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-6 lg:py-9">

        {/* HEADER */}
        <header className={`reveal flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7 pb-8 border-b ${subtleBorder}`}>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D8BA78] via-[#B99651] to-[#80612D] p-[1px] shadow-[0_10px_40px_rgba(214,179,106,.16)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                <div className={`w-full h-full rounded-[15px] flex items-center justify-center ${isDark ? 'bg-[#0C0F11]' : 'bg-white'}`}>
                  <span className="text-[#E3C47F] text-lg font-bold" style={{ fontFamily: DISPLAY_FONT }}>
                    Π
                  </span>
                </div>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${isDark ? 'bg-[#080A0C]' : 'bg-[#F5F4F0]'} p-[3px]`}>
                <div className="w-full h-full rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
              </div>
            </div>

            <div>
              <h1 className={`text-xl sm:text-2xl font-semibold tracking-[0.12em] ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>
                PORTFO
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F1D28C] to-[#B58A42]">
                  .IA
                </span>
              </h1>
              <p className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1 ${mutedText}`}>
                Gestión de Patrimonio Privado
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl backdrop-blur-xl border ${isDark ? 'bg-white/[0.025] border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className={`text-[9px] uppercase tracking-[0.18em] ${secondaryText}`}>Conexión segura</span>
            </div>

            <div className={`hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${isDark ? 'bg-white/[0.025] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
              <span className={`text-[9px] uppercase tracking-[0.18em] ${mutedText}`}>Nodo</span>
              <span className={`text-[10px] font-mono ${secondaryText}`}>MX-01</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className={`group relative h-10 w-[78px] rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D6B36A]/30 ${isDark ? 'bg-[#14181A] border-white/[0.1] hover:border-[#D6B36A]/30' : 'bg-white border-slate-200 hover:border-[#B58A42]/40 shadow-sm'}`}
            >
              <div className={`absolute top-1 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isDark ? 'left-[41px] bg-[#1C2224] shadow-[0_4px_15px_rgba(0,0,0,.4)]' : 'left-1 bg-[#F8F6EF] shadow-[0_4px_15px_rgba(0,0,0,.12)]'}`}>
                <span className="text-sm inline-block transition-transform duration-500" style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                  {isDark ? '🌙' : '☀️'}
                </span>
              </div>
              <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[8px] transition-opacity duration-300 ${isDark ? 'opacity-100 text-[#D6B36A]' : 'opacity-0'}`}>OSCURO</span>
              <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100 text-[#8A6A32]'}`}>CLARO</span>
            </button>

            {insights && (
              <div className={`relative px-4 py-2.5 rounded-xl border backdrop-blur-xl transition-all duration-300 hover:border-[#D6B36A]/40 ${isDark ? 'border-[#D6B36A]/20 bg-gradient-to-br from-[#D6B36A]/[0.07] to-transparent' : 'border-[#B58A42]/20 bg-gradient-to-br from-[#D6B36A]/[0.08] to-white'}`}>
                <div className="flex items-center gap-3">
                  <div>
                    <p className={`text-[8px] uppercase tracking-[0.2em] ${mutedText}`}>Salud del portafolio</p>
                    <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F0D28D] to-[#B38A44] leading-none mt-1" style={{ fontFamily: DISPLAY_FONT }}>
                      {insights.health_score}
                      <span className={`text-[9px] font-normal ${mutedText}`}>/100</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#D6B36A]/20 flex items-center justify-center">
                    <span className="text-[#D6B36A] text-xs">✦</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* HERO GRID */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 mt-7">

          {/* TOTAL VALUE */}
          <div className={`reveal relative overflow-hidden rounded-[28px] border ${subtleBorder} transition-shadow duration-500 hover:shadow-[0_35px_120px_rgba(214,179,106,.1)] ${isDark ? 'bg-gradient-to-br from-[#101416] via-[#0D1012] to-[#090B0D] shadow-[0_30px_100px_rgba(0,0,0,.35)]' : 'bg-gradient-to-br from-white via-white to-[#F8F6EF] shadow-[0_25px_70px_rgba(30,30,20,.08)]'}`}>
            <div className="shimmer-line absolute top-0 left-0 right-0 h-px" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(214,179,106,.7), transparent)' }} />

            <div className="relative p-7 sm:p-9 lg:p-10">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6B36A] shadow-[0_0_8px_rgba(214,179,106,.8)]" />
                    <span className={`text-[9px] uppercase tracking-[0.28em] ${mutedText}`}>Valor Neto Consolidado (NAV)</span>
                  </div>
                  <p className={`text-[10px] uppercase tracking-[0.16em] ${mutedText}`}>Todas tus plataformas, un solo lugar</p>
                </div>

                <div className={`px-3 py-1.5 rounded-full border ${isDark ? 'border-emerald-400/15 bg-emerald-400/[0.04]' : 'border-emerald-500/15 bg-emerald-500/[0.05]'}`}>
                  <span className="text-[9px] uppercase tracking-[0.15em] text-emerald-500">● En vivo · {updatedLabel}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-4">
                <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] tabular-nums ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>
                  ${animatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </h2>

                <div className={`mb-1 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-emerald-400/[0.06] border-emerald-400/10' : 'bg-emerald-500/[0.06] border-emerald-500/10'}`}>
                  <span className="text-xs font-medium text-emerald-500">+3.42%</span>
                  <span className={`text-[9px] ml-1.5 uppercase tracking-wider ${mutedText}`}>24h</span>
                </div>
              </div>

              <div className={`h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8 ${isDark ? '' : 'opacity-60'}`} />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className={`text-[9px] uppercase tracking-[0.18em] mb-2 ${mutedText}`}>Posiciones activas</p>
                  <p className={`text-xl font-medium ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>
                    {assets.length.toString().padStart(2, '0')}
                  </p>
                </div>

                <div>
                  <p className={`text-[9px] uppercase tracking-[0.18em] mb-2 ${mutedText}`}>Moneda base</p>
                  <p className={`text-xl font-medium ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>MXN</p>
                </div>

                <div className="hidden sm:block">
                  <p className={`text-[9px] uppercase tracking-[0.18em] mb-2 ${mutedText}`}>Estado del mercado</p>
                  <p className="text-xl font-medium text-emerald-500" style={{ fontFamily: DISPLAY_FONT }}>Abierto</p>
                </div>
              </div>

              {insights && (
                <div className={`mt-8 rounded-2xl border overflow-hidden transition-colors duration-300 ${isDark ? 'border-white/[0.07] bg-white/[0.018] hover:border-[#D6B36A]/20' : 'border-slate-200 bg-[#FAF9F5] hover:border-[#B58A42]/25'}`}>
                  <div className="flex">
                    <div className="w-1 bg-gradient-to-b from-[#D6B36A] to-emerald-400" />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-[#D6B36A] text-xs">✦</span>
                        <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#B58A42]">Reporte de inteligencia</span>
                      </div>
                      <p className={`text-xs sm:text-sm leading-6 ${secondaryText}`}>{insights.recommendation}</p>
                      {insights.diversification_tip && (
                        <p className={`text-xs sm:text-sm leading-6 mt-2 pt-2 border-t ${isDark ? 'border-white/[0.06] text-white/70' : 'border-slate-200 text-slate-600'}`}>
                          <span className="text-emerald-500 font-medium">Sugerencia →</span> {insights.diversification_tip}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ALLOCATION */}
          <div className={`reveal relative overflow-hidden rounded-[28px] border ${subtleBorder} ${cardBg} shadow-[0_30px_100px_rgba(0,0,0,.12)]`}>
            <div className="shimmer-line absolute top-0 left-0 right-0 h-px" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(214,179,106,.4), transparent)' }} />

            <div className="p-7 sm:p-8 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-[9px] uppercase tracking-[0.28em] ${mutedText}`}>Asignación de activos</p>
                  <p className={`text-xs mt-1 ${secondaryText}`}>Mix actual del portafolio</p>
                </div>
                <span className="text-[9px] uppercase tracking-[0.15em] text-[#B58A42]">Optimizado</span>
              </div>

              <div className="relative h-[240px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assets} dataKey="value" nameKey="symbol" cx="50%" cy="50%" innerRadius={68} outerRadius={91} paddingAngle={4} stroke="none">
                      {assets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#101416' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid #E2E8F0',
                        borderRadius: '14px',
                        color: isDark ? '#fff' : '#17191A',
                        padding: '12px 14px'
                      }}
                      formatter={(value) => [`$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 'Valor']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className={`text-[8px] uppercase tracking-[0.2em] ${mutedText}`}>Activos</p>
                    <p className={`text-lg font-semibold mt-1 ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>
                      {assets.length}
                    </p>
                    <p className={`text-[8px] uppercase tracking-wider ${mutedText}`}>totales</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-auto">
                {assets.map((item, idx) => (
                  <div key={item.symbol} className={`group rounded-xl border px-3 py-3 transition-all duration-300 ${isDark ? 'border-white/[0.06] bg-white/[0.018]' : 'border-slate-200 bg-[#FAFAF8]'}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className={`text-[9px] uppercase tracking-[0.15em] ${mutedText}`}>{item.symbol}</span>
                    </div>
                    <p className={`text-sm font-medium mt-2 ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>
                      {item.allocation}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI ADVISOR + STELLAR NETWORK */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">

          {/* AI ADVISOR */}
          <div className={`reveal relative overflow-hidden rounded-[28px] border ${subtleBorder} ${cardBg} shadow-lg p-7 sm:p-8`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <p className={`text-[9px] uppercase tracking-[0.28em] ${mutedText}`}>Asesor de IA</p>
                <p className={`text-xs mt-1 ${secondaryText}`}>Señales de compra / venta por activo</p>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={insightsLoading}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[10px] font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
                  insightsLoading
                    ? 'opacity-60 border-[#D6B36A]/20 bg-[#D6B36A]/[0.05] text-[#D6B36A]'
                    : isDark
                      ? 'border-[#D6B36A]/30 bg-[#D6B36A]/[0.08] text-[#E3C47F] hover:bg-[#D6B36A]/[0.15]'
                      : 'border-[#B58A42]/30 bg-[#B58A42]/[0.08] text-[#8A6A32] hover:bg-[#B58A42]/[0.15]'
                }`}
              >
                <span className={`text-xs ${insightsLoading ? 'animate-spin' : ''}`}>✦</span>
                <span>{insightsLoading ? 'Analizando...' : 'Analizar con IA'}</span>
              </button>
            </div>

            {!insights && !insightsLoading && (
              <div className={`rounded-xl border border-dashed px-5 py-6 text-center ${isDark ? 'border-white/[0.1]' : 'border-slate-300'}`}>
                <p className={`text-xs leading-6 ${secondaryText}`}>
                  Haz clic en <strong>"Analizar con IA"</strong> para generar las señales cuantitativas.
                </p>
              </div>
            )}

            {insights && (
              <div className="space-y-2">
                {assets.map((item) => {
                  const action = actionsBySymbol[item.symbol];
                  return (
                    <div key={item.symbol} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isDark ? 'border-white/[0.06] bg-white/[0.018]' : 'border-slate-200 bg-[#FAFAF8]'}`}>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${primaryText}`}>{item.symbol}</p>
                        <p className={`text-[10px] mt-0.5 truncate ${mutedText}`}>{action?.reason || 'Sin señal disponible'}</p>
                      </div>
                      <AiActionBadge action={action} isDark={isDark} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STELLAR NETWORK */}
          <div className={`reveal relative overflow-hidden rounded-[28px] border ${subtleBorder} ${cardBg} shadow-lg p-7 sm:p-8`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className={`text-[9px] uppercase tracking-[0.28em] ${mutedText}`}>Red Stellar</p>
                <p className={`text-xs mt-1 ${secondaryText}`}>Tu billetera on-chain</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full border text-[8px] uppercase tracking-[0.15em] ${isDark ? 'border-blue-400/20 text-blue-300 bg-blue-400/[0.05]' : 'border-blue-500/20 text-blue-600 bg-blue-500/[0.05]'}`}>
                {stellar?.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
              </span>
            </div>

            {stellar?.configured ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-medium tracking-[-0.02em] tabular-nums ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>
                    {Number(stellar.xlm_balance).toLocaleString('es-MX', { maximumFractionDigits: 4 })}
                  </span>
                  <span className={`text-xs uppercase tracking-wider ${mutedText}`}>XLM nativo</span>
                </div>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-mono ${isDark ? 'border-white/[0.07] bg-white/[0.02] text-white/50' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                  <span className="truncate">{stellar.public_key}</span>
                </div>

                {stellar.other_assets?.length > 0 && (
                  <div>
                    <p className={`text-[9px] uppercase tracking-[0.18em] mb-2 ${mutedText}`}>Otros trustlines</p>
                    <div className="flex flex-wrap gap-2">
                      {stellar.other_assets.map((a) => (
                        <span key={a.asset_code} className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono ${isDark ? 'border-white/[0.07] bg-white/[0.02] text-white/60' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                          {a.asset_code}: {Number(a.balance).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`rounded-xl border border-dashed px-5 py-6 text-center ${isDark ? 'border-white/[0.1]' : 'border-slate-300'}`}>
                <p className={`text-xs leading-6 ${secondaryText}`}>
                  {stellar?.message || 'Configura tu cuenta de Stellar para verla aquí.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SECCIÓN: OPORTUNIDADES DE INVERSIÓN Y GRÁFICAS EN TIEMPO REAL */}
        <section className={`reveal relative mt-8 overflow-hidden rounded-[28px] border ${subtleBorder} ${cardBg} p-7 sm:p-9 shadow-xl`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#D6B36A] text-xs">✦</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#B58A42]">Explorador de Mercado</span>
              </div>
              <h3 className={`text-lg font-semibold ${primaryText}`} style={{ fontFamily: DISPLAY_FONT }}>
                Oportunidades de Inversión Destacadas
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Todos', 'Cripto / L1', 'DeFi / Soroban', 'Acciones / Tech', 'ETFs'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] uppercase tracking-wider transition-all duration-300 ${
                    selectedCategory === cat
                      ? 'border-[#D6B36A] bg-[#D6B36A]/10 text-[#D6B36A] font-semibold'
                      : 'border-slate-200/40 text-slate-400 hover:border-[#D6B36A]/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LISTADO DE ACTIVOS */}
            <div className="space-y-3 lg:col-span-1">
              {filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => setSelectedAsset(opp)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 ${
                    selectedAsset?.id === opp.id
                      ? isDark
                        ? 'border-[#D6B36A] bg-white/[0.04]'
                        : 'border-[#B58A42] bg-[#FAF9F5]'
                      : isDark
                        ? 'border-white/[0.06] bg-white/[0.015] hover:border-white/[0.15]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs font-semibold ${primaryText}`}>{opp.symbol}</span>
                      <p className={`text-[10px] ${mutedText}`}>{opp.name}</p>
                    </div>
                    <span className={`text-xs font-mono font-medium ${opp.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {opp.change_24h}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mt-3">
                    <div>
                      <p className={`text-[9px] uppercase ${mutedText}`}>Precio Actual</p>
                      <p className={`text-sm font-mono font-medium ${primaryText}`}>
                        ${opp.price_mxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wider bg-[#D6B36A]/10 text-[#D6B36A] border border-[#D6B36A]/20">
                      {opp.ai_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* GRÁFICA INTERACTIVA EN TIEMPO REAL */}
            <div className={`lg:col-span-2 rounded-2xl border p-6 flex flex-col justify-between ${isDark ? 'border-white/[0.06] bg-white/[0.015]' : 'border-slate-200 bg-[#FAF9F5]'}`}>
              {selectedAsset ? (
                <>
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-semibold ${primaryText}`}>{selectedAsset.name}</span>
                        <span className={`text-xs font-mono ${mutedText}`}>({selectedAsset.symbol})</span>
                      </div>
                      <p className={`text-[10px] uppercase tracking-wider ${mutedText} mt-0.5`}>{selectedAsset.category}</p>
                    </div>

                    <div className="flex gap-4">
                      <div>
                        <p className={`text-[8px] uppercase tracking-wider ${mutedText}`}>Volumen 24h</p>
                        <p className={`text-xs font-mono font-medium ${primaryText}`}>{selectedAsset.volume_24h}</p>
                      </div>
                      <div>
                        <p className={`text-[8px] uppercase tracking-wider ${mutedText}`}>Máx / Mín 24h</p>
                        <p className={`text-xs font-mono font-medium ${primaryText}`}>${selectedAsset.high_24h} / ${selectedAsset.low_24h}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[220px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedAsset.history}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D6B36A" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#D6B36A" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke={isDark ? '#ffffff40' : '#00000040'} fontSize={10} tickLine={false} />
                        <YAxis stroke={isDark ? '#ffffff40' : '#00000040'} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: isDark ? '#101416' : '#FFFFFF',
                            border: '1px solid #D6B36A',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}
                          formatter={(val) => [`$${val} MXN`, 'Precio']}
                        />
                        <Area type="monotone" dataKey="price" stroke="#D6B36A" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Selecciona un activo de la lista para ver su gráfica en tiempo real.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* HOLDINGS TABLE COMPLETA */}
        <section className={`reveal relative mt-5 overflow-hidden rounded-[28px] border ${subtleBorder} ${cardBg} shadow-lg`}>
          <div className={`px-6 sm:px-8 py-6 border-b ${subtleBorder} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isDark ? 'bg-transparent' : 'bg-[#FCFBF8]'}`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#D6B36A] text-xs">◈</span>
                <h3 className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${secondaryText}`}>Holdings activos</h3>
              </div>
              <p className={`text-[10px] tracking-wide ${mutedText}`}>Posiciones consolidadas de todas tus plataformas</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[9px] uppercase tracking-[0.15em] ${mutedText}`}>Actualizado {updatedLabel}</span>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? 'border-emerald-400/10 bg-emerald-400/[0.035]' : 'border-emerald-500/10 bg-emerald-500/[0.04]'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]" />
                <span className="text-[8px] uppercase tracking-wider text-emerald-500/80">Activo</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className={`border-b ${subtleBorder} ${isDark ? 'bg-white/[0.012]' : 'bg-[#F8F7F3]'}`}>
                  {['Activo', 'Plataforma', 'Categoría', 'Cantidad', 'Precio unitario', 'Valor total', 'Cambio 24h', 'Asignación', 'Señal IA'].map((heading) => (
                    <th key={heading} className={`px-6 py-4 text-left text-[8px] font-medium uppercase tracking-[0.2em] ${mutedText}`}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((item, idx) => (
                  <tr key={item.id} className={`border-b last:border-b-0 transition-all duration-300 ${isDark ? 'border-white/[0.045] hover:bg-white/[0.025]' : 'border-slate-100 hover:bg-[#FAF9F5]'}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
                          <span className="text-[10px] font-semibold text-[#B58A42]">{item.symbol.slice(0, 3)}</span>
                        </div>
                        <div>
                          <span className={`block text-sm font-medium ${primaryText}`}>{item.symbol}</span>
                          <span className={`block text-[10px] mt-1 ${mutedText}`}>{item.name}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`text-xs ${secondaryText}`}>{item.platform}</span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg border text-[8px] uppercase tracking-[0.15em] ${isDark ? 'border-white/[0.07] bg-white/[0.025] text-white/40' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                        {item.category}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`text-xs font-mono tabular-nums ${secondaryText}`}>{item.amount}</span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`text-xs font-mono tabular-nums ${secondaryText}`}>{item.price}</span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`text-sm font-mono font-medium tabular-nums ${primaryText}`}>
                        ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-medium tabular-nums ${item.trend === 'up' ? 'text-emerald-500 bg-emerald-500/[0.05] border-emerald-500/10' : 'text-rose-500 bg-rose-500/[0.05] border-rose-500/10'}`}>
                        <span>{item.trend === 'up' ? '↗' : '↘'}</span>
                        {item.change}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono tabular-nums w-9 ${secondaryText}`}>{item.allocation}%</span>
                        <div className={`w-24 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                          <div className="h-full rounded-full bg-gradient-to-r from-[#9D793B] via-[#D6B36A] to-[#E8CD91]" style={{ width: `${item.allocation}%` }} />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <AiActionBadge action={actionsBySymbol[item.symbol]} isDark={isDark} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="reveal py-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className={`text-[8px] uppercase tracking-[0.22em] ${mutedText}`}>PORTFO.IA — Inteligencia de Patrimonio Privado</p>
          <p className={`text-[8px] uppercase tracking-[0.18em] ${mutedText}`}>Confidencial • Seguro • Institucional</p>
        </footer>

      </div>
    </div>
  );
}