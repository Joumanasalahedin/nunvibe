from fastapi import APIRouter, Depends, HTTPException
from app.services.recommender import ContentRecommender
from app.schemas.genres_response import GenresResponse
from app.schemas.genre_samples_request import GenreSamplesRequest
from app.schemas.genre_samples_response import GenreSamplesResponse
from app.schemas.request import ContentRequest
from app.schemas.response import ContentResponse
from app.schemas.feedback_request import FeedbackRequest
from app.schemas.feedback_response import FeedbackResponse

router = APIRouter()
get_cr = Depends(lambda: ContentRecommender())


@router.get("/genres", response_model=GenresResponse)
async def list_genres(cr: ContentRecommender = get_cr):
    """Return the full list of available genres."""
    return GenresResponse(genres=cr.get_available_genres())


@router.post("/genres/samples", response_model=GenreSamplesResponse)
async def sample_tracks(req: GenreSamplesRequest,
                        cr: ContentRecommender = get_cr):
    """Given selected genres, return the top-N popular tracks."""
    try:
        samples = cr.get_samples_by_genres(req.genres, req.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sampling error: {e}")
    return GenreSamplesResponse(samples=samples)


@router.post("/recommend", response_model=ContentResponse)
async def recommend(
    req: ContentRequest,
    cr: ContentRecommender = get_cr
):
    """Content-based: seed with genres & example URIs → similar tracks."""
    try:
        recs = cr.recommend(
            seed_genres=req.seed_genres,
            seed_uris=req.seed_uris,
            k=req.k
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Recommendation error: {e}")
    return ContentResponse(recommendations=recs)


@router.post("/recommend/feedback", response_model=FeedbackResponse)
async def recommend_feedback(
    req: FeedbackRequest,
    cr: ContentRecommender = get_cr
):
    """
    Iterative feedback: use initial genres + thumbs-up/down
    to refine the next batch of recommendations, and return 
    both the list of liked tracks and the new suggestions.
    """
    try:
        new_recs = cr.recommend_with_feedback(
            seed_genres=req.seed_genres,
            liked_uris=req.liked_uris,
            disliked_uris=req.disliked_uris,
            k=req.k
        )
        liked_tracks = cr.get_track_info(req.liked_uris)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {e}")

    return FeedbackResponse(
        liked=liked_tracks,
        recommendations=new_recs
    )
