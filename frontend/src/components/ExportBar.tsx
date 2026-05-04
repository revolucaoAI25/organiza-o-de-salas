import { FileText, Table, Map, RefreshCw } from 'lucide-react';
import { Session } from '../types';
import { exportUrl } from '../services/api';

interface Props {
  session: Session;
  onRegenerate: () => void;
}

export default function ExportBar({ session, onRegenerate }: Props) {
  function download(type: 'pdf' | 'pdf-map' | 'xlsx') {
    window.open(exportUrl(session.id, type), '_blank');
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
          <button
            className="btn-secondary text-xs"
            onClick={() => download('pdf')}
            title="Lista textual — uma página por sala"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF Listas
          </button>
          <button
            className="btn-secondary text-xs"
            onClick={() => download('pdf-map')}
            title="Mapa visual de carteiras"
          >
            <Map className="w-3.5 h-3.5" />
            PDF Mapa
          </button>
          <button
            className="btn-secondary text-xs"
            onClick={() => download('xlsx')}
            title="Planilha com aba por sala"
          >
            <Table className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            className="btn-primary text-xs"
            onClick={onRegenerate}
            title="Embaralhar novamente com as mesmas configurações"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar
          </button>
        </div>
      </div>
    </div>
  );
}
