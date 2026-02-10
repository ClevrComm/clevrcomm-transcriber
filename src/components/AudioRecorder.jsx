import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { GeminiLiveService } from '../services/gemini';
import { Mic, Square, Loader } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; // Ensure user provides this

export default function AudioRecorder({ onTranscriptUpdate }) {
    const [isConnected, setIsConnected] = useState(false);
    const geminiService = useRef(new GeminiLiveService(API_KEY));

    const handleAudioData = useCallback((arrayBuffer) => {
        if (!isConnected) return;

        // Convert ArrayBuffer to Base64
        const base64 = arrayBufferToBase64(arrayBuffer);
        geminiService.current.sendAudioChunk(base64);
    }, [isConnected]);

    const { isRecording, startRecording, stopRecording } = useAudioRecorder({ onAudioData: handleAudioData });

    useEffect(() => {
        // Cleanup on unmount
        return () => geminiService.current.disconnect();
    }, []);

    const handleStart = () => {
        if (!API_KEY) {
            alert("Please set VITE_GEMINI_API_KEY in .env");
            return;
        }

        geminiService.current.connect((data) => {
            // Handle incoming data
            if (data.serverContent?.modelTurn?.parts) {
                const text = data.serverContent.modelTurn.parts.map(p => p.text).join("");
                if (text) onTranscriptUpdate(text);
            }
        });
        setIsConnected(true);
        startRecording();
    };

    const handleStop = () => {
        stopRecording();
        geminiService.current.disconnect();
        setIsConnected(false);
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xl font-semibold text-gray-800 dark:text-white">
                Live Transcription
            </div>

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
