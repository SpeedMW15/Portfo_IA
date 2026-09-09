import asyncio
import httpx

from ..config import settings


async def fetch_live_prices():
    """
    Agrega posiciones de distintas 'plataformas' (exchange de cripto, casa de
    bolsa, etc.) en un solo portafolio. Los precios de BTC y XLM se consultan
    en vivo en CoinGecko; AAPL se consulta en vivo en Stooq (ambas son APIs
    públicas y gratuitas, sin API key). FMTY14 queda como valor de referencia
    mientras se conecta un bróker real (GBM, Actinver, etc.) — el campo
    "platform" en cada activo es justo el punto de enganche para eso: cuando
    conectes un bróker real, basta con reemplazar su bloque por una llamada
    a esa API y mantener la misma forma de diccionario.
    """
    # Valores base por defecto en caso de que falle la red
    btc_amount = 0.0500
    xlm_amount = 1200.00
    fmty_amount = 150.00
    aapl_amount = 12.00

    btc_price_mxn = 1084000.0
    xlm_price_mxn = 4.0
    fmty_price_mxn = 23.0
    aapl_price_mxn = 3450.0

    btc_change = "+5.42%"
    xlm_change = "-0.85%"
    fmty_change = "+1.18%"
    aapl_change = "+0.64%"

    # --- Cripto: CoinGecko (real, sin API key) ---
    try:
        url = (
            "https://api.coingecko.com/api/v3/simple/price"
            "?ids=bitcoin,stellar&vs_currencies=mxn&include_24hr_change=true"
        )
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()

                if "bitcoin" in data:
                    btc_price_mxn = data["bitcoin"].get("mxn", btc_price_mxn)
                    chg_btc = data["bitcoin"].get("mxn_24h_change", 5.42)
                    btc_change = f"{'+' if chg_btc >= 0 else ''}{chg_btc:.2f}%"

                if "stellar" in data:
                    xlm_price_mxn = data["stellar"].get("mxn", xlm_price_mxn)
                    chg_xlm = data["stellar"].get("mxn_24h_change", -0.85)
                    xlm_change = f"{'+' if chg_xlm >= 0 else ''}{chg_xlm:.2f}%"
    except Exception as e:
        print(f"Aviso: usando valores de respaldo para cripto por error de red: {e}")

    # --- Acciones (US equity): Stooq (real, sin API key) ---
    try:
        stock_url = "https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv"
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(stock_url)
            if response.status_code == 200:
                lines = response.text.strip().splitlines()
                if len(lines) >= 2:
                    header = lines[0].split(",")
                    row = lines[1].split(",")
                    record = dict(zip(header, row))
                    close = record.get("Close")
                    open_price = record.get("Open")
                    if close and close != "N/D":
                        # Stooq regresa el precio en USD; se aproxima a MXN
                        # con un tipo de cambio de referencia. Sustituye esto
                        # por tu fuente de FX real si necesitas precisión.
                        usd_mxn_ref = 18.5
                        aapl_price_mxn = float(close) * usd_mxn_ref
                        if open_price and open_price != "N/D" and float(open_price) > 0:
                            pct = (float(close) - float(open_price)) / float(open_price) * 100
                            aapl_change = f"{'+' if pct >= 0 else ''}{pct:.2f}%"
    except Exception as e:
        print(f"Aviso: usando valores de respaldo para acciones por error de red: {e}")

    # Calculamos valuaciones totales
    btc_value = btc_price_mxn * btc_amount
    fmty_value = fmty_price_mxn * fmty_amount
    xlm_value = xlm_price_mxn * xlm_amount
    aapl_value = aapl_price_mxn * aapl_amount

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
            "price": f"${btc_price_mxn:,.2f}",
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
            "price": f"${fmty_price_mxn:,.2f}",
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
            "platform": "Billetera Stellar",
            "amount": f"{xlm_amount:.2f}",
            "price": f"${xlm_price_mxn:,.2f}",
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
            "price": f"${aapl_price_mxn:,.2f}",
            "value": aapl_value,
            "change": aapl_change,
            "trend": "up" if not aapl_change.startswith("-") else "down",
            "allocation": alloc(aapl_value),
            "sparkline": "M0,18 Q15,14 30,18 T60,10 T90,6",
        },
    ]


async def fetch_stellar_account():
    """
    Consulta el estado real de una cuenta de Stellar vía Horizon (testnet o
    mainnet según STELLAR_NETWORK). Solo lectura: nunca maneja claves
    secretas. Requiere STELLAR_PUBLIC_KEY en backend/.env y el paquete
    'stellar-sdk' instalado (pip install stellar-sdk).
    """
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
    except ImportError:
        return {
            "configured": False,
            "network": settings.STELLAR_NETWORK,
            "message": "Instala 'stellar-sdk' (pip install stellar-sdk) para activar la conexión.",
        }
    except Exception as e:
        return {
            "configured": False,
            "network": settings.STELLAR_NETWORK,
            "message": f"No se pudo conectar con Horizon: {e}",
        }
