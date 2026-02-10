import React, { useState } from 'react';
import { FileText, Tag, BarChart3, CheckCircle, AlertCircle, MinusCircle, Download } from 'lucide-react';
import TranscriptView from './TranscriptView';
import TranscriptChat from './TranscriptChat';
import AudioPlayer from './AudioPlayer';
import { generatePDF } from '../utils/pdfExport';

// Helper function to render the scorecard
const renderScorecard = (scorecardData) => {
    if (!scorecardData || scorecardData.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">No scorecard data available for this session.</div>
        );
    }
    return (
        <div className="space-y-4">
            {scorecardData.map((item, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                {item.criteria}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.reasoning}
                            </p>
                        </div>
                        <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${item.score?.toString().toLowerCase().includes('yes') || item.score > 7 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            item.score?.toString().toLowerCase().includes('no') || item.score < 4 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            {item.score?.toString().toLowerCase().includes('yes') ? <CheckCircle className="w-4 h-4" /> :
                                item.score?.toString().toLowerCase().includes('no') ? <AlertCircle className="w-4 h-4" /> :
                                    <MinusCircle className="w-4 h-4" />}
                            {item.score}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default function AnalysisPanel({ data, audioUrl }) {
    const [activeTab, setActiveTab] = useState('summary');
    const [seekTime, setSeekTime] = useState(null);

    // Handle timestamp click - convert MM:SS to seconds
    const handleTimestampClick = (timeString) => {
        if (!timeString) return;
        const parts = timeString.split(':');
        const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        setSeekTime(seconds);
    };

    if (!data) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <nav className="flex -mb-px flex-1">
                    {['Summary', 'Scorecard', 'Transcript'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`
                                py-4 px-6 text-sm font-medium border-b-2 transition-colors
                                ${activeTab === tab.toLowerCase()
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
                <button
                    onClick={() => generatePDF(data)}
                    className="mr-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                    title="Export as PDF"
                >
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'summary' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Executive Summary
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {data.summary}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    Sentiment Analysis
                                </h3>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                                            {data.sentiment}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${data.sentiment?.toLowerCase().includes('positive') ? 'bg-green-500' :
                                                data.sentiment?.toLowerCase().includes('negative') ? 'bg-red-500' : 'bg-yellow-500'
                                                }`}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-indigo-500" />
                                    Keywords Detected
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.keywords?.map((keyword, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'scorecard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {renderScorecard(data.scorecard)}
                    </div>
                )}

                {activeTab === 'transcript' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
                        {audioUrl && (
                            <AudioPlayer
                                audioUrl={audioUrl}
                                currentTime={seekTime}
                                onTimeUpdate={() => setSeekTime(null)}
                            />
                        )}
                        <TranscriptView
                            text={typeof data.transcript === 'string' ? [{ speaker: 'System', text: data.transcript, time: '' }] : data.transcript}
                            onTimestampClick={handleTimestampClick}
                            audioUrl={audioUrl}
                        />
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <TranscriptChat transcript={typeof data.transcript === 'string' ? data.transcript : data.transcript.map(t => `${t.time} [${t.speaker}]: ${t.text}`).join('\n')} />
                    </div>
                )}
            </div>
        </div>
    );
}
