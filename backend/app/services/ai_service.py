import asyncio
import json

from ..config import settings

try:
    from groq import Groq

    _client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
except ImportError:
    _client = None

FALLBACK_RECOMMENDATION = (
    "Tu portafolio mantiene una alta concentración en criptoactivos. "
    "Considera incrementar la posición en instrumentos de renta fija o FIBRAs "
    "para mayor estabilidad a largo plazo."
)


def _fallback_insight(assets: list, reason: str = ""):
    """
    Análisis de respaldo determinista: se usa si no hay GROQ_API_KEY
    configurada o si la llamada al modelo falla, para que la app nunca se
    caiga por un problema de red o de cuota con el proveedor de IA.
    """
    total_value = sum(a["value"] for a in assets)
    actions = [
        {
            "symbol": a["symbol"],
            "action": "hold",
            "confidence": 50,
            "reason": "Análisis de respaldo (sin conexión con el modelo de IA).",
        }
        for a in assets
    ]
    return {
        "health_score": 78,
        "recommendation": FALLBACK_RECOMMENDATION,
        "diversification_tip": reason
        or "Configura GROQ_API_KEY en backend/.env para recibir análisis en tiempo real.",
        "actions": actions,
        "total_managed": total_value,
    }


async def generate_portfolio_insight(assets: list):
    """
    Genera un análisis de diversificación y una señal de compra/venta/mantener
    por cada activo, usando un modelo de Groq. Devuelve JSON estructurado para
    que el frontend pueda pintar badges por activo sin parseo adicional.
    """
    if _client is None:
        return _fallback_insight(assets)

    total_value = sum(a["value"] for a in assets)
    portfolio_summary = "\n".join(
        f"- {a['symbol']} ({a['name']}, {a['category']}, plataforma {a['platform']}): "
        f"valor ${a['value']:.2f} MXN, asignación {a['allocation']}%, cambio 24h {a['change']}"
        for a in assets
    )

    prompt = f"""Eres un asesor cuantitativo de banca privada. Analiza este portafolio y \
responde EXCLUSIVAMENTE con un JSON válido (sin texto adicional, sin markdown, sin \
comentarios) con esta forma exacta:

{{
  "health_score": <entero 0-100>,
  "recommendation": "<1-2 frases sobre diversificación general>",
  "diversification_tip": "<1 frase con una acción concreta>",
  "actions": [
    {{"symbol": "<símbolo>", "action": "buy|sell|hold", "confidence": <0-100>, "reason": "<máx 20 palabras>"}}
  ]
}}

Incluye una entrada en "actions" por cada activo listado abajo, usando exactamente su símbolo.

Portafolio (valor total ${total_value:.2f} MXN):
{portfolio_summary}
"""

    try:
        completion = await asyncio.to_thread(
            _client.chat.completions.create,
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=700,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content
        parsed = json.loads(raw)
        parsed["total_managed"] = total_value
        return parsed
    except Exception as e:
        print(f"Aviso: usando análisis de respaldo por error del modelo de IA: {e}")
        return _fallback_insight(assets, reason=f"Respaldo activado: {e}")
