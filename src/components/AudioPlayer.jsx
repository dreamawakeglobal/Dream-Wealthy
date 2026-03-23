import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

import './AudioPlayer.css';

const AudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(true);
    const audioRef = useRef(null);
    
    // Web Audio refs for mobile
    const audioCtxRef = useRef(null);
    const gainNodeRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const hasRoutedAudio = useRef(false);

    // Try to auto-play when the component mounts
    useEffect(() => {
        if (audioRef.current) {
            // Initial fallback volume for PC
            audioRef.current.volume = 0.025;

            // Set up Web Audio API to force volume reduction on iOS/Android
            // where physical 'volume' props on <audio> are completely ignored by the OS.
            const attachWebAudioGain = () => {
                if (!audioCtxRef.current && audioRef.current && !hasRoutedAudio.current) {
                    try {
                        const AudioContext = window.AudioContext || window.webkitAudioContext;
                        if (AudioContext) {
                            audioCtxRef.current = new AudioContext();
                            gainNodeRef.current = audioCtxRef.current.createGain();
                            
                            // Apply the exact 2.5% volume via mathematical Gain
                            gainNodeRef.current.gain.value = 0.025;
                            
                            // Connect the HTML5 audio element into the Gain Node
                            sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
                            sourceNodeRef.current.connect(gainNodeRef.current);
                            gainNodeRef.current.connect(audioCtxRef.current.destination);
                            
                            // Since GainNode handles it globally now, we must reset the physical 
                            // <audio> tag volume to 1.0 so Desktop doesn't double-mute itself!
                            audioRef.current.volume = 1.0;
                            hasRoutedAudio.current = true;
                        }
                    } catch (err) {
                        console.error("Web Audio API routing failed (CORS/Autoplay):", err);
                    }
                }
                
                // If context is suspended (autoplay policy), resume it
                if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
            };

            // Mobile browsers strictly require explicit user interaction to bind audio nodes
            window.addEventListener('click', attachWebAudioGain, { once: true });
            window.addEventListener('touchstart', attachWebAudioGain, { once: true });

            // Browsers often block autoplay on refresh unless the user interacts first.
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(() => {
                    console.log("Autoplay prevented by browser. User interaction required.");
                    setIsPlaying(false);
                });
            }
            
            return () => {
                window.removeEventListener('click', attachWebAudioGain);
                window.removeEventListener('touchstart', attachWebAudioGain);
            };
        }
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            // Ensure audio context is alive if they click play
            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            setIsPlaying(true);
        }
    };

    return (
        <div className="global-audio-player">
            <audio
                ref={audioRef}
                src="/background-music.mp3"
                crossOrigin="anonymous"
                loop
                preload="auto"
                autoPlay
            />
            <button
                className="audio-toggle-btn"
                onClick={togglePlay}
                title={isPlaying ? "Mute Background Music" : "Play Background Music"}
            >
                {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
        </div>
    );
};

export default AudioPlayer;
