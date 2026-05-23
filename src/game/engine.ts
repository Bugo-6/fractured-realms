// Battle simulation for WASTELAND COMMAND.
// Units move on the XZ plane (Y is up). Player on -X side, enemy on +X side.

import type {
  BattleConfig,
  BattleState,
  BattleUnit,
  Projectile,
  UnitTypeId,
} from './types';
import { UNIT_DEFS, leveledStats } from './unitDefs';

export const FIELD_MIN_X = -40;
export const FIELD_MAX_X = 40;
export const FIELD_MIN_Z = -25;
export const FIELD_MAX_Z = 25;

let NEXT_ID = 1;
function nextId(): number {
  return NEXT_ID++;
}

function makeUnit(
  type: UnitTypeId,
  level: number,
  team: 'player' | 'enemy',
  x: number,
  z: number,
): BattleUnit {
  const def = UNIT_DEFS[type];
  const stats = leveledStats(def, level);
  return {
    id: nextId(),
    type,
    team,
    level,
    x,
    z,
    hp: stats.hp,
    maxHp: stats.hp,
    dmg: stats.dmg,
    spd: def.spd,
    range: def.range,
    attackKind: def.attackKind,
    attackCooldown: def.attackCooldown,
    cooldownTimer: Math.random() * 0.4,
    facing: team === 'player' ? 0 : Math.PI,
    alive: true,
    dying: false,
    deathTimer: 0,
    spawnTimer: 0,
    targetId: null,
    flying: !!def.flying,
    scale: def.scale ?? 1,
    hitFlash: 0,
    attackAnim: 0,
  };
}

// Lay out an army in tidy ranks on one side of the field.
function layoutArmy(
  army: { type: UnitTypeId; level: number }[],
  team: 'player' | 'enemy',
): BattleUnit[] {
  const units: BattleUnit[] = [];
  const baseX = team === 'player' ? -26 : 26;
  const dir = team === 'player' ? -1 : 1; // ranks march away from center
  const perCol = 6;
  army.forEach((entry, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const x = baseX + dir * col * 3.2;
    const z = (row - (perCol - 1) / 2) * 3.6 + (col % 2 ? 1.8 : 0);
    units.push(makeUnit(entry.type, entry.level, team, x, z));
  });
  return units;
}

export function createBattle(config: BattleConfig): BattleState {
  const playerUnits = layoutArmy(config.playerArmy, 'player');
  const enemyUnits = layoutArmy(config.enemyArmy, 'enemy');
  return {
    units: [...playerUnits, ...enemyUnits],
    projectiles: [],
    playerAlive: playerUnits.length,
    enemyAlive: enemyUnits.length,
    finished: false,
    winner: null,
    elapsed: 0,
  };
}

function dist2(a: BattleUnit, bx: number, bz: number): number {
  const dx = a.x - bx;
  const dz = a.z - bz;
  return dx * dx + dz * dz;
}

function findTarget(unit: BattleUnit, units: BattleUnit[]): BattleUnit | null {
  let best: BattleUnit | null = null;
  let bestD = Infinity;
  for (const other of units) {
    if (!other.alive || other.dying) continue;
    if (other.team === unit.team) continue;
    const d = dist2(unit, other.x, other.z);
    if (d < bestD) {
      bestD = d;
      best = other;
    }
  }
  return best;
}

// Heal target: find most-wounded friendly within range (excluding self).
function findHealTarget(unit: BattleUnit, units: BattleUnit[]): BattleUnit | null {
  let best: BattleUnit | null = null;
  let bestMissing = 0;
  const r = Math.max(unit.range, 4);
  for (const other of units) {
    if (!other.alive || other.dying) continue;
    if (other.team !== unit.team) continue;
    if (other.id === unit.id) continue;
    const missing = other.maxHp - other.hp;
    if (missing <= 0) continue;
    if (dist2(unit, other.x, other.z) > r * r) continue;
    if (missing > bestMissing) {
      bestMissing = missing;
      best = other;
    }
  }
  return best;
}

function clampField(unit: BattleUnit): void {
  if (unit.x < FIELD_MIN_X) unit.x = FIELD_MIN_X;
  if (unit.x > FIELD_MAX_X) unit.x = FIELD_MAX_X;
  if (unit.z < FIELD_MIN_Z) unit.z = FIELD_MIN_Z;
  if (unit.z > FIELD_MAX_Z) unit.z = FIELD_MAX_Z;
}

function applyDamage(target: BattleUnit, amount: number): void {
  target.hp -= amount;
  target.hitFlash = 0.18;
  if (target.hp <= 0 && !target.dying) {
    target.hp = 0;
    target.dying = true;
    target.deathTimer = 0;
  }
}

const DEATH_DURATION = 0.6; // seconds for fall-over animation
const SPAWN_DURATION = 0.4;

