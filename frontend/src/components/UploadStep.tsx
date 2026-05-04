import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { ParseResult, Student } from '../types';
import { uploadFile } from '../services/api';

interface Props {
  onContinue: (students: Student[], result: ParseResult) => void;
}

export default function UploadStep({ onContinue }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const data = await uploadFile(file);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao processar arquivo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((accepted: File[]) => {
      if (accepted[0]) processFile(accepted[0]);
    }, [processFile]),
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    multiple: false,
    disabled: loading,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Importar Planilha de Alunos</h2>
        <p className="mt-1 text-slate-500 text-sm">
          Envie o arquivo <strong>.xlsx</strong> com as colunas: AlunoNome, Ciclo2026, Turma2026, AlunoMatricula.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`card p-10 text-center cursor-pointer border-2 border-dashed transition-all ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        } ${loading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-600">Processando <strong>{fileName}</strong>…</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-blue-500" />
            <p className="text-blue-600 font-medium">Solte aqui para importar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-400" />
            <div>
              <p className="font-medium text-slate-700">Arraste o arquivo aqui</p>
              <p className="text-sm text-slate-400 mt-1">ou clique para selecionar (.xlsx / .xls)</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erro ao processar planilha</p>
            <p className="mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Result preview */}
      {result && !loading && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Planilha importada com sucesso!</span>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Total" value={result.totals.total} color="slate" icon={<Users className="w-4 h-4" />} />
            <Stat label="1ª Série" value={result.totals.grade1} color="blue" />
            <Stat label="2ª Série" value={result.totals.grade2} color="green" />
            <Stat label="3ª Série" value={result.totals.grade3} color="orange" />
          </div>

          {/* Preview table */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Primeiros 8 alunos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-3 py-2 font-medium text-slate-500 text-xs">Nome</th>
                    <th className="px-3 py-2 font-medium text-slate-500 text-xs">Série</th>
                    <th className="px-3 py-2 font-medium text-slate-500 text-xs">Turma</th>
                    <th className="px-3 py-2 font-medium text-slate-500 text-xs">Matrícula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.students.slice(0, 8).map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">{s.name}</td>
                      <td className="px-3 py-2">
                        <GradeBadge grade={s.grade} />
                      </td>
                      <td className="px-3 py-2 text-slate-600">{s.classCode}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{s.studentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.students.length > 8 && (
              <p className="text-xs text-slate-400 mt-2 text-center">
                + {result.students.length - 8} alunos não exibidos
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary" onClick={() => { setResult(null); setError(null); }}>
              Trocar arquivo
            </button>
            <button
              className="btn-primary flex-1"
              onClick={() => onContinue(result.students, result)}
            >
              Continuar para Configurações →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className={`rounded-lg p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-70 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export function GradeBadge({ grade }: { grade: string }) {
  if (grade === '1ª SÉRIE') return <span className="badge-grade-1">1ª Série</span>;
  if (grade === '2ª SÉRIE') return <span className="badge-grade-2">2ª Série</span>;
  if (grade === '3ª SÉRIE') return <span className="badge-grade-3">3ª Série</span>;
  return <span className="text-slate-500">{grade}</span>;
}
