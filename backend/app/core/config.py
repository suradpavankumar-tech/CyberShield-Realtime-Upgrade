from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CyberShield"
    APP_ENV: str = "development"
    DEBUG: bool = False
    
    # Safe production defaults so container boots up seamlessly without missing env crashes
    DATABASE_URL: str = "sqlite:///./cybershield.db"

    JWT_SECRET_KEY: str = "cybershield_production_fallback_key_2026_x89f72c"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: str = "*"
    # Keep false for internet-facing deployments. Enable only when the operator explicitly authorizes private-network scanning.
    ALLOW_PRIVATE_SCAN_TARGETS: bool = False

    # Real-time incident alert routing
    DEFAULT_ALERT_WEBHOOK_URL: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()