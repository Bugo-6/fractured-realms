import React, { useEffect, useState } from 'react';
import type { ArenaType, UnitTypeId } from '../game/types';
import type { DefenseSlot } from '../multiplayer/types';
import { UNIT_DEFS, hexToCss, ALL_PLAYABLE } from '../game/unitDefs';
import { saveBase, fetchMyBase } from '../multiplayer/api';

interface Props {
  playerId: string;
  playerName: string;
  unlockedUnits: UnitTypeId[];
  onBack: () => void;
}

const ARENAS: ArenaType[] = ['desertTown', 'coastalRuins', 'industrial', 'desertOpen', 'underground', 'crater'];
const ARENA_LABELS: Record<ArenaType, string> = {
  desertTown: 'Desert Town', coastalRuins: 'Coastal Ruins', industrial: 'Industrial',
  desertOpen: 'Open Dunes', underground: 'Underground', crater: 'Crater',
};
const MAX_DEFENSE = 30;

export const BaseEditor: React.FC<Props> = ({ playerId, playerName, unlockedUnits, onBack }) => {
  const [arena, setArena] = useState<ArenaType>('desertTown');
  const [defense, setDefense] = useState<DefenseSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBase(playerId)
      .then(base => { if (base) { setArena(base.arena); setDefense(base.defense); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playerId]);

  const total = defense.reduce((s, d) => s + d.count, 0);

  const addUnit = (type: UnitTypeId) => {
    if (total >= MAX_DEFENSE) return;
    setDefense(prev => {
      const ex = prev.find(d => d.type === type);
      if (ex) return prev.map(d => d.type === type ? { ...d, count: d.count + 1 } : d);
      return [...prev, { type, count: 1, level: 1 }];
    });
  };

  const removeUnit = (type: UnitTypeId) =>
    setDefense(prev => prev.flatMap(d => {
      if (d.type !== type) return [d];
      return d.count <= 1 ? [] : [{ ...d, count: d.count - 1 }];
    }));

  const setLevel = (type: UnitTypeId, level: 1 | 2 | 3) =>
    setDefense(prev => prev.map(d => d.type === type ? { ...d, level } : d));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBase(playerId, playerName, arena, defense);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save. Is the server running? Set VITE_SERVER_URL in .env.local');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>;

  const available = ALL_PLAYABLE.filter(t => unlockedUnits.includes(t));

  return (
    <div className="flex h-full flex-col bg-[#0a0a14] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <button onClick={onBack} className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-200">← Back</button>
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-green-400">Base Editor</h2>
        <div className="text-xs text-gray-500">{total}/{MAX_DEFENSE} units</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Unit palette */}
        <div className="flex w-44 flex-col overflow-y-auto border-r border-white/10 p-3 gap-2">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Add Units</div>
          {available.map(type => {
            const def = UNIT_DEFS[type];
            const disabled = total >= MAX_DEFENSE;
            return (
              <button
                key={type}
                onClick={() => addUnit(type)}
                disabled={disabled}
                style={{ borderLeft: `3px solid ${hexToCss(def.color)}` }}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs border border-white/10 transition-colors
                  ${disabled ? 'opacity-30 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <span className="w-5 h-5 rounded text-[10px] font-black flex items-center justify-center flex-none"
                  style={{ background: hexToCss(def.color) + '33', color: hexToCss(def.color) }}>
                  {def.name[0]}
                </span>
                <span className="truncate font-bold text-gray-200">{def.name}</span>
              </button>
            );
          })}
        </div>

        {/* Defense roster */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Arena</div>
            <div className="flex flex-wrap gap-2">
              {ARENAS.map(a => (
                <button key={a} onClick={() => setArena(a)}
                  className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                    arena === a ? 'bg-green-600 text-white' : 'border border-white/20 bg-black/40 text-gray-400 hover:text-white'
                  }`}>
                  {ARENA_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Defense Roster</div>
          {defense.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-600">Add units from the left panel</div>
          ) : (
            <div className="flex flex-col gap-2">
              {defense.map(slot => {
                const def = UNIT_DEFS[slot.type as UnitTypeId];
                return (
                  <div key={slot.type}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    style={{ borderLeft: `3px solid ${hexToCss(def.color)}` }}>
                    <span className="flex-1 font-bold text-sm text-gray-200">{def.name}</span>
                    <div className="flex gap-1">
                      {([1, 2, 3] as const).map(lv => (
                        <button key={lv} onClick={() => setLevel(slot.type as UnitTypeId, lv)}
                          className={`h-5 w-5 rounded text-[10px] font-black transition-colors ${
                            slot.level === lv ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}>{lv}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => removeUnit(slot.type as UnitTypeId)}
                        className="h-6 w-6 rounded bg-red-900/60 text-red-300 hover:bg-red-800 font-bold text-sm">−</button>
                      <span className="w-6 text-center font-mono text-sm font-bold">{slot.count}</span>
                      <button onClick={() => addUnit(slot.type as UnitTypeId)} disabled={total >= MAX_DEFENSE}
                        className="h-6 w-6 rounded bg-green-900/60 text-green-300 hover:bg-green-800 font-bold text-sm disabled:opacity-30">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-3 flex justify-end">
        <button onClick={handleSave} disabled={saving || defense.length === 0}
          className={`rounded-md px-6 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
            saved ? 'bg-green-500 text-black' : 'bg-green-700 text-white hover:bg-green-600 disabled:opacity-40'
          }`}>
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Base'}
        </button>
      </div>
    </div>
  );
};
