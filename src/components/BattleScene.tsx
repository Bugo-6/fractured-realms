// Main Three.js React component. Renders the 3D battle, drives the simulation,
// overlays HTML health bars, and manages the dynamic camera system, debris
// particles, camera shake on explosions, and animated environmental hazards.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { BattleConfig, BattleState, UnitTypeId } from '../game/types';
import { createBattle, stepBattle, deployUnit, injectEnemyUnit } from '../game/engine';
import { buildUnitModel } from '../game/unitModels';
import { buildArena } from '../game/arenaBuilder';
import { CameraController, type CameraMode } from '../game/cameraSystem';

interface BattleSceneProps {
  config: BattleConfig;
  paused: boolean;
  speed: number;
  onFinished: (winner: 'player' | 'enemy') => void;
  onCPUpdate?: (cp: number, maxCp: number) => void;
  registerDeploy?: (fn: ((type: UnitTypeId, level: number) => boolean) | null) => void;
  registerInjectEnemy?: (fn: ((type: UnitTypeId, level: number) => void) | null) => void;
}

interface HealthBar {
  id: number;
  x: number;
  y: number;
  ratio: number;
  team: 'player' | 'enemy';
  visible: boolean;
}

interface DebrisParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const ROBOT_TYPES = new Set(['killerBot', 'robotTank', 'combatBot', 'warDrone', 'mechWalker']);

const CAM_LABELS: { mode: CameraMode; label: string; key: string }[] = [
  { mode: 'tactical', label: 'Tactical', key: '1' },
  { mode: 'action', label: 'Action Cam', key: '2' },
  { mode: 'cinematic', label: 'Cinematic', key: '3' },
  { mode: 'freeOrbit', label: 'Free Orbit', key: '4' },
];

