from pydantic import BaseModel, Field
from typing import List, Optional


class FeedbackRequest(BaseModel):
    seed_genres: List[str] = Field(
        ..., description="Initial genres the user selected"
    )
    seed_uris: List[str] = Field(
        [], description="Initial seed track URIs"
    )
    liked_uris: List[str] = Field(
        [], description="Track URIs the user thumbs-upped"
    )
    disliked_uris: List[str] = Field(
        [], description="Track URIs the user thumbs-downed"
    )
    k: Optional[int] = Field(
        None, ge=1, description="Number of recommendations to return"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "seed_genres":    ["pop", "indie rock", "dance pop"],
                "seed_uris":      ["spotify:track:AAA"],
                "liked_uris":     ["spotify:track:BBB"],
                "disliked_uris":  ["spotify:track:CCC"],
                "k": 10
            }
        }
