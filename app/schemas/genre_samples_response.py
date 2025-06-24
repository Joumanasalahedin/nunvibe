from pydantic import BaseModel
from typing import List, Dict


class GenreSamplesResponse(BaseModel):
    samples: List[Dict[str, str]]
