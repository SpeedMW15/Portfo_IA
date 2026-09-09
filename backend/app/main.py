from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .services.exchange_service import fetch_live_prices, fetch_stellar_account
from .services.ai_service import generate_portfolio_insight

app = FastAPI(title="PortfoIA Quant API", version="1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
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
