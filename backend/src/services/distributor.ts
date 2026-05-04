import { Allocation, Room, SessionConfig, Student } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Proportional round-robin interleaving.
 * Ensures each room gets roughly the same ratio of each grade as the whole cohort.
 */
function interleaveGrades(
  g1: Student[],
  g2: Student[],
  g3: Student[]
): Student[] {
  const total = g1.length + g2.length + g3.length;
  if (total === 0) return [];

  const groups = [g1, g2, g3];
  const pointers = [0, 0, 0];
  const result: Student[] = [];

  for (let i = 0; i < total; i++) {
    let best = -1;
    let bestBehind = -Infinity;
    for (let g = 0; g < 3; g++) {
      if (pointers[g] >= groups[g].length) continue;
      const quota = ((i + 1) * groups[g].length) / total;
      const behind = quota - pointers[g];
      if (behind > bestBehind) {
        bestBehind = behind;
        best = g;
      }
    }
    if (best >= 0) result.push(groups[best][pointers[best]++]);
  }
  return result;
}

/**
 * Within a single room's student list, attempt to reduce adjacent same-class
 * occurrences by swapping. Works row by row.
 */
function reduceAdjacentSameClass(
  students: Student[],
  seatsPerRow: number
): Student[] {
  const arr = [...students];
  const maxSwaps = arr.length * 2;

  for (let pass = 0; pass < maxSwaps; pass++) {
    let swapped = false;
    for (let i = 0; i < arr.length - 1; i++) {
      // Only check within the same row
      const sameRow = Math.floor(i / seatsPerRow) === Math.floor((i + 1) / seatsPerRow);
      if (!sameRow) continue;
      if (arr[i].classCode && arr[i].classCode === arr[i + 1].classCode) {
        // Find a candidate to swap arr[i+1] with (different row or different class)
        let swapIdx = -1;
        for (let j = i + 2; j < arr.length; j++) {
          if (arr[j].classCode !== arr[i].classCode) {
            swapIdx = j;
            break;
          }
        }
        if (swapIdx >= 0) {
          [arr[i + 1], arr[swapIdx]] = [arr[swapIdx], arr[i + 1]];
          swapped = true;
        }
      }
    }
    if (!swapped) break;
  }
  return arr;
}

export function distribute(
  students: Student[],
  config: SessionConfig
): Room[] {
  const { maxPerRoom, rows, seatsPerRow } = config;

  const g1 = shuffle(students.filter(s => s.grade === '1ª SÉRIE'));
  const g2 = shuffle(students.filter(s => s.grade === '2ª SÉRIE'));
  const g3 = shuffle(students.filter(s => s.grade === '3ª SÉRIE'));

  const interleaved = interleaveGrades(g1, g2, g3);

  const rooms: Room[] = [];
  const chunkSize = maxPerRoom;

  for (let i = 0; i < interleaved.length; i += chunkSize) {
    const chunk = interleaved.slice(i, i + chunkSize);
    const roomStudents = reduceAdjacentSameClass(chunk, seatsPerRow);
    const roomNumber = Math.floor(i / chunkSize) + 1;

    const allocations: Allocation[] = roomStudents.map((student, idx) => ({
      studentName: student.name,
      studentId: student.studentId,
      grade: student.grade,
      classCode: student.classCode,
      rowNumber: Math.floor(idx / seatsPerRow) + 1,
      seatNumber: (idx % seatsPerRow) + 1,
    }));

    const stats = {
      grade1: roomStudents.filter(s => s.grade === '1ª SÉRIE').length,
      grade2: roomStudents.filter(s => s.grade === '2ª SÉRIE').length,
      grade3: roomStudents.filter(s => s.grade === '3ª SÉRIE').length,
    };

    rooms.push({
      roomNumber,
      roomName: `Sala ${roomNumber.toString().padStart(2, '0')}`,
      allocations,
      stats,
    });
  }

  return rooms;
}
