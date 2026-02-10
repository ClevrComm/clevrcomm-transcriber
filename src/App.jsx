import React, { useState } from 'react';
import AudioRecorder from './components/AudioRecorder';
import FileUpload from './components/FileUpload';
import AnalysisPanel from './components/AnalysisPanel';
import TranscriptView from './components/TranscriptView';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import ThemeToggle from './components/ThemeToggle';
import PasswordGate from './components/PasswordGate';
import { saveSession } from './services/storage';
import { PERSONAS } from './utils/personas';
import { Mic, FileAudio, ExternalLink, Activity, Settings, History, UserCircle } from 'lucide-react';
import ClevrCommLogo from './components/ClevrCommLogo';

function App() {
  const [transcript, setTranscript] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [keywords, setKeywords] = useState([
    "solution", "price", "urgent",
    "Vivianite", "Solution provider", "Federal", "Autopay", "Paperless",
    "Visa", "Mastercard", "Credit card", "Quote", "Secure method",
    "Upgrade", "Accessory", "Accessories", "Wifi", "Add", "Add-a-line",
    "Household", "Watch", "Tablet", "Internet", "Fiber"
  ]);
  const [scorecards, setScorecards] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS.general.id);

  const handleTranscriptUpdate = (newText) => {
    setTranscript(prev => prev + newText);
  };

  const handleAnalysisComplete = async (data) => {
    // Extract audio URL if present
    const { audioUrl: newAudioUrl, ...analysisResult } = data;

    setAnalysisData(analysisResult);
    if (newAudioUrl) {
      // Clean up old blob URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(newAudioUrl);
    }

    if (data.transcript) {
      setTranscript(data.transcript);
    }

    // Auto-save session
    try {
      await saveSession({
        id: Date.now().toString(),
        transcript: data.transcript,
        summary: data.summary,
        keywords: data.keywords,
        sentiment: data.sentiment,
        scorecardResult: data.scorecard,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const loadSession = (session) => {
    setTranscript(session.transcript || "");
    setAnalysisData({
      transcript: session.transcript,
      summary: session.summary,
      keywords: session.keywords,
      sentiment: session.sentiment,
      scorecard: session.scorecardResult
    });
  };

  return (
    <PasswordGate>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          keywords={keywords}
          setKeywords={setKeywords}
          scorecards={scorecards}
          setScorecards={setScorecards}
        />

        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onLoadSession={loadSession}
        />

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center">
              <ClevrCommLogo className="h-10" />
              {/* Optional delimiter or app name */}
              <div className="hidden sm:block mx-4 h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <h1 className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transcriber
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hidden sm:block mr-2 border border-blue-100 dark:border-blue-900/50">
                Powered by Gemini Live
              </div>

              {/* Persona Selector */}
              <div className="relative group hidden md:block mr-2">
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className="appearance-none bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium py-1.5 pl-3 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {Object.values(PERSONAS).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <UserCircle className="w-3 h-3 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <ThemeToggle />
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="History"
              >
                <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Controls */}
            <div className="lg:col-span-1 space-y-6">
              <AudioRecorder
                onTranscriptUpdate={handleTranscriptUpdate}
                persona={PERSONAS[selectedPersona]}
              />
              <FileUpload
                onAnalysisComplete={handleAnalysisComplete}
                context={{ keywords, scorecard: scorecards.length > 0 ? scorecards[0] : null }}
              />
            </div>

            {/* Right Column: Transcript & Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {analysisData ? (
                <AnalysisPanel data={analysisData} audioUrl={audioUrl} />
              ) : (
                <TranscriptView text={transcript} keywords={keywords} />
              )}
            </div>

          </div>
        </main>
      </div>
    </PasswordGate>
  );
}

export default App;
