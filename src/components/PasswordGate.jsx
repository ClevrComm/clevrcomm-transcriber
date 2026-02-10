import React, { useState, useEffect } from 'react';
import { Lock, ChevronRight, AlertCircle, Activity } from 'lucide-react';

const DEFAULT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || "clevr2026";

export default function PasswordGate({ children }) {
    const [password, setPassword] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const auth = localStorage.getItem('clevr_auth');
        if (auth === 'true') {
            setIsAuthorized(true);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === DEFAULT_PASSWORD) {
            localStorage.setItem('clevr_auth', 'true');
            setIsAuthorized(true);
            setError(false);
        } else {
            setError(true);
            setPassword("");
        }
    };

    if (isLoading) return null;

    if (isAuthorized) return children;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200 font-sans">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center">
                        <div className="inline-flex p-3 bg-white/20 rounded-xl mb-4 backdrop-blur-sm">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold mb-1">ClevrComm</h1>
                        <p className="text-indigo-100 text-sm">Enterprise Transcription & Analysis</p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6 text-slate-800 dark:text-slate-200">
                            <Lock className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-semibold">Restricted Access</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    Enter Team Access Code
                                </label>
                                <div className="relative group">
                                    <input
                                        autoFocus
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`
                      w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border 
                      rounded-xl outline-none transition-all
                      ${error
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white'}
                    `}
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 mt-2 text-red-500 text-xs animate-in slide-in-from-top-1 duration-200">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Invalid access code. Please try again.</span>
                                    </div>
                                )}
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                            <p className="text-xs text-slate-400">
                                Unauthorized access is prohibited. <br />
                                Contact your administrator for support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
