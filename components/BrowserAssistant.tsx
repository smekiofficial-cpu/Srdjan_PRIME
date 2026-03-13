
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, TerminalLog } from '../types';

interface BrowserAssistantProps {
  onThinkingChange?: (t: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
}

const BrowserAssistant: React.FC<BrowserAssistantProps> = ({ onThinkingChange, addLog }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [viewportStatus, setViewportStatus] = useState<'idle' | 'loading' | 'streaming'>('idle');
  const [loadingMessage, setLoadingMessage] = useState('Inicijalizacija_Protokola...');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (viewportStatus === 'loading') {
      const statusSteps = [
        'Inicijalizacija_Protokola...',
        'Povezivanje_sa_Čvorovima...',
        'Pretraga_Globalne_Mreže...',
        'Analiza_Kredibiliteta...',
        'Rekonstrukcija_Stranice...',
        'Optimizacija_Prikaza...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMessage(statusSteps[i % statusSteps.length]);
        i++;
      }, 800);
      return () => clearInterval(interval);
    }
  }, [viewportStatus]);

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;
    
    const userMsg: ChatMessage = { role: 'user', text: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsSearching(true);
    setViewportStatus('loading');
    onThinkingChange?.(true);
    addLog?.(`WEB_ANALIZA_POKRENUTA: ${query}`, 'command');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: query,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          tools: [{ googleSearch: {} }],
          systemInstruction: "Ti si SRDJAN_ISTRUŽIVAČ v4.0. Tvoja misija je dubinska analiza globalne mreže. Koristi Google Search za prikupljanje najrelevantnijih podataka. Odgovaraj na srpskom jeziku stručnim tonom. Uvek navedi kredibilne izvore informacija."
        }
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Veb Resurs'
      })).filter((s: any) => s.uri) || [];

      if (sources.length > 0) {
        setCurrentUrl(sources[0].uri);
        setViewportStatus('streaming');
      } else {
        setViewportStatus('idle');
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: response.text || "Pretraga nije pronašla podatke koji zadovoljavaju Omega standard.",
        timestamp: Date.now(),
        sources
      };

      setMessages(prev => [...prev, assistantMsg]);
      addLog?.('SRDJAN: Istraživanje veba uspešno završeno.', 'success');
    } catch (err) {
      addLog?.('MREZA_ERR: Neuspešna sinhronizacija sa globalnim čvorovima.', 'error');
      setViewportStatus('idle');
    } finally {
      setIsSearching(false);
      onThinkingChange?.(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 animate-fade-in font-sans overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-4 lg:mb-6 shrink-0 gap-4 lg:gap-0">
        <div>
          <h3 className="text-lg lg:text-2xl font-black text-sky-400 italic flex items-center gap-2 lg:gap-4">
             <div className="w-8 h-8 lg:w-10 lg:h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9" /></svg>
             </div>
             <span className="hidden sm:inline">ISTRAŽIVAČKI_MODUL_PLATINUM</span>
             <span className="sm:hidden">ISTRAŽIVAČ</span>
          </h3>
        </div>
        <div className="flex flex-wrap justify-center gap-2 lg:gap-4">
           {isSearching && (
              <div className="px-3 lg:px-4 py-1 lg:py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center gap-2 lg:gap-3">
                 <span className="text-[7px] lg:text-[8px] font-black text-purple-400 uppercase tracking-widest">Duboko_Promišljanje</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></div>
              </div>
           )}
           <div className="px-3 lg:px-4 py-1 lg:py-1.5 glass rounded-xl border-sky-500/20 flex items-center gap-2 lg:gap-3">
              <span className="text-[7px] lg:text-[8px] font-black text-gray-500 uppercase tracking-widest">Protokol: HTTPS/3</span>
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        <div className="flex-[1] lg:flex-[1.5] flex flex-col glass bg-black/80 rounded-[20px] lg:rounded-[40px] border-white/5 overflow-hidden relative shadow-2xl min-h-[30vh] lg:min-h-0">
           <div className="h-10 lg:h-12 bg-white/[0.03] border-b border-white/5 flex items-center px-4 lg:px-6 gap-2 lg:gap-4 shrink-0">
              <div className="flex-1 glass bg-black/40 rounded-lg px-3 lg:px-4 py-1 flex items-center gap-2 lg:gap-3 border border-white/5 overflow-hidden">
                 <svg className="w-3 h-3 text-sky-500/50 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                 <span className="text-[8px] lg:text-[10px] font-mono text-gray-500 truncate select-all">{currentUrl || 'srdjan://neuralna-arhiva'}</span>
              </div>
           </div>

           <div className="flex-1 relative bg-[#050508] overflow-hidden group/viewport">
              {currentUrl ? (
                <div className="w-full h-full relative">
                   <iframe 
                     src={currentUrl} 
                     className="w-full h-full border-none opacity-80 group-hover/viewport:opacity-100 transition-opacity duration-1000"
                     title="Srdjan Live Preview"
                   />
                   <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                      <div className="glass px-3 py-1 rounded-lg border-sky-500/20 flex items-center gap-2">
                         <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Vizualizacija_Aktivna</span>
                         <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping"></div>
                      </div>
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/[0.03] to-transparent h-20 animate-[scan_6s_linear_infinite] pointer-events-none"></div>
                </div>
              ) : viewportStatus !== 'loading' && (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-8 p-20 text-center">
                   <div className="w-32 h-32 rounded-full border border-dashed border-sky-500/20 flex items-center justify-center">
                      <svg className="w-12 h-12 text-sky-500/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9" /></svg>
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-sm font-black text-gray-600 uppercase tracking-[0.4em]">Neuralna_Vizura_Standby</h4>
                      <p className="text-[10px] text-gray-700 uppercase leading-relaxed max-w-xs">Srdjan čeka na instrukcije za pretragu informacija.</p>
                   </div>
                </div>
              )}

              {viewportStatus === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020205] z-50">
                  <div className="relative w-32 h-32 lg:w-48 lg:h-48 mb-8 lg:mb-12 flex items-center justify-center">
                    {/* Outer HUD Rings */}
                    <div className="absolute inset-0 border-2 border-t-sky-500 border-r-transparent border-b-sky-500 border-l-transparent rounded-full animate-[spin_3s_linear_infinite]"></div>
                    <div className="absolute inset-2 lg:inset-4 border border-dashed border-sky-500/20 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-4 lg:inset-8 border border-white/5 rounded-full"></div>
                    
                    {/* Central Pulsing Core */}
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/30 animate-pulse">
                      <svg className="w-6 h-6 lg:w-8 lg:h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9" />
                      </svg>
                    </div>

                    {/* Orbiting Particles */}
                    <div className="absolute w-full h-full animate-[spin_4s_linear_infinite]">
                      <div className="absolute top-0 left-1/2 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-sky-400 rounded-full shadow-[0_0_10px_#38bdf8]"></div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 lg:gap-4">
                    <div className="px-4 lg:px-6 py-1.5 lg:py-2 glass bg-sky-500/5 border-sky-500/20 rounded-xl min-w-[200px] lg:min-w-[280px] text-center shadow-2xl">
                      <p className="text-[8px] lg:text-[10px] font-mono text-sky-400 uppercase tracking-[0.4em] lg:tracking-[0.6em] animate-pulse">
                        {loadingMessage}
                      </p>
                    </div>
                    
                    <div className="w-32 lg:w-48 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-sky-500/40 animate-[progress_2s_ease-in-out_infinite]"></div>
                    </div>

                    <div className="mt-2 lg:mt-4 flex gap-4 lg:gap-8">
                       <div className="flex flex-col items-center gap-1">
                          <span className="text-[6px] lg:text-[7px] font-black text-gray-600 uppercase">Protokol</span>
                          <span className="text-[7px] lg:text-[8px] font-mono text-sky-600">TLS_1.3</span>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                          <span className="text-[6px] lg:text-[7px] font-black text-gray-600 uppercase">Enkripcija</span>
                          <span className="text-[7px] lg:text-[8px] font-mono text-sky-600">AES_256</span>
                       </div>
                    </div>
                  </div>

                  {/* HUD Background Scanning Grid Overlay */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/[0.05] to-transparent h-32 animate-[scan_4s_linear_infinite]"></div>
                </div>
              )}
           </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
           <div ref={scrollRef} className="flex-1 glass bg-black/40 rounded-[20px] lg:rounded-[32px] p-4 lg:p-6 overflow-y-auto custom-scrollbar border-white/5 space-y-4 lg:space-y-6 shadow-inner">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[95%] p-4 lg:p-6 rounded-[20px] lg:rounded-[24px] ${msg.role === 'user' ? 'bg-sky-500/5 border border-sky-500/20' : 'glass border-white/5 bg-black/20'}`}>
                    <p className="text-[11px] lg:text-[13px] leading-relaxed text-gray-300 font-medium">{msg.text}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-white/5">
                        <div className="grid grid-cols-1 gap-2">
                          {msg.sources.slice(0, 3).map((source, si) => (
                            <button 
                              key={si} 
                              onClick={() => { setCurrentUrl(source.uri); setViewportStatus('streaming'); }}
                              className="flex items-center gap-2 lg:gap-3 bg-white/[0.02] hover:bg-sky-500/10 border border-white/5 p-2 rounded-xl text-sky-400/70 hover:text-sky-300 transition-all text-left"
                            >
                              <span className="text-[8px] lg:text-[9px] font-bold truncate uppercase tracking-tighter">{source.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
           </div>

           <div className="glass bg-black/80 rounded-[20px] lg:rounded-[24px] p-2 lg:p-4 border border-white/10 flex items-center gap-2 lg:gap-4 group focus-within:border-sky-500/40 transition-all shadow-2xl shrink-0">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Pretraži globalnu bazu znanja..."
                className="flex-1 bg-transparent border-none focus:outline-none text-[11px] lg:text-[13px] text-gray-200 placeholder:text-gray-700 ml-2"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-purple-600/20 shrink-0"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes scan {
          from { top: -100px; }
          to { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default BrowserAssistant;
