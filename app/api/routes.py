from fastapi import APIRouter, Query

from app.core.config import DEFAULT_K, FEEDBACK_CSV_PATH
from app.data.preprocess import ContentData
from app.services.recommender import HybridRecommender
from app.services.updater import FeedbackUpdater
from app.schemas import (
    GenresResponse,
    GenreSamplesRequest,
    GenreSamplesResponse,
    ContentRequest,
    ContentResponse,
    FeedbackRequest,
    FeedbackResponse,
)

data = ContentData()
recommender = HybridRecommender()
updater = FeedbackUpdater(feedback_csv_path=FEEDBACK_CSV_PATH)
router = APIRouter()


@router.get("/genres", response_model=GenresResponse)
def list_genres():
    """Return available music genres."""
    return GenresResponse(genres=data.list_genres())


@router.get("/genres/samples", response_model=GenreSamplesResponse)
def genre_samples(
    genres: list[str] = Query(..., description="Selected genres"),
    limit: int = Query(10, gt=0, description="How many sample tracks to return"),
):
    """Return example tracks for each genre."""
    samples = data.sample_popular_by_genres(genres, limit)
    return GenreSamplesResponse(samples=samples)


@router.post("/recommend", response_model=ContentResponse)
def recommend(req: ContentRequest):
    """Return initial or feedback-refined recommendations."""
    recs = recommender.recommend(
        k=req.k or DEFAULT_K,
        seed_genres=req.seed_genres,
        seed_uris=req.seed_uris,
    )
    return ContentResponse(recommendations=recs)


@router.post("/recommend/feedback", response_model=FeedbackResponse)
def feedback(req: FeedbackRequest):
    """Accept user feedback and return updated recommendations."""
    updater.update(
        liked_uris=req.liked_uris,
        disliked_uris=req.disliked_uris,
    )
    recs = recommender.recommend(
        k=req.k or DEFAULT_K,
        seed_genres=req.seed_genres,
        seed_uris=req.seed_uris,
        liked_uris=req.liked_uris,
        disliked_uris=req.disliked_uris,
    )
    return FeedbackResponse(recommendations=recs)
