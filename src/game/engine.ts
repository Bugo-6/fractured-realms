// Battle simulation for WASTELAND COMMAND.
// Units move on the XZ plane (Y is up). Player on -X side, enemy on +X side.

import type {
  BattleConfig,
  BattleState,
  BattleUnit,
  Projectile,
  UnitTypeId,
  DamageType,
  ArmorType,
  CollisionZone,
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
  statScale = 1,
): BattleUnit {
  const def = UNIT_DEFS[type];
  const stats = leveledStats(def, level);
  // Difficulty curve: enemies scale hp/dmg by the chapter statScale multiplier.
  const hp = Math.round(stats.hp * statScale);
  const dmg = Math.round(stats.dmg * statScale);
  return {
    id: nextId(),
    type,
    team,
    level,
    x,
    z,
    hp,
    maxHp: hp,
    dmg,
    spd: def.spd,
    range: def.range,
    attackKind: def.attackKind,
    attackCooldown: def.attackCooldown,
    cooldownTimer: Math.random() * 0.4,
    facing: team === 'player' ? 0 : Math.PI,
    damageType: def.damageType,
    armorType: def.armorType,
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
  statScale = 1,
  multiLane = false,
): BattleUnit[] {
  const units: BattleUnit[] = [];
  const baseX = team === 'player' ? -26 : 26;
  const dir = team === 'player' ? -1 : 1; // ranks march away from center
  const perCol = 6;

  // Multi-lane flanking: split the enemy army into two groups that spawn from
  // the top (+z) and bottom (-z) sides for a pincer attack.
  if (multiLane && team === 'enemy') {
    const half = Math.ceil(army.length / 2);
    army.forEach((entry, i) => {
      const inGroup = i < half ? i : i - half;
      const flank = i < half ? -1 : 1; // group A from -z, group B from +z
      const col = Math.floor(inGroup / perCol);
      const row = inGroup % perCol;
      const x = baseX + dir * col * 3.0;
      const z = flank * 15 + (row - (perCol - 1) / 2) * 2.4 + (col % 2 ? 1.4 : 0);
      units.push(makeUnit(entry.type, entry.level, team, x, z, statScale));
    });
    return units;
  }

  army.forEach((entry, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const x = baseX + dir * col * 3.2;
    const z = (row - (perCol - 1) / 2) * 3.6 + (col % 2 ? 1.8 : 0);
    units.push(makeUnit(entry.type, entry.level, team, x, z, statScale));
  });
  return units;
}

export function createBattle(config: BattleConfig): BattleState {
  const enemyScale = config.statScale ?? 1;
  // Player army deploys at full strength (no stat scaling). Enemies scale.
  const playerUnits = layoutArmy(config.playerArmy, 'player');
  const enemyUnits = layoutArmy(
    config.enemyArmy,
    'enemy',
    enemyScale,
    !!config.multiLane,
  );
  const allUnits = [...playerUnits, ...enemyUnits];

  // Environmental hazard: open dunes reduce effective weapon range.
  if (config.arena === 'desertOpen') {
    for (const u of allUnits) {
      u.range *= 0.65;
    }
  }

  const startingCP = config.startingCP ?? 0;
  const pool = config.pendingDeployments ?? [];
  const hasDeployPool = pool.length > 0;
  const minDeployCost = hasDeployPool
    ? Math.min(...pool.map((p) => UNIT_DEFS[p.type].cost))
    : Infinity;

  return {
    units: allUnits,
    projectiles: [],
    playerAlive: playerUnits.length,
    enemyAlive: enemyUnits.length,
    finished: false,
    winner: null,
    elapsed: 0,
    arena: config.arena,
    collisionZones: config.collisionZones ?? [],
    commandPoints: startingCP,
    maxCP: Math.max(startingCP, config.startingCP ?? 0),
    cpPerKill: config.cpPerKill ?? 12,
    minDeployCost,
    hasDeployPool,
    eruptionTimer: 8,
    eruptionX: 0,
    eruptionZ: 0,
    eruptionActive: false,
  };
}

// Deploy a single unit from the player's pool during battle, paying its CP cost.
// Returns true if the unit was deployed, false if there were not enough CP.
export function deployUnit(
  state: BattleState,
  type: UnitTypeId,
  level: number,
): boolean {
  const def = UNIT_DEFS[type];
  const cost = def.cost;
  if (state.commandPoints < cost) return false;
  // Spawn at a random position on the player side.
  const x = -30 + Math.random() * 10; // -30 .. -20
  const z = FIELD_MIN_Z + Math.random() * (FIELD_MAX_Z - FIELD_MIN_Z);
  const unit = makeUnit(type, level, 'player', x, z);
  if (state.arena === 'desertOpen') unit.range *= 0.65;
  state.units.push(unit);
  state.commandPoints -= cost;
  // If the fight was already considered "over" because the player had no units,
  // un-finish it so the freshly deployed unit can fight.
  if (state.finished && state.winner === 'enemy') {
    state.finished = false;
    state.winner = null;
  }
  return true;
}

function dist2(a: BattleUnit, bx: number, bz: number): number {
  const dx = a.x - bx;
  const dz = a.z - bz;
  return dx * dx + dz * dz;
}

type TargetStrategy = 'nearest' | 'weakest' | 'mostDangerous';

function findTarget(
  unit: BattleUnit,
  units: BattleUnit[],
  strategy: TargetStrategy = 'nearest',
): BattleUnit | null {
  const enemies = units.filter((u) => u.alive && !u.dying && u.team !== unit.team);
  if (enemies.length === 0) return null;

  if (strategy === 'weakest') {
    // Target unit with lowest HP ratio (medics, snipers tend to die first).
    return enemies.reduce((best, u) =>
      u.hp / u.maxHp < best.hp / best.maxHp ? u : best,
    );
  }
  if (strategy === 'mostDangerous') {
    // Target unit with highest damage (snipers, heavy, mechs).
    return enemies.reduce((best, u) => (u.dmg > best.dmg ? u : best));
  }
  // nearest (default)
  let best: BattleUnit | null = null;
  let bestD = Infinity;
  for (const u of enemies) {
    const dx = unit.x - u.x;
    const dz = unit.z - u.z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}

// Pick a unit's targeting strategy. Feral hunt the weakest (medics/snipers),
// Alpha hunt the most dangerous (heavies/mechs); everyone else picks nearest.
function strategyFor(type: UnitTypeId): TargetStrategy {
  if (type === 'feral') return 'weakest';
  if (type === 'alpha') return 'mostDangerous';
  return 'nearest';
}

// Hard-counter damage multiplier: attacker damageType vs target armorType.
function damageMultiplier(dmgType: DamageType, armorType: ArmorType): number {
  if (dmgType === 'bullet') {
    if (armorType === 'armored') return 0.25;
    if (armorType === 'heavy') return 0.12;
    return 1.0; // vs flesh
  }
  if (dmgType === 'explosive') {
    if (armorType === 'heavy') return 1.0;
    if (armorType === 'armored') return 1.0;
    return 1.5; // extra vs flesh clusters
  }
  if (dmgType === 'energy') {
    if (armorType === 'armored') return 1.8;
    if (armorType === 'heavy') return 1.6;
    return 1.0;
  }
  if (dmgType === 'melee') return 1.0;
  return 1.0;
}

// Steer a candidate position out of any obstacle collision zone.
function resolveCollisions(
  nx: number,
  nz: number,
  zones: CollisionZone[] | undefined,
): { x: number; z: number } {
  if (!zones || zones.length === 0) return { x: nx, z: nz };
  for (const zone of zones) {
    const dx = nx - zone.x;
    const dz = nz - zone.z;
    const d = Math.hypot(dx, dz) || 0.0001;
    if (d < zone.radius) {
      const push = zone.radius / d;
      return { x: zone.x + dx * push, z: zone.z + dz * push };
    }
  }
  return { x: nx, z: nz };
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

function applyDamage(
  state: BattleState,
  target: BattleUnit,
  amount: number,
  dmgType?: DamageType,
): void {
  const mult = dmgType ? damageMultiplier(dmgType, target.armorType) : 1.0;
  target.hp -= amount * mult;
  target.hitFlash = 0.18;
  if (target.hp <= 0 && !target.dying) {
    target.hp = 0;
    target.dying = true;
    target.deathTimer = 0;
    // Command Points: award CP when a player kills an enemy.
    if (target.team === 'enemy') {
      state.commandPoints += state.cpPerKill;
      if (state.commandPoints > state.maxCP) state.maxCP = state.commandPoints;
    }
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
          const moved = resolveCollisions(
            unit.x + (dx / d) * step,
            unit.z + (dz / d) * step,
            state.collisionZones,
          );
          unit.x = moved.x;
          unit.z = moved.z;
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
      target = findTarget(unit, units, strategyFor(unit.type));
      unit.targetId = target ? target.id : null;
    }

    if (!target) continue;

    const dx = target.x - unit.x;
    const dz = target.z - unit.z;
    const d = Math.hypot(dx, dz) || 0.0001;
    unit.facing = Math.atan2(dx, dz);

    if (d > unit.range) {
      // move toward target, steering around obstacles
      const step = unit.spd * dt;
      const moved = resolveCollisions(
        unit.x + (dx / d) * step,
        unit.z + (dz / d) * step,
        state.collisionZones,
      );
      unit.x = moved.x;
      unit.z = moved.z;
      clampField(unit);
    } else if (unit.cooldownTimer <= 0) {
      // attack
      unit.cooldownTimer = unit.attackCooldown;
      unit.attackAnim = 0.25;
      const def = UNIT_DEFS[unit.type];

      if (unit.attackKind === 'melee') {
        applyDamage(state, target, unit.dmg, unit.damageType);
      } else if (unit.attackKind === 'explosive') {
        // splash damage around target
        spawnProjectile(state, unit, target, def.color, true);
      } else {
        // ranged: spawn a projectile that will resolve on arrival
        spawnProjectile(state, unit, target, def.color, false);
      }
    }
  }

  // ---- Special abilities ----
  updateSpecialAbilities(state, dt);

  // ---- Environmental hazard: underground lava eruptions ----
  updateLavaEruption(state, dt);

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

  // The player can still reinforce while they have a deployment pool and enough
  // CP to field at least one more unit — an empty field is not yet a defeat.
  const canReinforce =
    state.hasDeployPool && state.commandPoints >= state.minDeployCost;

  if (!state.finished) {
    if (eAlive === 0) {
      state.finished = true;
      state.winner = 'player';
    } else if (pAlive === 0 && !canReinforce) {
      state.finished = true;
      state.winner = 'enemy';
    }
  }
}

// ---- Special abilities ----

const SUPPLY_DROP_INTERVAL = 12; // seconds
const SUPPLY_DROP_RADIUS = 8;
const SUPPLY_DROP_HEAL = 15;

const OVERCLOCK_INTERVAL = 18; // seconds between overclock activations
const OVERCLOCK_DURATION = 5; // seconds of boosted attack speed
const OVERCLOCK_FREEZE = 2; // seconds frozen afterwards

const SUICIDE_TRIGGER_RANGE = 5; // distance to nearest enemy to consider charging
const SUICIDE_BLAST_RADIUS = 6; // damage radius on self-destruct
const SUICIDE_CLUSTER_MIN = 3; // enemies needed within blast radius to detonate
const SUICIDE_DMG_MULT = 2.5;

function countEnemiesNear(
  units: BattleUnit[],
  team: 'player' | 'enemy',
  x: number,
  z: number,
  radius: number,
): number {
  const r2 = radius * radius;
  let count = 0;
  for (const u of units) {
    if (!u.alive || u.dying) continue;
    if (u.team === team) continue;
    const dx = u.x - x;
    const dz = u.z - z;
    if (dx * dx + dz * dz <= r2) count++;
  }
  return count;
}

function updateSpecialAbilities(state: BattleState, dt: number): void {
  const units = state.units;
  for (const unit of units) {
    if (!unit.alive || unit.dying) continue;
    const def = UNIT_DEFS[unit.type];
    const ability = def.specialAbility;
    if (!ability) continue;

    switch (ability) {
      case 'supplyDrop': {
        if (unit.specialCooldown === undefined) unit.specialCooldown = SUPPLY_DROP_INTERVAL;
        unit.specialCooldown -= dt;
        if (unit.specialCooldown <= 0) {
          unit.specialCooldown = SUPPLY_DROP_INTERVAL;
          // AoE healing pulse to all friendly units within radius
          const r2 = SUPPLY_DROP_RADIUS * SUPPLY_DROP_RADIUS;
          for (const ally of units) {
            if (!ally.alive || ally.dying) continue;
            if (ally.team !== unit.team) continue;
            const dx = ally.x - unit.x;
            const dz = ally.z - unit.z;
            if (dx * dx + dz * dz > r2) continue;
            ally.hp = Math.min(ally.maxHp, ally.hp + SUPPLY_DROP_HEAL);
          }
          unit.attackAnim = 0.3;
        }
        break;
      }

      case 'suicideBomber': {
        // Find nearest enemy
        let nearest: BattleUnit | null = null;
        let nearestD = Infinity;
        for (const other of units) {
          if (!other.alive || other.dying) continue;
          if (other.team === unit.team) continue;
          const d = dist2(unit, other.x, other.z);
          if (d < nearestD) {
            nearestD = d;
            nearest = other;
          }
        }
        if (nearest) {
          const dist = Math.sqrt(nearestD);
          // Enter suicide mode when close to an enemy cluster
          if (
            dist <= SUICIDE_TRIGGER_RANGE &&
            countEnemiesNear(units, unit.team, unit.x, unit.z, SUICIDE_BLAST_RADIUS) >=
              SUICIDE_CLUSTER_MIN
          ) {
            unit.suicideMode = true;
            // Detonate: damage all enemies in blast radius, then kill self
            const r2 = SUICIDE_BLAST_RADIUS * SUICIDE_BLAST_RADIUS;
            for (const other of units) {
              if (!other.alive || other.dying) continue;
              if (other.team === unit.team) continue;
              const dx = other.x - unit.x;
              const dz = other.z - unit.z;
              if (dx * dx + dz * dz > r2) continue;
              applyDamage(state, other, unit.dmg * SUICIDE_DMG_MULT, unit.damageType);
            }
            // Kill self
            unit.hp = 0;
            if (!unit.dying) {
              unit.dying = true;
              unit.deathTimer = 0;
            }
          }
        }
        break;
      }

      case 'overclock': {
        if (unit.baseAttackCooldown === undefined) unit.baseAttackCooldown = unit.attackCooldown;
        if (unit.baseSpd === undefined) unit.baseSpd = unit.spd;
        if (unit.specialCooldown === undefined) unit.specialCooldown = OVERCLOCK_INTERVAL;

        if (unit.frozen) {
          // Frozen freeze period after overclock
          unit.frozenTimer = (unit.frozenTimer ?? 0) - dt;
          unit.spd = 0;
          if (unit.frozenTimer <= 0) {
            unit.frozen = false;
            unit.spd = unit.baseSpd;
          }
        } else if (unit.overclocked) {
          unit.overclockedTimer = (unit.overclockedTimer ?? 0) - dt;
          if (unit.overclockedTimer <= 0) {
            // End overclock: restore attack speed, enter freeze
            unit.overclocked = false;
            unit.attackCooldown = unit.baseAttackCooldown;
            unit.frozen = true;
            unit.frozenTimer = OVERCLOCK_FREEZE;
            unit.spd = 0;
          }
        } else {
          unit.specialCooldown -= dt;
          if (unit.specialCooldown <= 0) {
            // Activate overclock
            unit.specialCooldown = OVERCLOCK_INTERVAL;
            unit.overclocked = true;
            unit.overclockedTimer = OVERCLOCK_DURATION;
            unit.attackCooldown = unit.baseAttackCooldown * 0.5;
          }
        }
        break;
      }
    }
  }
}

// ---- Environmental hazard: underground lava eruptions ----

const ERUPTION_INTERVAL = 8; // seconds between eruptions
const ERUPTION_DURATION = 2; // seconds an eruption stays active
const ERUPTION_RADIUS = 2.5;
const ERUPTION_DAMAGE = 15;

function updateLavaEruption(state: BattleState, dt: number): void {
  if (state.arena !== 'underground') return;
  if (state.eruptionTimer === undefined) state.eruptionTimer = ERUPTION_INTERVAL;

  if (state.eruptionActive) {
    // Active eruption damages units in the zone, then expires.
    const r2 = ERUPTION_RADIUS * ERUPTION_RADIUS;
    const ex = state.eruptionX ?? 0;
    const ez = state.eruptionZ ?? 0;
    for (const u of state.units) {
      if (!u.alive || u.dying) continue;
      if (u.flying) continue; // flying units avoid ground lava
      const dx = u.x - ex;
      const dz = u.z - ez;
      if (dx * dx + dz * dz <= r2) {
        applyDamage(state, u, ERUPTION_DAMAGE * dt);
      }
    }
    state.eruptionTimer -= dt;
    if (state.eruptionTimer <= 0) {
      state.eruptionActive = false;
      state.eruptionTimer = ERUPTION_INTERVAL;
    }
  } else {
    state.eruptionTimer -= dt;
    if (state.eruptionTimer <= 0) {
      // Trigger a new eruption at a random position.
      state.eruptionActive = true;
      state.eruptionTimer = ERUPTION_DURATION;
      state.eruptionX = FIELD_MIN_X + Math.random() * (FIELD_MAX_X - FIELD_MIN_X);
      state.eruptionZ = FIELD_MIN_Z + Math.random() * (FIELD_MAX_Z - FIELD_MIN_Z);
    }
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
  const last = state.projectiles[state.projectiles.length - 1] as ProjectileWithDmg;
  last.dmg = from.dmg;
  last.explosive = explosive;
  last.dmgType = from.damageType;
}

interface ProjectileWithDmg extends Projectile {
  dmg: number;
  explosive: boolean;
  dmgType: DamageType;
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
            applyDamage(state, u, p.dmg * falloff, p.dmgType);
          }
        }
      } else {
        applyDamage(state, hit, p.dmg, p.dmgType);
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
