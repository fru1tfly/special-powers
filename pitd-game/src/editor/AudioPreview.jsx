import { useAudioEffects } from "../hooks/audio/useAudioEffects";

export default function AudioPreview({ audio, ...props }) {
    const audioRef = useAudioEffects(audio);

    if (!audio?.url) return <div className="no-audio-message">No audio added</div>;

    return (
        <audio
            {...props}
            ref={audioRef}
            crossOrigin="anonymous"
            controls
            src={`${import.meta.env.VITE_DOMAIN}/${audio.url}`}
        />
    );
}
