// Detecta la URL de la API según el entorno
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
    console.warn("Usando datos Mock para Assets:", error);
    return [
      {
        id: 1,
        symbol: "XLM",
        name: "Stellar Lumens",
        platform: "Stellar Network",
        category: "DeFi / L1",
        amount: "1,500.00",
        price: "$0.12",
        value: 180.50,
        trend: "up",
        change: "+5.4%",
        allocation: 25
      },
      {
        id: 2,
        symbol: "BTC",
        name: "Bitcoin",
        platform: "Binance",
        category: "Store of Value",
        amount: "0.005",
        price: "$64,020.00",
        value: 320.10,
        trend: "up",
        change: "+2.1%",
        allocation: 45
      },
      {
        id: 3,
        symbol: "ETH",
        name: "Ethereum",
        platform: "Uniswap V3",
        category: "Smart Contracts",
        amount: "0.08",
        price: "$2,625.00",
        value: 210.00,
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
    if (json.status === "success") {
      return json.data;
    }
    throw new Error("Estructura de datos no válida");
  } catch (error) {
    console.warn("Usando datos Mock para IA Insights:", error);
    return {
      health_score: 88,
      recommendation: "Mantener posiciones actuales y considerar rebalanceo hacia XLM tras confirmación de ruptura en la Testnet.",
      diversification_tip: "Tu portafolio presenta una alta concentración en Store of Value. Incrementar participación en L1/DeFi mejorará el rendimiento ajustado por riesgo.",
      actions: [
        {
          symbol: "XLM",
          action: "buy",
          confidence: 85,
          reason: "Patrón alcista detectado en la Testnet de Soroban con volumen incremental."
        },
        {
          symbol: "BTC",
          action: "hold",
          confidence: 90,
          reason: "Consolidación saludable sobre la media móvil de 50 días."
        },
        {
          symbol: "ETH",
          action: "buy",
          confidence: 78,
          reason: "Soporte clave alcanzado con divergencia positiva en RSI."
        }
      ]
    };
  }
}

export async function fetchStellarAccount() {
  try {
    const response = await fetch(`${API_BASE_URL}/stellar`);
    if (!response.ok) throw new Error("Backend no disponible");
    const json = await response.json();
    if (json.status === "success") {
      return json.data;
    }
    throw new Error("Estructura de datos no válida");
  } catch (error) {
    console.warn("Usando datos Mock para Stellar:", error);
    return {
      configured: true,
      network: "testnet",
      public_key: "GCX2K3M4N5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0SOROBAN",
      xlm_balance: 1500.00,
      other_assets: [
        { asset_code: "USDC", balance: "250.00" }
      ]
    };
  }
}