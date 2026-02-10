import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { GeminiLiveService } from '../services/gemini';
import { Mic, Square, Loader } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; // Ensure user provides this

export default function AudioRecorder({ onTranscriptUpdate, persona }) {
    const [isConnected, setIsConnected] = useState(false);
    const geminiService = useRef(new GeminiLiveService(API_KEY));
    const [duration, setDuration] = useState(0);
    const timerRef = useRef(null);

    const handleAudioData = useCallback((arrayBuffer) => {
        if (!isConnected) return;

        // Convert ArrayBuffer to Base64
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



    // Cleanup on unmount
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
            // Pass the persona's system instruction
            geminiService.current.connect((data) => {
                // Handle incoming data - emit immediately for low latency
                if (data.serverContent?.modelTurn?.parts) {
                    const text = data.serverContent.modelTurn.parts
                        .map(p => p.text || '')
                        .filter(t => t.length > 0)
                        .join("");

                    if (text) {
                        // Emit text immediately - no buffering
                        onTranscriptUpdate(text);
                    }
                }
            }, persona?.instruction);
            setIsConnected(true);
        } catch (error) {
            console.error("Failed to start recording or connect to Gemini:", error);
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
        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xl font-semibold text-gray-800 dark:text-white">
                Live Transcription
            </div>

            <div className="flex flex-col items-center gap-6">

                {/* Visualizer Area */}
                <div className="w-full min-h-[80px] flex items-center justify-center">
                    {isRecording ? (
                        <AudioVisualizer stream={stream} isRecording={isRecording} />
                    ) : (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-4">
                            <div className="mb-2 text-sm font-medium">Ready to record</div>
                            <div className="w-64 h-1 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
                                <div className="w-full h-full bg-indigo-500/20"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timer */}
                <div className="text-4xl font-mono font-bold tracking-wider text-gray-700 dark:text-gray-200 tabular-nums">
                    {formatTime(duration)}
                </div>

                {/* Controls */}
                {!isRecording ? (
                    <button
                        onClick={handleStart}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all transform hover:scale-105"
                    >
                        <Mic className="w-5 h-5" />
                        Start Listening
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all transform hover:scale-105 animate-pulse"
                    >
                        <Square className="w-5 h-5" />
                        Stop Recording
                    </button>
                )}

                {isRecording && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Loader className="w-4 h-4 animate-spin" />
                        Listening & Processing...
                    </div>
                )}
            </div>
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
