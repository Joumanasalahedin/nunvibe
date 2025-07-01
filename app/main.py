from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import API_PREFIX
from app.api.routes import router
import uvicorn

app = FastAPI(
    title="NunVibe Recommender API",
    description="Serve personalized top-K music recommendations for NunVibe",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], #frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=API_PREFIX)
