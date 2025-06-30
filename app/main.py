from fastapi import FastAPI
from app.core.config import API_PREFIX
from app.api.routes import router
import uvicorn

app = FastAPI(
    title="NunVibe Recommender API",
    description="Serve personalized top-K music recommendations for NunVibe",
    version="0.1.0"
)
app.include_router(router, prefix=API_PREFIX)
