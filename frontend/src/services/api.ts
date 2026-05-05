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
  return handleResponse<ParseResult>(await fetch(`${BASE}/upload`, { method: 'POST', body: form }));
}

export async function generateDistribution(students: Student[], config: SessionConfig): Promise<Session> {
  return handleResponse<Session>(await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, config }),
  }));
}

export async function listSessions(): Promise<Session[]> {
  return handleResponse<Session[]>(await fetch(`${BASE}/sessions`));
}

export async function getSession(id: string): Promise<Session> {
  return handleResponse<Session>(await fetch(`${BASE}/sessions/${id}`));
}

export async function deleteSession(id: string): Promise<void> {
  await fetch(`${BASE}/sessions/${id}`, { method: 'DELETE' });
}

export interface SeatPos { roomNumber: number; rowNumber: number; seatNumber: number; }

export async function swapSeats(sessionId: string, from: SeatPos, to: SeatPos): Promise<Session> {
  return handleResponse<Session>(await fetch(`${BASE}/sessions/${sessionId}/seats`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to }),
  }));
}

export function exportUrl(id: string, type: 'pdf' | 'pdf-map' | 'xlsx', extra?: string): string {
  const url = `${BASE}/export/${id}/${type}`;
  return extra ? `${url}?${extra}` : url;
}
