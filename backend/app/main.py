from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .services.exchange_service import (
    fetch_live_prices,
    fetch_stellar_account,
    fetch_market_opportunities,
)
from .services.ai_service import generate_portfolio_insight

app = FastAPI(title="PortfoIA Quant API", version="1.1")

# Habilitar CORS para Vercel y entorno local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/assets")
async def get_assets():
    assets = await fetch_live_prices()
    return {"status": "success", "data": assets}

@app.get("/api/ai-insights")
async def get_ai_insights():
    assets = await fetch_live_prices()
    insights = await generate_portfolio_insight(assets)
    return {"status": "success", "data": insights}

@app.get("/api/stellar")
async def get_stellar_account():
    account = await fetch_stellar_account()
    return {"status": "success", "data": account}

@app.get("/api/market-opportunities")
async def get_market_opportunities():
    opportunities = await fetch_market_opportunities()
    return {"status": "success", "data": opportunities}