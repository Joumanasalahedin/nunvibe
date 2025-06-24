from fastapi import FastAPI
from app.api.routes import router as api_router
from app.core.config import settings

app = FastAPI(
    title="NunVibe Recommender API",
    description="Serve personalized top-K music recommendations for NunVibe",
    version="0.1.0"
)

app.include_router(api_router, prefix=settings.API_PREFIX)
