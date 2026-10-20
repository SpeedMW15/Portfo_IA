const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function fetchPortfolioAssets() {
  try {
    const response = await fetch(`${API_BASE_URL}/assets`);
    const json = await response.json();
    if (json.status === "success") {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error("Error al conectar con el backend de PortfoIA:", error);
    return [];
  }
}

export async function fetchAIInsights() {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-insights`);
    const json = await response.json();
    if (json.status === "success") {
      return json.data;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener los insights de IA:", error);
    return null;
  }
}

export async function fetchStellarAccount() {
  try {
    const response = await fetch(`${API_BASE_URL}/stellar`);
    const json = await response.json();
    if (json.status === "success") {
      return json.data;
    }
    return null;
  } catch (error) {
    console.error("Error al conectar con la red Stellar:", error);
    return null;
  }
}
