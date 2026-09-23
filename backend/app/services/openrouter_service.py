import json
import httpx
import re
from typing import Dict, Any, Optional
from app.config import settings
from app.utils.recommendation import generate_rule_based_recommendation
from app.utils.logger import get_logger

logger = get_logger("openrouter_service")

SYSTEM_PROMPT = """You are an elite civil and municipal transportation engineering AI assistant specializing in pavement management systems (PMS) and roadway maintenance prioritization.
Analyze the provided road defect data and produce a structured pavement maintenance evaluation.
Return ONLY valid JSON with exactly the following schema:
{
  "explanation": "Clear civil-engineering rationale for why this defect warrants this severity level",
  "risk_factors": [
    "Specific factor 1 (e.g., impact on vehicular steering and hydroplaning risk)",
    "Specific factor 2 (e.g., moisture intrusion into asphalt sub-base)"
  ],
  "maintenance_recommendation": "Specific professional pavement engineering intervention and materials",
  "urgency": "Immediate | Within 48 Hours | Within 7 Days | Scheduled Maintenance",
  "inspection_checklist": [
    "Step 1 to physically measure or verify",
    "Step 2 safety or traffic control measure",
    "Step 3 post-repair signoff requirement"
  ]
}
Do NOT wrap your output in markdown backticks or commentary. Return raw valid JSON only.
"""

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """Attempts to clean and parse JSON even if surrounded by markdown fences."""
    text = text.strip()
    # Strip markdown ```json ... ```
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict) and "explanation" in data and "maintenance_recommendation" in data:
            return data
    except Exception:
        # Try finding substring between { and }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                data = json.loads(text[start : end + 1])
                if isinstance(data, dict):
                    return data
            except Exception:
                pass
    return None

async def get_ai_recommendation(
    defect_type: str,
    severity: str,
    risk_score: float,
    confidence: float,
    road_importance: str = "Medium",
    defect_frequency: int = 1,
    has_water: bool = False,
    historical_trend: str = "Stable",
    location_context: str = "Urban municipal roadway"
) -> Dict[str, Any]:
    """
    Calls OpenRouter API to obtain structured pavement intelligence.
    If OpenRouter is unavailable, timed out, has invalid key, or fails,
    automatically falls back to generate_rule_based_recommendation.
    """
    api_key = settings.OPENROUTER_API_KEY.strip() if settings.OPENROUTER_API_KEY else ""

    # If no API key configured, use transparent rule-based fallback immediately
    if not api_key:
        logger.info("OPENROUTER_API_KEY not configured. Utilizing expert rule-based recommendation fallback.")
        return generate_rule_based_recommendation(
            defect_type=defect_type,
            severity=severity,
            risk_score=risk_score,
            confidence=confidence,
            road_importance=road_importance,
            defect_frequency=defect_frequency,
            has_water=has_water,
        )

    user_prompt = f"""Road Defect Telemetry:
- Defect Type: {defect_type}
- Assigned Severity: {severity}
- Project Risk Score: {risk_score}/100
- AI Confidence: {confidence*100:.1f}%
- Corridor Classification: {road_importance}
- Cluster Frequency: {defect_frequency} defects observed in vicinity
- Standing Water Accumulation: {'Yes' if has_water else 'No'}
- Historical Trend: {historical_trend}
- Location Context: {location_context}

Provide a certified municipal maintenance dossier response matching the specified JSON schema.
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://road-intelligence.gov.local",
        "X-Title": "AI Road Condition Intelligence System",
    }

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 1000,
    }

    # Attempt up to 2 tries with timeout
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    res_json = response.json()
                    content = res_json["choices"][0]["message"]["content"]
                    parsed = extract_json_from_text(content)
                    if parsed:
                        # Ensure fields exist
                        return {
                            "source": "OpenRouter",
                            "explanation": str(parsed.get("explanation", "")),
                            "risk_factors": list(parsed.get("risk_factors", [])),
                            "maintenance_recommendation": str(parsed.get("maintenance_recommendation", "")),
                            "urgency": str(parsed.get("urgency", "Within 7 Days")),
                            "inspection_checklist": list(parsed.get("inspection_checklist", [])),
                            "disclaimer": "AI-generated recommendation grounded in civil engineering principles; subject to physical verification by a licensed municipal engineer."
                        }
                    else:
                        logger.warning(f"Failed to parse structured JSON from OpenRouter response on attempt {attempt+1}")
                else:
                    logger.warning(f"OpenRouter API returned HTTP {response.status_code}: {response.text[:200]}")
        except httpx.TimeoutException:
            logger.warning(f"OpenRouter API call timed out on attempt {attempt+1}")
        except Exception as exc:
            logger.warning(f"OpenRouter API error on attempt {attempt+1}: {str(exc)}")

    # If OpenRouter failed after retries, fall back gracefully to rule-based engine
    logger.info("OpenRouter service unreachable or invalid response; falling back to rule-based expert recommendation.")
    fallback = generate_rule_based_recommendation(
        defect_type=defect_type,
        severity=severity,
        risk_score=risk_score,
        confidence=confidence,
        road_importance=road_importance,
        defect_frequency=defect_frequency,
        has_water=has_water,
    )
    fallback["source"] = "Rule-Based Fallback (OpenRouter Offline/Unavailable)"
    return fallback
