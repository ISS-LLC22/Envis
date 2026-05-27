from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/envis"
    SYNC_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/envis"
    ANTHROPIC_API_KEY: str = ""
    NWS_USER_AGENT: str = "(ENVIS, contact@example.com)"
    NCEI_API_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    ALERT_POLL_INTERVAL_SECONDS: int = 300

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
