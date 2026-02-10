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
import { Mic, FileAudio, ExternalLink, Activity, Settings, History } from 'lucide-react';

function App() {
  const [transcript, setTranscript] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [keywords, setKeywords] = useState(["solution", "price", "urgent"]); // Demo keywords
  const [scorecards, setScorecards] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleTranscriptUpdate = (newText) => {
    setTranscript(prev => prev + newText);
  };

  const handleAnalysisComplete = async (data) => {
    setAnalysisData(data);
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                ClevrComm Transcriber
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500 hidden sm:block mr-2">
                Powered by Gemini Live
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
              <AudioRecorder onTranscriptUpdate={handleTranscriptUpdate} />
              <FileUpload
                onAnalysisComplete={handleAnalysisComplete}
                context={{ keywords, scorecard: scorecards.length > 0 ? scorecards[0] : null }}
              />
            </div>

            {/* Right Column: Transcript & Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {analysisData ? (
                <AnalysisPanel data={analysisData} />
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
