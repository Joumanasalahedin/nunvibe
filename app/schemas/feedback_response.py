from pydantic import BaseModel
from typing import List, Dict


class FeedbackResponse(BaseModel):
    liked: List[Dict[str, str]]
    recommendations: List[Dict[str, str]]
