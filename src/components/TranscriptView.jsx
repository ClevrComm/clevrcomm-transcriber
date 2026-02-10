import React, { useMemo, useState } from 'react';
import { Search, Download, User, Clock, Play } from 'lucide-react';

export default function TranscriptView({ text, keywords = [], onTimestampClick, audioUrl }) {
    const [searchTerm, setSearchTerm] = useState("");

    // Determine if text is a structured array or legacy string
    const isStructured = Array.isArray(text);

    const filteredTranscript = useMemo(() => {
        if (!text) return [];
        if (!isStructured) return [{ text: text, speaker: 'Speaker', time: '' }];

        return text.filter(entry =>
            entry.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.speaker.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [text, searchTerm, isStructured]);

    const highlightText = (content) => {
        if (!content) return null;
        if (!keywords || keywords.length === 0) return content;

        const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
        const parts = content.split(regex);

        return parts.map((part, i) =>
            keywords.some(k => k.toLowerCase() === part.toLowerCase()) ? (
                <span key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 font-medium px-0.5 rounded">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    const handleDownload = () => {
        let content = "";
        if (isStructured) {
            content = text.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n\n');
        } else {
            content = text;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[500px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-xl gap-4">
                <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200 shrink-0">Conversation Transcript</h2>

                <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="relative max-w-xs w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto max-h-[600px] bg-gray-50/50 dark:bg-gray-900/50">
                {!text ? (
                    <div className="text-gray-400 italic text-center mt-10">Waiting for input...</div>
                ) : (
                    <div className="space-y-6">
                        {isStructured ? (
                            filteredTranscript.length > 0 ? (
                                filteredTranscript.map((entry, index) => (
                                    <div key={index} className="flex gap-4 group">
                                        <div className="flex flex-col items-center min-w-[60px] pt-1">
                                            <div className={`p-2 rounded-full mb-1 ${entry.speaker.includes('1') ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}>
                                                <User className="w-4 h-4" />
                                            </div>
                                            {entry.time && audioUrl ? (
                                                <button
                                                    onClick={() => onTimestampClick?.(entry.time)}
                                                    className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer hover:underline transition-colors group/time"
                                                    title="Click to play from this point"
                                                >
                                                    <Play className="w-2.5 h-2.5 opacity-0 group-hover/time:opacity-100 transition-opacity" fill="currentColor" />
                                                    {entry.time}
                                                </button>
                                            ) : (
                                                <div className="text-[10px] font-mono text-gray-400 flex items-center gap-0.5">
                                                    {entry.time}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                {entry.speaker}
                                            </div>
                                            <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
                                                {highlightText(entry.text)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-10">No matches found for "{searchTerm}"</div>
                            )
                        ) : (
                            // Legacy / Plain Text View
                            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                {highlightText(text)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
