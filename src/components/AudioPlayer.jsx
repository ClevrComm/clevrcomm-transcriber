import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind, SkipBack, SkipForward, Settings } from 'lucide-react';

export default function AudioPlayer({ audioUrl, currentTime, onTimeUpdate }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only trigger if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    skip(-10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    skip(10);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying]); // Dep on isPlaying for latest value in closure if needed (though toggle uses ref usually)

    // Update playback rate
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Seek to specific time when currentTime prop changes
    useEffect(() => {
        if (audioRef.current && currentTime !== null && currentTime !== undefined) {
            audioRef.current.currentTime = currentTime;
            audioRef.current.play().catch(err => console.warn("Playback failed:", err));
            setIsPlaying(true);
        }
    }, [currentTime]);

    // Update playback time
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setPlaybackTime(audio.currentTime);
            if (onTimeUpdate) {
                onTimeUpdate(audio.currentTime);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [onTimeUpdate]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(err => console.warn("Playback failed:", err));
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        audio.currentTime = newTime;
        setPlaybackTime(newTime);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newVolume = parseFloat(e.target.value);
        audio.volume = newVolume;
        setVolume(newVolume);

        if (newVolume === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!audioUrl) return null;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlayPause}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="w-5 h-5" fill="currentColor" />
                    ) : (
                        <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                    )}
                </button>

                {/* Skip Buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => skip(-10)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Rewind 10s (Left Arrow)"
                    >
                        <div className="relative">
                            <SkipBack className="w-4 h-4" />
                            <span className="absolute -bottom-2 -right-1 text-[8px] font-bold">-10</span>
                        </div>
                    </button>
                    <button
                        onClick={() => skip(10)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Forward 10s (Right Arrow)"
                    >
                        <div className="relative">
                            <SkipForward className="w-4 h-4" />
                            <span className="absolute -bottom-2 -left-1 text-[8px] font-bold">+10</span>
                        </div>
                    </button>
                </div>

                {/* Time Display */}
                <div className="text-sm font-mono text-gray-600 dark:text-gray-400 min-w-[80px] shrink-0">
                    {formatTime(playbackTime)} / {formatTime(duration)}
                </div>

                {/* Progress Bar */}
                <div
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative group mx-2"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${(playbackTime / duration) * 100 || 0}%` }}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `${(playbackTime / duration) * 100 || 0}%`, transform: 'translate(-50%, -50%)' }}
                    />
                </div>

                {/* Speed Control */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="flex items-center gap-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        title="Playback Speed"
                    >
                        {playbackRate}x
                        <Settings className="w-3 h-3 ml-0.5 opacity-50" />
                    </button>
                    {showSpeedMenu && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[60px]">
                            {[0.5, 1.0, 1.25, 1.5, 2.0].map(rate => (
                                <button
                                    key={rate}
                                    onClick={() => {
                                        setPlaybackRate(rate);
                                        setShowSpeedMenu(false);
                                    }}
                                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${playbackRate === rate ? 'text-indigo-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={toggleMute}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4" />
                        ) : (
                            <Volume2 className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
            </div>
        </div>
    );
}
