
import React, { useEffect, useRef } from 'react';
import { TerminalLog } from '../types';

interface SystemTerminalProps {
  logs: TerminalLog[];
  hyperMode?: boolean;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({ logs, hyperMode = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0; 
  }, [logs]);

  return (
    <div className="h-24 sm:h-32 lg:h-48 glass rounded-[16px] lg:rounded-[32px] border-white/5 flex flex-col overflow-hidden shadow-2xl relative shrink-0">
      <div className="h-6 sm:h-8 lg:h-10 px-3 lg:px-8 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-1.5 lg:gap-4">
          <div className="flex gap-1 lg:gap-1.5">
            <div className="w-1 h-1 lg:w-2 lg:h-2 rounded-full bg-red-500/40"></div>
            <div className="w-1 h-1 lg:w-2 lg:h-2 rounded-full bg-orange-500/40"></div>
            <div className={`w-1 h-1 lg:w-2 lg:h-2 rounded-full ${hyperMode ? 'bg-orange-500 shadow-[0_0_10px_orange]' : 'bg-emerald-500 shadow-[0_0_10px_emerald]'}`}></div>
          </div>
          <span className="text-[5px] sm:text-[7px] lg:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] lg:tracking-[0.3em] text-gray-500">TESLA-X_KERNEL_LOG</span>
        </div>
        <span className="text-[5px] sm:text-[6px] lg:text-[8px] font-mono text-gray-600">BUFFER: {logs.length}/50_PACKETS</span>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 p-2 sm:p-3 lg:p-6 font-mono text-[6px] sm:text-[8px] lg:text-[10px] overflow-y-auto custom-scrollbar space-y-0.5 sm:space-y-1 lg:space-y-2"
      >
        {logs.length === 0 ? (
          <div className="text-gray-700 italic">Core log buffer empty. Waiting for neural instructions...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-4 animate-fade-in group/log">
              <span className="text-gray-700 shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <span className={`break-all ${
                log.type === 'error' ? 'text-red-400 font-bold' :
                log.type === 'success' ? 'text-emerald-400' :
                log.type === 'warning' ? 'text-orange-400' :
                log.type === 'command' ? 'text-cyan-400 italic' : 'text-gray-500'
              }`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemTerminal;