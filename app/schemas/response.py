from pydantic import BaseModel
from typing import List, Dict


class ContentResponse(BaseModel):
    recommendations: List[Dict[str, str]]
