import React, { useEffect, useRef } from 'react';
import { NeuralData } from '../types';

interface NeuralActivityProps {
  data: NeuralData;
  isActive: boolean;
}

const NeuralActivity: React.FC<NeuralActivityProps> = ({ data, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Update points
      const newY = (canvas.height / 2) + (Math.sin(Date.now() / 100) * data.alpha * 20) + (Math.cos(Date.now() / 50) * data.beta * 10);
      pointsRef.current.push({ x: canvas.width, y: newY });
      if (pointsRef.current.length > 100) pointsRef.current.shift();
      pointsRef.current.forEach(p => p.x -= 2);

      // Draw wave
      ctx.beginPath();
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#8b5cf6';
      
      pointsRef.current.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isActive, data]);

  return (
    <div className="glass rounded-[20px] lg:rounded-3xl p-4 lg:p-6 border-white/5 bg-black/40 flex flex-col gap-3 lg:gap-4 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] text-purple-500 italic">Neuralni_Tok</span>
          <span className="text-white text-[8px] lg:text-[10px] font-black tracking-widest uppercase">#BCI_INTERFACE_V4</span>
        </div>
        <div className={`flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 rounded-full border ${isActive ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' : 'border-white/10 text-gray-600'}`}>
          <div className={`w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full ${isActive ? 'bg-purple-500 animate-pulse' : 'bg-gray-800'}`}></div>
          <span className="text-[6px] lg:text-[8px] font-black uppercase tracking-widest">{isActive ? 'LINK_AKTIVAN' : 'NO_SIGNAL'}</span>
        </div>
      </div>

      <div className="relative h-16 sm:h-24 lg:h-32 w-full bg-black/20 rounded-xl overflow-hidden border border-white/5">
        <canvas ref={canvasRef} width={400} height={128} className="w-full h-full" />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="text-[7px] lg:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] lg:tracking-[0.5em] animate-pulse text-center px-2">Čekam_Neuralni_Signal...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
        {[
          { label: 'ALPHA', val: data.alpha, color: 'purple' },
          { label: 'BETA', val: data.beta, color: 'cyan' },
          { label: 'GAMMA', val: data.gamma, color: 'emerald' },
          { label: 'DELTA', val: data.delta, color: 'amber' },
        ].map((wave) => (
          <div key={wave.label} className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">{wave.label}</span>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  wave.color === 'purple' ? 'bg-purple-500' : 
                  wave.color === 'cyan' ? 'bg-cyan-500' :
                  wave.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, wave.val * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-[7px] font-black text-gray-600 uppercase">Fokus_Indeks</span>
          <span className="text-xs font-black text-white">{(data.focus * 100).toFixed(1)}%</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[7px] font-black text-gray-600 uppercase">Stres_Nivo</span>
          <span className={`text-xs font-black ${data.stress > 0.7 ? 'text-red-500' : 'text-emerald-500'}`}>{(data.stress * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default NeuralActivity;
