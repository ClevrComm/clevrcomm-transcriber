import React from 'react';
import { Search } from 'lucide-react';

export default function KeywordsSidebar({
    detectedKeywords = [],
    keywordOccurrences = {},
    currentOccurrenceIndex = {},
    onKeywordClick,
}) {
    // Use keywords directly from props to respect Settings order
    // Filter to show all, or just highlight found ones.
    // The requirement is "list the detected keywords based on the order in the settings keywords"
    // So we iterate `detectedKeywords` (which is `keywords` from App.jsx) directly.

    const foundCount = detectedKeywords.filter(k => (keywordOccurrences[k]?.length || 0) > 0).length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-auto max-h-[300px] lg:h-[600px] lg:max-h-none">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-3 h-3" />
                    Detected Keywords ({foundCount}/{detectedKeywords.length})
                </h3>
            </div>

            {/* Flowing keyword pills */}
            <div className="flex-1 overflow-y-auto p-2.5">
                <div className="flex flex-wrap gap-1.5">
                    {detectedKeywords.map((keyword, idx) => {
                        const count = keywordOccurrences[keyword]?.length || 0;
                        const currentIdx = currentOccurrenceIndex[keyword] || 0;
                        const isFound = count > 0;
                        return (
                            <button
                                key={idx}
                                onClick={() => isFound && onKeywordClick?.(keyword)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-[11px] transition-all whitespace-nowrap ${isFound
                                    ? 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer'
                                    : 'border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 cursor-default opacity-60'
                                    }`}
                                title={isFound ? `Jump to next occurrence of "${keyword}"` : `"${keyword}" not found in transcript`}
                            >
                                <span className={`font-medium truncate max-w-[120px] ${!isFound ? 'line-through' : ''}`}>{keyword}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isFound
                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                    }`}>
                                    {count > 1 ? `${currentIdx + 1}/${count}` : count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
