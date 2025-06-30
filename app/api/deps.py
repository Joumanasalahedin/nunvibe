from fastapi import Depends
from app.services.recommender import HybridRecommender


def get_hybrid_recommender() -> HybridRecommender:
    return HybridRecommender()
