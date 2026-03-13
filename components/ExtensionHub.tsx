
import React, { useState, useEffect } from 'react';
import { TerminalLog } from '../types';

interface ExtensionHubProps {
  onThinkingChange?: (t: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
}

const ExtensionHub: React.FC<ExtensionHubProps> = ({ onThinkingChange, addLog }) => {
  const [isSynced, setIsSynced] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [activeTab, setActiveTab] = useState('https://github.com/srdjan-architect');
  const [cloudStatus, setCloudStatus] = useState<'offline' | 'connecting' | 'online'>('offline');

  useEffect(() => {
    setCloudStatus('connecting');
    const timer = setTimeout(() => {
      setCloudStatus('online');
      addLog?.('Cloud_Sync: Uspešno povezano sa Srdjan_Neural_Global.', 'success');
    }, 2000);
    return () => clearTimeout(timer);
  }, [addLog]);

  const handleInject = async () => {
    setIsInjecting(true);
    onThinkingChange?.(true);
    addLog?.('INJECTING_SRDJAN_RUNTIME: Provera DOM strukture...', 'info');
    
    await new Promise(r => setTimeout(r, 1500));
    addLog?.('Srdjan Sidebar v4.0 uspešno inicijalizovan na aktivnom tabu.', 'success');
    
    setIsInjecting(false);
    onThinkingChange?.(false);
    setIsSynced(true);
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-8 animate-fade-in font-sans overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-6 lg:mb-10 shrink-0 gap-4 lg:gap-0">
        <div>
          <h3 className="text-2xl lg:text-3xl font-black text-blue-500 italic flex items-center gap-3 lg:gap-4">
             <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/10 rounded-xl lg:rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
             </div>
             <span className="hidden sm:inline">SRDJAN_EXTENSION_PORTAL</span>
             <span className="sm:hidden">EXT_PORTAL</span>
          </h3>
          <p className="text-[9px] lg:text-[11px] font-mono text-gray-500 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-2 text-center lg:text-left">Neural Browser Companion & Global Cloud Sync</p>
        </div>
        
        <div className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-2 lg:py-3 rounded-full border transition-all duration-700 ${cloudStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
           <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500 animate-ping'}`}></div>
           <span className={`text-[9px] lg:text-[11px] font-black uppercase tracking-widest ${cloudStatus === 'online' ? 'text-emerald-400' : 'text-orange-400'}`}>
              CLOUD_SYNC: {cloudStatus.toUpperCase()}
           </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 overflow-y-auto custom-scrollbar pb-4 lg:pb-0">
        {/* Connection Control */}
        <div className="flex flex-col gap-6">
           <div className="glass p-6 lg:p-8 rounded-[30px] lg:rounded-[40px] border-white/5 bg-black/40 shadow-2xl space-y-6 lg:space-y-8 h-full flex flex-col justify-between">
              <div>
                 <h4 className="text-base lg:text-lg font-black text-white uppercase italic tracking-tighter mb-2">Extension_Deployer</h4>
                 <p className="text-[10px] lg:text-xs text-gray-500 leading-relaxed uppercase font-medium">Instaliraj Srdjanov "Ghost" interfejs direktno u tvoj browser za stalni pristup.</p>
              </div>

              <div className="space-y-3 lg:space-y-4">
                 <div className="flex items-center justify-between p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 group hover:border-blue-500/40 transition-all">
                    <div className="flex items-center gap-3 lg:gap-4">
                       <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3a10.003 10.003 0 00-9.257 6.13l.062.112C4.153 10.125 5 11.233 5 12.5a2.5 2.5 0 105 0c0-1.267.847-2.375 1.753-2.929z" /></svg>
                       <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-300">Biometric_Auth</span>
                    </div>
                    <div className="w-8 h-5 lg:w-10 lg:h-6 bg-emerald-500/20 rounded-full flex items-center px-1 border border-emerald-500/40"><div className="w-3 h-3 lg:w-4 lg:h-4 bg-emerald-500 rounded-full"></div></div>
                 </div>
                 <div className="flex items-center justify-between p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 group hover:border-blue-500/40 transition-all">
                    <div className="flex items-center gap-3 lg:gap-4">
                       <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-300">Hyper_Inject</span>
                    </div>
                    <div className="w-8 h-5 lg:w-10 lg:h-6 bg-emerald-500/20 rounded-full flex items-center px-1 border border-emerald-500/40"><div className="w-3 h-3 lg:w-4 lg:h-4 bg-emerald-500 rounded-full"></div></div>
                 </div>
              </div>

              <button 
                onClick={handleInject}
                disabled={isInjecting}
                className={`w-full py-4 lg:py-5 rounded-2xl lg:rounded-3xl font-black text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-3 lg:gap-4 mt-4 lg:mt-0 ${isSynced ? 'bg-emerald-600 text-white border-emerald-500/50' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {isInjecting ? (
                   <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : isSynced ? (
                   <>
                     <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                     EXTENSION_ACTIVE
                   </>
                ) : 'INJECT_SRDJAN_CORE'}
              </button>
           </div>
        </div>

        {/* Live Tab Monitor */}
        <div className="flex flex-col gap-6">
           <div className="flex-1 glass p-6 lg:p-8 rounded-[30px] lg:rounded-[40px] border-white/5 bg-black/40 flex flex-col min-h-[400px] lg:min-h-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-2 sm:gap-0">
                 <h4 className="text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest italic">Live_Tab_Surveillance</h4>
                 <div className="text-[8px] lg:text-[10px] font-mono text-emerald-500 animate-pulse">MONITORING_ACTIVE</div>
              </div>
              
              <div className="flex-1 bg-black/60 rounded-2xl lg:rounded-3xl border border-white/5 p-4 lg:p-6 font-mono text-[10px] lg:text-xs overflow-hidden relative flex flex-col">
                 <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6 p-3 lg:p-4 bg-white/5 rounded-xl border border-white/5 shrink-0">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-red-500 shrink-0"></div>
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-amber-500 shrink-0"></div>
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-emerald-500 shrink-0"></div>
                    <div className="flex-1 bg-black/40 px-3 lg:px-4 py-1 lg:py-1.5 rounded-lg border border-white/5 text-gray-500 truncate text-[8px] lg:text-[10px]">
                       {activeTab}
                    </div>
                 </div>

                 <div className="space-y-3 lg:space-y-4 opacity-60 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-start gap-3 lg:gap-4">
                       <span className="text-blue-500 shrink-0">[DOM]</span>
                       <span className="text-gray-400">Analiziram strukturu sajta...</span>
                    </div>
                    <div className="flex items-start gap-3 lg:gap-4">
                       <span className="text-emerald-500 shrink-0">[SEC]</span>
                       <span className="text-gray-400">Srdjan firewall aktivan na tabu.</span>
                    </div>
                    <div className="flex items-start gap-3 lg:gap-4">
                       <span className="text-purple-500 shrink-0">[AI]</span>
                       <span className="text-gray-400">Pronađen kod za optimizaciju na liniji 42.</span>
                    </div>
                 </div>

                 <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-8 opacity-50 lg:opacity-100">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full border border-blue-500/20 flex items-center justify-center animate-spin-slow">
                       <svg className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3a10.003 10.003 0 00-9.257 6.13l.062.112C4.153 10.125 5 11.233 5 12.5a2.5 2.5 0 105 0c0-1.267.847-2.375 1.753-2.929z" /></svg>
                    </div>
                 </div>
              </div>

              <div className="mt-6 lg:mt-8 p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-blue-500/5 border border-blue-500/20 shrink-0">
                 <p className="text-[8px] lg:text-[10px] text-blue-300 font-black uppercase tracking-widest mb-1 lg:mb-2">Neural_Insight:</p>
                 <p className="text-[10px] lg:text-xs text-gray-400 leading-relaxed italic">"Ovaj sajt sadrži neoptimizovane skripte. Želiš li da ih Srdjan sredi jednim klikom?"</p>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row gap-4 lg:gap-6 shrink-0">
         <div className="flex-1 p-4 lg:p-5 glass rounded-xl lg:rounded-2xl border-white/5 flex items-center gap-4 lg:gap-6 group hover:bg-white/5 transition-all">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform shrink-0">
               <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <div>
               <span className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Neural_Bridge</span>
               <p className="text-[9px] lg:text-[11px] text-white font-bold uppercase tracking-tighter">Srdjan sada radi u "Online" modu preko oblaka.</p>
            </div>
         </div>
         <div className="hidden sm:flex items-center">
            <div className="w-px h-12 bg-white/10"></div>
         </div>
         <div className="flex-1 p-4 lg:p-5 glass rounded-xl lg:rounded-2xl border-white/5 flex items-center gap-4 lg:gap-6 group hover:bg-white/5 transition-all">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform shrink-0">
               <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
               <span className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Trust_Shield</span>
               <p className="text-[9px] lg:text-[11px] text-white font-bold uppercase tracking-tighter">Podaci su kriptovani vojnim RSA_4096 standardom.</p>
            </div>
         </div>
      </div>
      
      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
      `}</style>
    </div>
  );
};

export default ExtensionHub;
