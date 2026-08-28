"""ULPF Plugin-Based Parser Engine"""
import re
import json
import csv
import xml.etree.ElementTree as ET
from io import StringIO
from typing import Any, Optional
from datetime import datetime


class ParseResult:
    def __init__(self):
        self.fields: dict[str, Any] = {}
        self.format_detected: str = "unknown"
        self.confidence: float = 0.0
        self.errors: list[str] = []
        self.warnings: list[str] = []


class BaseParser:
    name: str = "base"
    format: str = "unknown"
    
    def parse(self, raw_log: str) -> ParseResult:
        raise NotImplementedError


class SyslogRFC3164Parser(BaseParser):
    name = "syslog_rfc3164"
    format = "syslog_rfc3164"
    
    PATTERN = re.compile(
        r"^(?P<priority><\d+>)?"
        r"(?P<timestamp>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+"
        r"(?P<hostname>\S+)\s+"
        r"(?P<message>.*)$"
    )
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        match = self.PATTERN.match(raw_log.strip())
        if match:
            result.fields = match.groupdict()
            result.confidence = 0.95
            # Try to extract key=value pairs from message
            kv = self._extract_kv(result.fields.get("message", ""))
            result.fields.update(kv)
        else:
            result.errors.append("Failed to match RFC 3164 syslog pattern")
            result.confidence = 0.1
        return result
    
    def _extract_kv(self, text: str) -> dict:
        result = {}
        for match in re.finditer(r'(\w+)=([^\s]+)', text):
            result[match.group(1)] = match.group(2)
        return result


class SyslogRFC5424Parser(BaseParser):
    name = "syslog_rfc5424"
    format = "syslog_rfc5424"
    
    PATTERN = re.compile(
        r"^(?P<priority><\d+>)"
        r"(?P<version>\d+)\s+"
        r"(?P<timestamp>\S+)\s+"
        r"(?P<hostname>\S+)\s+"
        r"(?P<app_name>\S+)\s+"
        r"(?P<proc_id>\S+)\s+"
        r"(?P<msg_id>\S+)\s*"
        r"(?P<structured_data>(?:-\s*|\[.*?\]\s*)+)"
        r"(?P<message>.*)$"
    )
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        match = self.PATTERN.match(raw_log.strip())
        if match:
            result.fields = match.groupdict()
            result.confidence = 0.95
            kv = self._extract_kv(result.fields.get("message", ""))
            result.fields.update(kv)
        else:
            # Fallback to RFC 3164
            result.warnings.append("RFC 5424 match failed, falling back to RFC 3164 style")
            result.confidence = 0.4
        return result
    
    def _extract_kv(self, text: str) -> dict:
        result = {}
        for match in re.finditer(r'(\w+)=([^\s]+)', text):
            result[match.group(1)] = match.group(2)
        return result


class JSONParser(BaseParser):
    name = "json"
    format = "json"
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        try:
            data = json.loads(raw_log.strip())
            if isinstance(data, dict):
                result.fields = self._flatten(data)
                result.confidence = 0.99
            else:
                result.errors.append("JSON is not an object")
                result.confidence = 0.3
        except json.JSONDecodeError as e:
            result.errors.append(f"JSON decode error: {e}")
            result.confidence = 0.0
        return result
    
    def _flatten(self, d: dict, parent_key: str = "", sep: str = ".") -> dict:
        items = {}
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.update(self._flatten(v, new_key, sep))
            else:
                items[new_key] = v
        return items


class JSONLinesParser(JSONParser):
    name = "json_lines"
    format = "json_lines"
    
    def parse(self, raw_log: str) -> ParseResult:
        # Try first line if multiple
        first_line = raw_log.strip().split("\n")[0]
        return super().parse(first_line)


class CEFParser(BaseParser):
    name = "cef"
    format = "cef"
    
    HEADER_PATTERN = re.compile(
        r"^CEF:(?P<version>\d+)\|"
        r"(?P<device_vendor>[^|]+)\|"
        r"(?P<device_product>[^|]+)\|"
        r"(?P<device_version>[^|]+)\|"
        r"(?P<signature_id>[^|]+)\|"
        r"(?P<name>[^|]+)\|"
        r"(?P<severity>[^|]+)\|"
        r"(?P<extension>.*)$"
    )
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        match = self.HEADER_PATTERN.match(raw_log.strip())
        if match:
            result.fields = match.groupdict()
            result.confidence = 0.98
            # Parse CEF extension fields (key=value pairs)
            ext = result.fields.get("extension", "")
            for kv_match in re.finditer(r'(\w+)=([^=]+)(?=\s+\w+=|$)', ext):
                result.fields[kv_match.group(1)] = kv_match.group(2).strip()
        else:
            result.errors.append("Failed to match CEF header pattern")
            result.confidence = 0.1
        return result


class LEEFParser(BaseParser):
    name = "leef"
    format = "leef"
    
    HEADER_PATTERN = re.compile(
        r"^LEEF:(?P<version>[\d.]+)\|"
        r"(?P<vendor>[^|]+)\|"
        r"(?P<product>[^|]+)\|"
        r"(?P<version2>[^|]+)\|"
        r"(?P<event_id>[^|]+)\|"
        r"(?P<extension>.*)$"
    )
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        match = self.HEADER_PATTERN.match(raw_log.strip())
        if match:
            result.fields = match.groupdict()
            result.confidence = 0.95
            ext = result.fields.get("extension", "")
            for kv_match in re.finditer(r'(\w+)=([^\t]+)', ext):
                result.fields[kv_match.group(1)] = kv_match.group(2).strip()
        else:
            result.errors.append("Failed to match LEEF header pattern")
            result.confidence = 0.1
        return result


