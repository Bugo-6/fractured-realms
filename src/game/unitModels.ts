// Three.js model builders for WASTELAND COMMAND units.
// Each unit is a THREE.Group of geometric primitives assembled into a figure.
// Models face +Z by default (the engine rotates the group via `facing`).

import * as THREE from 'three';
import type { UnitTypeId } from './types';
import { UNIT_DEFS } from './unitDefs';

// Shared geometry cache to avoid recreating identical geometries every spawn.
const geoCache = new Map<string, THREE.BufferGeometry>();
function box(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `b${w}_${h}_${d}`;
  let g = geoCache.get(key) as THREE.BoxGeometry | undefined;
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    geoCache.set(key, g);
  }
  return g;
}
function sphere(r: number, ws = 8, hs = 6): THREE.SphereGeometry {
  const key = `s${r}_${ws}_${hs}`;
  let g = geoCache.get(key) as THREE.SphereGeometry | undefined;
  if (!g) {
    g = new THREE.SphereGeometry(r, ws, hs);
    geoCache.set(key, g);
  }
  return g;
}
function cyl(rt: number, rb: number, h: number, seg = 8): THREE.CylinderGeometry {
  const key = `c${rt}_${rb}_${h}_${seg}`;
  let g = geoCache.get(key) as THREE.CylinderGeometry | undefined;
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, h, seg);
    geoCache.set(key, g);
  }
  return g;
}

const SKIN = 0xc89b6c;
const DARK_METAL = 0x2b2f33;
const STEEL = 0xb9c0c7;

function mat(color: number, opts?: { emissive?: number; metal?: number; rough?: number }) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissive ? 0.9 : 0,
    metalness: opts?.metal ?? 0.1,
    roughness: opts?.rough ?? 0.8,
  });
}

function mesh(
  geo: THREE.BufferGeometry,
  m: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const me = new THREE.Mesh(geo, m);
  me.position.set(x, y, z);
  me.castShadow = true;
  me.receiveShadow = false;
  return me;
}

// Tint a base color by a level multiplier (brighter at higher level).
function levelTint(color: number, level: number): number {
  if (level <= 1) return color;
  const c = new THREE.Color(color);
  const factor = level === 2 ? 1.18 : 1.35;
  c.r = Math.min(1, c.r * factor);
  c.g = Math.min(1, c.g * factor);
  c.b = Math.min(1, c.b * factor);
  return c.getHex();
}

// ---- Individual builders ----

function buildRifleman(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = mat(color, { rough: 0.7 });
  const dark = mat(0x1f3d24);
  g.add(mesh(box(0.5, 0.65, 0.3), body, 0, 0.9, 0)); // torso
  g.add(mesh(sphere(0.22), mat(SKIN), 0, 1.35, 0)); // head
  g.add(mesh(box(0.44, 0.18, 0.44), dark, 0, 1.46, 0)); // helmet
  g.add(mesh(box(0.18, 0.5, 0.18), body, -0.15, 0.32, 0)); // left leg
  g.add(mesh(box(0.18, 0.5, 0.18), body, 0.15, 0.32, 0)); // right leg
  g.add(mesh(box(0.14, 0.4, 0.14), body, -0.32, 0.95, 0.05)); // left arm
  g.add(mesh(box(0.14, 0.4, 0.14), body, 0.32, 0.95, 0.05)); // right arm
  g.add(mesh(box(0.06, 0.06, 0.65), mat(DARK_METAL, { metal: 0.6 }), 0.32, 0.95, 0.35)); // rifle
  return g;
}

function buildScout(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = mat(color, { rough: 0.7 });
  g.add(mesh(box(0.42, 0.55, 0.26), body, 0, 0.82, 0));
  g.add(mesh(sphere(0.2), mat(SKIN), 0, 1.2, 0));
  g.add(mesh(box(0.42, 0.08, 0.32), mat(0x166534), 0, 1.34, 0.04)); // cap
  g.add(mesh(box(0.4, 0.05, 0.18), mat(0x166534), 0, 1.32, 0.22)); // cap brim
  g.add(mesh(box(0.16, 0.46, 0.16), body, -0.13, 0.3, 0));
  g.add(mesh(box(0.16, 0.46, 0.16), body, 0.13, 0.3, 0));
  g.add(mesh(box(0.12, 0.36, 0.12), body, 0.28, 0.85, 0.05));
  g.add(mesh(box(0.05, 0.05, 0.35), mat(DARK_METAL, { metal: 0.6 }), 0.28, 0.82, 0.25)); // pistol
  return g;
}