export const BattleScene: React.FC<BattleSceneProps> = ({
  config,
  paused,
  speed,
  onFinished,
  onCPUpdate,
  registerDeploy,
  registerInjectEnemy,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [bars, setBars] = useState<HealthBar[]>([]);
  const [camMode, setCamMode] = useState<CameraMode>('tactical');

  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  const onCPUpdateRef = useRef(onCPUpdate);
  const camControllerRef = useRef<CameraController | null>(null);
  const camModeRef = useRef<CameraMode>('tactical');

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);
  useEffect(() => { onCPUpdateRef.current = onCPUpdate; }, [onCPUpdate]);

  const switchCamMode = useCallback((mode: CameraMode) => {
    camModeRef.current = mode;
    setCamMode(mode);
    camControllerRef.current?.setMode(mode);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    finishedRef.current = false;

    const scene = new THREE.Scene();
    const arena = buildArena(config.arena);
    scene.background = new THREE.Color(arena.background);
    scene.fog = arena.fog;
    scene.add(arena.scenery);

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 28, 22);
    camera.lookAt(0, 0, 0);

    const camCtrl = new CameraController(camera, config.arena);
    camCtrl.setMode(camModeRef.current);
    camControllerRef.current = camCtrl;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(arena.ambient, arena.ambientIntensity);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(arena.sun, arena.sunIntensity);
    sun.position.set(...arena.sunPos);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -55;
    sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -45;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    scene.add(sun);
    if (arena.extraLights) {
      for (const l of arena.extraLights) scene.add(l);
    }

    const state: BattleState = createBattle(config);
    const meshMap = new Map<number, THREE.Group>();
    for (const u of state.units) {
      const m = buildUnitModel(u.type, u.level, u.team);
      m.position.set(u.x, u.flying ? 1.4 : 0, u.z);
      m.rotation.y = u.facing;
      scene.add(m);
      meshMap.set(u.id, m);
    }

    const wasAlive = new Map<number, boolean>();
    for (const u of state.units) wasAlive.set(u.id, true);

    if (registerDeploy) {
      registerDeploy((type, level) => deployUnit(state, type, level));
    }
    if (registerInjectEnemy) {
      registerInjectEnemy((type, level) => injectEnemyUnit(state, type, level));
    }
    let cpAccum = 0;
    let lastReportedCP = -1;

    const debris: DebrisParticle[] = [];
    const debrisGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const debrMats = [
      new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.6, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.2 }),
    ];

    function spawnDebris(x: number, y: number, z: number): void {
      for (let i = 0; i < 8; i++) {
        const dm = debrMats[Math.floor(Math.random() * debrMats.length)];
        const dMesh = new THREE.Mesh(debrisGeo, dm);
        dMesh.position.set(x, y + 0.5 + Math.random(), z);
        dMesh.castShadow = true;
        scene.add(dMesh);
        const angle = Math.random() * Math.PI * 2;
        const power = 2 + Math.random() * 5;
        debris.push({
          mesh: dMesh,
          vx: Math.cos(angle) * power,
          vy: 3 + Math.random() * 4,
          vz: Math.sin(angle) * power,
          life: 1.2 + Math.random() * 0.6,
          maxLife: 1.8,
        });
      }
    }

    const projMap = new Map<number, THREE.Mesh>();
    const projGeo = new THREE.SphereGeometry(0.18, 6, 6);

    const handleResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1') switchCamMode('tactical');
      else if (e.key === '2') switchCamMode('action');
      else if (e.key === '3') switchCamMode('cinematic');
      else if (e.key === '4') switchCamMode('freeOrbit');
    };
    window.addEventListener('keydown', handleKey);

    const handleMouseDown = (e: MouseEvent) => camCtrl.onMouseDown(e);
    const handleMouseMove = (e: MouseEvent) => camCtrl.onMouseMove(e);
    const handleMouseUp = () => camCtrl.onMouseUp();
    const handleWheel = (e: WheelEvent) => camCtrl.onWheel(e);
    mount.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    mount.addEventListener('wheel', handleWheel, { passive: true });

    let raf = 0;
    let last = performance.now();
    const tmpVec = new THREE.Vector3();
    let barAccum = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;

      if (!pausedRef.current) {
        const simDt = dt * speedRef.current;
        const steps = Math.max(1, Math.ceil(speedRef.current));
        for (let s = 0; s < steps; s++) {
          stepBattle(state, simDt / steps);
        }
      }

      camCtrl.update(dt, state.units);

      cpAccum += dt;
      if (cpAccum > 0.1) {
        cpAccum = 0;
        if (onCPUpdateRef.current && state.commandPoints !== lastReportedCP) {
          lastReportedCP = state.commandPoints;
          onCPUpdateRef.current(state.commandPoints, state.maxCP);
        }
      }

      arena.scenery.children.forEach((child) => {
        if (child.name?.startsWith('sandsheet_')) {
          child.position.x += dt * 3;
          if (child.position.x > 50) child.position.x -= 100;
          child.rotation.y += dt * 0.1;
        }
        if (child.name?.startsWith('lavawarning_')) {
          const pulse = 0.5 + Math.sin(state.elapsed * 3 + child.position.x) * 0.5;
          const lm = (child as THREE.Mesh).material;
          if (lm) (lm as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + pulse * 1.2;
        }
      });

      for (const u of state.units) {
        let m = meshMap.get(u.id);
        if (!m && u.alive) {
          m = buildUnitModel(u.type, u.level, u.team);
          m.position.set(u.x, u.flying ? 1.4 : 0, u.z);
          m.rotation.y = u.facing;
          scene.add(m);
          meshMap.set(u.id, m);
          wasAlive.set(u.id, true);
        }
        if (!m) continue;
        if (!u.alive) {
          if (meshMap.has(u.id)) {
            scene.remove(m);
            disposeGroup(m);
            meshMap.delete(u.id);
          }
          continue;
        }

        if (u.dying && wasAlive.get(u.id) && ROBOT_TYPES.has(u.type)) {
          spawnDebris(u.x, 0, u.z);
          camCtrl.shake(0.4);
          wasAlive.set(u.id, false);
        }

        const baseY = u.flying ? 1.4 : 0;
        m.position.x = u.x;
        m.position.z = u.z;
        m.rotation.y = u.facing;

        let y = baseY;
        if (u.spawnTimer < 0.4) {
          const t = u.spawnTimer / 0.4;
          y = baseY - (1 - t) * 1.5;
        }

        if (u.dying) {
          const t = Math.min(1, u.deathTimer / 0.6);
          m.rotation.x = t * (Math.PI / 2) * 0.9;
          y = baseY - t * 0.4;
          const sc = (1 - t * 0.3) * u.scale;
          m.scale.setScalar(sc * (m.userData.baseScale ?? 1));
        } else {
          m.rotation.x = 0;
          y += Math.sin((state.elapsed + u.id) * 6) * (u.flying ? 0.12 : 0.03);
          if (u.attackAnim > 0) {
            y += Math.sin((1 - u.attackAnim / 0.25) * Math.PI) * 0.1;
          }
        }
        m.position.y = y;

        applyHitFlash(m, u.hitFlash);

        if (u.flying) m.children[0].rotation.y += dt * 25;
        const aura = m.children.find((c) => c.name === 'aura');
        if (aura) aura.rotation.z += dt * 2;
      }

      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.life -= dt;
        if (d.life <= 0) { scene.remove(d.mesh); debris.splice(i, 1); continue; }
        d.vy -= 9.8 * dt;
        d.mesh.position.x += d.vx * dt;
        d.mesh.position.y += d.vy * dt;
        d.mesh.position.z += d.vz * dt;
        if (d.mesh.position.y < 0.09) {
          d.mesh.position.y = 0.09;
          d.vx *= 0.6; d.vz *= 0.6; d.vy *= -0.25;
        }
        const alpha = Math.min(1, d.life / (d.maxLife * 0.3));
        (d.mesh.material as THREE.MeshStandardMaterial).opacity = alpha;
        (d.mesh.material as THREE.MeshStandardMaterial).transparent = alpha < 1;
        d.mesh.rotation.x += dt * 3;
        d.mesh.rotation.z += dt * 2;
      }

      for (const p of state.projectiles) {
        let pm = projMap.get(p.id);
        if (!pm) {
          const pmat = new THREE.MeshBasicMaterial({ color: p.color });
          pm = new THREE.Mesh(projGeo, pmat);
          if (p.kind === 'explosive') pm.scale.setScalar(2.2);
          scene.add(pm);
          projMap.set(p.id, pm);
        }
        pm.position.set(p.x, p.y, p.z);
      }
      const liveProjIds = new Set(state.projectiles.map((p) => p.id));
      for (const [id, pm] of projMap) {
        if (!liveProjIds.has(id)) {
          if (pm.scale.x > 1.5) camCtrl.shake(0.55);
          scene.remove(pm);
          (pm.material as THREE.Material).dispose();
          projMap.delete(id);
        }
      }

      barAccum += dt;
      if (barAccum > 0.05) {
        barAccum = 0;
        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;
        const newBars: HealthBar[] = [];
        for (const u of state.units) {
          if (!u.alive || u.dying) continue;
          const m = meshMap.get(u.id);
          if (!m) continue;
          tmpVec.set(u.x, (u.flying ? 1.4 : 0) + 2.2 * u.scale, u.z);
          tmpVec.project(camera);
          const visible = tmpVec.z < 1;
          newBars.push({
            id: u.id,
            x: (tmpVec.x * 0.5 + 0.5) * w,
            y: (-tmpVec.y * 0.5 + 0.5) * h,
            ratio: Math.max(0, u.hp / u.maxHp),
            team: u.team,
            visible,
          });
        }
        setBars(newBars);
      }

      renderer.render(scene, camera);

      if (state.finished && !finishedRef.current) {
        finishedRef.current = true;
        const winner = state.winner ?? 'enemy';
        window.setTimeout(() => onFinishedRef.current(winner), 1100);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKey);
      mount.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      mount.removeEventListener('wheel', handleWheel);
      for (const m of meshMap.values()) disposeGroup(m);
      for (const pm of projMap.values()) (pm.material as THREE.Material).dispose();
      for (const d of debris) scene.remove(d.mesh);
      projGeo.dispose();
      debrisGeo.dispose();
      debrMats.forEach((m) => m.dispose());
      disposeGroup(arena.scenery);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      camControllerRef.current = null;
      if (registerDeploy) registerDeploy(null);
      if (registerInjectEnemy) registerInjectEnemy(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  return (
    <div ref={mountRef} className="absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        {bars.map((b) =>
          b.visible ? (
            <div key={b.id} className="absolute" style={{ left: b.x - 18, top: b.y, width: 36 }}>
              <div className="h-1.5 w-full rounded-sm bg-black/60 ring-1 ring-black/40">
                <div
                  className="h-full rounded-sm transition-[width] duration-100"
                  style={{
                    width: `${b.ratio * 100}%`,
                    background: b.team === 'player'
                      ? b.ratio > 0.4 ? '#22c55e' : '#eab308'
                      : '#ef4444',
                  }}
                />
              </div>
            </div>
          ) : null,
        )}
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        {CAM_LABELS.map(({ mode, label, key }) => (
          <button
            key={mode}
            onClick={() => switchCamMode(mode)}
            className={`rounded border px-3 py-1 font-mono text-xs transition-colors
              ${
                camMode === mode
                  ? 'border-amber-400/60 bg-amber-500/30 text-amber-300'
                  : 'border-white/20 bg-black/50 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
          >
            [{key}] {label}
          </button>
        ))}
        {camMode === 'freeOrbit' && (
          <div className="mt-1 text-center font-mono text-xs text-gray-500">
            Drag to rotate<br />Scroll to zoom
          </div>
        )}
      </div>
    </div>
  );
};

function applyHitFlash(group: THREE.Group, flash: number): void {
  group.traverse((obj) => {
    const me = obj as THREE.Mesh;
    if (!(me.isMesh && me.material)) return;
    const mat = me.material as THREE.MeshStandardMaterial;
    if (!mat.emissive) return;
    const ud = me.userData as { baseEmissive?: number; baseEI?: number };
    if (ud.baseEmissive === undefined) {
      ud.baseEmissive = mat.emissive.getHex();
      ud.baseEI = mat.emissiveIntensity;
    }
    if (flash > 0) {
      mat.emissive.setHex(0xff3333);
      mat.emissiveIntensity = flash * 3;
    } else {
      mat.emissive.setHex(ud.baseEmissive);
      mat.emissiveIntensity = ud.baseEI ?? 0;
    }
  });
}

function disposeGroup(group: THREE.Object3D): void {
  group.traverse((obj) => {
    const me = obj as THREE.Mesh;
    if (me.isMesh) {
      const mat = me.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    }
  });
}
