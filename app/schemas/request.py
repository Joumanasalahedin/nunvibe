from pydantic import BaseModel, Field
from typing import List, Optional


class ContentRequest(BaseModel):
    seed_genres: List[str] = Field(..., description="User-selected genres")
    liked_uris:   List[str] = Field(
        [], description="Optional list of Track URIs you liked")
    disliked_uris: List[str] = Field(
        [], description="Optional list of Track URIs you disliked")
    k:           Optional[int] = Field(
        None, ge=1, description="Number of recs (defaults server-side)")

    class Config:
        json_schema_extra = {
            "example": {
                "seed_genres": ["pop", "dance pop"],
                "liked_uris":   ["spotify:track:1MtUq6Wp1eQ8PC6BbPCj8P"],
                "disliked_uris": ["spotify:track:2MtUq6Wp1eQ8PC6BbPCj8P"],
                "k":            10
            }
        }