function buildHeavy(color: number): THREE.Group {
  const g = new THREE.Group();
  const armor = mat(color, { metal: 0.3, rough: 0.6 });
  const dark = mat(0x14532d, { metal: 0.4 });
  g.add(mesh(box(0.7, 0.7, 0.4), armor, 0, 0.95, 0));
  g.add(mesh(box(0.78, 0.2, 0.48), dark, 0, 1.32, 0)); // shoulder plate
  g.add(mesh(sphere(0.24), mat(SKIN), 0, 1.5, 0));
  g.add(mesh(box(0.5, 0.16, 0.5), dark, 0, 1.6, 0)); // big helmet
  g.add(mesh(box(0.24, 0.55, 0.24), armor, -0.2, 0.35, 0));
  g.add(mesh(box(0.24, 0.55, 0.24), armor, 0.2, 0.35, 0));
  // minigun: barrel cluster
  const gunBase = mesh(cyl(0.12, 0.12, 0.5), mat(DARK_METAL, { metal: 0.7 }), 0.4, 1.0, 0.3);
  gunBase.rotation.x = Math.PI / 2;
  g.add(gunBase);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const bx = 0.4 + Math.cos(a) * 0.06;
    const by = 1.0 + Math.sin(a) * 0.06;
    const b = mesh(cyl(0.025, 0.025, 0.55), mat(0x111111, { metal: 0.8 }), bx, by, 0.5);
    b.rotation.x = Math.PI / 2;
    g.add(b);
  }
  return g;
}

function buildMedic(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = mat(0xe5e7eb, { rough: 0.6 });
  const accent = mat(color);
  g.add(mesh(box(0.5, 0.65, 0.3), body, 0, 0.9, 0));
  g.add(mesh(sphere(0.22), mat(SKIN), 0, 1.35, 0));
  g.add(mesh(box(0.44, 0.16, 0.44), accent, 0, 1.46, 0)); // helmet
  // red cross on chest
  g.add(mesh(box(0.06, 0.26, 0.04), mat(0xdc2626, { emissive: 0x550000 }), 0, 0.95, 0.17));
  g.add(mesh(box(0.22, 0.06, 0.04), mat(0xdc2626, { emissive: 0x550000 }), 0, 0.95, 0.17));
  g.add(mesh(box(0.18, 0.5, 0.18), accent, -0.15, 0.32, 0));
  g.add(mesh(box(0.18, 0.5, 0.18), accent, 0.15, 0.32, 0));
  g.add(mesh(box(0.14, 0.4, 0.14), body, -0.32, 0.95, 0.05));
  g.add(mesh(box(0.14, 0.4, 0.14), body, 0.32, 0.95, 0.05));
  g.add(mesh(box(0.22, 0.3, 0.16), mat(0x9ca3af), 0, 0.95, -0.25)); // med kit backpack
  return g;
}

function buildBiker(color: number): THREE.Group {
  const g = new THREE.Group();
  const leather = mat(0x1c1917, { rough: 0.5, metal: 0.2 });
  const accent = mat(color);
  g.add(mesh(box(0.52, 0.62, 0.3), leather, 0, 0.88, 0));
  g.add(mesh(box(0.6, 0.16, 0.4), accent, 0, 1.18, 0)); // shoulder studs band
  g.add(mesh(sphere(0.21), mat(SKIN), 0, 1.32, 0));
  g.add(mesh(box(0.42, 0.18, 0.42), mat(0x0a0a0a, { metal: 0.5 }), 0, 1.42, 0)); // helmet
  g.add(mesh(box(0.18, 0.48, 0.18), leather, -0.14, 0.3, 0));
  g.add(mesh(box(0.18, 0.48, 0.18), leather, 0.14, 0.3, 0));
  g.add(mesh(box(0.13, 0.4, 0.13), leather, 0.3, 0.9, 0.1));
  // bat/chain weapon
  g.add(mesh(box(0.06, 0.06, 0.5), mat(0x6b7280, { metal: 0.7 }), 0.34, 0.9, 0.3));
  g.add(mesh(sphere(0.1), mat(0x9ca3af, { metal: 0.8 }), 0.34, 0.9, 0.55));
  return g;
}

