import { useEffect, useState } from 'react';
import { Clock, Trash2, ExternalLink, Users, DoorOpen, RefreshCw } from 'lucide-react';
import { Session } from '../types';
import { deleteSession, listSessions } from '../services/api';

interface Props {
  onOpen: (session: Session) => void;
  currentSessionId?: string;
}

export default function HistoryPanel({ onOpen, currentSessionId }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Remover esta sessão do histórico?')) return;
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhuma distribuição gerada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Histórico de Distribuições</h3>
        <button onClick={load} className="p-1 text-slate-400 hover:text-slate-700 rounded" title="Atualizar">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {sessions.map(session => (
        <div
          key={session.id}
          onClick={() => onOpen(session)}
          className={`group flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            session.id === currentSessionId
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
            <DoorOpen className="w-4 h-4 text-slate-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{session.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">
                {new Date(session.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <DoorOpen className="w-3 h-3" />
                {session.totalRooms} salas
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {session.totalStudents} alunos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              title="Abrir"
              onClick={(e) => { e.stopPropagation(); onOpen(session); }}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              title="Remover"
              onClick={(e) => handleDelete(session.id, e)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
