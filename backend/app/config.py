import os
from dotenv import load_dotenv

load_dotenv()


def _default_horizon_url(network: str) -> str:
    """Horizon público de Stellar según la red configurada."""
    return (
        "https://horizon-testnet.stellar.org"
        if network == "testnet"
        else "https://horizon.stellar.org"
    )


class Settings:
    """
    Configuración central de PortfoIA.
    Todos los valores sensibles viven en variables de entorno
    (ver backend/.env.example) y nunca se escriben en el código.
    """

    # --- IA (Groq) ---
    # Usado por app/services/ai_service.py para generar el análisis de
    # diversificación y las señales de compra/venta por activo.
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # --- Stellar ---
    # STELLAR_PUBLIC_KEY es la clave pública (G...) de la cuenta a consultar.
    # Nunca se debe configurar aquí una clave secreta (S...): solo lectura.
    STELLAR_NETWORK: str = os.getenv("STELLAR_NETWORK", "testnet")  # testnet | mainnet
    STELLAR_PUBLIC_KEY: str = os.getenv("STELLAR_PUBLIC_KEY", "")
    STELLAR_HORIZON_URL: str = os.getenv(
        "STELLAR_HORIZON_URL", _default_horizon_url(STELLAR_NETWORK)
    )


settings = Settings()