// Step the simulation forward by dt seconds.
export function stepBattle(state: BattleState, dt: number): void {
  if (state.finished) {
    // still advance death/projectile animations a little so visuals settle
  }
  state.elapsed += dt;

  const units = state.units;
  const byId = new Map<number, BattleUnit>();
  for (const u of units) byId.set(u.id, u);

  for (const unit of units) {
    if (!unit.alive) continue;

    // tick transient timers
    if (unit.spawnTimer < SPAWN_DURATION) unit.spawnTimer += dt;
    if (unit.hitFlash > 0) unit.hitFlash = Math.max(0, unit.hitFlash - dt);
    if (unit.attackAnim > 0) unit.attackAnim = Math.max(0, unit.attackAnim - dt);
    if (unit.cooldownTimer > 0) unit.cooldownTimer = Math.max(0, unit.cooldownTimer - dt);

    if (unit.dying) {
      unit.deathTimer += dt;
      if (unit.deathTimer >= DEATH_DURATION) {
        unit.alive = false;
      }
      continue;
    }

    // ---- Medic / healer behaviour ----
    if (unit.attackKind === 'heal') {
      const healTarget = findHealTarget(unit, units);
      if (healTarget) {
        // move toward wounded ally if not in range, else heal
        const dx = healTarget.x - unit.x;
        const dz = healTarget.z - unit.z;
        const d = Math.hypot(dx, dz);
        unit.facing = Math.atan2(dx, dz);
        if (d > unit.range) {
          const step = unit.spd * dt;
          unit.x += (dx / d) * step;
          unit.z += (dz / d) * step;
        } else if (unit.cooldownTimer <= 0) {
          healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + unit.dmg * 2.2);
          unit.cooldownTimer = unit.attackCooldown;
          unit.attackAnim = 0.3;
        }
        clampField(unit);
        continue;
      }
      // No one to heal: advance with the army toward enemies but keep back.
    }

    // ---- Combat behaviour ----
    let target: BattleUnit | null = null;
    if (unit.targetId != null) {
      const t = byId.get(unit.targetId);
      if (t && t.alive && !t.dying && t.team !== unit.team) target = t;
    }
    if (!target) {
      target = findTarget(unit, units);
      unit.targetId = target ? target.id : null;
    }

    if (!target) continue;

    const dx = target.x - unit.x;
    const dz = target.z - unit.z;
    const d = Math.hypot(dx, dz) || 0.0001;
    unit.facing = Math.atan2(dx, dz);

    if (d > unit.range) {
      // move toward target
      const step = unit.spd * dt;
      unit.x += (dx / d) * step;
      unit.z += (dz / d) * step;
      clampField(unit);
    } else if (unit.cooldownTimer <= 0) {
      // attack
      unit.cooldownTimer = unit.attackCooldown;
      unit.attackAnim = 0.25;
      const def = UNIT_DEFS[unit.type];

      if (unit.attackKind === 'melee') {
        applyDamage(target, unit.dmg);
      } else if (unit.attackKind === 'explosive') {
        // splash damage around target
        spawnProjectile(state, unit, target, def.color, true);
      } else {
        // ranged: spawn a projectile that will resolve on arrival
        spawnProjectile(state, unit, target, def.color, false);
      }
    }
  }

  // ---- Projectiles ----
  updateProjectiles(state, dt, byId);

  // ---- Win check ----
  let pAlive = 0;
  let eAlive = 0;
  for (const u of units) {
    if (u.alive && !u.dying) {
      if (u.team === 'player') pAlive++;
      else eAlive++;
    }
  }
  state.playerAlive = pAlive;
  state.enemyAlive = eAlive;

  if (!state.finished && (pAlive === 0 || eAlive === 0)) {
    state.finished = true;
    state.winner = eAlive === 0 ? 'player' : 'enemy';
  }
}

let PROJ_ID = 1;
function spawnProjectile(
  state: BattleState,
  from: BattleUnit,
  to: BattleUnit,
  color: number,
  explosive: boolean,
): void {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const d = Math.hypot(dx, dz) || 0.0001;
  const speed = explosive ? 18 : 42;
  state.projectiles.push({
    id: PROJ_ID++,
    x: from.x,
    z: from.z,
    y: from.flying ? 1.6 : 1.0,
    vx: (dx / d) * speed,
    vz: (dz / d) * speed,
    team: from.team,
    kind: explosive ? 'explosive' : 'ranged',
    life: explosive ? 1.2 : 0.9,
    color,
  });
  // store the intended damage/target hint via a side table-free approach:
  // we resolve by proximity on update, using the firing unit's damage baked in.
  (state.projectiles[state.projectiles.length - 1] as ProjectileWithDmg).dmg = from.dmg;
  (state.projectiles[state.projectiles.length - 1] as ProjectileWithDmg).explosive =
    explosive;
}

interface ProjectileWithDmg extends Projectile {
  dmg: number;
  explosive: boolean;
}

function updateProjectiles(
  state: BattleState,
  dt: number,
  byId: Map<number, BattleUnit>,
): void {
  void byId;
  const next: Projectile[] = [];
  for (const p of state.projectiles as ProjectileWithDmg[]) {
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.life -= dt;

    // find nearest enemy of the projectile's team for a hit test
    let hit: BattleUnit | null = null;
    let hitD = p.explosive ? 2.2 : 1.4;
    hitD = hitD * hitD;
    for (const u of state.units) {
      if (!u.alive || u.dying) continue;
      if (u.team === p.team) continue;
      const dx = u.x - p.x;
      const dz = u.z - p.z;
      const dd = dx * dx + dz * dz;
      if (dd < hitD) {
        hit = u;
        break;
      }
    }

    if (hit) {
      if (p.explosive) {
        // splash: damage everything near the impact
        for (const u of state.units) {
          if (!u.alive || u.dying) continue;
          if (u.team === p.team) continue;
          const dx = u.x - p.x;
          const dz = u.z - p.z;
          const dd = Math.hypot(dx, dz);
          if (dd < 4.5) {
            const falloff = 1 - dd / 4.5;
            applyDamage(u, p.dmg * falloff);
          }
        }
      } else {
        applyDamage(hit, p.dmg);
      }
      continue; // projectile consumed
    }

    // out of bounds or expired
    if (
      p.life <= 0 ||
      p.x < FIELD_MIN_X - 5 ||
      p.x > FIELD_MAX_X + 5 ||
      p.z < FIELD_MIN_Z - 5 ||
      p.z > FIELD_MAX_Z + 5
    ) {
      continue;
    }
    next.push(p);
  }
  state.projectiles = next;
}
