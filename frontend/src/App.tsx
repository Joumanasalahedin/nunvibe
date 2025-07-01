import { FC, useEffect, useState } from "react";
import styles from "./App.module.css";

interface Genre {
    id: string;
    name: string;
}

interface Song {
    uri: string;
    name: string;
    artist: string;
}

const API_BASE = "http://localhost:8000";

const App: FC = () => {
    const [step, setStep] = useState<"genre" | "samples" | "recommend" | "feedback">("genre");
    const [genres, setGenres] = useState<Genre[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

    const [sampleSongs, setSampleSongs] = useState<Song[]>([]);
    const [likedSamples, setLikedSamples] = useState<string[]>([]);
    const [dislikedSamples, setDislikedSamples] = useState<string[]>([]);

    const [recommendations, setRecommendations] = useState<Song[]>([]);
    const [likedRecs, setLikedRecs] = useState<string[]>([]);
    const [dislikedRecs, setDislikedRecs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/genres`)
            .then(res => res.json())
            .then(data => {
                const genreObjs = (data.genres || []).map((g: string) => ({ id: g, name: g }));
                setGenres(genreObjs);
            })
            .catch(() => setError("Failed to load genres."));
    }, []);

    const toggleGenre = (id: string) => {
        setSelectedGenres(prev =>
            prev.includes(id)
                ? prev.filter(g => g !== id)
                : prev.length < 3
                    ? [...prev, id]
                    : prev
        );
    };

    const fetchSamples = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            selectedGenres.forEach(g => params.append("genres", g));
            params.append("limit", "10");
            const res = await fetch(`${API_BASE}/api/genres/samples?${params.toString()}`);
            const data = await res.json();
            setSampleSongs(data.samples || []);
            setStep("samples");
        } catch {
            setError("Failed to fetch sample songs.");
        } finally {
            setLoading(false);
        }
    };

    const handleSampleFeedback = (id: string, liked: boolean) => {
        if (liked) {
            setLikedSamples(prev => prev.includes(id) ? prev : [...prev, id]);
            setDislikedSamples(prev => prev.filter(sid => sid !== id));
        } else {
            setDislikedSamples(prev => prev.includes(id) ? prev : [...prev, id]);
            setLikedSamples(prev => prev.filter(sid => sid !== id));
        }
    };

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    seed_genres: selectedGenres,
                    seed_uris: likedSamples,
                }),
            });
            const data = await res.json();
            setRecommendations(data.recommendations || []);
            setStep("recommend");
        } catch {
            setError("Failed to fetch recommendations.");
        } finally {
            setLoading(false);
        }
    };

    const handleRecFeedback = (id: string, liked: boolean) => {
        if (liked) {
            setLikedRecs(prev => prev.includes(id) ? prev : [...prev, id]);
            setDislikedRecs(prev => prev.filter(sid => sid !== id));
        } else {
            setDislikedRecs(prev => prev.includes(id) ? prev : [...prev, id]);
            setLikedRecs(prev => prev.filter(sid => sid !== id));
        }
    };

    const fetchMoreRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/recommend/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    seed_genres: selectedGenres,
                    seed_uris: likedSamples,
                    liked_uris: likedRecs,
                    disliked_uris: dislikedRecs,
                }),
            });
            const data = await res.json();
            setRecommendations(data.recommendations || []);
            setLikedRecs([]);
            setDislikedRecs([]);
            setStep("recommend");
        } catch {
            setError("Failed to fetch more recommendations.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.appContainer}>
            <h1>nunvibe™ Music Recommender</h1>
            {error && <div className={styles.error}>{error}</div>}
            {loading && <div className={styles.loading}>Loading...</div>}

            {step === "genre" && (
                <div>
                    <h2>Pick 1-3 genres you like</h2>
                    <div className={styles.genreChips}>
                        {genres.map(g => (
                            <button
                                key={g.id}
                                onClick={() => toggleGenre(g.id)}
                                className={
                                    selectedGenres.includes(g.id)
                                        ? `${styles.genreChip} ${styles.selected}`
                                        : styles.genreChip
                                }
                                disabled={loading}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchSamples}
                        disabled={selectedGenres.length === 0 || selectedGenres.length > 3 || loading}
                        className={styles.button}
                    >
                        Get Sample Songs
                    </button>
                </div>
            )}

            {step === "samples" && (
                <div>
                    <h2>Sample Songs</h2>
                    <p style={{ color: "var(--accent)", marginBottom: 12 }}>Like or dislike songs to help us recommend better music for you.</p>
                    <ul className={styles.songList}>
                        {Array.isArray(sampleSongs) && sampleSongs.length > 0 ? sampleSongs.map(song => (
                            <li key={song.uri} className={styles.songItem}>
                                <div style={{ flex: 1 }}>
                                    <div className={styles.songTitle}>{song.name}</div>
                                    <div className={styles.songArtist}>by {song.artist}</div>
                                </div>
                                <button
                                    onClick={() => handleSampleFeedback(song.uri, true)}
                                    className={
                                        likedSamples.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.liked}`
                                            : styles.feedbackBtn
                                    }
                                    aria-label="Like"
                                >👍</button>
                                <button
                                    onClick={() => handleSampleFeedback(song.uri, false)}
                                    className={
                                        dislikedSamples.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.disliked}`
                                            : styles.feedbackBtn
                                    }
                                    aria-label="Dislike"
                                >👎</button>
                            </li>
                        )) : (
                            <li style={{ color: "var(--accent)", textAlign: "center", padding: "2rem 0" }}>No samples found.</li>
                        )}
                    </ul>
                    <button
                        onClick={fetchRecommendations}
                        disabled={likedSamples.length + dislikedSamples.length === 0 || loading}
                        className={styles.button}
                    >
                        Get Recommendations
                    </button>
                </div>
            )}

            {step === "recommend" && (
                <div>
                    <h2>Recommended Songs</h2>
                    <ul className={styles.songList}>
                        {recommendations.map(song => (
                            <li key={song.uri} className={styles.songItem}>
                                <span className={styles.songTitle}>{song.name}<span className={styles.songArtist}>by {song.artist}</span></span>
                                <button
                                    onClick={() => handleRecFeedback(song.uri, true)}
                                    className={
                                        likedRecs.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.liked}`
                                            : styles.feedbackBtn
                                    }
                                    aria-label="Like"
                                >👍</button>
                                <button
                                    onClick={() => handleRecFeedback(song.uri, false)}
                                    className={
                                        dislikedRecs.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.disliked}`
                                            : styles.feedbackBtn
                                    }
                                    aria-label="Dislike"
                                >👎</button>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={fetchMoreRecommendations}
                        disabled={likedRecs.length + dislikedRecs.length === 0 || loading}
                        className={styles.button}
                    >
                        Recommend More
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;
