// Main Three.js React component. Renders the 3D battle, drives the simulation,
// and overlays HTML health bars positioned via Vector3.project().

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { BattleConfig, BattleState } from '../game/types';
import { createBattle, stepBattle } from '../game/engine';
import { buildUnitModel } from '../game/unitModels';
import { buildArena } from '../game/arenaBuilder';

interface BattleSceneProps {
  config: BattleConfig;
  paused: boolean;
  speed: number; // sim speed multiplier
  onFinished: (winner: 'player' | 'enemy') => void;
}

interface HealthBar {
  id: number;
  x: number; // screen px
  y: number;
  ratio: number;
  team: 'player' | 'enemy';
  visible: boolean;
}

export const BattleScene: React.FC<BattleSceneProps> = ({
  config,
  paused,
  speed,
  onFinished,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [bars, setBars] = useState<HealthBar[]>([]);

  // Refs that survive across the animation loop without re-rendering.
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    finishedRef.current = false;

    // ---- Scene / camera / renderer ----
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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ---- Lighting ----
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

    // ---- Build initial battle state + meshes ----
    const state: BattleState = createBattle(config);
    const meshMap = new Map<number, THREE.Group>();
    for (const u of state.units) {
      const m = buildUnitModel(u.type, u.level, u.team);
      m.position.set(u.x, u.flying ? 1.4 : 0, u.z);
      m.rotation.y = u.facing;
      scene.add(m);
      meshMap.set(u.id, m);
    }

    // Projectile meshes pooled by id
    const projMap = new Map<number, THREE.Mesh>();
    const projGeo = new THREE.SphereGeometry(0.18, 6, 6);

    // ---- Resize handling ----
    const handleResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ---- Animation loop ----
    let raf = 0;
    let last = performance.now();
    const tmpVec = new THREE.Vector3();
    let barAccum = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp big frame gaps

      if (!pausedRef.current) {
        const simDt = dt * speedRef.current;
        // sub-step for stability at high speed
        const steps = Math.max(1, Math.ceil(speedRef.current));
        for (let s = 0; s < steps; s++) {
          stepBattle(state, simDt / steps);
        }
      }

      // ---- Sync unit meshes ----
      for (const u of state.units) {
        const m = meshMap.get(u.id);
        if (!m) continue;
        if (!u.alive) {
          if (m.visible) {
            scene.remove(m);
            disposeGroup(m);
            meshMap.delete(u.id);
          }
          continue;
        }

        const baseY = u.flying ? 1.4 : 0;
        m.position.x = u.x;
        m.position.z = u.z;
        m.rotation.y = u.facing;

        // spawn rise
        let y = baseY;
        if (u.spawnTimer < 0.4) {
          const t = u.spawnTimer / 0.4;
          y = baseY - (1 - t) * 1.5;
        }

        if (u.dying) {
          // fall-over animation: tip forward and sink
          const t = Math.min(1, u.deathTimer / 0.6);
          m.rotation.x = t * (Math.PI / 2) * 0.9;
          y = baseY - t * 0.4;
          // fade by scaling down material opacity-ish via scale
          const s = (1 - t * 0.3) * u.scale;
          m.scale.setScalar(s * (m.userData.baseScale ?? 1));
        } else {
          m.rotation.x = u.flying ? 0 : 0;
          // subtle bob while moving / idle breathing
          y += Math.sin((state.elapsed + u.id) * 6) * (u.flying ? 0.12 : 0.03);
          // attack lunge
          if (u.attackAnim > 0) {
            y += Math.sin((1 - u.attackAnim / 0.25) * Math.PI) * 0.1;
          }
        }
        m.position.y = y;

        // hit flash: tint via emissive on the figure's first child meshes
        applyHitFlash(m, u.hitFlash);

        // rotate war drone rotors / spin aura
        if (u.flying) {
          m.children[0].rotation.y += dt * 25;
        }
        const aura = m.children.find((c) => c.name === 'aura');
        if (aura) aura.rotation.z += dt * 2;
      }

      // ---- Sync projectiles ----
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
      // remove dead projectiles
      const liveProjIds = new Set(state.projectiles.map((p) => p.id));
      for (const [id, pm] of projMap) {
        if (!liveProjIds.has(id)) {
          scene.remove(pm);
          (pm.material as THREE.Material).dispose();
          projMap.delete(id);
        }
      }

      // ---- Health bar overlay (throttled to ~20fps) ----
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

      // ---- Finish handling ----
      if (state.finished && !finishedRef.current) {
        finishedRef.current = true;
        const winner = state.winner ?? 'enemy';
        // brief delay so the last death animation plays
        window.setTimeout(() => onFinishedRef.current(winner), 1100);
      }
    };
    raf = requestAnimationFrame(tick);

    // ---- Cleanup ----
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      for (const m of meshMap.values()) disposeGroup(m);
      for (const pm of projMap.values()) {
        (pm.material as THREE.Material).dispose();
      }
      projGeo.dispose();
      disposeGroup(arena.scenery);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  return (
    <div ref={mountRef} className="absolute inset-0 overflow-hidden">
      {/* Health bar overlay */}
      <div className="pointer-events-none absolute inset-0">
        {bars.map((b) =>
          b.visible ? (
            <div
              key={b.id}
              className="absolute"
              style={{
                left: b.x - 18,
                top: b.y,
                width: 36,
              }}
            >
              <div className="h-1.5 w-full rounded-sm bg-black/60 ring-1 ring-black/40">
                <div
                  className="h-full rounded-sm transition-[width] duration-100"
                  style={{
                    width: `${b.ratio * 100}%`,
                    background:
                      b.team === 'player'
                        ? b.ratio > 0.4
                          ? '#22c55e'
                          : '#eab308'
                        : '#ef4444',
                  }}
                />
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
};

// Apply a brief white/red emissive flash on hit to all meshes in a group.
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
      // Geometry may be shared (cached) — dispose materials only to be safe
      const mat = me.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
}
