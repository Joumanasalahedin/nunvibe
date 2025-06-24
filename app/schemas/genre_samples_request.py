from pydantic import BaseModel, Field
from typing import List, Optional


class GenreSamplesRequest(BaseModel):
    genres: List[str] = Field(..., description="Selected genres")
    limit: Optional[int] = Field(
        10, gt=0, description="How many sample tracks to return")
