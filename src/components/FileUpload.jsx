import React, { useState } from 'react';
import { Upload, FileAudio, Loader, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { transcribeAudio, analyzeTranscript } from '../services/gemini';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export default function FileUpload({ onAnalysisComplete, onTranscriptProgress, onStageChange, context }) {
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState("");
    const [url, setUrl] = useState("");
    const [stage, setStage] = useState(""); // 'transcribing' | 'analyzing' | ''

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processFile(file);
    };

    const handleUrlSubmit = async () => {
        if (!url) return;
        setIsUploading(true);
        try {
            let fetchUrl = url;

            if (import.meta.env.PROD) {
                fetchUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
            } else {
                if (url.includes('cdn.discordapp.com')) {
                    fetchUrl = url.replace('https://cdn.discordapp.com', '/discord-proxy');
                } else {
                    fetchUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
                }
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            const blob = await response.blob();
            const file = new File([blob], "audio-url.mp3", { type: blob.type || "audio/mp3" });
            setFileName(url);
            await processFile(file);
        } catch (e) {
            console.error("URL fetch failed", e);
            alert("Failed to fetch audio from URL. It might be blocked by CORS or invalid.");
            setIsUploading(false);
            setStage("");
        }
    };

    const processFile = async (file) => {
        if (!API_KEY) {
            alert("Please set VITE_GEMINI_API_KEY in .env");
            setIsUploading(false);
            return;
        }

        setFileName(file.name || "Audio File");
        setIsUploading(true);

        const audioUrl = URL.createObjectURL(file);

        try {
            const base64Data = await fileToBase64(file);

            // ── PASS 1: Transcription (streamed plain text) ──
            setStage("transcribing");
            console.log("[FileUpload] Starting Pass 1: Transcription...");

            const fullTranscript = await transcribeAudio(
                base64Data,
                file.type,
                API_KEY,
                (chunkText, fullText) => {
                    if (onTranscriptProgress) {
                        onTranscriptProgress(chunkText, fullText, audioUrl);
                    }
                }
            );

            console.log("[FileUpload] Pass 1 complete. Starting Pass 2: Analysis...");

            // ── PASS 2: Analysis (text → structured JSON) ──
            setStage("analyzing");
            if (onStageChange) onStageChange('analyzing');

            const result = await analyzeTranscript(fullTranscript, API_KEY, context);

            console.log("[FileUpload] Pass 2 complete. Delivering results.");

            onAnalysisComplete({ ...result, audioUrl });
        } catch (error) {
            console.warn("Processing failed", error);
            alert(`Processing failed: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsUploading(false);
            setStage("");
        }
    };

    return (
        <div className="space-y-2.5">
            {/* File Upload Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md flex items-center justify-center">
                        <Upload className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Upload</span>
                </div>

                <div className="relative group">
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className={`
                        border-[1.5px] border-dashed rounded-lg p-3 text-center transition-all
                        ${isUploading ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'}
                    `}>
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-1 text-indigo-600">
                                <Loader className="w-5 h-5 animate-spin" />
                                <span className="text-[10px] font-medium">
                                    {stage === 'analyzing' ? 'Analyzing...' : 'Transcribing...'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-0.5 text-gray-400 dark:text-gray-500">
                                <Upload className="w-4 h-4" />
                                <span className="text-[10px]">Upload or drag file</span>
                                <span className="text-[9px] text-gray-300 dark:text-gray-600">MP3, WAV, M4A</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* URL Analyze Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md flex items-center justify-center">
                        <LinkIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">URL</span>
                </div>

                <input
                    type="text"
                    placeholder="Paste audio URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[10px] rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                />
                <button
                    onClick={handleUrlSubmit}
                    disabled={isUploading || !url}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-[11px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isUploading ? <Loader className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                    Analyze
                </button>
            </div>
        </div>
    );
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}
