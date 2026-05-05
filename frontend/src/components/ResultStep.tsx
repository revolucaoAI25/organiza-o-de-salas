import { useState } from 'react';
import { List, LayoutGrid, Loader2 } from 'lucide-react';
import { Session, Student } from '../types';
import { generateDistribution } from '../services/api';
import RoomListView from './RoomListView';
import RoomMapView from './RoomMapView';
import ExportBar from './ExportBar';

type View = 'list' | 'map';

interface Props {
  session: Session;
  students: Student[];
  onBack: () => void;
  onNewSession: (session: Session) => void;
}

export default function ResultStep({ session: initialSession, students, onBack, onNewSession }: Props) {
  const [session, setSession] = useState<Session>(initialSession);
  const [view, setView] = useState<View>('list');
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  async function handleRegenerate() {
    setRegenerating(true);
    setRegenError(null);
    try {
      const newSession = await generateDistribution(students, session.config);
      setSession(newSession);
      onNewSession(newSession);
    } catch (e) {
      setRegenError(e instanceof Error ? e.message : 'Erro ao regenerar.');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Export / actions bar */}
      <ExportBar session={session} onRegenerate={handleRegenerate} />

      {regenerating && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando nova distribuição…
        </div>
      )}
      {regenError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{regenError}</div>
      )}

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <TabBtn active={view === 'list'} onClick={() => setView('list')}>
            <List className="w-3.5 h-3.5" />
            Lista
          </TabBtn>
          <TabBtn active={view === 'map'} onClick={() => setView('map')}>
            <LayoutGrid className="w-3.5 h-3.5" />
            Mapa de Sala
          </TabBtn>
        </div>

        <button
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
        >
          ← Nova importação
        </button>
      </div>

      {/* View content */}
      <div className="flex-1 min-h-0" style={{ minHeight: '500px' }}>
        {view === 'list' ? (
          <RoomListView rooms={session.rooms ?? []} />
        ) : (
          <RoomMapView session={session} onSessionUpdate={setSession} />
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}
