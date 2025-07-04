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
        self._feedback_cache = None
        self._feedback_cache_time = 0

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

    def _get_feedback_uris(self):
        """Get all URIs from feedback.csv with caching."""
        import time
        current_time = time.time()

        # Cache for 5 seconds to avoid reading file too frequently
        if (self._feedback_cache is not None and
                current_time - self._feedback_cache_time < 5):
            return self._feedback_cache

        try:
            feedback_df = pd.read_csv(FEEDBACK_CSV_PATH)
            if not feedback_df.empty:
                self._feedback_cache = set(feedback_df['track_uri'].tolist())
                self._feedback_cache_time = current_time
                return self._feedback_cache
        except:
            pass

        self._feedback_cache = set()
        self._feedback_cache_time = current_time
        return self._feedback_cache

    def recommend(
        self,
        k: int = None,
        seed_genres: list[str] = None,
        liked_uris: list[str] = None,
        disliked_uris: list[str] = None
    ) -> list[dict]:
        seed_genres = seed_genres or []
        liked_uris = liked_uris or []
        disliked_uris = disliked_uris or []

        # Combine all URIs to exclude (liked, disliked, and all previously rated)
        exclude_uris = set(liked_uris) | set(disliked_uris)

        # Add all tracks from feedback.csv to exclusion set
        feedback_uris = self._get_feedback_uris()
        exclude_uris.update(feedback_uris)

        # 1) Pure content-based KNN recommendation (cold start)
        knn_dicts = self.data.recommend(
            seed_genres, liked_uris, k or self.k)
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

        # 3) Enhanced hybrid recommendation: blend logistic regression with musical similarity
        all_vectors = self.data.features
        lr_probs = self.lr_model.predict_proba(all_vectors)[:, 1]

        # Build user taste profile from liked tracks
        if liked_uris:
            liked_indices = [self.data.track_uris.index(
                uri) for uri in liked_uris if uri in self.data.track_uris]
            if liked_indices:
                # Get musical features of liked tracks
                liked_features = all_vectors[liked_indices]
                user_musical_profile = np.mean(liked_features, axis=0)

                # Calculate musical similarity scores
                musical_similarities = np.dot(all_vectors, user_musical_profile) / (
                    np.linalg.norm(all_vectors, axis=1) * np.linalg.norm(user_musical_profile))

                # Blend logistic regression with musical similarity
                # Weight: 70% LR probability, 30% musical similarity
                blended_scores = 0.7 * lr_probs + 0.3 * musical_similarities
            else:
                blended_scores = lr_probs
        else:
            blended_scores = lr_probs

        # Get top candidates from blended scores
        top_candidates = 100  # Get more candidates for better diversity
        ranked_idx = np.argsort(-blended_scores)[:top_candidates]

        # Use diversity-aware selection with musical variety
        recommendation_uris = []
        seen_uris = set()
        seen_songs = set()  # Track unique song+artist combinations
        seen_artists = set()  # Track artists to ensure diversity
        limit = k or self.k

        # First pass: select high-scoring tracks with artist diversity
        for idx in ranked_idx:
            uri = self.data.track_uris[idx]
            if uri in exclude_uris or uri in seen_uris:
                continue

            song_name = self.data.track_names[idx]
            artist_name = self.data.artist_names[idx]

            # Create a unique key for song+artist combination
            song_key = f"{song_name}|{artist_name}"

            if song_key in seen_songs:
                continue
            seen_songs.add(song_key)

            # Limit same artist to max 2 tracks per recommendation set
            artist_key = artist_name.lower().split(
                ',')[0].strip()  # Primary artist
            if artist_key in seen_artists and len([u for u in recommendation_uris if self.data.artist_names[self.data.track_uris.index(u)].lower().split(',')[0].strip() == artist_key]) >= 2:
                continue

            recommendation_uris.append(uri)
            seen_uris.add(uri)
            seen_artists.add(artist_key)

            if len(recommendation_uris) >= limit:
                break

        # If we still don't have enough recommendations, add more diverse tracks
        if len(recommendation_uris) < limit:
            # Get remaining tracks with good probabilities but lower ranking
            remaining_indices = [i for i in range(
                len(self.data.track_uris)) if i not in ranked_idx]
            remaining_probs = lr_probs[remaining_indices]
            remaining_ranked = [remaining_indices[i]
                                for i in np.argsort(-remaining_probs)]

            for idx in remaining_ranked:
                uri = self.data.track_uris[idx]
                if uri in exclude_uris or uri in seen_uris:
                    continue

                song_name = self.data.track_names[idx]
                artist_name = self.data.artist_names[idx]

                song_key = f"{song_name}|{artist_name}"

                if song_key in seen_songs:
                    continue
                seen_songs.add(song_key)

                # Relax artist diversity when we need more tracks
                artist_key = artist_name.lower().split(',')[0].strip()
                if artist_key in seen_artists and len([u for u in recommendation_uris if self.data.artist_names[self.data.track_uris.index(u)].lower().split(',')[0].strip() == artist_key]) >= 3:
                    continue

                recommendation_uris.append(uri)
                seen_uris.add(uri)
                seen_artists.add(artist_key)

                if len(recommendation_uris) >= limit:
                    break

        # Enhanced fallback: popular tracks with relaxed diversity
        if len(recommendation_uris) < limit:
            all_indices = list(range(len(self.data.track_uris)))
            popularity_scores = self.data.features[:, len(
                self.data.genre_encoder.classes_)]
            sorted_indices = sorted(
                all_indices, key=lambda i: popularity_scores[i], reverse=True)

            for idx in sorted_indices:
                uri = self.data.track_uris[idx]
                if uri in exclude_uris or uri in seen_uris:
                    continue

                song_name = self.data.track_names[idx]
                artist_name = self.data.artist_names[idx]

                song_key = f"{song_name}|{artist_name}"

                if song_key in seen_songs:
                    continue
                seen_songs.add(song_key)

                # Relax artist diversity even more in final fallback
                artist_key = artist_name.lower().split(',')[0].strip()
                if artist_key in seen_artists and len([u for u in recommendation_uris if self.data.artist_names[self.data.track_uris.index(u)].lower().split(',')[0].strip() == artist_key]) >= 4:
                    continue

                recommendation_uris.append(uri)
                seen_uris.add(uri)
                seen_artists.add(artist_key)

                if len(recommendation_uris) >= limit:
                    break

        # Ultimate fallback: any available tracks to meet the limit
        if len(recommendation_uris) < limit:
            for idx in range(len(self.data.track_uris)):
                uri = self.data.track_uris[idx]
                if uri in exclude_uris or uri in seen_uris:
                    continue

                song_name = self.data.track_names[idx]
                artist_name = self.data.artist_names[idx]

                song_key = f"{song_name}|{artist_name}"

                if song_key in seen_songs:
                    continue
                seen_songs.add(song_key)

                recommendation_uris.append(uri)
                seen_uris.add(uri)

                if len(recommendation_uris) >= limit:
                    break

        return self.data.get_track_info(recommendation_uris)
