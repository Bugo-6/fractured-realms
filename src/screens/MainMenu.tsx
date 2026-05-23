import React, { useEffect, useRef } from 'react';

interface Props {
  onNewGame: () => void;
  onContinue: () => void;
  onSandbox: () => void;
  hasSave: boolean;
}

export function MainMenu({ onNewGame, onContinue, onSandbox, hasSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; r: number; color: string }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        life: Math.random(),
        r: 1 + Math.random() * 2,
        color: ['#60a5fa', '#a78bfa', '#f97316', '#06b6d4'][Math.floor(Math.random() * 4)],
      });
    }

    let rafId: number;
    function draw() {
      ctx!.fillStyle = '#04000a';
      ctx!.fillRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.004;
        if (p.y < 0 || p.life > 1) {
          p.x = Math.random() * W;
          p.y = H + 5;
          p.life = 0;
        }
        ctx!.globalAlpha = Math.sin(p.life * Math.PI) * 0.7;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#04000a] flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} width={1200} height={800} className="absolute inset-0 w-full h-full object-cover" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">
        {/* Title */}
        <div>
          <p className="text-sm font-mono tracking-[0.4em] text-purple-400 mb-2 uppercase">A Battle Simulator</p>
          <h1
            className="font-black uppercase leading-none"
            style={{
              fontSize: 'clamp(3rem,9vw,8rem)',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #f97316 80%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
            }}
          >
            Fractured
            <br />
            Realms
          </h1>
          <p className="mt-4 text-gray-400 font-mono text-sm max-w-md">
            Four factions. One Void. An epic struggle across shattered dimensions.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {hasSave && (
            <button
              onClick={onContinue}
              className="px-8 py-3 rounded-lg font-bold font-mono uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 transition-all hover:scale-105"
            >
              Continue Campaign
            </button>
          )}
          <button
            onClick={onNewGame}
            className="px-8 py-3 rounded-lg font-bold font-mono uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 border border-amber-300 transition-all hover:scale-105"
          >
            {hasSave ? 'New Game' : 'Start Campaign'}
          </button>
          <button
            onClick={onSandbox}
            className="px-8 py-3 rounded-lg font-bold font-mono uppercase tracking-wider text-gray-200 bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105"
          >
            Sandbox Mode
          </button>
        </div>

        {/* Faction preview */}
        <div className="flex gap-6 mt-2">
          {[
            { name: 'Kingdom of Aldor', color: '#60a5fa' },
            { name: 'Iron Legion',      color: '#f97316' },
            { name: 'Void Reapers',     color: '#06b6d4' },
            { name: 'Last Breath',      color: '#84cc16' },
          ].map(f => (
            <div key={f.name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
              <span className="text-xs font-mono text-gray-400">{f.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
