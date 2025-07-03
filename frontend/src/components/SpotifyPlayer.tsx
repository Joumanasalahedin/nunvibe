import { FC, useRef, useState, useEffect } from "react";
import GenericIcon from "./GenericIcon";
import styles from "./SpotifyPlayer.module.css";

interface SpotifyPlayerProps {
    uri: string;
    onClose?: () => void;
    isLiked?: boolean;
    isDisliked?: boolean;
    onLike?: () => void;
    onDislike?: () => void;
}

const SpotifyPlayer: FC<SpotifyPlayerProps> = ({
    uri,
    onClose,
    isLiked,
    isDisliked,
    onLike,
    onDislike
}) => {
    const embedRef = useRef<HTMLDivElement>(null);
    const spotifyEmbedControllerRef = useRef<any>(null);
    const [iFrameAPI, setIFrameAPI] = useState<any>(undefined);
    const [playerLoaded, setPlayerLoaded] = useState(false);
    const [currentUri, setCurrentUri] = useState(uri);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://open.spotify.com/embed/iframe-api/v1";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (iFrameAPI) return;
        (window as any).onSpotifyIframeApiReady = (SpotifyIframeApi: any) => {
            setIFrameAPI(SpotifyIframeApi);
        };
    }, [iFrameAPI]);

    useEffect(() => {
        if (playerLoaded || iFrameAPI === undefined) return;
        if (!embedRef.current) return;
        iFrameAPI.createController(
            embedRef.current,
            {
                width: "100%",
                height: "80",
                uri: currentUri,
            },
            (spotifyEmbedController: any) => {
                spotifyEmbedController.addListener("ready", () => {
                    setPlayerLoaded(true);
                });
                spotifyEmbedController.addListener("playback_update", (e: any) => {
                    const { isPaused, position, duration } = e.data;
                    if (isPaused) {
                        setIsPlaying(false);
                    } else if (typeof position === 'number' && typeof duration === 'number' && duration > 0 && position >= duration - 500) {
                        setIsPlaying(false);
                    } else {
                        setIsPlaying(true);
                    }
                });
                spotifyEmbedControllerRef.current = spotifyEmbedController;
            }
        );
        return () => {
            if (spotifyEmbedControllerRef.current) {
                spotifyEmbedControllerRef.current.removeListener("playback_update");
            }
        };
    }, [playerLoaded, iFrameAPI, currentUri]);

    useEffect(() => {
        if (uri !== currentUri) {
            setCurrentUri(uri);
            if (spotifyEmbedControllerRef.current) {
                spotifyEmbedControllerRef.current.loadUri(uri);
            }
        }
    }, [uri, currentUri]);

    const handlePlayStop = () => {
        if (!spotifyEmbedControllerRef.current) return;
        if (isPlaying) {
            spotifyEmbedControllerRef.current.pause();
        } else {
            spotifyEmbedControllerRef.current.play();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.topRow}>
                {onClose && (
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        &times;
                    </button>
                )}
                <button
                    aria-label={isPlaying ? "Stop" : "Play"}
                    onClick={handlePlayStop}
                    className={isPlaying ? styles.pauseButton : styles.playButton}
                    style={{ minWidth: 80, fontWeight: 700 }}
                >
                    {isPlaying ? "Stop" : "Play"}
                </button>
                <GenericIcon
                    icon="like"
                    onClick={onLike}
                    className={isLiked ? `${styles.feedbackBtn} ${styles.liked}` : styles.feedbackBtn}
                    onHoverStyle={{ transform: "scale(1.1)" }}
                />
                <GenericIcon
                    icon="dislike"
                    onClick={onDislike}
                    className={isDisliked ? `${styles.feedbackBtn} ${styles.disliked}` : styles.feedbackBtn}
                    onHoverStyle={{ transform: "scale(1.1)" }}
                />
            </div>
            <div ref={embedRef} className={styles.embed} />
            {!playerLoaded && <p className={styles.loading}>Loading Spotify Player...</p>}
        </div>
    );
};

export default SpotifyPlayer;
