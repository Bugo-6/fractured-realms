import * as THREE from 'three';
import type { BattleUnit } from './types';

export type CameraMode = 'tactical' | 'action' | 'cinematic' | 'freeOrbit';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private mode: CameraMode = 'tactical';
  private trackedUnitId: number | null = null;

  // Cinematic state
  private cinematicAngle = 0;
  private cinematicFocusTimer = 0;
  private cinematicFocusPos = new THREE.Vector3();

  // Camera shake
  private shakeAmount = 0;
  private shakeDecay = 8; // per second

  // Smooth camera
  private targetPos = new THREE.Vector3(0, 28, 22);
  private targetLookAt = new THREE.Vector3(0, 0, 0);
  private currentPos = new THREE.Vector3(0, 28, 22);
  private currentLookAt = new THREE.Vector3(0, 0, 0);

  // OrbitControls (only active in freeOrbit mode)
  private orbitEnabled = false;
  private orbitTarget = new THREE.Vector3(0, 0, 0);
  private orbitRadius = 38;
  private orbitTheta = 0;
  private orbitPhi = Math.PI / 4;
  private isDragging = false;
  private lastMouse = { x: 0, y: 0 };

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPos.copy(camera.position);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
    if (mode === 'freeOrbit') {
      this.orbitEnabled = true;
    } else {
      this.orbitEnabled = false;
    }
  }

  getMode(): CameraMode {
    return this.mode;
  }

  setTrackedUnit(id: number | null): void {
    this.trackedUnitId = id;
  }

  shake(intensity: number): void {
    this.shakeAmount = Math.max(this.shakeAmount, intensity);
  }

  // Call on mousedown/mousemove/mouseup for free orbit
  onMouseDown(e: MouseEvent): void {
    if (!this.orbitEnabled) return;
    this.isDragging = true;
    this.lastMouse = { x: e.clientX, y: e.clientY };
  }
  onMouseMove(e: MouseEvent): void {
    if (!this.orbitEnabled || !this.isDragging) return;
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    this.orbitTheta -= dx * 0.005;
    this.orbitPhi = Math.max(0.15, Math.min(Math.PI / 2.2, this.orbitPhi - dy * 0.005));
    this.lastMouse = { x: e.clientX, y: e.clientY };
  }
  onMouseUp(): void {
    this.isDragging = false;
  }
  onWheel(e: WheelEvent): void {
    if (!this.orbitEnabled) return;
    this.orbitRadius = Math.max(15, Math.min(70, this.orbitRadius + e.deltaY * 0.05));
  }

  update(dt: number, units: BattleUnit[]): void {
    // Decay shake
    this.shakeAmount = Math.max(0, this.shakeAmount - dt * this.shakeDecay);

    const aliveUnits = units.filter((u) => u.alive && !u.dying);

    switch (this.mode) {
      case 'tactical': {
        this.targetPos.set(0, 28, 22);
        this.targetLookAt.set(0, 0, 0);
        break;
      }

      case 'action': {
        // Follow tracked unit or auto-pick a random live player unit
        let tracked = aliveUnits.find(
          (u) => u.id === this.trackedUnitId && u.team === 'player',
        );
        if (!tracked) {
          const playerUnits = aliveUnits.filter((u) => u.team === 'player');
          if (playerUnits.length > 0) {
            tracked = playerUnits[Math.floor(Math.random() * playerUnits.length)];
            this.trackedUnitId = tracked.id;
          }
        }
        if (tracked) {
          // Camera sits behind and above the tracked unit, facing enemies
          const angle = tracked.facing;
          this.targetPos.set(
            tracked.x - Math.sin(angle) * 8,
            4.5,
            tracked.z - Math.cos(angle) * 8,
          );
          this.targetLookAt.set(
            tracked.x + Math.sin(angle) * 10,
            1.5,
            tracked.z + Math.cos(angle) * 10,
          );
        }
        break;
      }

      case 'cinematic': {
        // Slow orbit around battlefield
        this.cinematicAngle += dt * 0.12;
        const radius = 38;
        this.targetPos.set(
          Math.sin(this.cinematicAngle) * radius,
          18 + Math.sin(this.cinematicAngle * 0.5) * 5,
          Math.cos(this.cinematicAngle) * radius,
        );
        // Randomly focus on a hotspot (random active unit)
        this.cinematicFocusTimer -= dt;
        if (this.cinematicFocusTimer <= 0) {
          this.cinematicFocusTimer = 2.5 + Math.random() * 3;
          const candidates = aliveUnits;
          if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            this.cinematicFocusPos.set(pick.x, 1, pick.z);
          }
        }
        this.targetLookAt.lerp(this.cinematicFocusPos, dt * 1.2);
        break;
      }

      case 'freeOrbit': {
        const x = this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
        const y = this.orbitRadius * Math.cos(this.orbitPhi);
        const z = this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);
        this.targetPos.set(
          this.orbitTarget.x + x,
          this.orbitTarget.y + y,
          this.orbitTarget.z + z,
        );
        this.targetLookAt.copy(this.orbitTarget);
        break;
      }
    }

    // Smooth camera interpolation
    const lerpSpeed = this.mode === 'freeOrbit' ? 1 : 3;
    this.currentPos.lerp(this.targetPos, Math.min(1, dt * lerpSpeed));
    this.currentLookAt.lerp(this.targetLookAt, Math.min(1, dt * lerpSpeed * 1.5));

    this.camera.position.copy(this.currentPos);

    // Apply shake as additive offset
    if (this.shakeAmount > 0.001) {
      const s = this.shakeAmount;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.camera.position.z += (Math.random() - 0.5) * s;
    }

    this.camera.lookAt(this.currentLookAt);
  }
}
