const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function fetchPortfolioAssets() {
  try {
    const response = await fetch(`${API_BASE_URL}/assets`);
    if (!response.ok) throw new Error("Backend no disponible");
    const json = await response.json();
    if (json.status === "success" && Array.isArray(json.data)) {
      return json.data;
    }
    throw new Error("Estructura de datos no válida");
  } catch (error) {
    console.warn("Usando datos Mock para Assets (en MXN):", error);
    return [
      {
        id: 1,
        symbol: "XLM",
        name: "Stellar Lumens",
        platform: "Red Stellar",
        category: "CRYPTO",
        amount: "1,500.00",
        price: "$3.29 MXN",
        value: 4935.00,
        trend: "up",
        change: "+0.52%",
        allocation: 25
      },
      {
        id: 2,
        symbol: "BTC",
        name: "Bitcoin",
        platform: "Binance",
        category: "CRYPTO",
        amount: "0.005",
        price: "$1,184,000.00 MXN",
        value: 5920.00,
        trend: "up",
        change: "+2.1%",
        allocation: 45
      },
      {
        id: 3,
        symbol: "ETH",
        name: "Ethereum",
        platform: "Uniswap V3",
        category: "CRYPTO",
        amount: "0.08",
        price: "$48,500.00 MXN",
        value: 3880.00,
        trend: "down",
        change: "-0.8%",
        allocation: 30
      }
    ];
  }
}

export async function fetchAIInsights() {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-insights`);
    if (!response.ok) throw new Error("Backend no disponible");
    const json = await response.json();
    if (json.status === "success") return json.data;
    throw new Error("Estructura no válida");
  } catch (error) {
    return {
      health_score: 88,
      recommendation: "Mantener posiciones actuales y monitorear el soporte de XLM en la Testnet de Soroban.",
      diversification_tip: "Tu portafolio presenta una distribución óptima en activos de capa 1.",
      actions: [
        { symbol: "XLM", action: "buy", confidence: 85, reason: "Tendencia alcista sobre soporte en MXN." },
        { symbol: "BTC", action: "hold", confidence: 90, reason: "Consolidación en rango." },
        { symbol: "ETH", action: "buy", confidence: 78, reason: "Divergencia positiva detectada." }
      ]
    };
  }
}

export async function fetchStellarAccount() {
  try {
    const response = await fetch(`${API_BASE_URL}/stellar`);
    if (!response.ok) throw new Error("Backend no disponible");
    const json = await response.json();
    if (json.status === "success") return json.data;
    throw new Error("Estructura no válida");
  } catch (error) {
    return {
      configured: true,
      network: "testnet",
      public_key: "GCX2K3M4N5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0SOROBAN",
      xlm_balance: 1500.00,
      other_assets: [{ asset_code: "USDC", balance: "250.00" }]
    };
  }
}

export async function fetchMarketOpportunities() {
  try {
    const response = await fetch(`${API_BASE_URL}/market-opportunities`);
    if (!response.ok) throw new Error("Backend no disponible");
    const json = await response.json();
    if (json.status === "success") return json.data;
    throw new Error("Estructura no válida");
  } catch (error) {
    console.warn("Usando datos Mock para Oportunidades de Mercado:", error);
    return [
      {
        id: "solana",
        symbol: "SOL",
        name: "Solana",
        category: "Cripto / L1",
        price_mxn: 3250.0,
        change_24h: "+6.4%",
        trend: "up",
        volume_24h: "$4.2B MXN",
        market_cap: "$1.4T MXN",
        high_24h: 3320.0,
        low_24h: 3010.0,
        ai_score: "Alcista (88%)",
        history: [
          { time: "00:00", price: 3020 },
          { time: "04:00", price: 3080 },
          { time: "08:00", price: 3150 },
          { time: "12:00", price: 3210 },
          { time: "16:00", price: 3190 },
          { time: "20:00", price: 3250 }
        ]
      },
      {
        id: "stellar",
        symbol: "XLM",
        name: "Stellar Lumens",
        category: "DeFi / Soroban",
        price_mxn: 3.29,
        change_24h: "+0.52%",
        trend: "up",
        volume_24h: "$180M MXN",
        market_cap: "$98B MXN",
        high_24h: 3.38,
        low_24h: 3.22,
        ai_score: "Fuerte Compra (92%)",
        history: [
          { time: "00:00", price: 3.24 },
          { time: "04:00", price: 3.27 },
          { time: "08:00", price: 3.31 },
          { time: "12:00", price: 3.35 },
          { time: "16:00", price: 3.28 },
          { time: "20:00", price: 3.29 }
        ]
      },
      {
        id: "nvidia",
        symbol: "NVDA",
        name: "NVIDIA Corp.",
        category: "Acciones / Tech",
        price_mxn: 2480.0,
        change_24h: "+3.15%",
        trend: "up",
        volume_24h: "$12.5B MXN",
        market_cap: "$3.2T USD",
        high_24h: 2510.0,
        low_24h: 2410.0,
        ai_score: "Alcista (85%)",
        history: [
          { time: "00:00", price: 2410 },
          { time: "04:00", price: 2430 },
          { time: "08:00", price: 2465 },
          { time: "12:00", price: 2490 },
          { time: "16:00", price: 2470 },
          { time: "20:00", price: 2480 }
        ]
      },
      {
        id: "voo",
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        category: "ETFs",
        price_mxn: 9850.0,
        change_24h: "+0.85%",
        trend: "up",
        volume_24h: "$8.1B MXN",
        market_cap: "$1.1T USD",
        high_24h: 9890.0,
        low_24h: 9780.0,
        ai_score: "Acumular (94%)",
        history: [
          { time: "00:00", price: 9780 },
          { time: "04:00", price: 9800 },
          { time: "08:00", price: 9820 },
          { time: "12:00", price: 9870 },
          { time: "16:00", price: 9840 },
          { time: "20:00", price: 9850 }
        ]
      }
    ];
  }
}