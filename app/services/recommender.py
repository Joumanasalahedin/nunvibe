import pandas as pd
import numpy as np
import joblib
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import CSV_PATH, DEFAULT_K, LR_MODEL_PATH, MIN_FEEDBACK, FEEDBACK_CSV_PATH
from app.data.preprocess import ContentData


class HybridRecommender:
    """
    Hybrid music recommender that falls back to content-based KNN for cold-start,
    and once sufficient feedback is collected, blends KNN similarity with a
    logistic-regression model trained on user likes/dislikes.
    """

    def __init__(self):
        self.data = ContentData(CSV_PATH)
        self.k = DEFAULT_K
        try:
            self.lr_model = joblib.load(LR_MODEL_PATH)
        except:
            self.lr_model = None

    def build_taste_vector(self, seed_genres: list[str], seed_uris: list[str]) -> np.ndarray:
        # 1) One-hot encode seed genres
        g_vec = self.data.genre_encoder.transform([seed_genres])[0]
        # 2) Gather seed-track feature vectors
        idxs = [self.data.track_uris.index(
            u) for u in seed_uris if u in self.data.track_uris]
        t_vecs = self.data.features[idxs] if idxs else np.empty(
            (0, self.data.features.shape[1]))
        # 3) Combine genre and track vectors
        if t_vecs.size:
            pad = np.zeros(self.data.features.shape[1] - len(g_vec))
            g_full = np.hstack([g_vec, pad]) if pad.size else g_vec
            all_vecs = np.vstack([g_full, t_vecs])
            taste = all_vecs.mean(axis=0)[None, :]
        else:
            pad = np.zeros(self.data.features.shape[1] - len(g_vec))
            taste = np.hstack([g_vec, pad])[None, :]
        return taste

    def recommend(
        self,
        k: int = None,
        seed_genres: list[str] = None,
        seed_uris: list[str] = None,
        liked_uris: list[str] = None,
        disliked_uris: list[str] = None
    ) -> list[dict]:
        seed_genres = seed_genres or []
        seed_uris = seed_uris or []
        liked_uris = liked_uris or []
        disliked_uris = disliked_uris or []

        # Combine all URIs to exclude
        exclude_uris = set(seed_uris) | set(liked_uris) | set(disliked_uris)

        # 1) Pure content-based KNN recommendation (cold start)
        knn_dicts = self.data.recommend(
            seed_genres, seed_uris + liked_uris, k or self.k)
        knn_dicts = [rec for rec in knn_dicts if rec['uri']
                     not in exclude_uris]

        # 2) If no logistic model or not enough feedback yet, return KNN
        if self.lr_model is None:
            return knn_dicts[:k or self.k]

        try:
            feedback_df = pd.read_csv(FEEDBACK_CSV_PATH)
            total_feedback = len(feedback_df)
        except:
            total_feedback = 0

        if total_feedback < MIN_FEEDBACK:
            return knn_dicts[:k or self.k]

        # 3) Pure logistic regression recommendation (after cold start)
        all_vectors = self.data.features
        lr_probs = self.lr_model.predict_proba(all_vectors)[:, 1]
        # Rank by logistic regression probabilities only
        ranked_idx = np.argsort(-lr_probs)
        recommendation_uris = []
        limit = k or self.k
        for idx in ranked_idx:
            uri = self.data.track_uris[idx]
            if uri in exclude_uris:
                continue
            recommendation_uris.append(uri)
            if len(recommendation_uris) >= limit:
                break
        return self.data.get_track_info(recommendation_uris)