function buildBomber(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = mat(color, { rough: 0.7 });
  g.add(mesh(box(0.62, 0.62, 0.42), body, 0, 0.88, 0));
  g.add(mesh(sphere(0.22), mat(SKIN), 0, 1.32, 0));
  g.add(mesh(box(0.46, 0.16, 0.46), mat(0x7c2d12), 0, 1.42, 0));
  g.add(mesh(box(0.22, 0.5, 0.2), body, -0.17, 0.33, 0));
  g.add(mesh(box(0.22, 0.5, 0.2), body, 0.17, 0.33, 0));
  g.add(mesh(box(0.14, 0.38, 0.14), body, -0.34, 0.9, 0.05));
  g.add(mesh(box(0.14, 0.38, 0.14), body, 0.34, 0.9, 0.05));
  // bomb pack on back
  g.add(mesh(sphere(0.22), mat(0x111111, { metal: 0.4 }), 0, 0.92, -0.32));
  g.add(mesh(cyl(0.03, 0.03, 0.22), mat(0xdc2626, { emissive: 0x551111 }), 0, 1.18, -0.32)); // fuse
  return g;
}

function buildSniper(color: number): THREE.Group {
  const g = new THREE.Group();
  const body = mat(color, { rough: 0.7 });
  const ghillie = mat(0x44403c, { rough: 0.9 });
  // crouched: shorter torso
  g.add(mesh(box(0.46, 0.5, 0.3), ghillie, 0, 0.66, 0));
  g.add(mesh(sphere(0.2), mat(SKIN), 0, 0.98, 0.05));
  g.add(mesh(box(0.42, 0.12, 0.42), ghillie, 0, 1.06, 0));
  g.add(mesh(box(0.18, 0.4, 0.18), body, -0.13, 0.25, 0));
  g.add(mesh(box(0.18, 0.4, 0.18), body, 0.13, 0.25, 0.1));
  g.add(mesh(box(0.12, 0.34, 0.12), body, 0.28, 0.7, 0.1));
  // very long rifle
  g.add(mesh(box(0.05, 0.05, 1.2), mat(DARK_METAL, { metal: 0.7 }), 0.2, 0.78, 0.55));
  g.add(mesh(box(0.07, 0.1, 0.18), mat(0x111111, { metal: 0.6 }), 0.2, 0.86, 0.4)); // scope
  return g;
}

function buildCombatBot(color: number): THREE.Group {
  const g = new THREE.Group();
  const metal = mat(color, { metal: 0.6, rough: 0.4 });
  const dark = mat(DARK_METAL, { metal: 0.7 });
  g.add(mesh(box(0.6, 0.7, 0.4), metal, 0, 0.92, 0));
  g.add(mesh(box(0.4, 0.36, 0.36), dark, 0, 1.42, 0)); // cube head
  // glowing eyes
  g.add(mesh(box(0.08, 0.06, 0.04), mat(0x22d3ee, { emissive: 0x22d3ee }), -0.1, 1.44, 0.19));
  g.add(mesh(box(0.08, 0.06, 0.04), mat(0x22d3ee, { emissive: 0x22d3ee }), 0.1, 1.44, 0.19));
  g.add(mesh(cyl(0.01, 0.01, 0.22), dark, 0, 1.7, 0)); // antenna
  g.add(mesh(sphere(0.04), mat(0xef4444, { emissive: 0xef4444 }), 0, 1.82, 0));
  g.add(mesh(box(0.2, 0.5, 0.2), metal, -0.22, 0.34, 0));
  g.add(mesh(box(0.2, 0.5, 0.2), metal, 0.22, 0.34, 0));
  g.add(mesh(box(0.14, 0.42, 0.14), dark, 0.34, 0.92, 0.05));
  g.add(mesh(box(0.06, 0.06, 0.5), dark, 0.34, 0.92, 0.32)); // arm cannon
  return g;
}

function buildWarDrone(color: number): THREE.Group {
  const g = new THREE.Group();
  const metal = mat(color, { metal: 0.6, rough: 0.4 });
  const dark = mat(DARK_METAL, { metal: 0.7 });
  const disc = mesh(cyl(0.4, 0.4, 0.12, 12), metal, 0, 0, 0);
  g.add(disc);
  g.add(mesh(sphere(0.16), mat(0x111111, { metal: 0.5 }), 0, -0.06, 0)); // sensor pod
  g.add(mesh(sphere(0.05), mat(0xef4444, { emissive: 0xef4444 }), 0, -0.06, 0.14));
  const arms = [
    [0.4, 0.4],
    [-0.4, 0.4],
    [0.4, -0.4],
    [-0.4, -0.4],
  ];
  for (const [ax, az] of arms) {
    const rotor = mesh(cyl(0.12, 0.12, 0.04, 8), dark, ax, 0.08, az);
    g.add(rotor);
  }
  // gun underneath
  g.add(mesh(box(0.06, 0.06, 0.4), dark, 0, -0.04, 0.3));
  return g;
}

