import React from 'react';
import { AppStep } from '../types';

const STEPS: { key: AppStep; label: string; number: number }[] = [
  { key: 'upload', label: 'Importar Planilha', number: 1 },
  { key: 'config', label: 'Configurações', number: 2 },
  { key: 'result', label: 'Resultado', number: 3 },
];

interface Props {
  current: AppStep;
}

export default function StepIndicator({ current }: Props) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <nav className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  done
                    ? 'bg-blue-600 text-white'
                    : active
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  active ? 'font-semibold text-slate-900' : done ? 'text-blue-600 font-medium' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-16 mx-2 shrink-0 ${i < currentIdx ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
