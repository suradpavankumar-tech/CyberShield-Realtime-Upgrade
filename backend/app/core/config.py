from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CyberShield"
    APP_ENV: str = "development"
    DEBUG: bool = False
    
    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CORS_ORIGINS: str = ""
    # Keep false for internet-facing deployments. Enable only when the operator explicitly authorizes private-network scanning.
    ALLOW_PRIVATE_SCAN_TARGETS: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()