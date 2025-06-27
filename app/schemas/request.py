from pydantic import BaseModel, Field
from typing import List, Optional


class ContentRequest(BaseModel):
    seed_genres: List[str] = Field(..., description="User-selected genres")
    seed_uris:   List[str] = Field(
        [], description="Optional list of Track URIs you liked")
    k:           Optional[int] = Field(
        None, ge=1, description="Number of recs (defaults server-side)")

    class Config:
        json_schema_extra = {
            "example": {
                "seed_genres": ["pop", "dance pop"],
                "seed_uris":   ["spotify:track:1MtUq6Wp1eQ8PC6BbPCj8P"],
                "k":            10
            }
        }
