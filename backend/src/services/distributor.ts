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
      const sameRow = Math.floor(i / seatsPerRow) === Math.floor((i + 1) / seatsPerRow);
      if (!sameRow) continue;
      if (arr[i].classCode && arr[i].classCode === arr[i + 1].classCode) {
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

/**
 * Assigns row/seat positions, respecting the configured layout while avoiding
 * near-empty rows.
 *
 * Rules (priority order):
 *  1. Use at least configRows rows — the layout the user set.
 *  2. Add extra rows only when students overflow configRows × seatsPerRow:
 *       - Overflow ≤ 3: absorb into existing rows (tiny seatsPerRow overrun).
 *       - Overflow > 3: add one more row, distribute evenly across all.
 *  3. Use fewer than configRows only if spreading across all rows would give
 *     < 3 students per row (avoids rows with just 1-2 students).
 *
 * Students are always spread evenly across the chosen number of rows.
 */
function assignSeats(students: Student[], seatsPerRow: number, configRows: number): Allocation[] {
  const N = students.length;
  if (N === 0) return [];

  // Natural rows needed given seatsPerRow (with near-empty-last-row rule)
  const baseRows = Math.max(1, Math.floor(N / seatsPerRow));
  const remainder = N % seatsPerRow;
  const naturalRows = (remainder === 0 || remainder <= 3) ? baseRows : baseRows + 1;

  // Prefer configRows as minimum; cap only when rows would have < 3 students
  const maxRowsByDensity = Math.max(1, Math.floor(N / 3));
  const targetRows = Math.min(
    Math.max(configRows, naturalRows),
    maxRowsByDensity,
  );

  // Even distribution via largest-remainder method
  const raw = N / targetRows;
  const perRow = Array.from({ length: targetRows }, () => Math.floor(raw));
  let leftover = N - perRow.reduce((s, c) => s + c, 0);
  for (let i = 0; i < leftover; i++) perRow[i]++;

  const allocations: Allocation[] = [];
  let si = 0;
  for (let r = 0; r < targetRows; r++) {
    for (let s = 0; s < perRow[r]; s++) {
      allocations.push({
        studentName: students[si].name,
        studentId: students[si].studentId,
        grade: students[si].grade,
        classCode: students[si].classCode,
        rowNumber: r + 1,
        seatNumber: s + 1,
      });
      si++;
    }
  }
  return allocations;
}

function buildRoom(
  roomStudents: Student[],
  roomNumber: number,
  roomName: string,
  seatsPerRow: number,
  configRows: number,
  building?: string,
  floor?: string,
): Room {
  const allocations = assignSeats(roomStudents, seatsPerRow, configRows);

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
  const { maxPerRoom, rows, seatsPerRow } = config;

  const g1 = shuffle(students.filter(s => s.grade === '1ª SÉRIE'));
  const g2 = shuffle(students.filter(s => s.grade === '2ª SÉRIE'));
  const g3 = shuffle(students.filter(s => s.grade === '3ª SÉRIE'));

  const interleaved = interleaveGrades(g1, g2, g3);
  const rooms: Room[] = [];

  if (config.selectedRooms && config.selectedRooms.length > 0) {
    // Catalog mode: use minimum rooms needed, distribute proportionally
    const total = interleaved.length;

    // Find the minimum prefix of selected rooms whose combined capacity >= total
    let cumCap = 0;
    let roomCount = 0;
    for (const room of config.selectedRooms) {
      cumCap += room.capacity;
      roomCount++;
      if (cumCap >= total) break;
    }
    const activeRooms = config.selectedRooms.slice(0, roomCount);
    const totalActiveCap = activeRooms.reduce((s, r) => s + r.capacity, 0);

    // Proportional allocation via largest-remainder method
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
      rooms.push(buildRoom(roomStudents, i + 1, roomDef.name, seatsPerRow, rows, roomDef.building, roomDef.floor));
    });
  } else {
    // Auto mode: split into equal chunks of maxPerRoom
    for (let i = 0; i < interleaved.length; i += maxPerRoom) {
      const chunk = interleaved.slice(i, i + maxPerRoom);
      const roomNumber = Math.floor(i / maxPerRoom) + 1;
      const roomStudents = reduceAdjacentSameClass(chunk, seatsPerRow);
      rooms.push(buildRoom(roomStudents, roomNumber, `Sala ${roomNumber.toString().padStart(2, '0')}`, seatsPerRow, rows));
    }
  }

  return rooms;
}
