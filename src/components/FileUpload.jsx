import React, { useState } from 'react';
import { Upload, FileAudio, Loader, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { analyzeAudioFile } from '../services/gemini';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export default function FileUpload({ onAnalysisComplete, context }) {
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState("");
    const [url, setUrl] = useState("");

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processFile(file);
    };

    const handleUrlSubmit = async () => {
        if (!url) return;
        setIsUploading(true);
        try {
            // Use local Vite proxy to bypass CORS
            // The URL path after 'https://cdn.discordapp.com' is what we need
            // Example: https://cdn.discordapp.com/attachments/... -> /discord-proxy/attachments/...

            let fetchUrl = url;

            if (import.meta.env.PROD) {
                // Production: Use Vercel Serverless Function
                fetchUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
            } else {
                // Development: Use Vite Proxy
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

        try {
            const base64Data = await fileToBase64(file);
            const result = await analyzeAudioFile(base64Data, file.type, API_KEY, context);
            onAnalysisComplete(result);
        } catch (error) {
            console.error("Analysis failed", error);
            alert(`Analysis failed: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* File Upload Section */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                        <FileAudio className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Upload Audio</h3>
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
            border-2 border-dashed rounded-lg p-6 text-center transition-all
            ${isUploading ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'}
            `}>
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2 text-indigo-600">
                                <Loader className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Analyzing...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Upload className="w-8 h-8" />
                                <span className="text-sm">Click to upload or drag & drop</span>
                                <span className="text-xs text-gray-400">MP3, WAV, M4A up to 20MB</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* URL Analyze Section */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                        <LinkIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Analyze URL</h3>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Paste audio URL (e.g. Discord)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="flex items-start gap-2 text-xs text-gray-400">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <span>Only works with public URLs that allow CORS (like Discord CDN).</span>
                    </div>
                    <button
                        onClick={handleUrlSubmit}
                        disabled={isUploading || !url}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isUploading ? <Loader className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                        Analyze URL
                    </button>
                </div>
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
