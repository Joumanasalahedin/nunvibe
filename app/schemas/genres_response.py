from pydantic import BaseModel
from typing import List


class GenresResponse(BaseModel):
    genres: List[str]
