import React, { useEffect, useRef } from 'react';

interface MainMenuProps {
  hasSave: boolean;
  onStartCampaign: () => void;
  onContinue: () => void;
  onSandbox: () => void;
  onMultiplayer: () => void;
}

function useEmbers(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Ember { x: number; y: number; vy: number; vx: number; r: number; life: number; max: number; }
    const embers: Ember[] = [];
    const spawn = (): Ember => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vy: -(0.3 + Math.random() * 0.9),
      vx: (Math.random() - 0.5) * 0.4,
      r: 0.8 + Math.random() * 2.2,
      life: 0,
      max: 200 + Math.random() * 250,
    });
    for (let i = 0; i < 90; i++) {
      const e = spawn();
      e.y = Math.random() * canvas.height;
      e.life = Math.random() * e.max;
      embers.push(e);
    }

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const e of embers) {
        e.x += e.vx; e.y += e.vy; e.life += 1;
        const t = e.life / e.max;
        const alpha = Math.max(0, 1 - t) * 0.8;
        const hue = 18 + Math.random() * 14;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${alpha})`;
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        if (e.life >= e.max || e.y < -10) Object.assign(e, spawn());
      }
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [canvasRef]);
}

export const MainMenu: React.FC<MainMenuProps> = ({ hasSave, onStartCampaign, onContinue, onSandbox, onMultiplayer }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEmbers(canvasRef);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#1a0a05] via-[#0d0503] to-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(circle at 50% 80%, rgba(255,90,0,0.35), transparent 55%)' }} />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.5em] text-orange-300/70">2041 &middot; The Wasteland</p>
        <h1 className="select-none text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl md:text-8xl">
          <span className="bg-gradient-to-b from-orange-300 via-red-500 to-red-800 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(255,60,0,0.5)]">
            Wasteland
          </span>
          <br />
          <span className="bg-gradient-to-b from-amber-200 via-orange-500 to-red-700 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(255,60,0,0.5)]">
            Command
          </span>
        </h1>
        <p className="mt-5 max-w-md text-sm text-gray-400">
          Lead the last organized survivors of humanity against the dead, the mutants, and the machines.
        </p>
        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <MenuButton primary onClick={onStartCampaign}>Start Campaign</MenuButton>
          <MenuButton onClick={onContinue} disabled={!hasSave}>Continue</MenuButton>
          <MenuButton onClick={onSandbox}>Sandbox</MenuButton>
          <MenuButton onClick={onMultiplayer}>Multiplayer</MenuButton>
        </div>
        <p className="mt-10 text-[10px] uppercase tracking-widest text-gray-600">Built with React + Three.js</p>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{
  children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean;
}> = ({ children, onClick, primary, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className={[
      'rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all',
      disabled
        ? 'cursor-not-allowed border border-white/10 bg-white/5 text-gray-600'
        : primary
          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-red-900/40 hover:from-orange-500 hover:to-red-500'
          : 'border border-orange-500/40 bg-black/40 text-orange-200 hover:border-orange-400 hover:bg-orange-950/40',
    ].join(' ')}>
    {children}
  </button>
);
