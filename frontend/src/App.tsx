import { useState } from 'react';
import { GraduationCap, History, X } from 'lucide-react';
import { AppStep, ParseResult, Session, Student } from './types';
import StepIndicator from './components/StepIndicator';
import UploadStep from './components/UploadStep';
import ConfigStep from './components/ConfigStep';
import ResultStep from './components/ResultStep';
import HistoryPanel from './components/HistoryPanel';
import { getSession } from './services/api';

export default function App() {
  const [step, setStep] = useState<AppStep>('upload');
  const [students, setStudents] = useState<Student[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  function handleUploaded(s: Student[], pr: ParseResult) {
    setStudents(s);
    setParseResult(pr);
    setStep('config');
  }

  function handleGenerated(s: Session) {
    setSession(s);
    setStep('result');
    setShowHistory(false);
  }

  async function handleOpenHistory(s: Session) {
    // Load full session (with rooms) from API
    try {
      const full = await getSession(s.id);
      setSession(full);
      setStep('result');
      setShowHistory(false);
    } catch {
      alert('Não foi possível carregar a sessão.');
    }
  }

  function handleNewSession(s: Session) {
    setSession(s);
  }

  function resetToUpload() {
    setStep('upload');
    setStudents([]);
    setParseResult(null);
    setSession(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={resetToUpload}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">Distribuição de Salas</p>
              <p className="text-[10px] text-slate-500 leading-tight">Ensino Médio</p>
            </div>
          </button>

          <div className="flex items-center gap-4">
            {step !== 'upload' && (
              <StepIndicator current={step} />
            )}
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                showHistory
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-blue-300'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          {step === 'upload' && (
            <UploadStep onContinue={handleUploaded} />
          )}
          {step === 'config' && parseResult && (
            <ConfigStep
              students={students}
              parseResult={parseResult}
              onBack={() => setStep('upload')}
              onGenerated={handleGenerated}
            />
          )}
          {step === 'result' && session && (
            <ResultStep
              session={session}
              students={students}
              onBack={resetToUpload}
              onNewSession={handleNewSession}
            />
          )}
        </main>

        {/* History sidebar */}
        {showHistory && (
          <aside className="w-80 shrink-0 border-l border-slate-200 bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Histórico
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <HistoryPanel
                onOpen={handleOpenHistory}
                currentSessionId={session?.id}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
