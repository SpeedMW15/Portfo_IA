from pydantic import BaseModel


class Asset(BaseModel):
    id: int
    symbol: str
    name: str
    category: str
    platform: str
    amount: str
    price: str
    value: float
    change: str
    trend: str
    allocation: float
    sparkline: str


class AssetAction(BaseModel):
    symbol: str
    action: str  # "buy" | "sell" | "hold"
    confidence: int
    reason: str


class PortfolioInsight(BaseModel):
    health_score: int
    recommendation: str
    diversification_tip: str
    actions: list[AssetAction]
    total_managed: float
