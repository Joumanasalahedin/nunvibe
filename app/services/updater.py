import os
import pandas as pd
from typing import List
from app.core.config import FEEDBACK_CSV_PATH


class FeedbackUpdater:
    """
    Handles persistence of feedback (likes/dislikes) to a CSV file.
    """

    def __init__(self, feedback_csv_path: str = FEEDBACK_CSV_PATH):
        self.path = feedback_csv_path
        if not os.path.exists(self.path):
            df = pd.DataFrame(columns=["track_uri", "label"])
            os.makedirs(os.path.dirname(self.path), exist_ok=True)
            df.to_csv(self.path, index=False)

    def update(self, liked_uris: List[str], disliked_uris: List[str]):
        """
        Append new feedback rows: label=1 for likes, label=0 for dislikes.
        """
        try:
            df = pd.read_csv(self.path)
        except Exception:
            df = pd.DataFrame(columns=["track_uri", "label"])

        entries = []
        for uri in liked_uris:
            entries.append({"track_uri": uri, "label": 1})
        for uri in disliked_uris:
            entries.append({"track_uri": uri, "label": 0})

        if entries:
            new_df = pd.DataFrame(entries)
            df = pd.concat([df, new_df], ignore_index=True)
            df.to_csv(self.path, index=False)
