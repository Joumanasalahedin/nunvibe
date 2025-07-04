import pandas as pd
import numpy as np
from sklearn.preprocessing import MultiLabelBinarizer, MinMaxScaler
from sklearn.neighbors import NearestNeighbors
from app.core.config import CSV_PATH


class ContentData:
    def __init__(self, csv_path: str = CSV_PATH):
        df = pd.read_csv(csv_path)
        self.df = df

        df['genres'] = (
            df['Artist Genres']
            .fillna('')
            .apply(lambda s: [g.strip() for g in s.replace(';', ',').split(',') if g.strip()])
        )
        mlb = MultiLabelBinarizer()
        genre_mat = mlb.fit_transform(df['genres'])

        numeric_cols = [
            'Popularity', 'Danceability', 'Energy', 'Key', 'Loudness', 'Mode',
            'Speechiness', 'Acousticness', 'Instrumentalness', 'Liveness', 'Valence', 'Tempo'
        ]
        num_df = df[numeric_cols].fillna(df[numeric_cols].median())

        scaler = MinMaxScaler()
        numeric_mat = scaler.fit_transform(num_df)

        self.numeric_cols = numeric_cols
        self.features = np.hstack([genre_mat, numeric_mat])
        self.track_uris = df['Track URI'].tolist()
        self.track_names = df['Track Name'].tolist()
        self.artist_names = df['Artist Name(s)'].tolist()
        self.genre_encoder = mlb

        self.knn = NearestNeighbors(n_neighbors=50, metric='cosine')
        self.knn.fit(self.features)

    def list_genres(self):
        return sorted(self.genre_encoder.classes_.tolist())

    def sample_popular_by_genres(self, genres, limit):
        mask = self.df['genres'].apply(lambda gl: any(g in gl for g in genres))
        filtered = self.df.loc[mask]
        top = filtered.sort_values('Popularity', ascending=False).head(limit)
        return [{"uri": row['Track URI'], "name": row['Track Name'], "artist": row['Artist Name(s)']} for _, row in top.iterrows()]

    def recommend(self, seed_genres, seed_uris, k):
        # 1) One‐hot genre component
        g_vec = self.genre_encoder.transform([seed_genres])[0]
        t_idxs = [self.track_uris.index(
            uri) for uri in seed_uris if uri in self.track_uris]
        t_vecs = self.features[t_idxs] if t_idxs else np.empty(
            (0, self.features.shape[1]))
        if t_vecs.shape[0] > 0:
            all_vecs = np.vstack(
                [np.hstack([g_vec, np.zeros(len(self.numeric_cols))]), t_vecs])
            user_vec = all_vecs.mean(axis=0)[None, :]
        else:
            zero_pad = np.zeros(len(self.numeric_cols))
            user_vec = np.hstack([g_vec, zero_pad])[None, :]

        # Start with a larger search to ensure we get enough unique results
        # Search 3x more to account for duplicates and exclusions
        search_k = min(k * 3, len(self.track_uris))
        dists, nbrs = self.knn.kneighbors(
            user_vec, n_neighbors=search_k)

        recs = []
        seen_uris = set()
        seen_songs = set()  # Track unique song+artist combinations

        for idx in nbrs[0]:
            uri = self.track_uris[idx]
            if uri not in seed_uris and uri not in seen_uris:
                song_name = self.track_names[idx]
                artist_name = self.artist_names[idx]

                # Create a unique key for song+artist combination
                song_key = f"{song_name}|{artist_name}"

                if song_key in seen_songs:
                    continue
                seen_songs.add(song_key)

                recs.append(
                    {"uri": uri, "name": song_name, "artist": artist_name})
                seen_uris.add(uri)
                if len(recs) >= k:
                    break

        # If we still don't have enough recommendations, expand search to all tracks
        if len(recs) < k:
            # Get all track indices and sort by popularity or other criteria
            all_indices = list(range(len(self.track_uris)))

            # Sort by popularity (assuming popularity is in the first numeric column)
            popularity_scores = self.features[:, len(
                self.genre_encoder.classes_)]  # Popularity column
            sorted_indices = sorted(
                all_indices, key=lambda i: popularity_scores[i], reverse=True)

            for idx in sorted_indices:
                uri = self.track_uris[idx]
                if uri not in seed_uris and uri not in seen_uris:
                    song_name = self.track_names[idx]
                    artist_name = self.artist_names[idx]

                    song_key = f"{song_name}|{artist_name}"

                    if song_key in seen_songs:
                        continue
                    seen_songs.add(song_key)

                    recs.append(
                        {"uri": uri, "name": song_name, "artist": artist_name})
                    seen_uris.add(uri)
                    if len(recs) >= k:
                        break

        return recs

    def get_track_info(self, uris: list[str]) -> list[dict]:
        """Return track information for the given URIs, removing duplicates by song name and artist."""
        seen_uris = set()
        seen_songs = set()  # Track unique song+artist combinations
        result = []

        for uri in uris:
            if uri in seen_uris:
                continue
            seen_uris.add(uri)

            if uri in self.track_uris:
                idx = self.track_uris.index(uri)
                song_name = self.track_names[idx]
                artist_name = self.artist_names[idx]

                # Create a unique key for song+artist combination
                song_key = f"{song_name}|{artist_name}"

                if song_key in seen_songs:
                    continue
                seen_songs.add(song_key)

                result.append({
                    "uri": uri,
                    "name": song_name,
                    "artist": artist_name
                })

        return result


def load_feature_matrix(uris: list[str]) -> np.ndarray:
    """Return feature matrix rows corresponding to the provided track URIs."""
    data = ContentData()
    idxs = [data.track_uris.index(u) for u in uris if u in data.track_uris]
    return data.features[idxs]
