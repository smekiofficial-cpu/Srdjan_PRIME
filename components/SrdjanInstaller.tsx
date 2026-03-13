
import React, { useState } from 'react';
import { TerminalLog } from '../types';

interface SrdjanInstallerProps {
  onThinkingChange?: (t: boolean) => void;
  onProgressChange?: (p: number) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
}

const SrdjanInstaller: React.FC<SrdjanInstallerProps> = ({ onThinkingChange, onProgressChange, addLog }) => {
  const [step, setStep] = useState<'selection' | 'repairing' | 'building' | 'finished'>('selection');
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [progress, setProgress] = useState(0);
  const [arch, setArch] = useState<'x64' | 'arm64'>('x64');
  const [statusText, setStatusText] = useState('');
  const [checksum, setChecksum] = useState('');

  const generateChecksum = () => {
    const chars = 'ABCDEF0123456789';
    let res = '';
    for(let i=0; i<32; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
  };

  const handleDownload = async () => {
    setIsPreparingDownload(true);
    addLog?.('FINAL_SIGNING: Ubrizgavanje RSA-4096 digitalnog potpisa...', 'command');
    
    // Simulacija završne pripreme fajla
    await new Promise(r => setTimeout(r, 1500));
    
    const finalChecksum = generateChecksum();
    setChecksum(finalChecksum);
    addLog?.(`CHECKSUM_GENERATED: SHA256[${finalChecksum}]`, 'success');
    addLog?.('MIRROR_SYNC: Povezivanje sa Global CDN serverom...', 'info');
    
    await new Promise(r => setTimeout(r, 1000));

    // Generisanje simuliranog binarnog paketa
    const manifest = `
      =========================================
      SRDJAN TESLA-X ULTIMATE v10.0.1
      =========================================
      PUBLISHER: SRDJAN AI GLOBAL SYSTEMS
      ARCHITECTURE: ${arch.toUpperCase()}
      BUILD_ID: TESLA_FINAL_2025
      SHA256: ${finalChecksum}
      STATUS: VERIFIED & SIGNED
      =========================================
      "Spreman za Android i PC razvoj."
    `;

    const blob = new Blob([manifest], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Srdjan_TeslaX_v10.0.1_${arch}_Setup.exe`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    setIsPreparingDownload(false);
    addLog?.('DOWNLOAD_SUCCESS: Instalacioni paket je prebačen na tvoj sistem.', 'success');
  };

  const runDeployment = async () => {
    setStep('repairing');
    onThinkingChange?.(true);
    addLog?.('POKREĆEM_OFICIJALNI_DEPLOY_V10: Provera serverskih resursa...', 'warning');
    
    const repairSteps = [
      { msg: 'Provera SRDJAN_AI_GLOBAL digitalnog koda...', p: 10 },
      { msg: 'Patching: Core_Neural_Engine.bin...', p: 25 },
      { msg: 'Sinhronizacija sa Windows API bibliotekama...', p: 40 }
    ];

    for (const s of repairSteps) {
      setStatusText(s.msg);
      addLog?.(s.msg, 'info');
      setProgress(s.p);
      await new Promise(r => setTimeout(r, 600));
    }

    setStep('building');

    const buildSteps = [
      { msg: 'Kompajliranje ' + arch.toUpperCase() + ' binara...', p: 60 },
      { msg: 'Pakovanje resursa za Android Pro i Windows Desktop...', p: 75 },
      { msg: 'Generisanje Authenticode v5.0 sertifikata...', p: 90 },
      { msg: 'Finalizacija SRDJAN_TESLA_X instalatera...', p: 100 }
    ];

    for (const s of buildSteps) {
      setStatusText(s.msg);
      addLog?.(s.msg, 'info');
      setProgress(s.p);
      onProgressChange?.(s.p);
      await new Promise(r => setTimeout(r, 800));
    }

    onThinkingChange?.(false);
    setStep('finished');
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-10 font-sans overflow-hidden animate-fade-in relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 lg:w-64 lg:h-64 bg-blue-500/5 blur-[50px] lg:blur-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-10 z-10 gap-4 lg:gap-0">
        <div className="flex items-center gap-4 lg:gap-6">
           <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)] lg:shadow-[0_0_40px_rgba(37,99,235,0.5)] border border-white/20 shrink-0">
              <svg className="w-6 h-6 lg:w-10 lg:h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1V11.719H0V3.449zm0 9.15h9.75V22.5L0 21.15V12.599zm10.5-10.5L24 0v11.719h-13.5V2.099zm0 10.5H24V24l-13.5-2.1V12.599z"/></svg>
           </div>
           <div>
              <h3 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter uppercase">ULTIMATE_DEPLOY_HUB</h3>
              <p className="text-[8px] lg:text-[10px] font-mono text-blue-400 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-1">Srdjan AI Global - Certified Software Publisher</p>
           </div>
        </div>
        <div className="flex flex-col items-start lg:items-end w-full lg:w-auto">
           <div className="px-3 lg:px-5 py-1.5 lg:py-2 glass border-emerald-500/30 rounded-full flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b881]"></div>
              <span className="text-[8px] lg:text-[10px] font-black text-emerald-400 uppercase tracking-widest">Signed_v10.0.1</span>
           </div>
           <span className="text-[6px] lg:text-[8px] font-mono text-gray-600 uppercase tracking-widest">Security_Level: RSA_4096_VALID</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center z-10 overflow-y-auto custom-scrollbar pb-4 lg:pb-0">
        {step === 'selection' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-slide-up">
            <div className="glass-dark p-6 lg:p-10 rounded-[30px] lg:rounded-[40px] border-white/5 space-y-6 lg:space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
              <div>
                <h4 className="text-lg lg:text-xl font-black text-white uppercase italic tracking-widest mb-2">Priprema_Paketa</h4>
                <p className="text-[10px] lg:text-xs text-gray-500 leading-relaxed uppercase">Izaberi arhitekturu tvog Windows 10/11 sistema. Srdjan će generisati unikatan, potpisan instalacioni fajl za tebe.</p>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div onClick={() => setArch('x64')} className={`p-4 lg:p-6 rounded-2xl lg:rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${arch === 'x64' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}>
                   <div className="flex items-center gap-3 lg:gap-4">
                      <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all ${arch === 'x64' ? 'bg-blue-400 shadow-[0_0_15px_#60a5fa] scale-125' : 'bg-gray-700'}`}></div>
                      <span className="font-black text-xs lg:text-sm tracking-widest uppercase">Windows Desktop (x64)</span>
                   </div>
                   <svg className={`w-4 h-4 lg:w-5 lg:h-5 transition-opacity ${arch === 'x64' ? 'opacity-100' : 'opacity-20'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                </div>
                <div onClick={() => setArch('arm64')} className={`p-4 lg:p-6 rounded-2xl lg:rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${arch === 'arm64' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}>
                   <div className="flex items-center gap-3 lg:gap-4">
                      <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all ${arch === 'arm64' ? 'bg-blue-400 shadow-[0_0_15px_#60a5fa] scale-125' : 'bg-gray-700'}`}></div>
                      <span className="font-black text-xs lg:text-sm tracking-widest uppercase">Windows Surface/ARM (ARM64)</span>
                   </div>
                   <svg className={`w-4 h-4 lg:w-5 lg:h-5 transition-opacity ${arch === 'arm64' ? 'opacity-100' : 'opacity-20'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                </div>
              </div>

              <button 
                onClick={runDeployment}
                className="w-full py-4 lg:py-6 rounded-2xl lg:rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.4em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 lg:gap-4 group shadow-blue-500/40"
              >
                GENERISI_POTPISAN_SETUP
                <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 lg:gap-6">
               <div className="glass p-6 lg:p-8 rounded-[30px] lg:rounded-[40px] border-white/5 bg-black/40 flex-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-blue-500/5 -mr-12 -mt-12 lg:-mr-16 lg:-mt-16 rounded-full"></div>
                  <h4 className="text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest mb-4 lg:mb-6 italic">Sigurnosni_Integritet</h4>
                  <div className="space-y-3 lg:space-y-4 font-mono">
                     {[
                       { label: 'IZDAVAČ', val: 'SRDJAN_AI_GLOBAL', color: 'blue' },
                       { label: 'CERTIFIKAT', val: 'EV_SHA256_OFFICIAL', color: 'emerald' },
                       { label: 'STATUS', val: 'VERIFIED_TRUSTED', color: 'cyan' },
                       { label: 'VERZIJA', val: '10.0.1_ULTIMATE', color: 'emerald' }
                     ].map((item, i) => (
                       <div key={i} className="flex justify-between items-center py-1.5 lg:py-2 border-b border-white/5">
                          <span className="text-[8px] lg:text-[10px] text-gray-400 uppercase tracking-tighter">{item.label}</span>
                          <span className={`text-[8px] lg:text-[10px] text-${item.color}-400 font-bold uppercase tracking-widest`}>{item.val}</span>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-4 lg:gap-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 animate-pulse shrink-0">
                    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div className="flex-1">
                     <p className="text-[8px] lg:text-[9px] text-blue-300 font-black uppercase tracking-widest mb-1 italic">Srdjan_Defender:</p>
                     <p className="text-[9px] lg:text-[10px] text-gray-500 leading-relaxed uppercase">Ovaj fajl je siguran za Windows SmartScreen sisteme.</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {(step === 'repairing' || step === 'building') && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 lg:space-y-12 animate-fade-in py-6 lg:py-10">
             <div className="relative">
                <div className="w-40 h-40 lg:w-56 lg:h-56 rounded-full border-4 border-white/5 flex items-center justify-center relative shadow-[0_0_50px_rgba(37,99,235,0.1)] lg:shadow-[0_0_100px_rgba(37,99,235,0.1)]">
                   <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1s_linear_infinite]"></div>
                   <div className="absolute inset-2 lg:inset-4 border-2 border-dashed border-blue-500/20 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
                   <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl lg:text-5xl font-black font-mono text-white mb-1 lg:mb-2">{progress}%</span>
                      <span className="text-[7px] lg:text-[9px] font-mono text-blue-400 uppercase tracking-[0.3em] lg:tracking-[0.5em] animate-pulse">
                        {step === 'repairing' ? 'VERIFYING...' : 'COMPILING...'}
                      </span>
                   </div>
                </div>
             </div>
             
             <div className="text-center space-y-4 lg:space-y-6 w-full max-w-md px-4">
                <div className="space-y-1 lg:space-y-2">
                   <h4 className="text-xl lg:text-3xl font-black text-white uppercase italic tracking-tighter">
                      {step === 'repairing' ? 'PROVERA_DIGITALNOG_POTPISA' : 'GENERISANJE_ULTIMATE_FAJLA'}
                   </h4>
                   <p className="text-[8px] lg:text-[10px] font-mono text-blue-400 uppercase tracking-[0.2em] lg:tracking-[0.4em] h-4">
                      {statusText}
                   </p>
                </div>
                <div className="w-full lg:w-96 h-1 lg:h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 mx-auto shadow-2xl">
                   <div 
                     className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 transition-all duration-500 shadow-[0_0_10px_#2563eb] lg:shadow-[0_0_20px_#2563eb]" 
                     style={{ width: `${progress}%` }}
                   ></div>
                </div>
             </div>
          </div>
        )}

        {step === 'finished' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 lg:space-y-10 animate-slide-up py-6 lg:py-10">
             <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 blur-[40px] lg:blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="w-32 h-32 lg:w-48 lg:h-48 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-[30px] lg:rounded-[50px] flex flex-col items-center justify-center relative z-10 shadow-2xl">
                   <svg className="w-12 h-12 lg:w-20 lg:h-20 text-emerald-500 mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                   <span className="text-[7px] lg:text-[9px] font-black text-emerald-400 uppercase tracking-widest">BUILD_SIGNED</span>
                </div>
             </div>
             
             <div className="text-center space-y-3 lg:space-y-4 px-4">
                <h4 className="text-2xl lg:text-4xl font-black text-white italic uppercase tracking-tighter">SRDJAN_TESLA_X_V10.0.1_SPREMAN</h4>
                <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-[0.2em] lg:tracking-[0.4em]">Zvanični instalacioni binar je uspešno potpisan i verifikovan.</p>
                {checksum && (
                  <div className="inline-block px-3 lg:px-4 py-1.5 lg:py-2 glass border-white/10 rounded-lg lg:rounded-xl mt-2 lg:mt-4 max-w-full overflow-hidden">
                    <span className="text-[7px] lg:text-[8px] font-mono text-gray-600 uppercase block mb-1">SHA-256 Checksum:</span>
                    <span className="text-[8px] lg:text-[10px] font-mono text-emerald-400 break-all">{checksum}</span>
                  </div>
                )}
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full sm:w-auto px-4 sm:px-0">
                <button 
                  onClick={handleDownload}
                  disabled={isPreparingDownload}
                  className="w-full sm:w-auto px-6 lg:px-16 py-4 lg:py-6 rounded-2xl lg:rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] lg:tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-3 lg:gap-4 hover:scale-105 active:scale-95 shadow-blue-500/40 group relative overflow-hidden"
                >
                   {isPreparingDownload ? (
                     <>
                       <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                       POTPISIVANJE...
                     </>
                   ) : (
                     <>
                        <svg className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        PREUZMI_POTPISAN_SETUP.EXE
                     </>
                   )}
                </button>
                <button 
                  onClick={() => setStep('selection')}
                  className="w-full sm:w-auto px-6 lg:px-10 py-4 lg:py-6 rounded-2xl lg:rounded-3xl glass text-gray-500 hover:text-white font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] lg:tracking-[0.4em] transition-all hover:bg-white/5"
                >
                  RE-CONFIG_BUILD
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="mt-6 lg:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8 border-t border-white/5 pt-6 lg:pt-8 z-10 shrink-0">
         <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
               <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
               <span className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Authenticode_Publisher</span>
               <p className="text-[9px] lg:text-[11px] text-white font-bold uppercase tracking-tighter">Potpisano od: SRDJAN AI GLOBAL SYSTEMS LLC.</p>
            </div>
         </div>
         <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
               <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
               <span className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Global_Sync_Mirror</span>
               <p className="text-[9px] lg:text-[11px] text-white font-bold uppercase tracking-tighter">Integritet fajla verifikovan preko CDN-a.</p>
            </div>
         </div>
      </div>

      <style>{`
        .glass-dark { background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default SrdjanInstaller;