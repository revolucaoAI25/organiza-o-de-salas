import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Session } from './types';

// ── Supabase client (optional) ─────────────────────────────────────────────
let supabase: SupabaseClient | null = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );
  console.log('[storage] Using Supabase');
} else {
  console.log('[storage] Using local file storage (set SUPABASE_URL + SUPABASE_SERVICE_KEY to enable Supabase)');
}

const TABLE = 'exam_sessions';

// ── File-based fallback ────────────────────────────────────────────────────
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
  try { return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')); } catch { return []; }
}

function writeIndex(sessions: Session[]) {
  ensureDirs();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(sessions, null, 2));
}

function saveToFile(session: Session) {
  ensureDirs();
  fs.writeFileSync(path.join(SESSIONS_DIR, `${session.id}.json`), JSON.stringify(session, null, 2));
  const index = readIndex();
  const meta: Session = {
    id: session.id, name: session.name, createdAt: session.createdAt,
    config: session.config, totalStudents: session.totalStudents, totalRooms: session.totalRooms,
  };
  const i = index.findIndex(s => s.id === session.id);
  if (i >= 0) index[i] = meta; else index.unshift(meta);
  writeIndex(index);
}

function readFromFile(id: string): Session | null {
  ensureDirs();
  const f = path.join(SESSIONS_DIR, `${id}.json`);
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
}

function deleteFromFile(id: string): boolean {
  ensureDirs();
  const f = path.join(SESSIONS_DIR, `${id}.json`);
  if (fs.existsSync(f)) fs.unlinkSync(f);
  writeIndex(readIndex().filter(s => s.id !== id));
  return true;
}

// ── Public API (always async) ──────────────────────────────────────────────

export async function saveSession(session: Session): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from(TABLE).upsert({
      id: session.id,
      name: session.name,
      created_at: session.createdAt,
      config: session.config,
      total_students: session.totalStudents,
      total_rooms: session.totalRooms,
      rooms: session.rooms ?? null,
    });
    if (error) throw new Error(`Supabase saveSession: ${error.message}`);
    return;
  }
  saveToFile(session);
}

export async function listSessions(): Promise<Session[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, created_at, config, total_students, total_rooms')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Supabase listSessions: ${error.message}`);
    return (data ?? []).map(r => ({
      id: r.id, name: r.name, createdAt: r.created_at,
      config: r.config, totalStudents: r.total_students, totalRooms: r.total_rooms,
    }));
  }
  return readIndex();
}

export async function getSession(id: string): Promise<Session | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id, name: data.name, createdAt: data.created_at,
      config: data.config, totalStudents: data.total_students,
      totalRooms: data.total_rooms, rooms: data.rooms ?? undefined,
    };
  }
  return readFromFile(id);
}

export async function deleteSession(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(`Supabase deleteSession: ${error.message}`);
    return true;
  }
  return deleteFromFile(id);
}