function buildMechWalker(color: number): THREE.Group {
  const g = new THREE.Group();
  const metal = mat(color, { metal: 0.6, rough: 0.4 });
  const dark = mat(DARK_METAL, { metal: 0.7 });
  // big body
  g.add(mesh(box(1.0, 0.7, 0.8), metal, 0, 1.3, 0));
  // cockpit
  g.add(mesh(box(0.5, 0.4, 0.5), dark, 0, 1.55, 0.25));
  g.add(mesh(box(0.4, 0.1, 0.04), mat(0x22d3ee, { emissive: 0x22d3ee }), 0, 1.6, 0.5)); // viewport
  // 4 legs
  const legPos = [
    [0.45, 0.35],
    [-0.45, 0.35],
    [0.45, -0.35],
    [-0.45, -0.35],
  ];
  for (const [lx, lz] of legPos) {
    g.add(mesh(cyl(0.1, 0.14, 0.9, 6), dark, lx, 0.55, lz));
    g.add(mesh(box(0.24, 0.12, 0.3), metal, lx, 0.06, lz)); // foot
  }
  // turret cannons
  g.add(mesh(box(0.1, 0.1, 0.9), dark, -0.25, 1.45, 0.4));
  g.add(mesh(box(0.1, 0.1, 0.9), dark, 0.25, 1.45, 0.4));
  return g;
}

function buildZombie(color: number): THREE.Group {
  const g = new THREE.Group();
  const flesh = mat(color, { rough: 0.95 });
  g.add(mesh(box(0.46, 0.6, 0.28), flesh, 0, 0.86, 0));
  g.add(mesh(sphere(0.2), mat(0x8a9a6b), 0, 1.22, 0));
  g.add(mesh(box(0.17, 0.46, 0.17), flesh, -0.13, 0.3, 0));
  g.add(mesh(box(0.17, 0.46, 0.17), flesh, 0.13, 0.3, 0.08));
  // arms extended forward
  const la = mesh(box(0.13, 0.13, 0.5), flesh, -0.2, 1.0, 0.28);
  const ra = mesh(box(0.13, 0.13, 0.5), flesh, 0.2, 1.0, 0.28);
  g.add(la);
  g.add(ra);
  g.rotation.x = 0.12; // shambling tilt
  return g;
}

function buildFeral(color: number): THREE.Group {
  const g = new THREE.Group();
  const flesh = mat(color, { rough: 0.95 });
  g.add(mesh(box(0.46, 0.5, 0.3), flesh, 0, 0.72, 0));
  g.add(mesh(sphere(0.19), mat(0x3a2f24), 0, 1.0, 0.12));
  // claws/arms forward, wide stance
  g.add(mesh(box(0.13, 0.13, 0.46), flesh, -0.24, 0.85, 0.26));
  g.add(mesh(box(0.13, 0.13, 0.46), flesh, 0.24, 0.85, 0.26));
  g.add(mesh(box(0.17, 0.42, 0.17), flesh, -0.2, 0.28, 0));
  g.add(mesh(box(0.17, 0.42, 0.17), flesh, 0.2, 0.28, 0));
  g.rotation.x = 0.3; // hunched forward
  return g;
}

function buildBrute(color: number): THREE.Group {
  const g = new THREE.Group();
  const flesh = mat(color, { rough: 0.85 });
  g.add(mesh(box(0.9, 0.8, 0.5), flesh, 0, 1.0, 0)); // very wide body
  g.add(mesh(sphere(0.26), mat(0x581c87), 0, 1.5, 0));
  // oversized arms (bigger than body height)
  g.add(mesh(box(0.26, 0.95, 0.26), flesh, -0.6, 0.85, 0.08));
  g.add(mesh(box(0.26, 0.95, 0.26), flesh, 0.6, 0.85, 0.08));
  g.add(mesh(sphere(0.2), flesh, -0.6, 0.4, 0.08)); // fists
  g.add(mesh(sphere(0.2), flesh, 0.6, 0.4, 0.08));
  g.add(mesh(box(0.28, 0.6, 0.28), flesh, -0.24, 0.35, 0));
  g.add(mesh(box(0.28, 0.6, 0.28), flesh, 0.24, 0.35, 0));
  return g;
}

