from fastapi import Depends
from app.services.recommender import ContentRecommender


def get_content_recommender() -> ContentRecommender:
    return ContentRecommender()