class CSVParser(BaseParser):
    name = "csv"
    format = "csv"
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        try:
            reader = csv.DictReader(StringIO(raw_log.strip()))
            rows = list(reader)
            if rows:
                result.fields = rows[0]
                result.confidence = 0.95
            else:
                result.errors.append("No CSV rows found")
                result.confidence = 0.2
        except csv.Error as e:
            result.errors.append(f"CSV parse error: {e}")
            result.confidence = 0.0
        return result


class XMLParser(BaseParser):
    name = "xml"
    format = "xml"
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        try:
            root = ET.fromstring(raw_log.strip())
            result.fields = self._xml_to_dict(root)
            result.confidence = 0.92
        except ET.ParseError as e:
            result.errors.append(f"XML parse error: {e}")
            result.confidence = 0.0
        return result
    
    def _xml_to_dict(self, element) -> dict:
        result = {"tag": element.tag}
        if element.text and element.text.strip():
            result["text"] = element.text.strip()
        result.update(element.attrib)
        for child in element:
            child_dict = self._xml_to_dict(child)
            if child.tag in result:
                if not isinstance(result[child.tag], list):
                    result[child.tag] = [result[child.tag]]
                result[child.tag].append(child_dict)
            else:
                result[child.tag] = child_dict
        return result


class KeyValueParser(BaseParser):
    name = "key_value"
    format = "grok_custom"
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        # Try various key=value delimiters
        patterns = [
            r'(\w+)=([^\s|]+)',           # key=value
            r'(\w+):\s*([^\s|]+)',        # key: value
            r'(\w+)\s+([^\s|]+)',         # key value
        ]
        for pattern in patterns:
            matches = re.findall(pattern, raw_log)
            if len(matches) >= 2:
                for k, v in matches:
                    result.fields[k] = v
                result.confidence = min(0.7 + 0.05 * len(matches), 0.95)
                break
        if not result.fields:
            result.errors.append("No key-value pairs detected")
            result.confidence = 0.1
        return result


class PlainTextParser(BaseParser):
    name = "plain_text"
    format = "multiline"
    
    def parse(self, raw_log: str) -> ParseResult:
        result = ParseResult()
        result.format_detected = self.format
        result.fields["raw_text"] = raw_log
        result.fields["line_count"] = len(raw_log.strip().split("\n"))
        result.confidence = 0.3
        return result


# ── Parser Registry ────────────────────────────────────────────

PARSERS: dict[str, BaseParser] = {
    "syslog_rfc3164": SyslogRFC3164Parser(),
    "syslog_rfc5424": SyslogRFC5424Parser(),
    "json": JSONParser(),
    "json_lines": JSONLinesParser(),
    "cef": CEFParser(),
    "leef": LEEFParser(),
    "csv": CSVParser(),
    "xml": XMLParser(),
    "grok_custom": KeyValueParser(),
    "multiline": PlainTextParser(),
    "plain_text": PlainTextParser(),
}


def detect_format(raw_log: str) -> tuple[str, float]:
    """Detect the format of a raw log line. Returns (format, confidence)."""
    raw = raw_log.strip()
    
    # JSON
    if raw.startswith("{") or raw.startswith("["):
        try:
            json.loads(raw)
            return "json", 0.99
        except:
            pass
    
    # CEF
    if raw.startswith("CEF:"):
        return "cef", 0.98
    
    # LEEF
    if raw.startswith("LEEF:"):
        return "leef", 0.98
    
    # XML
    if raw.startswith("<"):
        try:
            ET.fromstring(raw)
            return "xml", 0.95
        except:
            pass
    
    # Syslog RFC 5424
    if re.match(r'^<\d+>\d+\s+\d{4}-\d{2}-\d{2}', raw):
        return "syslog_rfc5424", 0.95
    
    # Syslog RFC 3164
    if re.match(r'^(<\d+>)?[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}', raw):
        return "syslog_rfc3164", 0.92
    
    # CSV
    if ',' in raw and len(raw.split(',')) > 2:
        try:
            list(csv.reader(StringIO(raw)))
            return "csv", 0.70
        except:
            pass
    
    # Key-Value
    kv_matches = re.findall(r'(\w+)=([^\s]+)', raw)
    if len(kv_matches) >= 3:
        return "grok_custom", 0.75
    
    # Pipe-delimited
    if raw.count("|") >= 3:
        return "grok_custom", 0.60
    
    return "unknown", 0.0


def parse_log(raw_log: str, format_hint: Optional[str] = None) -> ParseResult:
    """Parse a raw log line using the appropriate parser."""
    if format_hint and format_hint in PARSERS:
        return PARSERS[format_hint].parse(raw_log)
    
    detected_format, _ = detect_format(raw_log)
    if detected_format in PARSERS:
        return PARSERS[detected_format].parse(raw_log)
    
    result = ParseResult()
    result.format_detected = "unknown"
    result.confidence = 0.0
    result.errors.append("Unable to detect format")
    return result
