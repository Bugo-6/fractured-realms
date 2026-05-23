import { BattleUnit, BattleState, ArmyComp, Particle, UnitClassId, TeamId } from './types';
import { UNIT_DEFS } from './unitDefs';

export const CANVAS_W = 1200;
export const CANVAS_H = 560;

let nextId = 0;

function createUnit(classId: UnitClassId, team: TeamId, x: number, y: number): BattleUnit {
  const def = UNIT_DEFS[classId];
  return {
    id: nextId++,
    classId,
    team,
    x, y,
    hp: def.hp,
    maxHp: def.hp,
    vx: 0, vy: 0,
    state: 'seeking',
    attackTimer: 0,
    targetId: null,
    damage: def.damage,
    speed: def.speed,
    range: def.range,
    attackCooldown: def.attackCooldown,
    color: def.color,
    letter: def.letter,
    isRanged: def.isRanged,
    radius: def.radius,
    flashTimer: 0,
  };
}

function spawnArmy(army: ArmyComp[], team: TeamId): BattleUnit[] {
  const units: BattleUnit[] = [];
  const isLeft = team === 0;
  for (const { classId, count } of army) {
    for (let i = 0; i < count; i++) {
      const x = isLeft
        ? 20 + Math.random() * 220
        : CANVAS_W - 240 + Math.random() * 220;
      const y = 30 + Math.random() * (CANVAS_H - 60);
      units.push(createUnit(classId, team, x, y));
    }
  }
  return units;
}

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function findTarget(unit: BattleUnit, units: BattleUnit[]): BattleUnit | null {
  let best: BattleUnit | null = null;
  let bestD = Infinity;
  for (const u of units) {
    if (u.team === unit.team || u.state === 'dead') continue;
    const d = dist2(unit.x, unit.y, u.x, u.y);
    if (d < bestD) { bestD = d; best = u; }
  }
  return best;
}

function deathParticles(unit: BattleUnit): Particle[] {
  const out: Particle[] = [];
  const n = 6 + Math.floor(Math.random() * 6);
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const spd = 1.2 + Math.random() * 2.8;
    out.push({
      x: unit.x, y: unit.y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      color: unit.color,
      size: 2 + Math.random() * 3,
    });
  }
  return out;
}

export function initBattle(playerArmy: ArmyComp[], enemyArmy: ArmyComp[]): BattleState {
  nextId = 0;
  const p = spawnArmy(playerArmy, 0);
  const e = spawnArmy(enemyArmy, 1);
  return {
    units: [...p, ...e],
    particles: [],
    tick: 0,
    status: 'running',
    teamCount: [p.length, e.length],
  };
}

export function tickBattle(state: BattleState, deltaMs: number, speedMult = 1): BattleState {
  if (state.status !== 'running') return state;

  const dt = deltaMs * speedMult;
  // Deep copy units
  const units: BattleUnit[] = state.units.map(u => ({ ...u }));
  const newParticles: Particle[] = [];

  for (const unit of units) {
    if (unit.state === 'dead') continue;

    if (unit.attackTimer > 0) unit.attackTimer = Math.max(0, unit.attackTimer - dt);
    if (unit.flashTimer > 0) unit.flashTimer = Math.max(0, unit.flashTimer - dt);

    // Resolve target
    let target: BattleUnit | null = null;
    if (unit.targetId !== null) {
      target = units.find(u => u.id === unit.targetId && u.state !== 'dead') ?? null;
    }
    if (!target) {
      target = findTarget(unit, units);
      unit.targetId = target?.id ?? null;
    }

    if (!target) {
      unit.vx *= 0.85;
      unit.vy *= 0.85;
      unit.state = 'seeking';
      unit.x = clamp(unit.x + unit.vx, unit.radius, CANVAS_W - unit.radius);
      unit.y = clamp(unit.y + unit.vy, unit.radius, CANVAS_H - unit.radius);
      continue;
    }

    const d2 = dist2(unit.x, unit.y, target.x, target.y);
    const stopRange = unit.isRanged ? unit.range * 0.82 : unit.range * 0.88;
    const stopRange2 = stopRange * stopRange;

    if (d2 <= stopRange2) {
      // In range
      unit.state = 'attacking';
      unit.vx *= 0.7;
      unit.vy *= 0.7;

      if (unit.attackTimer === 0) {
        target.hp -= unit.damage;
        unit.attackTimer = unit.attackCooldown;
        unit.flashTimer = 120;

        if (target.hp <= 0) {
          target.hp = 0;
          target.state = 'dead';
          newParticles.push(...deathParticles(target));
          unit.targetId = null;
        }
      }
    } else {
      // Move toward target
      unit.state = 'seeking';
      const len = Math.sqrt(d2);
      unit.vx = (target.x - unit.x) / len * unit.speed;
      unit.vy = (target.y - unit.y) / len * unit.speed;
    }

    unit.x = clamp(unit.x + unit.vx, unit.radius, CANVAS_W - unit.radius);
    unit.y = clamp(unit.y + unit.vy, unit.radius, CANVAS_H - unit.radius);
  }

  // Tick particles
  const particles: Particle[] = [];
  for (const p of state.particles) {
    const np = { ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.08, life: p.life - 0.035 };
    if (np.life > 0) particles.push(np);
  }
  for (const p of newParticles) particles.push(p);

  const teamCount: [number, number] = [0, 0];
  for (const u of units) {
    if (u.state !== 'dead') teamCount[u.team]++;
  }

  let status: BattleState['status'] = 'running';
  if (teamCount[1] === 0 && teamCount[0] === 0) status = 'defeat';
  else if (teamCount[1] === 0) status = 'victory';
  else if (teamCount[0] === 0) status = 'defeat';

  return { units, particles, tick: state.tick + 1, status, teamCount };
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}
