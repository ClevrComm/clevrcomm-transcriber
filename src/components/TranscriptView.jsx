import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Download, User, Clock, Play, MessageCircle, X } from 'lucide-react';
import TranscriptChat from './TranscriptChat';

export default function TranscriptView({ text, keywords = [], onTimestampClick, audioUrl, transcript }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [keywordOccurrences, setKeywordOccurrences] = useState({});
    const [currentOccurrenceIndex, setCurrentOccurrenceIndex] = useState({});
    const transcriptRefs = useRef({});

    // Parse potentially streaming JSON data
    const processedText = useMemo(() => {
        if (Array.isArray(text)) return text;
        if (typeof text !== 'string') return text || "";

        // Attempt to extract JSON objects from strict or loose format
        // Matches { "speaker": ... } patterns even if stuck together
        const jsonPattern = /\{"speaker":\s*".*?"(?:,\s*"time":\s*".*?")?(?:,\s*"text":\s*".*?")?\}/g;
        const matches = text.match(jsonPattern);

        if (matches && matches.length > 0) {
            try {
                // Parse each match and filter out failures
                const parsed = matches
                    .map(m => {
                        try { return JSON.parse(m); } catch { return null; }
                    })
                    .filter(Boolean);

                if (parsed.length > 0) return parsed;
            } catch (e) {
                console.warn("Failed to parse realtime JSON", e);
            }
        }

        return text;
    }, [text]);

    // Determine if text is a structured array or legacy string
    const isStructured = Array.isArray(processedText);

    // Detect keywords in transcript
    const detectedKeywords = useMemo(() => {
        if (!processedText || !keywords || keywords.length === 0) return [];

        const fullText = isStructured
            ? processedText.map(t => t.text).join(' ').toLowerCase()
            : (processedText || '').toLowerCase();

        return keywords.filter(keyword =>
            fullText.includes(keyword.toLowerCase())
        );
    }, [processedText, keywords, isStructured]);

    // Build keyword occurrence map
    useEffect(() => {
        if (!processedText || !isStructured) return;

        const occurrences = {};
        detectedKeywords.forEach(keyword => {
            occurrences[keyword] = [];
            processedText.forEach((entry, index) => {
                if (entry.text && entry.text.toLowerCase().includes(keyword.toLowerCase())) {
                    occurrences[keyword].push(index);
                }
            });
        });
        setKeywordOccurrences(occurrences);

        // Initialize current index for each keyword
        const initialIndices = {};
        detectedKeywords.forEach(keyword => {
            initialIndices[keyword] = 0;
        });
        setCurrentOccurrenceIndex(initialIndices);
    }, [processedText, detectedKeywords, isStructured]);

    const handleKeywordClick = (keyword) => {
        const occurrences = keywordOccurrences[keyword];
        if (!occurrences || occurrences.length === 0) return;

        const currentIdx = currentOccurrenceIndex[keyword] || 0;
        const transcriptIndex = occurrences[currentIdx];

        // Scroll to the transcript entry
        const element = transcriptRefs.current[transcriptIndex];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight briefly
            element.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
            }, 2000);
        }

        // Move to next occurrence for next click
        setCurrentOccurrenceIndex(prev => ({
            ...prev,
            [keyword]: (currentIdx + 1) % occurrences.length
        }));
    };

    const filteredTranscript = useMemo(() => {
        if (!processedText) return [];
        if (!isStructured) return [{ text: processedText, speaker: 'Speaker', time: '' }];

        return processedText.filter(entry =>
            (entry.text && entry.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (entry.speaker && entry.speaker.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [processedText, searchTerm, isStructured]);

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
            content = processedText.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n\n');
        } else {
            content = processedText;
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 shrink-0 gap-4">
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

            {/* Main Content Area - Split View */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Transcript - Flexible Width & Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {!processedText ? (
                        <div className="text-gray-400 italic text-center mt-10">Waiting for input...</div>
                    ) : (
                        <div className="space-y-6 pb-20">
                            {isStructured ? (
                                filteredTranscript.length > 0 ? (
                                    filteredTranscript.map((entry, index) => (
                                        <div
                                            key={index}
                                            ref={el => transcriptRefs.current[index] = el}
                                            className="flex gap-4 group transition-all duration-300 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <div className="flex flex-col items-center min-w-[60px] pt-1 shrink-0">
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
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                    {entry.speaker}
                                                </div>
                                                <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
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
                                    {highlightText(processedText)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Detected Keywords Sidebar - Fixed Width & Scrollable */}
                {detectedKeywords.length > 0 && (
                    <div className="w-72 border-l border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col shrink-0">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                Detected Keywords ({detectedKeywords.length})
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {detectedKeywords.map((keyword, idx) => {
                                const count = keywordOccurrences[keyword]?.length || 0;
                                const currentIdx = currentOccurrenceIndex[keyword] || 0;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleKeywordClick(keyword)}
                                        className="w-full group flex items-center justify-start gap-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all text-left"
                                        title={`Jump to next occurrence of "${keyword}"`}
                                    >
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                                            {keyword}
                                        </span>
                                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${count > 0
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {count > 1 ? `${currentIdx + 1}/${count}` : count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Chat Button */}
            {transcript && (
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
                    title="Ask AI about transcript"
                >
                    {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </button>
            )}

            {/* Chat Popup Modal */}
            {isChatOpen && transcript && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl rounded-xl overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <TranscriptChat transcript={transcript} />
                </div>
            )}
        </div>
    );
}
