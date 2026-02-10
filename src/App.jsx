import React, { useState, useCallback, useMemo } from 'react';
import AudioRecorder from './components/AudioRecorder';
import FileUpload from './components/FileUpload';
import AnalysisPanel from './components/AnalysisPanel';
import TranscriptView from './components/TranscriptView';
import KeywordsSidebar from './components/KeywordsSidebar';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import ThemeToggle from './components/ThemeToggle';
import PasswordGate from './components/PasswordGate';
import { saveSession } from './services/storage';
import { PERSONAS } from './utils/personas';
import { Mic, FileAudio, ExternalLink, Activity, Settings, History, UserCircle, Loader } from 'lucide-react';
import ClevrCommLogo from './components/ClevrCommLogo';

function App() {
  const [transcript, setTranscript] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  // Default keywords if none in storage
  const DEFAULT_KEYWORDS = [
    "solution", "price", "urgent",
    "Vivianite", "Solution provider", "Federal", "Autopay", "Paperless",
    "Visa", "Mastercard", "Credit card", "Quote", "Secure method",
    "Upgrade", "Accessory", "Accessories", "Wifi", "Add", "Add-a-line",
    "Household", "Watch", "Tablet", "Internet", "Fiber"
  ];

  const [keywords, setKeywords] = useState(() => {
    const saved = localStorage.getItem('clevrcomm_keywords');
    return saved ? JSON.parse(saved) : DEFAULT_KEYWORDS;
  });

  // Persist keywords
  React.useEffect(() => {
    localStorage.setItem('clevrcomm_keywords', JSON.stringify(keywords));
  }, [keywords]);
  const [scorecards, setScorecards] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS.general.id);
  const [textSize, setTextSize] = useState('text-sm');

  // Two-pass processing stage: 'idle' | 'transcribing' | 'analyzing' | 'done'
  const [processingStage, setProcessingStage] = useState('idle');

  // Compute keyword occurrences at App level (works for both TranscriptView and AnalysisPanel states)
  const keywordOccurrences = useMemo(() => {
    if (!keywords || keywords.length === 0) return {};

    // Get transcript text from whichever source is available
    let transcriptEntries = null;
    let plainText = '';

    if (analysisData && processingStage === 'done') {
      // From analysis data (structured array or string)
      if (Array.isArray(analysisData.transcript)) {
        transcriptEntries = analysisData.transcript;
      } else if (typeof analysisData.transcript === 'string') {
        plainText = analysisData.transcript;
      }
    } else if (transcript) {
      plainText = transcript;
    }

    const occurrences = {};
    keywords.forEach(keyword => {
      occurrences[keyword] = [];
      const kw = keyword.toLowerCase();

      if (transcriptEntries) {
        transcriptEntries.forEach((entry, index) => {
          if (entry.text && entry.text.toLowerCase().includes(kw)) {
            occurrences[keyword].push(index);
          }
        });
      } else if (plainText) {
        const lower = plainText.toLowerCase();
        let pos = 0;
        while ((pos = lower.indexOf(kw, pos)) !== -1) {
          occurrences[keyword].push(pos);
          pos += kw.length;
        }
      }
    });
    return occurrences;
  }, [keywords, transcript, analysisData, processingStage]);

  const [currentOccurrenceIndex, setCurrentOccurrenceIndex] = useState({});
  const handleTranscriptUpdate = (newText) => {
    setTranscript(prev => prev + newText);
  };

  // Pass 1 streaming callback — append text as it arrives
  const handleTranscriptProgress = (chunkText, fullText, newAudioUrl) => {
    setProcessingStage('transcribing');
    setTranscript(fullText);
    if (newAudioUrl && newAudioUrl !== audioUrl) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(newAudioUrl);
    }
    // Clear analysis data during transcription to show TranscriptView
    setAnalysisData(null);
  };

  // Stage transition callback from FileUpload
  const handleStageChange = (stage) => {
    setProcessingStage(stage);
  };

  // Pass 2 complete callback — structured analysis ready
  const handleAnalysisComplete = async (data) => {
    const { audioUrl: newAudioUrl, ...analysisResult } = data;

    setAnalysisData(analysisResult);
    setProcessingStage('done');

    if (newAudioUrl) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
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
      console.warn("Failed to save session", e);
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
    setProcessingStage('done');
  };

  // Handle keyword click from external sidebar → trigger scroll in TranscriptView
  const handleExternalKeywordClick = useCallback((keyword) => {
    const occurrences = keywordOccurrences[keyword];
    if (!occurrences || occurrences.length === 0) return;

    // Cycle through occurrences
    const currentIdx = currentOccurrenceIndex[keyword] || 0;
    setCurrentOccurrenceIndex(prev => ({
      ...prev,
      [keyword]: (currentIdx + 1) % occurrences.length
    }));

    if (window.__transcriptKeywordClick) {
      window.__transcriptKeywordClick(keyword);
    }
  }, [keywordOccurrences, currentOccurrenceIndex]);

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
          <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center">
              <ClevrCommLogo className="h-8" />
              <div className="hidden sm:block mx-3 h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
              <h1 className="hidden sm:block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transcriber
              </h1>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hidden sm:block mr-1 border border-blue-100 dark:border-blue-900/50">
                Powered by Gemini Live
              </div>

              {/* Persona Selector */}
              <div className="relative group hidden md:block mr-1">
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className="appearance-none bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium py-1 pl-2 pr-6 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {Object.values(PERSONAS).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <UserCircle className="w-2.5 h-2.5 text-indigo-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <ThemeToggle />
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="History"
              >
                <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-4 py-4">
          {/* Processing Stage Indicator */}
          {processingStage !== 'idle' && processingStage !== 'done' && (
            <div className="mb-4 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-300">
              <Loader className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                  {processingStage === 'transcribing'
                    ? 'Pass 1: Transcribing audio — words appearing in real time...'
                    : 'Pass 2: Analyzing transcript — generating summary, keywords, and scorecard...'}
                </div>
                <div className="mt-1 w-full h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${processingStage === 'transcribing'
                      ? 'bg-blue-500 w-1/2 animate-pulse'
                      : 'bg-green-500 w-3/4 animate-pulse'
                      }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══ RESPONSIVE 3-COLUMN GRID LAYOUT ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-4 lg:gap-6">

            {/* LEFT COLUMN: Compact Controls */}
            <div className="space-y-2.5 lg:order-1">
              <FileUpload
                onAnalysisComplete={handleAnalysisComplete}
                onTranscriptProgress={handleTranscriptProgress}
                onStageChange={handleStageChange}
                context={{ keywords, scorecard: scorecards.length > 0 ? scorecards[0] : null }}
              />
              <AudioRecorder
                onTranscriptUpdate={handleTranscriptUpdate}
                persona={PERSONAS[selectedPersona]}
              />
            </div>

            {/* CENTER COLUMN: Transcript / Analysis (maximum width) */}
            <div className="lg:order-2">
              {analysisData && processingStage === 'done' ? (
                <AnalysisPanel data={analysisData} audioUrl={audioUrl} settingsKeywords={keywords} />
              ) : (
                <TranscriptView
                  text={transcript}
                  keywords={keywords}
                  isStreaming={processingStage === 'transcribing'}
                  showKeywords={false}
                  textSize={textSize}
                  setTextSize={setTextSize}
                />
              )}
            </div>

            {/* RIGHT COLUMN: Keywords Sidebar */}
            <div className="lg:order-3">
              <KeywordsSidebar
                detectedKeywords={keywords}
                keywordOccurrences={keywordOccurrences}
                currentOccurrenceIndex={currentOccurrenceIndex}
                onKeywordClick={handleExternalKeywordClick}
              />
            </div>

          </div>
        </main>
      </div>
    </PasswordGate>
  );
}

export default App;
