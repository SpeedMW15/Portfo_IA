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
    // Precios y cálculos actualizados en Pesos Mexicanos (MXN)
    return [
      {
        id: 1,
        symbol: "XLM",
        name: "Stellar Lumens",
        platform: "Red Stellar",
        category: "CRYPTO",
        amount: "1,500.00",
        price: "$3.29 MXN",
        value: 4935.00, // 1500 * 3.29
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