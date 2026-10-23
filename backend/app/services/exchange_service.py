import asyncio
import httpx

from ..config import settings


async def fetch_live_prices():
    """
    Consulta precios en tiempo real para el portafolio principal.
    Garantiza consistencia matemática entre Precio Unitario, Cantidad y Valor Total.
    """
    btc_amount = 0.005
    xlm_amount = 1500.00
    fmty_amount = 150.00
    aapl_amount = 12.00

    # Si hay una cuenta de Stellar configurada, sincronizar balance dinámico de XLM
    if settings.STELLAR_PUBLIC_KEY:
        try:
            stellar_data = await fetch_stellar_account()
            if stellar_data.get("configured") and "xlm_balance" in stellar_data:
                xlm_amount = float(stellar_data["xlm_balance"])
        except Exception as e:
            print(f"Aviso: no se pudo obtener balance dinámico de Stellar: {e}")

    # Precios base de referencia (MXN)
    btc_price_mxn = 1184000.0
    xlm_price_mxn = 3.29
    fmty_price_mxn = 23.0
    aapl_price_mxn = 3450.0

    btc_change = "+2.10%"
    xlm_change = "+0.52%"
    fmty_change = "+1.18%"
    aapl_change = "+0.64%"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        url = (
            "https://api.coingecko.com/api/v3/simple/price"
            "?ids=bitcoin,stellar&vs_currencies=mxn&include_24hr_change=true"
        )
        async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()

                if "bitcoin" in data:
                    btc_price_mxn = float(data["bitcoin"].get("mxn", btc_price_mxn))
                    chg_btc = float(data["bitcoin"].get("mxn_24h_change", 2.10))
                    btc_change = f"{'+' if chg_btc >= 0 else ''}{chg_btc:.2f}%"

                if "stellar" in data:
                    xlm_price_mxn = float(data["stellar"].get("mxn", xlm_price_mxn))
                    chg_xlm = float(data["stellar"].get("mxn_24h_change", 0.52))
                    xlm_change = f"{'+' if chg_xlm >= 0 else ''}{chg_xlm:.2f}%"
    except Exception as e:
        print(f"Aviso: usando valores de respaldo para cripto por error de red: {e}")

    # Cálculos estrictos: Valor = Precio * Cantidad
    btc_value = round(btc_price_mxn * btc_amount, 2)
    fmty_value = round(fmty_price_mxn * fmty_amount, 2)
    xlm_value = round(xlm_price_mxn * xlm_amount, 2)
    aapl_value = round(aapl_price_mxn * aapl_amount, 2)

    total_val = btc_value + fmty_value + xlm_value + aapl_value

    def alloc(value):
        return round((value / total_val) * 100, 1) if total_val > 0 else 0

    return [
        {
            "id": 1,
            "symbol": "BTC",
            "name": "Bitcoin",
            "category": "CRYPTO",
            "platform": "Binance",
            "amount": f"{btc_amount:.4f}",
            "price": f"${btc_price_mxn:,.2f} MXN",
            "value": btc_value,
            "change": btc_change,
            "trend": "up" if not btc_change.startswith("-") else "down",
            "allocation": alloc(btc_value),
            "sparkline": "M0,25 Q15,18 30,22 T60,10 T90,5",
        },
        {
            "id": 2,
            "symbol": "FMTY14",
            "name": "Fibra Monterrey",
            "category": "FIBRA",
            "platform": "GBM",
            "amount": f"{fmty_amount:.2f}",
            "price": f"${fmty_price_mxn:,.2f} MXN",
            "value": fmty_value,
            "change": fmty_change,
            "trend": "up",
            "allocation": alloc(fmty_value),
            "sparkline": "M0,20 Q15,22 30,15 T60,12 T90,8",
        },
        {
            "id": 3,
            "symbol": "XLM",
            "name": "Stellar Lumens",
            "category": "CRYPTO",
            "platform": "Red Stellar",
            "amount": f"{xlm_amount:,.2f}",
            "price": f"${xlm_price_mxn:,.2f} MXN",
            "value": xlm_value,
            "change": xlm_change,
            "trend": "up" if not xlm_change.startswith("-") else "down",
            "allocation": alloc(xlm_value),
            "sparkline": "M0,8 Q15,12 30,20 T60,18 T90,28",
        },
        {
            "id": 4,
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "category": "ACCIÓN",
            "platform": "Interactive Brokers",
            "amount": f"{aapl_amount:.2f}",
            "price": f"${aapl_price_mxn:,.2f} MXN",
            "value": aapl_value,
            "change": aapl_change,
            "trend": "up" if not aapl_change.startswith("-") else "down",
            "allocation": alloc(aapl_value),
            "sparkline": "M0,18 Q15,14 30,18 T60,10 T90,6",
        },
    ]


