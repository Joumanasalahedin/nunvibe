import { FC, useRef, useState, useEffect } from "react";

interface SpotifyPlayerProps {
    uri: string;
    onClose?: () => void;
}

const SpotifyPlayer: FC<SpotifyPlayerProps> = ({ uri, onClose }) => {
    const embedRef = useRef<HTMLDivElement>(null);
    const spotifyEmbedControllerRef = useRef<any>(null);
    const [iFrameAPI, setIFrameAPI] = useState<any>(undefined);
    const [playerLoaded, setPlayerLoaded] = useState(false);
    const [currentUri, setCurrentUri] = useState(uri);


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

    const onPauseClick = () => {
        if (spotifyEmbedControllerRef.current) {
            spotifyEmbedControllerRef.current.pause();
        }
    };

    const onPlayClick = () => {
        if (spotifyEmbedControllerRef.current) {
            spotifyEmbedControllerRef.current.play();
        }
    };

    return (
        <div style={{ width: "100%", background: "#181818", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", padding: 8, position: "relative" }}>
            {onClose && (
                <button onClick={onClose} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>&times;</button>
            )}
            <div ref={embedRef} />
            {!playerLoaded && <p style={{ color: "#fff", textAlign: "center" }}>Loading Spotify Player...</p>}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                <button aria-label="Play" onClick={onPlayClick} style={{ padding: 6, borderRadius: 4, border: "none", background: "#1db954", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Play</button>
                <button aria-label="Pause" onClick={onPauseClick} style={{ padding: 6, borderRadius: 4, border: "none", background: "#333", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Pause</button>
            </div>
        </div>
    );
};

export default SpotifyPlayer; 