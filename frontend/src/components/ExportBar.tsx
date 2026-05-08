import { FileText, Table, Map, RefreshCw, Users, ClipboardList } from 'lucide-react';
import { Session } from '../types';
import { exportUrl } from '../services/api';

interface Props {
  session: Session;
  onRegenerate: () => void;
}

function getBoardPositions(sessionId: string): Record<number, string> {
  try {
    const raw = localStorage.getItem(`boardPos-${sessionId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export default function ExportBar({ session, onRegenerate }: Props) {
  function download(type: 'pdf' | 'pdf-map' | 'pdf-turmas' | 'pdf-assinaturas' | 'xlsx') {
    let extra: string | undefined;
    if (type === 'pdf-map') {
      const positions = getBoardPositions(session.id);
      if (Object.keys(positions).length > 0) {
        extra = `positions=${encodeURIComponent(JSON.stringify(positions))}`;
      }
    }
    window.open(exportUrl(session.id, type, extra), '_blank');
  }

  return (
    <div className="card p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{session.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {session.totalRooms} salas · {session.totalStudents} alunos · {session.config.examDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary text-xs" onClick={() => download('pdf')}
            title="Lista de alunos por sala">
            <FileText className="w-3.5 h-3.5" /> PDF por Sala
          </button>
          <button className="btn-secondary text-xs" onClick={() => download('pdf-turmas')}
            title="Lista de alunos por turma">
            <Users className="w-3.5 h-3.5" /> PDF por Turma
          </button>
          <button className="btn-secondary text-xs" onClick={() => download('pdf-assinaturas')}
            title="Lista de presença com linha de assinatura">
            <ClipboardList className="w-3.5 h-3.5" /> Lista de Presença
          </button>
          <button className="btn-secondary text-xs" onClick={() => download('pdf-map')}
            title="Mapa visual de carteiras">
            <Map className="w-3.5 h-3.5" /> PDF Mapa
          </button>
          <button className="btn-secondary text-xs" onClick={() => download('xlsx')}
            title="Planilha com aba por sala">
            <Table className="w-3.5 h-3.5" /> Excel
          </button>
          <button className="btn-primary text-xs" onClick={onRegenerate}
            title="Embaralhar novamente">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerar
          </button>
        </div>
      </div>
    </div>
  );
}
