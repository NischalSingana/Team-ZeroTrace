"""ULPF Backend Configuration"""
import os
from pathlib import Path
from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Project root .env (backend/app/config.py -> parents[2] is the repo root)
_ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ULPF Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "ulpf-dev-secret-change-in-production"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:7100"]
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://ulpf:ulpf@postgres:5432/ulpf"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # OpenSearch
    OPENSEARCH_URL: str = "http://opensearch:9200"
    
    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "ulpf-raw-events"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:9092"
    KAFKA_ENABLED: bool = True
    
    # AI / OpenRouter
    OPENROUTER_API_KEY: Optional[str] = None
    OPEN_KEY_1: Optional[str] = None
    OPEN_KEY_2: Optional[str] = None
    OPEN_KEY_3: Optional[str] = None
    OPEN_KEY_4: Optional[str] = None
    OPEN_KEY_5: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b:free"
    OPENROUTER_FALLBACK_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    AI_ENABLED: bool = True
    AI_TIMEOUT: int = 30

    @property
    def openrouter_api_keys(self) -> list[str]:
        """All configured OpenRouter keys, in fallback order."""
        keys = [
            self.OPEN_KEY_1, self.OPEN_KEY_2, self.OPEN_KEY_3,
            self.OPEN_KEY_4, self.OPEN_KEY_5, self.OPENROUTER_API_KEY,
        ]
        seen: list[str] = []
        for k in keys:
            if k and k.strip() and k not in seen:
                seen.append(k.strip())
        return seen

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        """Make the URL asyncpg-compatible (Neon gives plain postgresql://)."""
        if v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        elif v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[len("postgres://"):]
        # asyncpg does not understand sslmode / channel_binding query params
        if "?" in v:
            base, query = v.split("?", 1)
            params = []
            for p in query.split("&"):
                k, _, val = p.partition("=")
                if k == "sslmode":
                    params.append(f"ssl={val}")
                elif k == "channel_binding":
                    continue  # unsupported by asyncpg
                else:
                    params.append(p)
            v = base + ("?" + "&".join(params) if params else "")
        return v

    # Security
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Demo
    DEMO_MODE: bool = True
    DEMO_EVENT_COUNT: int = 1000

    class Config:
        env_file = [str(_ROOT_ENV), ".env"]
        case_sensitive = True
        extra = "ignore"


settings = Settings()
