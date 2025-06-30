from pydantic import BaseModel
from typing import List, Dict


class FeedbackResponse(BaseModel):
    recommendations: List[Dict[str, str]]
