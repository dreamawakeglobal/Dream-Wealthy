import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AudioPlayer.css';

const AudioPlayer = () => {
    const { user } = useAuth();
    const [isPlaying, setIsPlaying] = useState(true);
    const audioRef = useRef(null);

    // Try to auto-play when the component mounts
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.025;

            // Browsers often block autoplay on refresh unless the user interacts first.
            // We initiate a play attempt and catch any AbortErrors.
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.log("Autoplay prevented by browser. User interaction required.");
                    setIsPlaying(false);
                });
            }
        }
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="global-audio-player">
            <audio
                ref={audioRef}
                src="/background-music.mp3"
                loop
                preload="auto"
                autoPlay
            />
            {user && (
                <button
                    className="audio-toggle-btn"
                    onClick={togglePlay}
                    title={isPlaying ? "Mute Background Music" : "Play Background Music"}
                >
                    {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            )}
        </div>
    );
};

export default AudioPlayer;
