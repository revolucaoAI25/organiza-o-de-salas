import { useState } from 'react';
import { Settings, Loader2, AlertCircle, CalendarDays, Users, Rows, LayoutGrid } from 'lucide-react';
import { ParseResult, SessionConfig, Student } from '../types';
import { generateDistribution } from '../services/api';
import { Session } from '../types';

interface Props {
  students: Student[];
  parseResult: ParseResult;
  onBack: () => void;
  onGenerated: (session: Session) => void;
}

const defaultConfig: SessionConfig = {
  sessionName: '',
  examDate: new Date().toLocaleDateString('pt-BR'),
  institutionName: '',
  maxPerRoom: 40,
  rows: 6,
  seatsPerRow: 10,
};

export default function ConfigStep({ students, parseResult, onBack, onGenerated }: Props) {
  const [config, setConfig] = useState<SessionConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSeats = config.rows * config.seatsPerRow;
  const roomsNeeded = Math.ceil(students.length / config.maxPerRoom);
  const capacityOk = totalSeats >= config.maxPerRoom;

  function set<K extends keyof SessionConfig>(key: K, value: SessionConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    if (!config.sessionName.trim()) {
      setError('Informe o nome da aplicação/prova.');
      return;
    }
    if (!capacityOk) {
      setError(`Fileiras × Carteiras (${totalSeats}) deve ser ≥ máximo por sala (${config.maxPerRoom}).`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await generateDistribution(students, config);
      onGenerated(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar distribuição.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Configurações da Aplicação</h2>
        <p className="mt-1 text-slate-500 text-sm">
          {students.length} alunos importados · {parseResult.totals.grade1} de 1ª, {parseResult.totals.grade2} de 2ª, {parseResult.totals.grade3} de 3ª
        </p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Identification */}
        <Section icon={<Settings className="w-4 h-4" />} title="Identificação">
          <div className="space-y-3">
            <div>
              <label className="label">Nome da Aplicação / Prova *</label>
              <input
                className="input"
                placeholder="Ex: 2ª Avaliação Bimestral — Junho 2026"
                value={config.sessionName}
                onChange={e => set('sessionName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                  Data
                </label>
                <input
                  className="input"
                  placeholder="DD/MM/AAAA"
                  value={config.examDate}
                  onChange={e => set('examDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Instituição (opcional)</label>
                <input
                  className="input"
                  placeholder="Nome da escola"
                  value={config.institutionName}
                  onChange={e => set('institutionName', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Room settings */}
        <Section icon={<Users className="w-4 h-4" />} title="Capacidade das Salas">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Máximo por sala</label>
                <span className="text-lg font-bold text-blue-600">{config.maxPerRoom}</span>
              </div>
              <input
                type="range"
                min={10} max={45} step={1}
                value={config.maxPerRoom}
                onChange={e => set('maxPerRoom', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                <span>10</span>
                <span>45</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label mb-0">
                    <Rows className="w-3.5 h-3.5 inline mr-1" />
                    Fileiras
                  </label>
                  <span className="font-bold text-slate-700">{config.rows}</span>
                </div>
                <input
                  type="range"
                  min={1} max={12} step={1}
                  value={config.rows}
                  onChange={e => set('rows', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label mb-0">
                    <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />
                    Carteiras/fileira
                  </label>
                  <span className="font-bold text-slate-700">{config.seatsPerRow}</span>
                </div>
                <input
                  type="range"
                  min={1} max={15} step={1}
                  value={config.seatsPerRow}
                  onChange={e => set('seatsPerRow', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Preview */}
        <div className={`rounded-xl p-4 text-sm ${capacityOk ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`font-semibold mb-1 ${capacityOk ? 'text-blue-700' : 'text-red-700'}`}>
            Estimativa de distribuição
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <span>Salas necessárias:</span>
            <span className="font-bold text-slate-800">{roomsNeeded}</span>
            <span>Capacidade por sala:</span>
            <span className={`font-bold ${capacityOk ? 'text-slate-800' : 'text-red-600'}`}>
              {totalSeats} ({config.rows}×{config.seatsPerRow})
            </span>
            <span>Alunos por série/sala:</span>
            <span className="font-bold text-slate-800">
              ~{Math.round(parseResult.totals.grade1 / roomsNeeded)} · ~{Math.round(parseResult.totals.grade2 / roomsNeeded)} · ~{Math.round(parseResult.totals.grade3 / roomsNeeded)}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button className="btn-secondary" onClick={onBack} disabled={loading}>
            ← Voltar
          </button>
          <button className="btn-primary flex-1" onClick={handleGenerate} disabled={loading || !capacityOk}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando distribuição…</>
            ) : (
              'Gerar Distribuição →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
