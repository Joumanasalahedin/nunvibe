from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MODEL_PATH: str = "models/nunvibe"
    API_PREFIX: str = "/api"
    DEFAULT_K: int = 10
    CSV_PATH:   str = "top_10000_1950-now.csv"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