async def fetch_stellar_account():
    if not settings.STELLAR_PUBLIC_KEY:
        return {
            "configured": False,
            "network": settings.STELLAR_NETWORK,
            "message": "Agrega STELLAR_PUBLIC_KEY en backend/.env para conectar tu cuenta.",
        }

    try:
        from stellar_sdk import Server

        def _load_account():
            server = Server(horizon_url=settings.STELLAR_HORIZON_URL)
            return server.accounts().account_id(settings.STELLAR_PUBLIC_KEY).call()

        account = await asyncio.to_thread(_load_account)

        native_balance = "0"
        other_assets = []
        for b in account.get("balances", []):
            if b.get("asset_type") == "native":
                native_balance = b.get("balance", "0")
            else:
                other_assets.append(
                    {
                        "asset_code": b.get("asset_code", "?"),
                        "balance": b.get("balance", "0"),
                        "issuer": b.get("asset_issuer", ""),
                    }
                )

        return {
            "configured": True,
            "network": settings.STELLAR_NETWORK,
            "public_key": settings.STELLAR_PUBLIC_KEY,
            "xlm_balance": native_balance,
            "other_assets": other_assets,
            "sequence": account.get("sequence"),
        }
    except Exception as e:
        return {
            "configured": False,
            "network": settings.STELLAR_NETWORK,
            "message": f"No se pudo conectar con Horizon: {e}",
        }


async def fetch_market_opportunities():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    opportunities = [
        {
            "id": "solana",
            "symbol": "SOL",
            "name": "Solana",
            "category": "Cripto / L1",
            "price_mxn": 3250.0,
            "change_24h": "+6.4%",
            "trend": "up",
            "volume_24h": "$4.2B MXN",
            "market_cap": "$1.4T MXN",
            "high_24h": 3320.0,
            "low_24h": 3010.0,
            "ai_score": "Alcista (88%)",
            "history": [
                {"time": "00:00", "price": 3020},
                {"time": "04:00", "price": 3080},
                {"time": "08:00", "price": 3150},
                {"time": "12:00", "price": 3210},
                {"time": "16:00", "price": 3190},
                {"time": "20:00", "price": 3250},
            ],
        },
        {
            "id": "stellar",
            "symbol": "XLM",
            "name": "Stellar Lumens",
            "category": "DeFi / Soroban",
            "price_mxn": 3.29,
            "change_24h": "+0.52%",
            "trend": "up",
            "volume_24h": "$180M MXN",
            "market_cap": "$98B MXN",
            "high_24h": 3.38,
            "low_24h": 3.22,
            "ai_score": "Fuerte Compra (92%)",
            "history": [
                {"time": "00:00", "price": 3.24},
                {"time": "04:00", "price": 3.27},
                {"time": "08:00", "price": 3.31},
                {"time": "12:00", "price": 3.35},
                {"time": "16:00", "price": 3.28},
                {"time": "20:00", "price": 3.29},
            ],
        },
        {
            "id": "nvidia",
            "symbol": "NVDA",
            "name": "NVIDIA Corp.",
            "category": "Acciones / Tech",
            "price_mxn": 2480.0,
            "change_24h": "+3.15%",
            "trend": "up",
            "volume_24h": "$12.5B MXN",
            "market_cap": "$3.2T USD",
            "high_24h": 2510.0,
            "low_24h": 2410.0,
            "ai_score": "Alcista (85%)",
            "history": [
                {"time": "00:00", "price": 2410},
                {"time": "04:00", "price": 2430},
                {"time": "08:00", "price": 2465},
                {"time": "12:00", "price": 2490},
                {"time": "16:00", "price": 2470},
                {"time": "20:00", "price": 2480},
            ],
        },
        {
            "id": "voo",
            "symbol": "VOO",
            "name": "Vanguard S&P 500 ETF",
            "category": "ETFs",
            "price_mxn": 9850.0,
            "change_24h": "+0.85%",
            "trend": "up",
            "volume_24h": "$8.1B MXN",
            "market_cap": "$1.1T USD",
            "high_24h": 9890.0,
            "low_24h": 9780.0,
            "ai_score": "Acumular (94%)",
            "history": [
                {"time": "00:00", "price": 9780},
                {"time": "04:00", "price": 9800},
                {"time": "08:00", "price": 9820},
                {"time": "12:00", "price": 9870},
                {"time": "16:00", "price": 9840},
                {"time": "20:00", "price": 9850},
            ],
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
            resp = await client.get(
                "https://api.coingecko.com/api/v3/simple/price?ids=solana,stellar&vs_currencies=mxn&include_24hr_change=true"
            )
            if resp.status_code == 200:
                cg_data = resp.json()
                for opp in opportunities:
                    if opp["id"] in cg_data:
                        price = float(cg_data[opp["id"]].get("mxn", opp["price_mxn"]))
                        chg = float(cg_data[opp["id"]].get("mxn_24h_change", 0.0))
                        opp["price_mxn"] = price
                        opp["change_24h"] = f"{'+' if chg >= 0 else ''}{chg:.2f}%"
                        opp["trend"] = "up" if chg >= 0 else "down"
    except Exception as e:
        print(f"Aviso: usando valores de respaldo de oportunidades: {e}")

    return opportunities