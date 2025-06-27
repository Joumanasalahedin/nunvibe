from app.data.preprocess import ContentData
from app.core.config import settings


class ContentRecommender:
    def __init__(self):
        self.data = ContentData(settings.CSV_PATH)
        self.default_k = settings.DEFAULT_K

    def get_available_genres(self) -> list[str]:
        return self.data.list_genres()

    def get_samples_by_genres(self, genres: list[str], limit: int) -> list[dict]:
        return self.data.sample_popular_by_genres(genres, limit)

    def recommend(self,
                  seed_genres: list[str],
                  seed_uris: list[str],
                  k: int | None = None) -> list[dict]:
        return self.data.recommend(seed_genres, seed_uris, k or self.default_k)

    def recommend_with_feedback(
        self,
        seed_genres: list[str],
        liked_uris: list[str],
        disliked_uris: list[str],
        k: int | None = None
    ) -> list[dict]:
        return self.data.recommend_with_feedback(
            seed_genres,
            liked_uris,
            disliked_uris,
            k or self.default_k
        )

    def get_track_info(self, uris: list[str]) -> list[dict]:
        return self.data.get_track_info(uris)
