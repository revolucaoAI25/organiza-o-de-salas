import fs from 'fs';
import path from 'path';
import { Session } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const INDEX_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

function readIndex(): Session[] {
  ensureDirs();
  if (!fs.existsSync(INDEX_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeIndex(sessions: Session[]) {
  ensureDirs();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(sessions, null, 2));
}

export function saveSession(session: Session): void {
  ensureDirs();
  // Save full data (with rooms) to individual file
  const sessionFile = path.join(SESSIONS_DIR, `${session.id}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

  // Save metadata (without rooms) to index
  const index = readIndex();
  const meta: Session = {
    id: session.id,
    name: session.name,
    createdAt: session.createdAt,
    config: session.config,
    totalStudents: session.totalStudents,
    totalRooms: session.totalRooms,
  };
  const existing = index.findIndex(s => s.id === session.id);
  if (existing >= 0) {
    index[existing] = meta;
  } else {
    index.unshift(meta);
  }
  writeIndex(index);
}

export function listSessions(): Session[] {
  return readIndex();
}

export function getSession(id: string): Session | null {
  ensureDirs();
  const sessionFile = path.join(SESSIONS_DIR, `${id}.json`);
  if (!fs.existsSync(sessionFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  } catch {
    return null;
  }
}

export function deleteSession(id: string): boolean {
  ensureDirs();
  const sessionFile = path.join(SESSIONS_DIR, `${id}.json`);
  if (fs.existsSync(sessionFile)) fs.unlinkSync(sessionFile);
  const index = readIndex().filter(s => s.id !== id);
  writeIndex(index);
  return true;
}
