"""Backend tests for ULPF parser engine and API"""
import pytest
from app.services.parser_engine import detect_format, parse_log, PARSERS
from app.services.ai_service import AIService


class TestParserEngine:
    def test_detect_json(self):
        fmt, conf = detect_format('{"src_ip": "10.0.0.1"}')
        assert fmt == "json"
        assert conf > 0.9

    def test_detect_cef(self):
        fmt, conf = detect_format('CEF:0|Vendor|Product|1.0|100|Login|5|src=10.0.0.1')
        assert fmt == "cef"
        assert conf > 0.9

    def test_detect_syslog(self):
        fmt, conf = detect_format('<134>Aug 27 17:14:32 firewall01 src=10.0.0.5')
        assert fmt == "syslog_rfc3164"
        assert conf > 0.8

    def test_detect_leef(self):
        fmt, conf = detect_format('LEEF:1.0|IBM|QRadar|7.3|CustomEvent|src=10.0.0.1')
        assert fmt == "leef"
        assert conf > 0.9

    def test_parse_json(self):
        result = parse_log('{"src_ip": "10.0.0.1", "action": "ALLOW"}', "json")
        assert result.confidence > 0.9
        assert "src_ip" in result.fields

    def test_parse_cef(self):
        result = parse_log('CEF:0|Vendor|Product|1.0|100|Login|5|src=10.0.0.1 dst=10.0.0.2', "cef")
        assert result.confidence > 0.9
        assert "src" in result.fields

    def test_parse_key_value(self):
        result = parse_log('USER=admin SRC=10.0.0.1 ACTION=LOGIN', "grok_custom")
        assert len(result.fields) >= 2
        assert result.confidence > 0.5


class TestAIService:
    @pytest.mark.asyncio
    async def test_fallback_analysis(self, monkeypatch):
        monkeypatch.setattr("app.services.ai_service.settings.AI_ENABLED", False)
        ai = AIService()
        result = await ai.analyze_log('{"src": "10.0.0.1", "dst": "10.0.0.2", "user": "admin"}')
        assert "suggestions" in result
        assert len(result["suggestions"]) > 0
