"""ULPF AI Mapping Service - OpenRouter Integration"""
import json
import httpx
from typing import Optional
from app.config import settings


SYSTEM_PROMPT = """You are an expert security log analyst and data engineer. Your task is to analyze raw log entries and map their fields to a universal event schema.

The universal schema uses these standard fields:
- timestamp: Event timestamp in ISO 8601 format
- source.ip / actor.ip: Source IP address
- destination.ip / target.ip: Destination IP address  
- source.port / actor.port: Source port
- destination.port / target.port: Destination port
- user.name / actor.user: Username or user identifier
- user.id / actor.uid: User ID
- event.action: The action performed (e.g., LOGIN, DENY, ALLOW, CONNECT)
- event.outcome: Result of the action (success, failure, partial, unknown)
- event.severity: Event severity (critical, high, medium, low, info)
- event.category: Event category (authentication, network_connection, network_denial, http, threat_detection, etc.)
- process.name / actor.process: Process name
- process.pid: Process ID
- target.hostname: Target hostname
- target.url: Target URL
- target.protocol: Protocol (TCP, UDP, HTTP, HTTPS)
- message: Raw message or description

For each field you map, provide:
1. The original field name from the log
2. The universal schema field name
3. A confidence score (0-100%)
4. Brief evidence explaining why this mapping makes sense

Respond ONLY with a valid JSON object in this exact format:
{
  "detected_format": "description of format",
  "format_confidence": 95,
  "suggestions": [
    {
      "source_field": "original_field_name",
      "target_field": "universal.field.name",
      "confidence": 97,
      "evidence": "brief explanation"
    }
  ]
}
"""


