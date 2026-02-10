import React from 'react';
import { FileText, Tag, BarChart } from 'lucide-react';
import TranscriptView from './TranscriptView';

export default function AnalysisPanel({ data }) {
    if (!data) return null;

    const { transcript, summary, keywords, sentiment } = data;

    return (
        <div className="space-y-6">
            {/* Transcript View */}
            <TranscriptView text={transcript} keywords={keywords} />

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Summary</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {summary || "No summary available."}
                </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Keywords */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4 text-emerald-600">
                        <Tag className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Keywords</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {keywords && keywords.length > 0 ? (
                            keywords.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                                    {kw}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-400 text-sm">No keywords detected</span>
                        )}
                    </div>
                </div>

                {/* Sentiment */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4 text-amber-600">
                        <BarChart className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Sentiment</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
                        {sentiment || "Unknown"}
                    </div>
                </div>
            </div>

            {/* Scorecard Results */}
            {data.scorecard && data.scorecard.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4 text-purple-600">
                        <BarChart className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Scorecard Evaluation</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 uppercase text-xs text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Criteria</th>
                                    <th className="px-4 py-3">Score</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Reasoning</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.scorecard.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.criteria}</td>
                                        <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{item.score}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.reasoning}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
