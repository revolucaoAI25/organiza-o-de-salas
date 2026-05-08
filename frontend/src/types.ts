export type Grade = '1ª SÉRIE' | '2ª SÉRIE' | '3ª SÉRIE';

export interface Student {
  name: string;
  grade: Grade;
  classCode: string;
  studentId: string;
  course: string;
}

export interface ParseResult {
  students: Student[];
  totals: {
    grade1: number;
    grade2: number;
    grade3: number;
    total: number;
  };
}

export interface Allocation {
  studentName: string;
  studentId: string;
  grade: string;
  classCode: string;
  rowNumber: number;
  seatNumber: number;
}

export interface RoomStats {
  grade1: number;
  grade2: number;
  grade3: number;
}

export interface Room {
  roomNumber: number;
  roomName: string;
  building?: string;
  floor?: string;
  allocations: Allocation[];
  stats: RoomStats;
}

export interface SessionConfig {
  sessionName: string;
  examDate: string;
  institutionName: string;
  maxPerRoom: number;
  rows: number;
  seatsPerRow: number;
  selectedRooms?: import('./data/rooms').RoomDefinition[];
}

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  config: SessionConfig;
  totalStudents: number;
  totalRooms: number;
  rooms?: Room[];
}

export type AppStep = 'upload' | 'config' | 'result';
