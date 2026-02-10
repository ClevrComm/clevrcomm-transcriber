import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, keywords, setKeywords, scorecards, setScorecards }) {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('keywords');
    const [newKeyword, setNewKeyword] = useState("");
    const [newCriteria, setNewCriteria] = useState("");
    const [editingScorecard, setEditingScorecard] = useState(null); // or ID

    // --- Keywords Logic ---
    const addKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            setKeywords([...keywords, newKeyword.trim()]);
            setNewKeyword("");
        }
    };

    const removeKeyword = (kw) => {
        setKeywords(keywords.filter(k => k !== kw));
    };

    // --- Scorecards Logic ---
    // Simple structure: { id: string, name: string, criteria: string[] }
    const [tempScorecardName, setTempScorecardName] = useState("");
    const [tempCriteriaList, setTempCriteriaList] = useState([]);

    const addScorecard = () => {
        if (!tempScorecardName) return;
        const newCard = {
            id: Date.now().toString(),
            name: tempScorecardName,
            criteria: tempCriteriaList
        };
        setScorecards([...scorecards, newCard]);
        setTempScorecardName("");
        setTempCriteriaList([]);
    };

    const deleteScorecard = (id) => {
        setScorecards(scorecards.filter(s => s.id !== id));
    };

    const addCriteria = () => {
        if (newCriteria.trim()) {
            setTempCriteriaList([...tempCriteriaList, newCriteria.trim()]);
            setNewCriteria("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('keywords')}
                        className={`flex-1 py-3 font-medium text-sm transition-colors ${activeTab === 'keywords' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Keywords
                    </button>
                    <button
                        onClick={() => setActiveTab('scorecards')}
                        className={`flex-1 py-3 font-medium text-sm transition-colors ${activeTab === 'scorecards' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Scorecards
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'keywords' && (
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                                    placeholder="Enter keyword or phrase..."
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button onClick={addKeyword} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {keywords.map(kw => (
                                    <div key={kw} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                                        {kw}
                                        <button onClick={() => removeKeyword(kw)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {keywords.length === 0 && <p className="text-gray-400 text-sm">No keywords added yet.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'scorecards' && (
                        <div className="space-y-8">
                            {/* Create New */}
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Create New Scorecard</h3>
                                <input
                                    type="text"
                                    placeholder="Scorecard Name (e.g. Sales Call)"
                                    value={tempScorecardName}
                                    onChange={(e) => setTempScorecardName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add evaluation criteria..."
                                        value={newCriteria}
                                        onChange={(e) => setNewCriteria(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addCriteria()}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                    <button onClick={addCriteria} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                {tempCriteriaList.length > 0 && (
                                    <ul className="space-y-2">
                                        {tempCriteriaList.map((c, i) => (
                                            <li key={i} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                                <span>{c}</span>
                                                <button onClick={() => setTempCriteriaList(tempCriteriaList.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <button
                                    onClick={addScorecard}
                                    disabled={!tempScorecardName || tempCriteriaList.length === 0}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Save Scorecard
                                </button>
                            </div>

                            {/* Existing List */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Your Scorecards</h3>
                                {scorecards.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No scorecards created.</p>
                                ) : (
                                    scorecards.map(card => (
                                        <div key={card.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{card.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{card.criteria.length} criteria</div>
                                            </div>
                                            <button onClick={() => deleteScorecard(card.id)} className="text-gray-400 hover:text-red-500 transition">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:shadow-sm transition">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
