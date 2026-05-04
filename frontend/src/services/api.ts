import { ParseResult, Session, SessionConfig, Student } from '../types';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function uploadFile(file: File): Promise<ParseResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  return handleResponse<ParseResult>(res);
}

export async function generateDistribution(
  students: Student[],
  config: SessionConfig
): Promise<Session> {
  const res = await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, config }),
  });
  return handleResponse<Session>(res);
}

export async function listSessions(): Promise<Session[]> {
  const res = await fetch(`${BASE}/sessions`);
  return handleResponse<Session[]>(res);
}

export async function getSession(id: string): Promise<Session> {
  const res = await fetch(`${BASE}/sessions/${id}`);
  return handleResponse<Session>(res);
}

export async function deleteSession(id: string): Promise<void> {
  await fetch(`${BASE}/sessions/${id}`, { method: 'DELETE' });
}

export function exportUrl(id: string, type: 'pdf' | 'pdf-map' | 'xlsx'): string {
  return `${BASE}/export/${id}/${type}`;
}
