import pandas as pd
import numpy as np
from sklearn.preprocessing import MultiLabelBinarizer, MinMaxScaler
from sklearn.neighbors import NearestNeighbors


class ContentData:
    def __init__(self, csv_path: str):
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
            'Popularity',
            'Danceability',
            'Energy',
            'Key',
            'Loudness',
            'Mode',
            'Speechiness',
            'Acousticness',
            'Instrumentalness',
            'Liveness',
            'Valence',
            'Tempo'
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

    def list_genres(self) -> list[str]:
        """Return all unique genres alphabetically."""
        return sorted(self.genre_encoder.classes_.tolist())

    def sample_popular_by_genres(self, genres: list[str], limit: int) -> list[dict]:
        mask = self.df['genres'].apply(lambda gl: any(g in gl for g in genres))
        filtered = self.df.loc[mask]  # type: ignore
        top = filtered.sort_values('Popularity', ascending=False).head(limit)
        return [
            {
                "uri":    row['Track URI'],
                "name":   row['Track Name'],
                "artist": row['Artist Name(s)']
            }
            for _, row in top.iterrows()
        ]

    def recommend(
        self,
        seed_genres: list[str],
        seed_uris: list[str],
        k: int
    ) -> list[dict]:
        """
        Build a 'user taste vector' by averaging:
          1) the one-hot vector for seed_genres, and
          2) the full audio+genre vector(s) of any seed_uris.
        Then return the top‐k nearest neighbors (excluding seeds).
        """
        # 1) One‐hot genre component
        g_vec = self.genre_encoder.transform([seed_genres])[0]

        # 2) Audio‐feature component for any explicit seed URIs
        t_idxs = [self.track_uris.index(uri)
                  for uri in seed_uris
                  if uri in self.track_uris]
        t_vecs = self.features[t_idxs] if t_idxs else np.empty(
            (0, self.features.shape[1]))

        # 3) Aggregate into a single user vector
        if t_vecs.shape[0] > 0:
            all_vecs = np.vstack(
                [np.hstack([g_vec, np.zeros(len(self.numeric_cols))]), t_vecs])
            user_vec = all_vecs.mean(axis=0)[None, :]
        else:
            zero_pad = np.zeros(len(self.numeric_cols))
            user_vec = np.hstack([g_vec, zero_pad])[None, :]

        # 4) Query KNN (ask for k + len(seed_uris) so we can filter seeds out)
        dists, nbrs = self.knn.kneighbors(
            user_vec, n_neighbors=k + len(seed_uris))

        # 5) Collect k recommendations, skipping any seed_uris
        recs = []
        for idx in nbrs[0]:
            uri = self.track_uris[idx]
            if uri not in seed_uris:
                recs.append({
                    "uri":    uri,
                    "name":   self.track_names[idx],
                    "artist": self.artist_names[idx]
                })
                if len(recs) >= k:
                    break

        return recs
