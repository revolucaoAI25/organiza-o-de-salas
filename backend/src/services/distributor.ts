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

function buildRoom(
  roomStudents: Student[],
  roomNumber: number,
  roomName: string,
  seatsPerRow: number,
  building?: string,
  floor?: string,
): Room {
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

  return { roomNumber, roomName, building, floor, allocations, stats };
}

export function distribute(
  students: Student[],
  config: SessionConfig
): Room[] {
  const { maxPerRoom, rows: _rows, seatsPerRow } = config;

  const g1 = shuffle(students.filter(s => s.grade === '1ª SÉRIE'));
  const g2 = shuffle(students.filter(s => s.grade === '2ª SÉRIE'));
  const g3 = shuffle(students.filter(s => s.grade === '3ª SÉRIE'));

  const interleaved = interleaveGrades(g1, g2, g3);
  const rooms: Room[] = [];

  if (config.selectedRooms && config.selectedRooms.length > 0) {
    // Catalog mode: use only the minimum number of rooms needed, then distribute
    // proportionally so no room ends up with far fewer students than the others.
    const total = interleaved.length;

    // Step 1: find the minimum prefix of selected rooms whose combined capacity >= total
    let cumCap = 0;
    let roomCount = 0;
    for (const room of config.selectedRooms) {
      cumCap += room.capacity;
      roomCount++;
      if (cumCap >= total) break;
    }
    const activeRooms = config.selectedRooms.slice(0, roomCount);
    const totalActiveCap = activeRooms.reduce((s, r) => s + r.capacity, 0);

    // Step 2: proportional allocation using the largest-remainder method.
    // Each room gets floor(total * room.capacity / totalActiveCap); the
    // remaining students (due to rounding) go to the rooms with the largest
    // fractional remainder, one each.
    const rawShares = activeRooms.map(r => (total * r.capacity) / totalActiveCap);
    const floorShares = rawShares.map(x => Math.floor(x));
    const remainder = total - floorShares.reduce((s, c) => s + c, 0);
    rawShares
      .map((x, i) => ({ i, frac: x - floorShares[i] }))
      .sort((a, b) => b.frac - a.frac)
      .slice(0, remainder)
      .forEach(({ i }) => floorShares[i]++);

    let offset = 0;
    activeRooms.forEach((roomDef, i) => {
      const chunk = interleaved.slice(offset, offset + floorShares[i]);
      offset += chunk.length;
      const roomStudents = reduceAdjacentSameClass(chunk, seatsPerRow);
      rooms.push(buildRoom(roomStudents, i + 1, roomDef.name, seatsPerRow, roomDef.building, roomDef.floor));
    });
  } else {
    // Auto mode: split into equal chunks of maxPerRoom
    for (let i = 0; i < interleaved.length; i += maxPerRoom) {
      const chunk = interleaved.slice(i, i + maxPerRoom);
      const roomNumber = Math.floor(i / maxPerRoom) + 1;
      const roomStudents = reduceAdjacentSameClass(chunk, seatsPerRow);
      rooms.push(buildRoom(roomStudents, roomNumber, `Sala ${roomNumber.toString().padStart(2, '0')}`, seatsPerRow));
    }
  }

  return rooms;
}
