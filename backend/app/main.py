from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="Portfo IA API",
    description="Backend oficial para análisis de portafolios multi-plataforma con IA y Stellar.",
    version="1.0.0"
)

# Configuración de CORS para que el Frontend (React) se comunique sin problemas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción se restringe a tu dominio de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Asset(BaseModel):
    symbol: str
    amount: float
    platform: str # ej. "Binance", "GBM", "Stellar"

class PortfolioRequest(BaseModel):
    user_id: str
    assets: List[Asset]

@app.get("/")
def read_root():
    return {"status": "online", "message": "Bienvenido al núcleo de Portfo IA 🚀"}

@app.post("/api/analyze")
def analyze_portfolio(portfolio: PortfolioRequest):
    # Aquí conectaremos próximamente el servicio de Groq
    try:
        # Simulación de respuesta estructurada de la IA
        return {
            "trust_score": 85,
            "risk_level": "Moderado",
            "summary": "Tu portafolio muestra una buena distribución, pero alta exposición a criptomonedas volátiles frente a activos tradicionales.",
            "recommendations": [
                "Considera rebalancear un 10% hacia activos estables o FIBRAs.",
                "Monitorea la volatilidad de tus activos principales en Binance."
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))