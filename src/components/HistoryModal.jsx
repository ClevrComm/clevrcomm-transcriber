import React, { useEffect, useState } from 'react';
import { getSessions, deleteSession } from '../services/storage';
import { X, Trash2, Calendar, FileText } from 'lucide-react';

export default function HistoryModal({ isOpen, onClose, onLoadSession }) {
    if (!isOpen) return null;

    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadHistory();
    }, [isOpen]);

    const loadHistory = async () => {
        const list = await getSessions();
        // Sort descending
        setSessions(list.reverse());
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        await deleteSession(id);
        loadHistory();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">History</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {sessions.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">
                            No saved sessions yet.
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => { onLoadSession(session); onClose(); }}
                                className="group flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer transition-all"
                            >
                                <div className="flex gap-4">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                        <FileText className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {session.summary ? session.summary.slice(0, 50) + "..." : "Untitled Session"}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(session.timestamp).toLocaleString()}
                                            </span>
                                            {session.scorecardResult && (
                                                <span className="font-medium text-emerald-600">
                                                    Scorecard Available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, session.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
