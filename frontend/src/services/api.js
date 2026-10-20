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
    // Incluye propiedades compatibles con .toLocaleString()
    return [
      { id: 1, name: "Stellar Lumens", symbol: "XLM", amount: 1500, valueUsd: 180.50, value: 180.50, price: 0.12 },
      { id: 2, name: "Bitcoin", symbol: "BTC", amount: 0.005, valueUsd: 320.10, value: 320.10, price: 64020.00 },
      { id: 3, name: "Ethereum", symbol: "ETH", amount: 0.08, valueUsd: 210.00, value: 210.00, price: 2625.00 }
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
      summary: "Análisis predictivo de la cartera vía Groq AI (Llama 3.3 70B)",
      recommendation: "MANTENER / REBALANCEAR",
      riskScore: "Medio-Bajo",
      details: "Diversificación óptima detectada en la Testnet de Stellar. El rendimiento proyectado a 30 días presenta una tendencia positiva del +4.2%."
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
      network: "Testnet",
      accountPublicKey: "GCX2K...SOROBAN_TESTNET_ACCOUNT",
      contractId: "C1234...SMART_CONTRACT_SOROBAN",
      balanceXLM: 1500.00,
      balance: 1500.00,
      status: "Connected (Mock Mode)"
    };
  }
}