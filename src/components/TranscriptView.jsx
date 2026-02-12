import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Search, Download, User, Clock, Play, MessageCircle, X, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import TranscriptChat from './TranscriptChat';

export default function TranscriptView({
    text,
    keywords = [],
    onTimestampClick,
    audioUrl,
    transcript,
    isStreaming = false,
    showKeywords = true,
    textSize = 'text-sm',
    setTextSize,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [keywordOccurrences, setKeywordOccurrences] = useState({});
    const [currentOccurrenceIndex, setCurrentOccurrenceIndex] = useState({});

    // Search Highlight & Jump State
    const [searchMatches, setSearchMatches] = useState([]); // Array of { index: number, subIndex: number }
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

    const transcriptRefs = useRef({});
    const streamEndRef = useRef(null);

    // Determine the display mode:
    // - During streaming (Pass 1): text is a plain string, show as-is
    // - After analysis (Pass 2): text is a structured array from AnalysisPanel
    const isStructured = Array.isArray(text);
    const displayText = isStructured ? text : (text || "");

    // Auto-scroll during streaming
    useEffect(() => {
        if (isStreaming && streamEndRef.current) {
            streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [displayText, isStreaming]);

    // Build keyword occurrence map for highlighting only (internal usage)
    useEffect(() => {
        if (!displayText) return;

        const occurrences = {};
        const initialIndices = {};

        // Use all passed keywords
        keywords.forEach(keyword => {
            occurrences[keyword] = [];
            initialIndices[keyword] = 0;

            if (isStructured) {
                displayText.forEach((entry, index) => {
                    if (entry.text && entry.text.toLowerCase().includes(keyword.toLowerCase())) {
                        occurrences[keyword].push(index);
                    }
                });
            } else {
                // Plain text: count all non-overlapping matches
                const lower = (displayText || '').toLowerCase();
                const kw = keyword.toLowerCase();
                let pos = 0;
                while ((pos = lower.indexOf(kw, pos)) !== -1) {
                    occurrences[keyword].push(pos);
                    pos += kw.length;
                }
            }
        });

        setKeywordOccurrences(occurrences);
        setCurrentOccurrenceIndex(initialIndices);
    }, [displayText, keywords, isStructured]);

    // Calculate Search Matches
    useEffect(() => {
        if (!searchTerm || !displayText) {
            setSearchMatches([]);
            setCurrentMatchIndex(0);
            return;
        }

        const matches = [];
        const lowerSearch = searchTerm.toLowerCase();

        if (isStructured) {
            displayText.forEach((entry, index) => {
                if (entry.text && entry.text.toLowerCase().includes(lowerSearch)) {
                    matches.push({ index, type: 'text' });
                } else if (entry.speaker && entry.speaker.toLowerCase().includes(lowerSearch)) {
                    matches.push({ index, type: 'speaker' });
                }
            });
        } else {
            // Plain text search logic could go here if needed, 
            // but usually we just highlight in the block.
            // For now, simple text matching.
        }

        setSearchMatches(matches);
        setCurrentMatchIndex(0); // Reset to first match
    }, [displayText, searchTerm, isStructured]);

    // Scroll to current search match
    useEffect(() => {
        if (searchMatches.length > 0 && transcriptRefs.current[searchMatches[currentMatchIndex]?.index]) {
            const element = transcriptRefs.current[searchMatches[currentMatchIndex].index];
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add temporary highlight effect
            element.classList.add('ring-2', 'ring-orange-400', 'bg-orange-50', 'dark:bg-orange-900/20');
            const timer = setTimeout(() => {
                element.classList.remove('ring-2', 'ring-orange-400', 'bg-orange-50', 'dark:bg-orange-900/20');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentMatchIndex, searchMatches]);

    const nextMatch = () => {
        if (searchMatches.length === 0) return;
        setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length);
    };

    const prevMatch = () => {
        if (searchMatches.length === 0) return;
        setCurrentMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
    };

    const handleKeywordClick = (keyword) => {
        const occurrences = keywordOccurrences[keyword];
        if (!occurrences || occurrences.length === 0) return;

        const currentIdx = currentOccurrenceIndex[keyword] || 0;
        const transcriptIndex = occurrences[currentIdx];

        const element = transcriptRefs.current[transcriptIndex];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20');
            }, 2000);
        }

        setCurrentOccurrenceIndex(prev => ({
            ...prev,
            [keyword]: (currentIdx + 1) % occurrences.length
        }));
    };

    // Allow parent to trigger keyword click (for external sidebar)
    useEffect(() => {
        if (window.__transcriptKeywordClick) return;
        window.__transcriptKeywordClick = handleKeywordClick;
        return () => { delete window.__transcriptKeywordClick; };
    });

    // Highlight text logic (Keywords + Search Terms)
    const highlightText = (content) => {
        if (!content) return null;
        if (isStreaming) return content;

        // 1. Highlight Keywords
        let parts = [content];
        if (keywords && keywords.length > 0) {
            const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
            parts = content.split(regex).map((part, i) => {
                if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
                    return <span key={`kw-${i}`} className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 font-medium px-0.5 rounded">{part}</span>;
                }
                return part;
            });
        }

        // 2. Highlight Search Term (in Orange) within the parts
        if (searchTerm) {
            parts = parts.flatMap((part, i) => {
                if (React.isValidElement(part)) return part; // Already highlighted keyword

                const regex = new RegExp(`(${searchTerm})`, 'gi');
                return part.split(regex).map((subPart, j) => {
                    if (subPart.toLowerCase() === searchTerm.toLowerCase()) {
                        return <span key={`search-${i}-${j}`} className="bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-orange-100 font-bold px-0.5 rounded">{subPart}</span>;
                    }
                    return subPart;
                });
            });
        }

        return parts;
    };

    const handleDownload = () => {
        let content = "";
        if (isStructured) {
            content = displayText.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n\n');
        } else {
            content = displayText;
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[50vh] lg:h-[600px] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 shrink-0 gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200 shrink-0">Conversation Transcript</h2>
                    {isStreaming && (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-[10px] font-medium">Live</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                    {!isStreaming && (
                        <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm">
                            <div className="relative w-32 sm:w-48">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-2 py-1 text-xs bg-transparent border-none rounded-l-md focus:ring-0 outline-none"
                                />
                            </div>

                            {/* Search Navigation Controls */}
                            {searchTerm && (
                                <div className="flex items-center border-l border-gray-200 dark:border-gray-600 px-1">
                                    <span className="text-[10px] text-gray-400 px-2 min-w-[50px] text-center">
                                        {searchMatches.length > 0 ? `${currentMatchIndex + 1} / ${searchMatches.length}` : '0 / 0'}
                                    </span>
                                    <button
                                        onClick={prevMatch}
                                        disabled={searchMatches.length === 0}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronUp className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <button
                                        onClick={nextMatch}
                                        disabled={searchMatches.length === 0}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-1 transition-colors group"
                                    >
                                        <X className="w-3 h-3 text-gray-400 group-hover:text-red-500" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Text Size Control */}
                    {setTextSize && (
                        <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden mr-2">
                            <button
                                onClick={() => setTextSize('text-xs')}
                                className={`px-2 py-1 text-xs font-medium border-r border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${textSize === 'text-xs' ? 'bg-gray-100 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                title="Small Text"
                            >
                                A
                            </button>
                            <button
                                onClick={() => setTextSize('text-sm')}
                                className={`px-2 py-1 text-sm font-medium border-r border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${textSize === 'text-sm' ? 'bg-gray-100 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                title="Medium Text"
                            >
                                A
                            </button>
                            <button
                                onClick={() => setTextSize('text-base')}
                                className={`px-2 py-1 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${textSize === 'text-base' ? 'bg-gray-100 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                title="Large Text"
                            >
                                A
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleDownload}
                        disabled={isStreaming || !displayText}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Transcript - Full Width */}
                <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                    {!displayText ? (
                        <div className="text-gray-400 italic text-center mt-10 text-sm">Waiting for input...</div>
                    ) : isStreaming ? (
                        /* ── STREAMING MODE: Plain text typewriter ── */
                        <div className="space-y-1 pb-20">
                            <div className={`font-mono leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 ${textSize}`}>
                                {displayText}
                                <span className="inline-block w-2 h-4 bg-blue-500 ml-0.5 animate-pulse rounded-sm" />
                            </div>
                            <div ref={streamEndRef} />
                        </div>
                    ) : (
                        /* ── STRUCTURED / PLAIN MODE ── */
                        <div className="space-y-3">
                            {isStructured ? (
                                displayText.length > 0 ? (
                                    displayText.map((entry, index) => (
                                        <div
                                            key={index}
                                            ref={el => transcriptRefs.current[index] = el}
                                            className="flex gap-3 group transition-all duration-300 rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <div className="flex flex-col items-center min-w-[48px] pt-1 shrink-0">
                                                <div className={`p-1.5 rounded-full mb-1 ${entry.speaker.includes('1') ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}>
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                                {entry.time && audioUrl ? (
                                                    <button
                                                        onClick={() => onTimestampClick?.(entry.time)}
                                                        className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                        title="Click to play from this point"
                                                    >
                                                        <Play className="w-2.5 h-2.5" fill="currentColor" />
                                                        {entry.time}
                                                    </button>
                                                ) : (
                                                    <div className="text-[10px] font-mono text-gray-400 mt-1">
                                                        {entry.time}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                                                    {entry.speaker}
                                                </div>
                                                <div className={`text-gray-800 dark:text-gray-200 leading-relaxed bg-white dark:bg-gray-800 p-2.5 rounded-lg rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow ${textSize}`}>
                                                    {highlightText(entry.text)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 py-10 text-sm">No matches found for "{searchTerm}"</div>
                                )
                            ) : (
                                // Legacy / Plain Text View (non-streaming)
                                <div className={`font-mono leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 ${textSize}`}>
                                    {highlightText(displayText)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Chat Button */}
            {transcript && (
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
                    title="Ask AI about transcript"
                >
                    {isChatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
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

