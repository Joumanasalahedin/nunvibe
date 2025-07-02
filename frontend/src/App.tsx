import { FC, useEffect, useState } from "react";
import GenericIcon from "./components/GenericIcon";
import styles from "./App.module.css";
import { useMediaQuery } from "react-responsive";

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
    const [search, setSearch] = useState("");

    const [sampleSongs, setSampleSongs] = useState<Song[]>([]);
    const [likedSamples, setLikedSamples] = useState<string[]>([]);
    const [dislikedSamples, setDislikedSamples] = useState<string[]>([]);

    const [recommendations, setRecommendations] = useState<Song[]>([]);
    const [likedRecs, setLikedRecs] = useState<string[]>([]);
    const [dislikedRecs, setDislikedRecs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const currentYear = new Date().getFullYear();

    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

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
            if (likedSamples.includes(id)) {
                // Deselect if already liked
                setLikedSamples(prev => prev.filter(sid => sid !== id));
            } else {
                // Select like and remove from disliked
                setLikedSamples(prev => [...prev, id]);
                setDislikedSamples(prev => prev.filter(sid => sid !== id));
            }
        } else {
            if (dislikedSamples.includes(id)) {
                // Deselect if already disliked
                setDislikedSamples(prev => prev.filter(sid => sid !== id));
            } else {
                // Select dislike and remove from liked
                setDislikedSamples(prev => [...prev, id]);
                setLikedSamples(prev => prev.filter(sid => sid !== id));
            }
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
            if (likedRecs.includes(id)) {
                // Deselect if already liked
                setLikedRecs(prev => prev.filter(sid => sid !== id));
            } else {
                // Select like and remove from disliked
                setLikedRecs(prev => [...prev, id]);
                setDislikedRecs(prev => prev.filter(sid => sid !== id));
            }
        } else {
            if (dislikedRecs.includes(id)) {
                // Deselect if already disliked
                setDislikedRecs(prev => prev.filter(sid => sid !== id));
            } else {
                // Select dislike and remove from liked
                setDislikedRecs(prev => [...prev, id]);
                setLikedRecs(prev => prev.filter(sid => sid !== id));
            }
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

    const filteredGenres = genres.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.appContainer}>
            <h1>nunvibe™</h1>
            {error && <div className={styles.error}>{error}</div>}
            {loading && <div className={styles.loading}>Loading...</div>}

            {step === "genre" && (
                <div>
                    <div className={styles.genreHeader}>
                        <h2>Pick 1-3 genres you like</h2>
                        <input
                            className={styles.searchBar}
                            type="text"
                            placeholder="Search genres..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.genreContainer}>
                        <div className={styles.genreChips}>
                            {filteredGenres.map(g => (
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
                    </div>
                    {selectedGenres.length > 0 && (
                        <div className={styles.selectedGenres}>
                            <span className={styles.selectedLabel}>Selected:</span>
                            <div className={styles.selectedGenreList}>
                                {selectedGenres.map(genreId => {
                                    const genre = genres.find(g => g.id === genreId);
                                    return (
                                        <span key={genreId} className={styles.selectedGenre}>
                                            {genre?.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
                    <p className={styles.description}>
                        Like or dislike songs to help us recommend better music for you!
                    </p>
                    <ul className={styles.songList}>
                        {Array.isArray(sampleSongs) && sampleSongs.length > 0 ? sampleSongs.map(song => (
                            <li key={song.uri} className={styles.songItem}>
                                <div className={styles.songInfo}>
                                    <div className={styles.songTitle}>{song.name}</div>
                                    <div className={styles.songArtist}>
                                        <img src="/artist-icon.png" alt="artist" className={styles.artistIcon} />
                                        {song.artist}
                                    </div>
                                </div>
                                <GenericIcon
                                    icon="like"
                                    onClick={() => handleSampleFeedback(song.uri, true)}
                                    className={
                                        likedSamples.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.liked}`
                                            : styles.feedbackBtn
                                    }
                                    onHoverStyle={{
                                        transform: "scale(var(--scale))"
                                    }}
                                />
                                <GenericIcon
                                    icon="dislike"
                                    onClick={() => handleSampleFeedback(song.uri, false)}
                                    className={
                                        dislikedSamples.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.disliked}`
                                            : styles.feedbackBtn
                                    }
                                    onHoverStyle={{
                                        transform: "scale(var(--scale))"
                                    }}
                                />
                            </li>
                        )) : (
                            <li className={styles.noSamples}>No samples found.</li>
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
                    <p className={styles.description}>
                        Like or dislike songs to help us recommend better music for you!
                    </p>
                    <ul className={styles.songList}>
                        {recommendations.map(song => (
                            <li key={song.uri} className={styles.songItem}>
                                <div className={styles.songInfo}>
                                    <div className={styles.songTitle}>{song.name}</div>
                                    <div className={styles.songArtist}>
                                        <img src="/artist-icon.png" alt="artist" className={styles.artistIcon} />
                                        {song.artist}
                                    </div>
                                </div>
                                <GenericIcon
                                    icon="like"
                                    onClick={() => handleRecFeedback(song.uri, true)}
                                    className={
                                        likedRecs.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.liked}`
                                            : styles.feedbackBtn
                                    }
                                    onHoverStyle={{
                                        transform: "scale(var(--scale))"
                                    }}
                                />
                                <GenericIcon
                                    icon="dislike"
                                    onClick={() => handleRecFeedback(song.uri, false)}
                                    className={
                                        dislikedRecs.includes(song.uri)
                                            ? `${styles.feedbackBtn} ${styles.disliked}`
                                            : styles.feedbackBtn
                                    }
                                    onHoverStyle={{
                                        transform: "scale(var(--scale))"
                                    }}
                                />
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

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerText}>
                        {isTablet || isMobile ? (
                            <>
                                <strong>nunvibe™</strong> Music Recommender &copy; {currentYear} <br /> A project by <strong>Joumana</strong> and <strong>Somto</strong>
                            </>
                        ) : (
                            <>
                                <strong>nunvibe™</strong> Music Recommender &copy; {currentYear}, a project by <strong>Joumana</strong> and <strong>Somto</strong>
                            </>
                        )}
                    </div>
                    <div className={styles.footerIcons}>
                        <GenericIcon
                            icon="info"
                            onClick={() => setShowModal(true)}
                            className={styles.footerIcon}
                            onHoverStyle={{
                                transform: "scale(1.1)",
                                color: "var(--primary)"
                            }}
                        />
                        <GenericIcon
                            icon="github"
                            onClick={() => window.open("https://github.com/Joumanasalahedin/nunvibe", "_blank")}
                            className={styles.footerIcon}
                            onHoverStyle={{
                                transform: "scale(1.1)",
                                color: "var(--primary)"
                            }}
                        />
                        <GenericIcon
                            icon="email"
                            onClick={() => window.open("mailto:somtochukwu.mbuko@stud.th-deg.de", "_blank")}
                            className={styles.footerIcon}
                            onHoverStyle={{
                                transform: "scale(1.1)",
                                color: "var(--primary)"
                            }}
                        />
                    </div>
                </div>
            </footer>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>About nunvibe™</h3>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowModal(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <p>
                                nunvibe™ is an intelligent music recommendation system that learns your taste
                                through genre selection and song feedback to provide personalized music suggestions.
                            </p>
                            <p>
                                Our AI-powered algorithm analyzes your preferences to discover new songs
                                that match your unique musical taste.
                            </p>
                            <div className={styles.modalLinks}>
                                <a
                                    href="https://github.com/Joumanasalahedin/nunvibe"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.modalLink}
                                >
                                    <GenericIcon icon="github" className={styles.modalLinkIcon} />
                                    View on GitHub
                                </a>
                                <a
                                    href="mailto:somtochukwu.mbuko@stud.th-deg.de"
                                    className={styles.modalLink}
                                >
                                    <GenericIcon icon="email" className={styles.modalLinkIcon} />
                                    Contact Us
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