function buildAlpha(color: number): THREE.Group {
  const g = buildBrute(color);
  // crown spikes on head
  const crown = mat(0xfbbf24, { emissive: 0x553300, metal: 0.3 });
  for (let i = -2; i <= 2; i++) {
    const spike = mesh(cyl(0.0, 0.06, 0.3, 4), crown, i * 0.12, 1.78, 0);
    g.add(spike);
  }
  // glowing eyes
  g.add(mesh(sphere(0.05), mat(0xf43f5e, { emissive: 0xf43f5e }), -0.1, 1.52, 0.22));
  g.add(mesh(sphere(0.05), mat(0xf43f5e, { emissive: 0xf43f5e }), 0.1, 1.52, 0.22));
  return g;
}

function buildKillerBot(color: number): THREE.Group {
  const g = new THREE.Group();
  const metal = mat(color, { metal: 0.8, rough: 0.25 });
  const dark = mat(0x4b5563, { metal: 0.7 });
  g.add(mesh(box(0.46, 0.66, 0.32), metal, 0, 0.9, 0));
  g.add(mesh(box(0.34, 0.3, 0.34), metal, 0, 1.38, 0));
  // single red optic
  g.add(mesh(box(0.24, 0.06, 0.04), mat(0xff0000, { emissive: 0xff0000 }), 0, 1.4, 0.18));
  g.add(mesh(box(0.16, 0.5, 0.16), dark, -0.16, 0.34, 0));
  g.add(mesh(box(0.16, 0.5, 0.16), dark, 0.16, 0.34, 0));
  g.add(mesh(box(0.12, 0.4, 0.12), metal, 0.3, 0.9, 0.05));
  g.add(mesh(box(0.05, 0.05, 0.55), dark, 0.3, 0.9, 0.34)); // rifle
  return g;
}

function buildRobotTank(color: number): THREE.Group {
  const g = new THREE.Group();
  const metal = mat(color, { metal: 0.7, rough: 0.4 });
  const dark = mat(DARK_METAL, { metal: 0.7 });
  // wide hull
  g.add(mesh(box(1.2, 0.5, 0.9), metal, 0, 0.55, 0));
  // treads
  g.add(mesh(box(1.3, 0.34, 0.26), dark, 0, 0.3, 0.46));
  g.add(mesh(box(1.3, 0.34, 0.26), dark, 0, 0.3, -0.46));
  // turret
  g.add(mesh(box(0.6, 0.34, 0.6), metal, 0, 0.95, 0));
  const barrel = mesh(cyl(0.08, 0.08, 0.9, 8), dark, 0, 0.98, 0.5);
  barrel.rotation.x = Math.PI / 2;
  g.add(barrel);
  g.add(mesh(sphere(0.05), mat(0xff0000, { emissive: 0xff0000 }), 0, 1.12, 0.28));
  return g;
}

type Builder = (color: number) => THREE.Group;
const BUILDERS: Record<UnitTypeId, Builder> = {
  scout: buildScout,
  rifleman: buildRifleman,
  heavy: buildHeavy,
  medic: buildMedic,
  biker: buildBiker,
  bomber: buildBomber,
  sniper: buildSniper,
  combatBot: buildCombatBot,
  warDrone: buildWarDrone,
  mechWalker: buildMechWalker,
  zombie: buildZombie,
  feral: buildFeral,
  brute: buildBrute,
  alpha: buildAlpha,
  killerBot: buildKillerBot,
  robotTank: buildRobotTank,
};

// Build a unit model. `team` tints enemy units slightly red-grey for contrast.
export function buildUnitModel(
  type: UnitTypeId,
  level: number,
  team: 'player' | 'enemy',
): THREE.Group {
  const def = UNIT_DEFS[type];
  const color = levelTint(def.color, level);
  const root = new THREE.Group();
  const figure = BUILDERS[type](color);
  root.add(figure);

  const scale = def.scale ?? 1;
  root.scale.setScalar(scale);

  // Level 3: glowing aura ring under the unit
  if (level >= 3) {
    const auraGeo = new THREE.RingGeometry(0.5, 0.7, 20);
    const auraMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.05;
    aura.name = 'aura';
    root.add(aura);
  }

  // Team marker disc beneath feet
  const markGeo = new THREE.CircleGeometry(0.5, 16);
  const markMat = new THREE.MeshBasicMaterial({
    color: team === 'player' ? 0x22c55e : 0xb91c1c,
    transparent: true,
    opacity: 0.28,
  });
  const mark = new THREE.Mesh(markGeo, markMat);
  mark.rotation.x = -Math.PI / 2;
  mark.position.y = 0.02;
  root.add(mark);

  return root;
}
