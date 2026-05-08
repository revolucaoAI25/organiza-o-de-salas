import { useState, useMemo } from 'react';
import { Settings, Loader2, AlertCircle, CalendarDays, Users, Rows, LayoutGrid, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { ParseResult, SessionConfig, Student } from '../types';
import { generateDistribution } from '../services/api';
import { Session } from '../types';
import { ROOM_CATALOG, BUILDINGS, getBuildingRooms, getFloors, floorLabel, RoomDefinition } from '../data/rooms';

interface Props {
  students: Student[];
  parseResult: ParseResult;
  onBack: () => void;
  onGenerated: (session: Session) => void;
}

const defaultConfig: SessionConfig = {
  sessionName: '',
  examDate: new Date().toLocaleDateString('pt-BR'),
  institutionName: '',
  maxPerRoom: 60,
  rows: 6,
  seatsPerRow: 10,
};

export default function ConfigStep({ students, parseResult, onBack, onGenerated }: Props) {
  const [config, setConfig] = useState<SessionConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalog mode state
  const [catalogMode, setCatalogMode] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set(['A']));

  // Derived: selected room definitions
  const selectedRooms = useMemo(
    () => ROOM_CATALOG.filter(r => selectedRoomIds.has(r.id)),
    [selectedRoomIds]
  );
  const catalogTotalCapacity = selectedRooms.reduce((s, r) => s + r.capacity, 0);

  // Auto mode derived values
  const totalSeats = config.rows * config.seatsPerRow;
  const roomsNeeded = catalogMode
    ? selectedRooms.length
    : Math.ceil(students.length / config.maxPerRoom);
  const capacityOk = catalogMode
    ? selectedRooms.length > 0
    : totalSeats >= config.maxPerRoom;

  function set<K extends keyof SessionConfig>(key: K, value: SessionConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  function toggleBuilding(b: string) {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
  }

  function toggleRoom(room: RoomDefinition) {
    setSelectedRoomIds(prev => {
      const next = new Set(prev);
      if (next.has(room.id)) next.delete(room.id); else next.add(room.id);
      return next;
    });
  }

  function selectFloor(building: string, floor: string) {
    const ids = getBuildingRooms(building).filter(r => r.floor === floor).map(r => r.id);
    setSelectedRoomIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }

  function deselectFloor(building: string, floor: string) {
    const ids = new Set(getBuildingRooms(building).filter(r => r.floor === floor).map(r => r.id));
    setSelectedRoomIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }

  function selectBuilding(building: string) {
    const ids = getBuildingRooms(building).map(r => r.id);
    setSelectedRoomIds(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next; });
  }

  function deselectBuilding(building: string) {
    const ids = new Set(getBuildingRooms(building).map(r => r.id));
    setSelectedRoomIds(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
  }

  async function handleGenerate() {
    if (!config.sessionName.trim()) {
      setError('Informe o nome da aplicação/prova.');
      return;
    }
    if (catalogMode && selectedRooms.length === 0) {
      setError('Selecione pelo menos uma sala no catálogo.');
      return;
    }
    if (!catalogMode && !capacityOk) {
      setError(`Fileiras × Carteiras (${totalSeats}) deve ser ≥ máximo por sala (${config.maxPerRoom}).`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const finalConfig: SessionConfig = {
        ...config,
        selectedRooms: catalogMode ? selectedRooms : undefined,
      };
      const session = await generateDistribution(students, finalConfig);
      onGenerated(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar distribuição.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Configurações da Aplicação</h2>
        <p className="mt-1 text-slate-500 text-sm">
          {students.length} alunos importados · {parseResult.totals.grade1} de 1ª, {parseResult.totals.grade2} de 2ª, {parseResult.totals.grade3} de 3ª
        </p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Identification */}
        <Section icon={<Settings className="w-4 h-4" />} title="Identificação">
          <div className="space-y-3">
            <div>
              <label className="label">Nome da Aplicação / Prova *</label>
              <input
                className="input"
                placeholder="Ex: 2ª Avaliação Bimestral — Junho 2026"
                value={config.sessionName}
                onChange={e => set('sessionName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                  Data
                </label>
                <input
                  className="input"
                  placeholder="DD/MM/AAAA"
                  value={config.examDate}
                  onChange={e => set('examDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Instituição (opcional)</label>
                <input
                  className="input"
                  placeholder="Nome da escola"
                  value={config.institutionName}
                  onChange={e => set('institutionName', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Room mode toggle */}
        <Section icon={<Building2 className="w-4 h-4" />} title="Seleção de Salas">
          <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
              <button
                type="button"
                onClick={() => setCatalogMode(false)}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                  !catalogMode ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Automático
              </button>
              <button
                type="button"
                onClick={() => setCatalogMode(true)}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                  catalogMode ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Selecionar salas
              </button>
            </div>

            {/* Auto mode: max per room slider */}
            {!catalogMode && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label mb-0">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    Máximo por sala
                  </label>
                  <span className="text-lg font-bold text-blue-600">{config.maxPerRoom}</span>
                </div>
                <input
                  type="range"
                  min={10} max={60} step={1}
                  value={config.maxPerRoom}
                  onChange={e => set('maxPerRoom', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>10</span>
                  <span>60</span>
                </div>
              </div>
            )}

            {/* Catalog mode: building/floor/room selector */}
            {catalogMode && (
              <CatalogSelector
                selectedRoomIds={selectedRoomIds}
                expandedBuildings={expandedBuildings}
                onToggleBuilding={toggleBuilding}
                onToggleRoom={toggleRoom}
                onSelectFloor={selectFloor}
                onDeselectFloor={deselectFloor}
                onSelectBuilding={selectBuilding}
                onDeselectBuilding={deselectBuilding}
              />
            )}
          </div>
        </Section>

        {/* Layout */}
        <Section icon={<Rows className="w-4 h-4" />} title="Layout da Sala">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">
                  <Rows className="w-3.5 h-3.5 inline mr-1" />
                  Fileiras
                </label>
                <span className="font-bold text-slate-700">{config.rows}</span>
              </div>
              <input
                type="range"
                min={1} max={12} step={1}
                value={config.rows}
                onChange={e => set('rows', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">
                  <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />
                  Carteiras/fileira
                </label>
                <span className="font-bold text-slate-700">{config.seatsPerRow}</span>
              </div>
              <input
                type="range"
                min={1} max={15} step={1}
                value={config.seatsPerRow}
                onChange={e => set('seatsPerRow', Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </Section>

        {/* Preview */}
        <div className={`rounded-xl p-4 text-sm ${capacityOk ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`font-semibold mb-1 ${capacityOk ? 'text-blue-700' : 'text-red-700'}`}>
            Estimativa de distribuição
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <span>Salas necessárias:</span>
            <span className="font-bold text-slate-800">{roomsNeeded}</span>
            {catalogMode ? (
              <>
                <span>Capacidade total das salas:</span>
                <span className={`font-bold ${catalogTotalCapacity >= students.length ? 'text-slate-800' : 'text-amber-600'}`}>
                  {catalogTotalCapacity} vagas
                  {catalogTotalCapacity < students.length && ` ⚠ faltam ${students.length - catalogTotalCapacity}`}
                </span>
              </>
            ) : (
              <>
                <span>Capacidade por sala:</span>
                <span className={`font-bold ${capacityOk ? 'text-slate-800' : 'text-red-600'}`}>
                  {totalSeats} ({config.rows}×{config.seatsPerRow})
                </span>
              </>
            )}
            <span>Alunos por série/sala:</span>
            <span className="font-bold text-slate-800">
              ~{roomsNeeded > 0 ? Math.round(parseResult.totals.grade1 / roomsNeeded) : 0} · ~{roomsNeeded > 0 ? Math.round(parseResult.totals.grade2 / roomsNeeded) : 0} · ~{roomsNeeded > 0 ? Math.round(parseResult.totals.grade3 / roomsNeeded) : 0}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button className="btn-secondary" onClick={onBack} disabled={loading}>
            ← Voltar
          </button>
          <button className="btn-primary flex-1" onClick={handleGenerate} disabled={loading || !capacityOk}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando distribuição…</>
            ) : (
              'Gerar Distribuição →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Catalog selector sub-component ────────────────────────────────────────────

interface CatalogProps {
  selectedRoomIds: Set<string>;
  expandedBuildings: Set<string>;
  onToggleBuilding: (b: string) => void;
  onToggleRoom: (r: RoomDefinition) => void;
  onSelectFloor: (building: string, floor: string) => void;
  onDeselectFloor: (building: string, floor: string) => void;
  onSelectBuilding: (building: string) => void;
  onDeselectBuilding: (building: string) => void;
}

function CatalogSelector({
  selectedRoomIds,
  expandedBuildings,
  onToggleBuilding,
  onToggleRoom,
  onSelectFloor,
  onDeselectFloor,
  onSelectBuilding,
  onDeselectBuilding,
}: CatalogProps) {
  const total = selectedRoomIds.size;
  const totalCap = ROOM_CATALOG.filter(r => selectedRoomIds.has(r.id)).reduce((s, r) => s + r.capacity, 0);

  return (
    <div className="space-y-2">
      {/* Summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>{total === 0 ? 'Nenhuma sala selecionada' : `${total} sala${total !== 1 ? 's' : ''} · ${totalCap} vagas`}</span>
        <button
          type="button"
          onClick={() => {
            if (total === ROOM_CATALOG.length) {
              BUILDINGS.forEach(b => onDeselectBuilding(b));
            } else {
              BUILDINGS.forEach(b => onSelectBuilding(b));
            }
          }}
          className="text-blue-600 hover:underline"
        >
          {total === ROOM_CATALOG.length ? 'Desmarcar tudo' : 'Selecionar tudo'}
        </button>
      </div>

      {/* Building list */}
      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
        {BUILDINGS.map(building => {
          const buildingRooms = getBuildingRooms(building);
          const floors = getFloors(building);
          const selectedInBuilding = buildingRooms.filter(r => selectedRoomIds.has(r.id)).length;
          const expanded = expandedBuildings.has(building);
          const allSelected = selectedInBuilding === buildingRooms.length;

          return (
            <div key={building}>
              {/* Building header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 cursor-pointer select-none"
                onClick={() => onToggleBuilding(building)}>
                <span className="text-slate-400 w-3 shrink-0">
                  {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
                <span className="font-semibold text-sm text-slate-700 flex-1">Prédio {building}</span>
                <span className="text-xs text-slate-400">
                  {selectedInBuilding}/{buildingRooms.length}
                </span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); allSelected ? onDeselectBuilding(building) : onSelectBuilding(building); }}
                  className="text-xs text-blue-600 hover:underline ml-1 whitespace-nowrap"
                >
                  {allSelected ? 'Limpar' : 'Todos'}
                </button>
              </div>

              {/* Floors */}
              {expanded && floors.map(floor => {
                const floorRooms = buildingRooms.filter(r => r.floor === floor);
                const selectedInFloor = floorRooms.filter(r => selectedRoomIds.has(r.id)).length;
                const allFloorSelected = selectedInFloor === floorRooms.length;

                return (
                  <div key={`${building}-${floor}`} className="px-3 py-2 space-y-1.5">
                    {/* Floor label + quick select */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {floorLabel(floor, building)}
                        <span className="ml-1 font-normal">({selectedInFloor}/{floorRooms.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => allFloorSelected ? onDeselectFloor(building, floor) : onSelectFloor(building, floor)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {allFloorSelected ? 'Limpar' : 'Todos'}
                      </button>
                    </div>

                    {/* Room chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {floorRooms.map(room => {
                        const checked = selectedRoomIds.has(room.id);
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => onToggleRoom(room)}
                            title={`${room.name} — ${room.capacity} vagas`}
                            className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                              checked
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                            }`}
                          >
                            {room.name}
                            <span className={`ml-1 ${checked ? 'text-blue-200' : 'text-slate-400'}`}>
                              {room.capacity}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
