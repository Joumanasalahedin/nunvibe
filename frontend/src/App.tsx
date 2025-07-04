import { FC, useEffect, useState } from "react";
import GenericIcon from "./components/GenericIcon";
import styles from "./App.module.css";
import { useMediaQuery } from "react-responsive";
import SpotifyPlayer from "./components/SpotifyPlayer";

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
    const [songCount, setSongCount] = useState<number>(10);

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

    const [spotifyPlayerUri, setSpotifyPlayerUri] = useState<string | null>(null);
    const [spotifyPlayerAutoPlay, setSpotifyPlayerAutoPlay] = useState(false);

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

    const handleSongCountChange = (value: number) => {
        const clampedValue = Math.max(5, Math.min(20, value));
        setSongCount(clampedValue);
    };

    const filteredGenres = genres.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleUserLikeDislikeAction = (
        id: string,
        liked: boolean,
        type: 'sample' | 'recommendation'
    ) => {
        const stateConfig = {
            sample: {
                liked: { getter: likedSamples, setter: setLikedSamples },
                disliked: { getter: dislikedSamples, setter: setDislikedSamples }
            },
            recommendation: {
                liked: { getter: likedRecs, setter: setLikedRecs },
                disliked: { getter: dislikedRecs, setter: setDislikedRecs }
            }
        };

        const config = stateConfig[type];
        const targetState = liked ? config.liked : config.disliked;
        const oppositeState = liked ? config.disliked : config.liked;

        if (targetState.getter.includes(id)) {
            targetState.setter(prev => prev.filter(sid => sid !== id));
        } else {
            targetState.setter(prev => [...prev, id]);
            oppositeState.setter(prev => prev.filter(sid => sid !== id));
        }
    };

    const handleSampleFeedback = (
        id: string,
        liked: boolean
    ) => handleUserLikeDislikeAction(id, liked, 'sample');

    const handleRecFeedback = (
        id: string,
        liked: boolean
    ) => handleUserLikeDislikeAction(id, liked, 'recommendation');

    // TODO @Joumana: verify all API endpoints payloads

    const fetchSamples = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            selectedGenres.forEach(g => params.append("genres", g));
            params.append("limit", songCount.toString());
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
                    disliked_uris: dislikedSamples,
                    k: songCount
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
                    k: songCount
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

    const songCountSlider = (
        <div className={styles.songCountSelector}>
            <label htmlFor="songCount" className={styles.songCountLabel}>
                &#8470; of songs: {songCount}
            </label>
            <input
                id="songCount"
                type="range"
                min="5"
                step="1"
                max="20"
                value={songCount}
                onChange={(e) => handleSongCountChange(parseInt(e.target.value))}
                className={styles.songCountSlider}
            />
        </div>
    )

    return (
        <>
            <div className={styles.appContainer}>
                <div className={styles.mainContent}>
                    <h1>
                        <a href="/" className={styles.brandName}>
                            <img src="/favicon.png" alt="nunvibe logo" className={styles.brandIcon} />
                            <span className={styles.brandName}>nunvibe&trade;</span>
                        </a>
                    </h1>
                    {error && <div className={styles.error}>{error}</div>}
                    {loading && <div className={styles.loading}>Loading...</div>}

                    {step === "genre" && (
                        <div>
                            <div className={styles.genreHeader}>
                                <h2>Pick 1-3 genres you like</h2>
                                <div className={styles.headerControls}>
                                    {songCountSlider}
                                    <div className={styles.searchContainer}>
                                        <input
                                            className={styles.searchBar}
                                            type="text"
                                            placeholder="Search genres..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                        {search && (
                                            <button
                                                className={styles.clearButton}
                                                onClick={() => setSearch("")}
                                                type="button"
                                                aria-label="Clear search"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                                    <span className={styles.selectedLabel}>Selected genres:</span>
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
                            <div className={styles.stepHeader}>
                                <h2>Sample Songs</h2>
                                {songCountSlider}
                            </div>
                            <p className={styles.description}>
                                Like or dislike songs to help us recommend better music for you!
                            </p>
                            {selectedGenres.length > 0 && (
                                <div className={styles.selectedGenres}>
                                    <span className={styles.selectedLabel}>Selected genres:</span>
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
                            <ul className={styles.songList}>
                                {Array.isArray(sampleSongs) && sampleSongs.length > 0 ? sampleSongs.map((song, idx) => (
                                    <li key={song.uri + '-' + idx} className={styles.songItem}>
                                        <GenericIcon
                                            icon="play"
                                            onClick={() => {
                                                setSpotifyPlayerUri(song.uri);
                                                setSpotifyPlayerAutoPlay(true);
                                            }}
                                            className={styles.feedbackBtn}
                                            width={28}
                                            height={28}
                                            onHoverStyle={{
                                                transform: "scale(var(--icon-scale))"
                                            }}
                                            title="Play"
                                        />
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
                                            title="Like"
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
                                            title="Dislike"
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
                            <div className={styles.stepHeader}>
                                <h2>Recommended Songs</h2>
                                {songCountSlider}
                            </div>
                            <p className={styles.description}>
                                Like or dislike songs to help us recommend better music for you!
                            </p>
                            <ul className={styles.songList}>
                                {recommendations.map((song, idx) => (
                                    <li key={song.uri + '-' + idx} className={styles.songItem}>
                                        <GenericIcon
                                            icon="play"
                                            onClick={() => {
                                                setSpotifyPlayerUri(song.uri);
                                                setSpotifyPlayerAutoPlay(true);
                                            }}
                                            className={styles.feedbackBtn}
                                            width={28}
                                            height={28}
                                            onHoverStyle={{
                                                transform: "scale(var(--icon-scale))"
                                            }}
                                            title="Play"
                                        />
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
                                            title="Like"
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
                                            title="Dislike"
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
                {spotifyPlayerUri && (
                    <div className={styles.spotifyPlayerSidePanel}>
                        <SpotifyPlayer
                            uri={spotifyPlayerUri}
                            autoPlay={spotifyPlayerAutoPlay}
                            onDidAutoPlay={() => setSpotifyPlayerAutoPlay(false)}
                            onClose={() => setSpotifyPlayerUri(null)}
                            isLiked={
                                step === "samples"
                                    ? likedSamples.includes(spotifyPlayerUri)
                                    : likedRecs.includes(spotifyPlayerUri)
                            }
                            isDisliked={
                                step === "samples"
                                    ? dislikedSamples.includes(spotifyPlayerUri)
                                    : dislikedRecs.includes(spotifyPlayerUri)
                            }
                            onLike={() => {
                                if (step === "samples") {
                                    handleSampleFeedback(spotifyPlayerUri, true);
                                } else {
                                    handleRecFeedback(spotifyPlayerUri, true);
                                }
                            }}
                            onDislike={() => {
                                if (step === "samples") {
                                    handleSampleFeedback(spotifyPlayerUri, false);
                                } else {
                                    handleRecFeedback(spotifyPlayerUri, false);
                                }
                            }}
                        />
                    </div>
                )}
            </div>
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
                            title="About"
                        />
                        <GenericIcon
                            icon="github"
                            onClick={() => window.open("https://github.com/Joumanasalahedin/nunvibe", "_blank")}
                            className={styles.footerIcon}
                            title="View on GitHub"
                        />
                        <GenericIcon
                            icon="email"
                            onClick={() => window.open("mailto:somtochukwu.mbuko@stud.th-deg.de", "_blank")}
                            className={styles.footerIcon}
                            title="Email Us"
                        />
                    </div>
                </div>
            </footer>
        </>
    );
};

export default App;
