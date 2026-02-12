import React, { useEffect, useState } from 'react';
import { getSessions, deleteSession } from '../services/storage';
import { X, Trash2, Calendar, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function HistoryModal({ isOpen, onClose, onLoadSession }) {
    if (!isOpen) return null;

    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadHistory();
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const list = await getSessions();
            // Sort descending by timestamp
            setSessions(list.sort((a, b) => b.timestamp - a.timestamp));
        } catch (error) {
            console.error("Failed to load history:", error);
            toast.error("Failed to load history");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this session?")) {
            try {
                await deleteSession(id);
                toast.success("Session deleted");
                loadHistory();
            } catch (error) {
                console.error("Failed to delete session:", error);
                toast.error("Failed to delete session");
            }
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "Unknown date";
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        }).format(date);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Session History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Clock className="w-12 h-12 mb-3 opacity-20" />
                            <p>No saved sessions yet.</p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => { onLoadSession(session); onClose(); }}
                                className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-900/50 rounded-xl cursor-pointer transition-all duration-200"
                            >
                                <div className="flex gap-4 items-center overflow-hidden">
                                    <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
                                            {session.summary ? session.summary.slice(0, 60) + (session.summary.length > 60 ? "..." : "") : "Untitled Session"}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(session.timestamp)}
                                            </span>
                                            {session.scorecardResult && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-medium border border-emerald-100 dark:border-emerald-900/30">
                                                    Scorecard
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, session.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Delete session"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Icon component since it was missing in imports
function History({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}