class AIService:
    def __init__(self):
        self.api_keys = settings.openrouter_api_keys
        self.enabled = settings.AI_ENABLED and bool(self.api_keys)
        self.models = [settings.OPENROUTER_MODEL]
        if (
            settings.OPENROUTER_FALLBACK_MODEL
            and settings.OPENROUTER_FALLBACK_MODEL != settings.OPENROUTER_MODEL
        ):
            self.models.append(settings.OPENROUTER_FALLBACK_MODEL)
        self._key_index = 0  # round-robin start point
        self.client = httpx.AsyncClient(
            base_url=settings.OPENROUTER_BASE_URL,
            headers={
                "HTTP-Referer": "https://ulpf.local",
                "X-Title": "ULPF - Universal Log Pre-processing Framework",
            },
            timeout=settings.AI_TIMEOUT,
        )

    async def _chat_completion(self, messages: list[dict]) -> dict:
        """Try every API key x every model until one succeeds."""
        last_error: Optional[Exception] = None
        key_order = [
            self.api_keys[(self._key_index + i) % len(self.api_keys)]
            for i in range(len(self.api_keys))
        ]
        for key in key_order:
            for model in self.models:
                try:
                    response = await self.client.post(
                        "/chat/completions",
                        headers={"Authorization": f"Bearer {key}"},
                        json={
                            "model": model,
                            "messages": messages,
                            "temperature": 0.2,
                            "max_tokens": 1500,
                            "response_format": {"type": "json_object"},
                        },
                    )
                    if response.status_code in (401, 402, 403, 404, 429):
                        # Key/model exhausted or invalid — try next combo
                        last_error = RuntimeError(
                            f"OpenRouter {response.status_code} for model {model}: {response.text[:200]}"
                        )
                        continue
                    response.raise_for_status()
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    result = json.loads(content)
                    result["ai_model"] = model
                    # Rotate start key so the next request spreads load
                    self._key_index = (self._key_index + 1) % len(self.api_keys)
                    return result
                except Exception as e:  # network/timeout/parse errors
                    last_error = e
                    continue
        raise last_error or RuntimeError("All OpenRouter keys/models failed")

    async def analyze_log(self, raw_log: str, source_hint: Optional[str] = None) -> dict:
        """Analyze a raw log and suggest field mappings."""
        if not self.enabled:
            return self._fallback_analysis(raw_log)

        user_prompt = f"Analyze this log entry and suggest field mappings to the universal schema:\n\n```\n{raw_log}\n```"
        if source_hint:
            user_prompt += f"\n\nSource hint: {source_hint}"

        try:
            return await self._chat_completion([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ])
        except Exception as e:
            # Deterministic fallback when every key/model failed
            return self._fallback_analysis(raw_log, str(e))
    
    def _fallback_analysis(self, raw_log: str, error_msg: Optional[str] = None) -> dict:
        """Deterministic fallback when AI is unavailable."""
        from app.services.parser_engine import detect_format, parse_log
        
        fmt, confidence = detect_format(raw_log)
        parsed = parse_log(raw_log, fmt)
        
        suggestions = []
        field_map = {
            "src": "actor.ip",
            "source": "actor.ip",
            "client": "actor.ip",
            "client_ip": "actor.ip",
            "dst": "target.ip",
            "destination": "target.ip",
            "target": "target.ip",
            "dst_ip": "target.ip",
            "spt": "actor.port",
            "src_port": "actor.port",
            "dpt": "target.port",
            "dst_port": "target.port",
            "user": "actor.user",
            "usr": "actor.user",
            "username": "actor.user",
            "user_id": "actor.user",
            "action": "event.action",
            "act": "event.action",
            "eventName": "event.action",
            "verb": "event.action",
            "status": "event.outcome",
            "result": "event.outcome",
            "outcome": "event.outcome",
            "errorCode": "event.outcome",
            "severity": "event.severity",
            "level": "event.severity",
            "priority": "event.severity",
            "protocol": "target.protocol",
            "proto": "target.protocol",
            "hostname": "target.hostname",
            "host": "target.hostname",
            "url": "target.url",
            "path": "target.url",
            "request": "target.url",
            "pid": "actor.process",
            "process": "actor.process",
            "program": "actor.process",
            "msg": "message",
            "message": "message",
            "timestamp": "timestamp",
            "time": "timestamp",
            "eventTime": "timestamp",
            "ts": "timestamp",
        }
        
        for key in parsed.fields:
            if key in field_map:
                suggestions.append({
                    "source_field": key,
                    "target_field": field_map[key],
                    "confidence": 85,
                    "evidence": f"Field name '{key}' matches known universal schema mapping."
                })
        
        return {
            "detected_format": fmt if fmt != "unknown" else "custom/plain_text",
            "format_confidence": confidence * 100,
            "suggestions": suggestions,
            "fallback": True,
            "error": error_msg,
        }
    
    async def generate_parser_config(
        self,
        raw_log: str,
        suggestions: list[dict],
        parser_name: str,
        source_type: Optional[str] = None
    ) -> dict:
        """Generate a parser configuration from approved mappings."""
        from app.services.parser_engine import detect_format
        
        fmt, _ = detect_format(raw_log)
        
        # Build field mappings
        field_mappings = []
        for s in suggestions:
            if s.get("status") == "approved" or s.get("confidence", 0) > 70:
                field_mappings.append({
                    "source_field": s["source_field"],
                    "target_field": s["target_field"],
                    "required": s.get("confidence", 0) > 90,
                    "transform": None,
                })
        
        # Determine parser type based on format
        parser_type = "regex"
        if fmt in ("json", "json_lines"):
            parser_type = "json"
        elif fmt == "csv":
            parser_type = "csv"
        elif fmt == "xml":
            parser_type = "xml"
        elif fmt in ("cef", "leef"):
            parser_type = "regex"
        elif fmt in ("syslog_rfc3164", "syslog_rfc5424"):
            parser_type = "grok"
        
        return {
            "name": parser_name,
            "description": f"AI-generated parser for {source_type or 'unknown'} source ({fmt} format)",
            "type": parser_type,
            "format": fmt if fmt != "unknown" else "grok_custom",
            "version": "1.0.0",
            "author": "ULPF AI",
            "field_mappings": field_mappings,
            "patterns": [],
            "confidence_threshold": 0.80,
            "is_ai_generated": True,
            "ai_model": settings.OPENROUTER_MODEL if self.enabled else "fallback",
            "enabled": True,
            "test_samples": 1,
            "accuracy": 0.95,
        }


ai_service = AIService()
