export interface RoomDefinition {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
}

export const ROOM_CATALOG: RoomDefinition[] = [
  // Prédio A — 1º Andar
  { id: 'A-1-1A',  name: '1A',  building: 'A', floor: '1º Andar', capacity: 40 },
  { id: 'A-1-2A',  name: '2A',  building: 'A', floor: '1º Andar', capacity: 33 },
  { id: 'A-1-3A',  name: '3A',  building: 'A', floor: '1º Andar', capacity: 42 },
  { id: 'A-1-4A',  name: '4A',  building: 'A', floor: '1º Andar', capacity: 34 },
  { id: 'A-1-5A',  name: '5A',  building: 'A', floor: '1º Andar', capacity: 42 },
  { id: 'A-1-6A',  name: '6A',  building: 'A', floor: '1º Andar', capacity: 45 },
  { id: 'A-1-7A',  name: '7A',  building: 'A', floor: '1º Andar', capacity: 35 },
  { id: 'A-1-10A', name: '10A', building: 'A', floor: '1º Andar', capacity: 45 },
  { id: 'A-1-11A', name: '11A', building: 'A', floor: '1º Andar', capacity: 32 },
  { id: 'A-1-16A', name: '16A', building: 'A', floor: '1º Andar', capacity: 32 },
  { id: 'A-1-17A', name: '17A', building: 'A', floor: '1º Andar', capacity: 28 },
  { id: 'A-1-18A', name: '18A', building: 'A', floor: '1º Andar', capacity: 32 },
  { id: 'A-1-19A', name: '19A', building: 'A', floor: '1º Andar', capacity: 32 },
  // Prédio A — 2º Andar
  { id: 'A-2-22A', name: '22A', building: 'A', floor: '2º Andar', capacity: 40 },
  { id: 'A-2-23A', name: '23A', building: 'A', floor: '2º Andar', capacity: 45 },
  { id: 'A-2-25A', name: '25A', building: 'A', floor: '2º Andar', capacity: 45 },
  { id: 'A-2-26A', name: '26A', building: 'A', floor: '2º Andar', capacity: 45 },
  { id: 'A-2-27A', name: '27A', building: 'A', floor: '2º Andar', capacity: 45 },
  { id: 'A-2-28A', name: '28A', building: 'A', floor: '2º Andar', capacity: 42 },
  { id: 'A-2-1AA', name: '1AA', building: 'A', floor: '2º Andar', capacity: 40 },
  { id: 'A-2-2AA', name: '2AA', building: 'A', floor: '2º Andar', capacity: 40 },
  // Prédio A — 3º Andar
  { id: 'A-3-31A', name: '31A', building: 'A', floor: '3º Andar', capacity: 45 },
  { id: 'A-3-32A', name: '32A', building: 'A', floor: '3º Andar', capacity: 45 },
  { id: 'A-3-33A', name: '33A', building: 'A', floor: '3º Andar', capacity: 45 },
  { id: 'A-3-34A', name: '34A', building: 'A', floor: '3º Andar', capacity: 45 },
  { id: 'A-3-35A', name: '35A', building: 'A', floor: '3º Andar', capacity: 45 },
  { id: 'A-3-36A', name: '36A', building: 'A', floor: '3º Andar', capacity: 45 },
  { id: 'A-3-37A', name: '37A', building: 'A', floor: '3º Andar', capacity: 45 },
  // Prédio B — Térreo
  { id: 'B-0-13B', name: '13B', building: 'B', floor: 'Térreo', capacity: 38 },
  { id: 'B-0-14B', name: '14B', building: 'B', floor: 'Térreo', capacity: 38 },
  // Prédio B — 1º Andar
  { id: 'B-1-3B',  name: '3B',  building: 'B', floor: '1º Andar', capacity: 25 },
  { id: 'B-1-4B',  name: '4B',  building: 'B', floor: '1º Andar', capacity: 28 },
  { id: 'B-1-5B',  name: '5B',  building: 'B', floor: '1º Andar', capacity: 26 },
  { id: 'B-1-6B',  name: '6B',  building: 'B', floor: '1º Andar', capacity: 24 },
  { id: 'B-1-7B',  name: '7B',  building: 'B', floor: '1º Andar', capacity: 32 },
  { id: 'B-1-8B',  name: '8B',  building: 'B', floor: '1º Andar', capacity: 24 },
  { id: 'B-1-11B', name: '11B', building: 'B', floor: '1º Andar', capacity: 34 },
  { id: 'B-1-12B', name: '12B', building: 'B', floor: '1º Andar', capacity: 34 },
  // Prédio B — 2º Andar
  { id: 'B-2-15B', name: '15B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-16B', name: '16B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-19B', name: '19B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-20B', name: '20B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-21B', name: '21B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-22B', name: '22B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-23B', name: '23B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-24B', name: '24B', building: 'B', floor: '2º Andar', capacity: 34 },
  { id: 'B-2-25B', name: '25B', building: 'B', floor: '2º Andar', capacity: 35 },
  { id: 'B-2-26B', name: '26B', building: 'B', floor: '2º Andar', capacity: 40 },
  // Prédio C
  { id: 'C--1C',  name: '1C',  building: 'C', floor: '', capacity: 30 },
  { id: 'C--2C',  name: '2C',  building: 'C', floor: '', capacity: 30 },
  { id: 'C--3C',  name: '3C',  building: 'C', floor: '', capacity: 29 },
  { id: 'C--4C',  name: '4C',  building: 'C', floor: '', capacity: 30 },
  { id: 'C--6C',  name: '6C',  building: 'C', floor: '', capacity: 30 },
  { id: 'C--7C',  name: '7C',  building: 'C', floor: '', capacity: 30 },
  { id: 'C--8C',  name: '8C',  building: 'C', floor: '', capacity: 35 },
  { id: 'C--9C',  name: '9C',  building: 'C', floor: '', capacity: 35 },
  { id: 'C--10C', name: '10C', building: 'C', floor: '', capacity: 35 },
  { id: 'C--11C', name: '11C', building: 'C', floor: '', capacity: 35 },
  // Prédio D
  { id: 'D--1D', name: '1D', building: 'D', floor: '', capacity: 40 },
  { id: 'D--2D', name: '2D', building: 'D', floor: '', capacity: 40 },
  { id: 'D--3D', name: '3D', building: 'D', floor: '', capacity: 45 },
  { id: 'D--4D', name: '4D', building: 'D', floor: '', capacity: 35 },
];

export const BUILDINGS = ['A', 'B', 'C', 'D'] as const;

export function getBuildingRooms(building: string): RoomDefinition[] {
  return ROOM_CATALOG.filter(r => r.building === building);
}

export function getFloors(building: string): string[] {
  const floors = [...new Set(getBuildingRooms(building).map(r => r.floor))];
  return floors.sort((a, b) => {
    if (a === b) return 0;
    if (a === '') return -1;
    if (b === '') return 1;
    if (a === 'Térreo') return -1;
    if (b === 'Térreo') return 1;
    return a.localeCompare(b, 'pt-BR');
  });
}

export function floorLabel(floor: string, building: string): string {
  if (floor === '') return `Prédio ${building}`;
  return floor;
}
