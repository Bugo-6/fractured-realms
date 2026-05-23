import React, { useRef, useEffect } from 'react';
import { BattleUnit, ArmyComp, BattleState } from '../game/types';
import { initBattle, tickBattle, CANVAS_W, CANVAS_H } from '../game/engine';

interface Props {
  playerArmy: ArmyComp[];
  enemyArmy: ArmyComp[];
  terrain: string;
  speedMultiplier: number;
  isPaused: boolean;
  onUpdate: (teamCount: [number, number]) => void;
  onEnd: (result: 'victory' | 'defeat') => void;
}

const TERRAIN_BG: Record<string, [string, string, string]> = {
  hills:      ['#0d1a0d', '#0a1a0a', '#1a3a1a'],
  desert:     ['#1a1005', '#120c04', '#3d2005'],
  industrial: ['#0a0e14', '#060a10', '#1a2233'],
  wasteland:  ['#120e08', '#0e0a06', '#2a201a'],
  ruins:      ['#12080f', '#0e060c', '#2d0f2a'],
  void:       ['#04000a', '#02000a', '#1a0040'],
};

function hexRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '200,200,200';
  return `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`;
}

function drawScene(ctx: CanvasRenderingContext2D, state: BattleState, terrain: string) {
  const [bg, floor, accent] = TERRAIN_BG[terrain] ?? TERRAIN_BG.hills;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, floor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Ground
  ctx.fillStyle = accent;
  ctx.fillRect(0, CANVAS_H - 18, CANVAS_W, 18);

  // Stars for dark terrains
  if (terrain === 'void' || terrain === 'ruins') {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 60; i++) {
      ctx.fillRect((i * 157.3 + 20) % CANVAS_W, (i * 89.7) % (CANVAS_H * 0.75), 1, 1);
    }
  }

  // Center divider
  ctx.setLineDash([12, 24]);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, 0);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Particles (behind units)
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Attack lines for ranged attackers
  for (const unit of state.units) {
    if (unit.state !== 'attacking' || !unit.isRanged || unit.flashTimer <= 0) continue;
    const target = state.units.find(u => u.id === unit.targetId);
    if (!target || target.state === 'dead') continue;
    ctx.strokeStyle = `rgba(${hexRgb(unit.color)},${unit.flashTimer / 120 * 0.6})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(unit.x, unit.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  }

  // Units
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const unit of state.units) {
    if (unit.state === 'dead') continue;

    const flash = unit.flashTimer > 0;
    const r = unit.radius;

    if (flash) {
      ctx.shadowColor = unit.color;
      ctx.shadowBlur = 14;
    }

    // Body
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexRgb(unit.color)},${flash ? 1.0 : 0.82})`;
    ctx.fill();

    // Team ring
    ctx.strokeStyle = unit.team === 0 ? '#93c5fd' : '#fca5a5';
    ctx.lineWidth = flash ? 2 : 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Letter
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${r < 10 ? 9 : 11}px monospace`;
    ctx.fillText(unit.letter, unit.x, unit.y + 0.5);

    // Health bar
    const bw = r * 2.2, bh = 2.5;
    const bx = unit.x - bw / 2, by = unit.y - r - 7;
    ctx.fillStyle = '#111';
    ctx.fillRect(bx, by, bw, bh);
    const ratio = unit.hp / unit.maxHp;
    ctx.fillStyle = ratio > 0.55 ? '#22c55e' : ratio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(bx, by, bw * ratio, bh);
  }

  ctx.textAlign = 'left';

  // HUD counts
  const alive0 = state.teamCount[0];
  const alive1 = state.teamCount[1];

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText(`YOUR: ${alive0}`, 16, 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fca5a5';
  ctx.fillText(`ENEMY: ${alive1}`, CANVAS_W - 16, 22);
  ctx.textAlign = 'left';

  // End overlay
  if (state.status !== 'running') {
    ctx.fillStyle = state.status === 'victory'
      ? 'rgba(0,40,0,0.72)'
      : 'rgba(40,0,0,0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.font = 'bold 80px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = state.status === 'victory' ? '#4ade80' : '#f87171';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 30;
    ctx.fillText(
      state.status === 'victory' ? 'VICTORY' : 'DEFEAT',
      CANVAS_W / 2, CANVAS_H / 2
    );
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
}

export function BattleCanvas({ playerArmy, enemyArmy, terrain, speedMultiplier, isPaused, onUpdate, onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(isPaused);
  const speedRef = useRef(speedMultiplier);

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { speedRef.current = speedMultiplier; }, [speedMultiplier]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let state = initBattle(playerArmy, enemyArmy);
    let lastTime = performance.now();
    let rafId: number;
    let ended = false;

    function loop(ts: number) {
      const raw = Math.min(ts - lastTime, 48);
      lastTime = ts;

      if (!pausedRef.current && state.status === 'running') {
        state = tickBattle(state, raw, speedRef.current);
        onUpdate(state.teamCount);
      }

      drawScene(ctx!, state, terrain);

      if (state.status !== 'running' && !ended) {
        ended = true;
        setTimeout(() => onEnd(state.status as 'victory' | 'defeat'), 1600);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="w-full rounded-xl border border-white/10 shadow-2xl"
    />
  );
}
