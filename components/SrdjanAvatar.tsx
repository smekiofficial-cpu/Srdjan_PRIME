
import React, { useState, useRef, useEffect } from 'react';
import { AgentMode, AvatarShape } from '../types';

interface SrdjanAvatarProps {
  mode: AgentMode;
  isProcessing?: boolean;
  volume?: number; 
  hyperMode?: boolean;
  visionStream?: MediaStream | null;
  isLinked?: boolean;
  shape?: AvatarShape;
  cameraConfig?: {
    zoom: number;
    panX: number;
    panY: number;
    focus: number;
  };
  setCameraConfig?: React.Dispatch<React.SetStateAction<{
    zoom: number;
    panX: number;
    panY: number;
    focus: number;
  }>>;
  cameraPresets?: Record<string, any>;
}

const SrdjanAvatar: React.FC<SrdjanAvatarProps> = ({ 
  mode, 
  isProcessing = false, 
  volume = 0, 
  hyperMode = false, 
  visionStream = null, 
  isLinked = false, 
  shape = AvatarShape.HUMAN,
  cameraConfig = { zoom: 1, panX: 0, panY: 0, focus: 0 },
  setCameraConfig,
  cameraPresets = {}
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [jitters, setJitters] = useState<number[]>(new Array(12).fill(0));
  const [blink, setBlink] = useState(false);
  const [isFocusChanging, setIsFocusChanging] = useState(false);
  const [isNeuralScanActive, setIsNeuralScanActive] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    if (videoRef.current && visionStream) videoRef.current.srcObject = visionStream;
  }, [visionStream]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 4200);
    return () => clearInterval(blinkInterval);
  }, []);

  // Visual trigger for movement/focus changes
  useEffect(() => {
    setIsFocusChanging(true);
    setIsCalibrating(true);
    const timer = setTimeout(() => {
      setIsFocusChanging(false);
      setIsCalibrating(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [cameraConfig.focus, cameraConfig.zoom, cameraConfig.panX, cameraConfig.panY]);

  useEffect(() => {
    if (volume > 0.01) {
      const interval = setInterval(() => setJitters(prev => prev.map(() => 0.8 + Math.random() * 0.4)), 50);
      return () => clearInterval(interval);
    } else setJitters(new Array(12).fill(1));
  }, [volume]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ 
        x: (e.clientX - rect.left - rect.width / 2) / 100, 
        y: (e.clientY - rect.top - rect.height / 2) / 100 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Fix: Corrected cleanup function to remove the mousemove event listener instead of a non-existent property.
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400 - 200;
    const y = ((e.clientY - rect.top) / rect.height) * 400 - 200;
    setCameraConfig?.(prev => ({ ...prev, panX: x, panY: y }));
  };

  const toggleNeuralScan = () => {
    setIsNeuralScanActive(!isNeuralScanActive);
  };

  const cameraStyles: React.CSSProperties = {
    transform: `scale(${cameraConfig.zoom}) translate(${cameraConfig.panX}px, ${cameraConfig.panY}px) rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
    filter: `blur(${cameraConfig.focus}px) ${isNeuralScanActive ? 'saturate(200%) hue-rotate(90deg)' : ''}`,
    transition: `transform 1.4s cubic-bezier(0.19, 1, 0.22, 1), filter 1.2s cubic-bezier(0.4, 0, 0.2, 1)`,
    transformOrigin: 'center 40%',
    willChange: 'transform, filter'
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center justify-center perspective-[2500px] overflow-hidden bg-[#020205]">
      {visionStream && (
        <div className={`absolute top-10 right-10 w-64 h-48 glass rounded-3xl border-purple-500/30 overflow-hidden z-[60] shadow-2xl transition-all duration-700 ${isNeuralScanActive ? 'scale-110 border-red-500/50' : ''}`}>
           <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-700 ${isNeuralScanActive ? 'brightness-125' : 'opacity-60'}`} />
           <div className="absolute inset-0 pointer-events-none border border-white/5"></div>
           <div className="absolute top-3 left-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isNeuralScanActive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
              <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{isNeuralScanActive ? 'NEURAL_SCAN_ACTIVE' : 'OPTICAL_FEED'}</span>
           </div>
        </div>
      )}

      {/* Calibration Layer */}
      {isCalibrating && (
        <div className="absolute inset-0 pointer-events-none z-[45] animate-fade-in">
           <div className="absolute top-0 left-0 w-full h-full border-[1px] border-purple-500/10 flex items-center justify-center overflow-hidden">
              <div className="w-full h-1 bg-purple-500/5 animate-[scan_1.2s_linear_infinite]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500/20 font-mono text-[9px] tracking-[1.5em] uppercase whitespace-nowrap">Neural_Optic_Calibrating...</div>
           </div>
        </div>
      )}

      {/* Neural HUD Controls */}
      <div className={`absolute inset-0 pointer-events-none z-50 p-4 lg:p-12 flex flex-col justify-between transition-all duration-1000 ${isLinked ? 'opacity-100' : 'opacity-40'}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-0">
          <div className="flex flex-col gap-4 lg:gap-6">
            <div className="flex items-center gap-3 lg:gap-5">
              <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded-sm rotate-45 border transition-all duration-700 ${isProcessing ? 'bg-purple-500 shadow-[0_0_25px_purple] animate-spin' : 'bg-cyan-500/20 border-cyan-500/40'}`}></div>
              <span className="text-[10px] lg:text-[13px] font-black tracking-[0.4em] lg:tracking-[0.6em] text-white italic drop-shadow-md uppercase">SRDJAN_KAMERA_V5</span>
            </div>
            
            <button 
              onClick={toggleNeuralScan}
              className="pointer-events-auto glass px-4 lg:px-6 py-2 lg:py-3 rounded-2xl border-white/10 flex items-center gap-2 lg:gap-3 hover:bg-white/5 transition-all active:scale-95 group w-fit"
            >
               <div className={`w-3 h-3 rounded-full transition-all ${isNeuralScanActive ? 'bg-red-500 shadow-[0_0_15px_red]' : 'bg-white/20'}`}></div>
               <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${isNeuralScanActive ? 'text-red-400' : 'text-gray-500 group-hover:text-white'}`}>Neural_Scan</span>
            </button>

            {/* Neural Link Info */}
            {isLinked && mode === AgentMode.MEETING && (
               <div className="glass px-5 py-3 rounded-2xl border-emerald-500/40 bg-emerald-500/10 flex items-center gap-3 animate-slide-right mt-2 w-fit">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_emerald]"></div>
                  <span className="text-[10px] font-black text-emerald-400 tracking-[0.4em] uppercase">MEETING_SYNC_ACTIVE</span>
               </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start lg:items-center self-end lg:self-auto hidden sm:flex">
            {/* Neural Pan Grid with Numeric Indicators */}
            <div className="flex flex-col items-center gap-2 lg:gap-3">
              <div className="flex justify-between w-full px-1">
                 <span className="text-[6px] lg:text-[7px] font-mono text-emerald-500/50 uppercase">X:{Math.round(cameraConfig.panX)}</span>
                 <span className="text-[6px] lg:text-[7px] font-mono text-emerald-500/50 uppercase">Y:{Math.round(cameraConfig.panY)}</span>
              </div>
              <div 
                onClick={handleGridClick}
                className="pointer-events-auto w-24 h-24 lg:w-32 lg:h-32 glass border-white/10 bg-black/60 rounded-xl relative overflow-hidden cursor-crosshair group/grid shadow-inner"
              >
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '20% 20%' }}></div>
                <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-white/5"></div>
                <div className="absolute left-1/2 top-0 w-[0.5px] h-full bg-white/5"></div>
                
                {/* Target Reticle */}
                <div 
                  className="absolute w-6 h-6 border border-emerald-500/40 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out flex items-center justify-center"
                  style={{ left: `${((cameraConfig.panX + 200) / 400) * 100}%`, top: `${((cameraConfig.panY + 200) / 400) * 100}%` }}
                >
                  <div className={`w-1 h-1 bg-emerald-500 rounded-full transition-all duration-300 ${isCalibrating ? 'scale-[3] opacity-50 shadow-[0_0_20px_emerald]' : 'shadow-[0_0_10px_emerald]'}`}></div>
                  <div className="absolute inset-0 border-t border-emerald-500/20 rotate-45 scale-150"></div>
                  <div className="absolute inset-0 border-l border-emerald-500/20 rotate-45 scale-150"></div>
                </div>
              </div>
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Neural_Pan_Grid</span>
            </div>

            <div className="pointer-events-auto flex items-center gap-4 lg:gap-6 glass px-4 lg:px-6 py-3 lg:py-4 rounded-[20px] lg:rounded-[30px] border-white/5 bg-black/60 shadow-2xl">
              <div className="flex flex-col items-center gap-1 lg:gap-2">
                <div className="relative w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center">
                   <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/10" />
                      <circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500" strokeDasharray="150" strokeDashoffset={150 - (150 * (cameraConfig.zoom / 3))} />
                   </svg>
                   <span className="text-[8px] lg:text-[9px] font-black text-white">{cameraConfig.zoom.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.5" max="3" step="0.1" value={cameraConfig.zoom} onChange={(e) => setCameraConfig?.(prev => ({...prev, zoom: parseFloat(e.target.value)}))} className="w-12 lg:w-16 accent-emerald-500 h-1 appearance-none bg-white/5 rounded-full cursor-pointer" />
              </div>
              <div className="flex flex-col items-center gap-1 lg:gap-2">
                <div className="relative w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center">
                   <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/10" />
                      <circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="3" className="text-purple-500" strokeDasharray="150" strokeDashoffset={150 - (150 * (cameraConfig.focus / 15))} />
                   </svg>
                   <span className="text-[8px] lg:text-[9px] font-black text-white">{Math.round(cameraConfig.focus)}</span>
                </div>
                <input type="range" min="0" max="15" step="1" value={cameraConfig.focus} onChange={(e) => setCameraConfig?.(prev => ({...prev, focus: parseFloat(e.target.value)}))} className="w-12 lg:w-16 accent-purple-500 h-1 appearance-none bg-white/5 rounded-full cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1 hidden sm:flex">
             <span className="text-[9px] lg:text-[11px] text-purple-400 font-black italic tracking-widest uppercase">Deep_Neural_Focus_Active</span>
             <span className="text-[7px] lg:text-[8px] font-mono text-gray-600 uppercase tracking-widest italic">Srdjan_Optics_Engine_v5.2</span>
          </div>
          <div className="text-right w-full sm:w-auto">
             <div className="text-[12px] lg:text-[16px] font-black text-white italic tracking-[0.1em] uppercase leading-none mb-1">SRDJAN_OMEGA</div>
             <div className="text-[7px] lg:text-[9px] font-mono text-gray-700 uppercase tracking-widest">Cinematic Precision Engineering</div>
          </div>
        </div>
      </div>

      <div className="relative z-20" style={cameraStyles}>
        <div className="animate-avatar-float flex flex-col items-center scale-[0.6] sm:scale-75 lg:scale-100">
          <div className={`w-64 h-[420px] sm:w-80 sm:h-[520px] glass border-white/20 rounded-[100px] sm:rounded-[140px] relative overflow-hidden flex flex-col items-center shadow-[0_100px_300px_rgba(0,0,0,0.95)] transition-all duration-1000 ${shape === AvatarShape.ROBOT ? 'border-purple-500/40 bg-slate-950/95' : 'border-amber-500/40 bg-amber-950/5'}`}>
            <div className="mt-16 sm:mt-24 relative w-52 h-64 sm:w-64 sm:h-80 flex flex-col items-center">
              {shape === AvatarShape.ROBOT ? (
                 <div className="w-48 h-56 sm:w-60 sm:h-68 bg-slate-900/90 rounded-[70px] sm:rounded-[90px] border-2 border-purple-500/30 flex flex-col items-center justify-center">
                    <div className="flex gap-12 sm:gap-20 mb-12 sm:mb-16">
                       <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-[24px] sm:rounded-[32px] bg-black border border-purple-500/40 flex items-center justify-center"><div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${isProcessing ? 'bg-purple-400' : 'bg-purple-600/30'} animate-pulse shadow-[0_0_20px_purple]`}></div></div>
                       <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-[24px] sm:rounded-[32px] bg-black border border-purple-500/40 flex items-center justify-center"><div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${isProcessing ? 'bg-purple-400' : 'bg-purple-600/30'} animate-pulse shadow-[0_0_20px_purple]`}></div></div>
                    </div>
                    <div className="w-36 h-10 sm:w-44 sm:h-14 bg-black/95 rounded-xl sm:rounded-2xl border border-purple-500/20 flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 shadow-inner overflow-hidden">
                       {[...Array(10)].map((_, i) => <div key={i} className={`w-1.5 sm:w-2 rounded-full transition-all duration-75 ${isProcessing ? 'bg-purple-500 shadow-[0_0_15px_purple]' : 'bg-purple-900/40'}`} style={{ height: `${8 + volume * 180 * jitters[i]}px` }}></div>)}
                    </div>
                 </div>
              ) : (
                <div className="relative w-40 h-48 sm:w-52 sm:h-60 bg-gradient-to-b from-white/[0.04] to-transparent rounded-[50px] sm:rounded-[70px] border border-white/5 flex flex-col items-center pt-10 sm:pt-14">
                   <div className="flex gap-12 sm:gap-18">
                      <div className={`w-7 h-2.5 sm:w-9 sm:h-3.5 bg-amber-400/10 rounded-full transition-all duration-200 ${blink ? 'scale-y-[0.1]' : 'scale-y-100'}`}><div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full mx-auto bg-white"></div></div>
                      <div className={`w-7 h-2.5 sm:w-9 sm:h-3.5 bg-amber-400/10 rounded-full transition-all duration-200 ${blink ? 'scale-y-[0.1]' : 'scale-y-100'}`}><div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full mx-auto bg-white"></div></div>
                   </div>
                   <div className="mt-12 sm:mt-16 flex items-end gap-2 sm:gap-3 h-16 sm:h-20">
                    {[...Array(8)].map((_, i) => <div key={i} className={`w-2 sm:w-2.5 rounded-full transition-all duration-100 ${isProcessing ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-amber-400'}`} style={{ height: `${12 + volume * 160 * jitters[i]}px` }} />)}
                   </div>
                </div>
              )}
            </div>
            <div className="mt-12 sm:mt-20 flex flex-col items-center gap-4 sm:gap-5">
              <h2 className={`text-3xl sm:text-4xl font-black italic tracking-[0.4em] ${isProcessing ? 'text-purple-400 animate-pulse' : 'text-gray-200'}`}>SRDJAN</h2>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes avatar-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .animate-avatar-float { animation: avatar-float 5s ease-in-out infinite; }
        .animate-slide-right { animation: slide-right 0.4s ease-out forwards; }
        @keyframes slide-right { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        
        @keyframes scan {
          from { transform: translateY(-300px); }
          to { transform: translateY(300px); }
        }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SrdjanAvatar;
