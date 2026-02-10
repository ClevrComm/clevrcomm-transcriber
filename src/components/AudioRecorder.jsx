import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { GeminiLiveService } from '../services/gemini';
import { Mic, Square, Loader } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export default function AudioRecorder({ onTranscriptUpdate, persona }) {
    const [isConnected, setIsConnected] = useState(false);
    const geminiService = useRef(new GeminiLiveService(API_KEY));
    const [duration, setDuration] = useState(0);
    const timerRef = useRef(null);

    const handleAudioData = useCallback((arrayBuffer) => {
        if (!isConnected) return;
        const base64 = arrayBufferToBase64(arrayBuffer);
        geminiService.current.sendAudioChunk(base64);
    }, [isConnected]);

    const { isRecording, startRecording, stopRecording, stream } = useAudioRecorder({ onAudioData: handleAudioData });

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setDuration(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    useEffect(() => {
        return () => {
            geminiService.current.disconnect();
        };
    }, []);

    const handleStart = async () => {
        if (!API_KEY) {
            alert("Please set VITE_GEMINI_API_KEY in .env");
            return;
        }

        try {
            await startRecording();
            geminiService.current.connect((data) => {
                if (data.serverContent?.modelTurn?.parts) {
                    const text = data.serverContent.modelTurn.parts
                        .map(p => p.text || '')
                        .filter(t => t.length > 0)
                        .join("");

                    if (text) {
                        onTranscriptUpdate(text);
                    }
                }
            }, persona?.instruction);
            setIsConnected(true);
        } catch (error) {
            console.warn("Failed to start recording or connect to Gemini:", error);
            alert("Could not start recording or connect to Gemini. Please check your microphone and API key.");
            setIsConnected(false);
        }
    };

    const handleStop = () => {
        stopRecording();
        geminiService.current.disconnect();
        setIsConnected(false);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            {/* Card Title */}
            <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md flex items-center justify-center">
                    <Mic className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Live</span>
            </div>

            {/* Status Bar */}
            <div className="w-full h-0.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-1.5 overflow-hidden">
                {isRecording && (
                    <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                )}
            </div>

            {!isRecording ? (
                <div className="text-[9px] text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-1">
                    Ready to record
                </div>
            ) : (
                <div className="text-[9px] text-red-500 mb-1.5 flex items-center gap-1">
                    <Loader className="w-2.5 h-2.5 animate-spin" />
                    Listening...
                </div>
            )}

            {/* Timer */}
            <div className="font-mono text-xl font-bold text-center text-gray-700 dark:text-gray-200 mb-2 tabular-nums">
                {formatTime(duration)}
            </div>

            {/* Button */}
            {!isRecording ? (
                <button
                    onClick={handleStart}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-[11px] font-semibold transition-all"
                >
                    <Mic className="w-3 h-3" />
                    Start
                </button>
            ) : (
                <button
                    onClick={handleStop}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[11px] font-semibold transition-all animate-pulse"
                >
                    <Square className="w-3 h-3" />
                    Stop
                </button>
            )}
        </div>
    );
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
