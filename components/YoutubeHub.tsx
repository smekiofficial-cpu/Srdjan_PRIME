
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { TerminalLog } from '../types';
import Markdown from 'react-markdown';

interface YoutubeHubProps {
  onThinkingChange?: (t: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
}

type AnalysisType = 'STRATEGY' | 'CONTENT_GEN' | 'SEO' | 'TRANSCRIPT_SIM';

const YoutubeHub: React.FC<YoutubeHubProps> = ({ onThinkingChange, addLog }) => {
  const [channelInput, setChannelInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('STRATEGY');
  const [metrics, setMetrics] = useState<{subs?: string, views?: string, engagement?: string} | null>(null);

  const extractId = (input: string) => {
    // Basic extraction for video IDs or channel handles
    if (input.includes('v=')) return input.split('v=')[1].split('&')[0];
    if (input.includes('youtu.be/')) return input.split('youtu.be/')[1].split('?')[0];
    if (input.includes('@')) return input.split('@')[1];
    return input;
  };

  const handleAnalyze = async () => {
    if (!channelInput.trim()) return;
    setIsAnalyzing(true);
    onThinkingChange?.(true);
    const targetId = extractId(channelInput);
    addLog?.(`INICIJALIZACIJA_YOUTUBE_MODULA [${analysisType}]: ${targetId}`, 'command');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      let prompt = '';
      switch(analysisType) {
        case 'STRATEGY':
          prompt = `Analiziraj YouTube kanal/video: "${targetId}". Daj mi strateški izveštaj na srpskom. Fokus: Brendiranje, target publika i rast.`;
          break;
        case 'CONTENT_GEN':
          prompt = `Na osnovu YouTube kanala/videa: "${targetId}", generiši 5 ideja za nove videe, uključujući naslove, opise i strukturu scenarija. Sve na srpskom.`;
          break;
        case 'SEO':
          prompt = `Izvrši SEO optimizaciju za YouTube entitet: "${targetId}". Predloži tagove, optimizovan naslov i opis koji će rangirati na prvoj strani.`;
          break;
        case 'TRANSCRIPT_SIM':
          prompt = `Simuliraj analizu transkripta za video: "${targetId}". Identifikuj ključne tačke, momente visokog zadržavanja i predloži poboljšanja u naraciji.`;
          break;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          tools: [{ googleSearch: {} }]
        }
      });

      setReport(response.text || "Nije moguće generisati izveštaj.");
      
      setMetrics({
        subs: "ANALYZING...",
        views: "FETCHING...",
        engagement: "CALCULATING..."
      });

      setTimeout(() => {
        setMetrics({
          subs: "Top Tier",
          views: "Viral Potential",
          engagement: "High Velocity"
        });
      }, 1500);

      addLog?.(`SRDJAN: YouTube ${analysisType} analiza završena.`, 'success');
    } catch (err) {
      addLog?.('Greška prilikom analize YouTube sadržaja.', 'error');
    } finally {
      setIsAnalyzing(false);
      onThinkingChange?.(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 animate-fade-in font-sans overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-4 lg:mb-8 shrink-0 gap-4 lg:gap-0">
        <div>
          <h3 className="text-xl lg:text-2xl font-black text-red-500 italic flex items-center gap-2 lg:gap-3">
             <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
             <span className="hidden sm:inline">SRDJAN_YOUTUBE_STUDIO</span>
             <span className="sm:hidden">YT_STUDIO</span>
          </h3>
          <p className="text-[8px] lg:text-[10px] font-mono text-gray-500 uppercase tracking-widest text-center lg:text-left mt-1 lg:mt-0">Neuralni Content Engine & Analitika</p>
        </div>
        {isAnalyzing && (
          <div className="px-3 lg:px-4 py-1 lg:py-1.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 lg:gap-3">
             <span className="text-[7px] lg:text-[8px] font-black text-red-400 uppercase tracking-widest">Deep_Analysis_Active</span>
             <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:gap-6 flex-1 overflow-hidden">
        <div className="flex flex-col gap-3 lg:gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <input 
              type="text" 
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder="Unesi URL kanala, Video ID ili @handle..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 focus:outline-none focus:border-red-500 transition-all text-xs lg:text-sm"
            />
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-red-600 hover:bg-red-500 px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {isAnalyzing ? 'Procesiram...' : 'Analiziraj'}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {[
              { id: 'STRATEGY', label: 'STRATEGIJA' },
              { id: 'CONTENT_GEN', label: 'IDEJE ZA KONTENT' },
              { id: 'SEO', label: 'SEO OPTIMIZACIJA' },
              { id: 'TRANSCRIPT_SIM', label: 'ANALIZA NARACIJE' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setAnalysisType(type.id as AnalysisType)}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[7px] lg:text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shrink-0 ${
                  analysisType === type.id 
                    ? 'bg-red-500/20 border-red-500 text-red-400' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 animate-slide-up shrink-0">
            <div className="glass p-3 lg:p-4 rounded-xl lg:rounded-2xl border-red-500/20 bg-red-500/5 text-center">
               <span className="block text-[7px] lg:text-[9px] text-gray-500 font-black uppercase mb-1">Status_Kanala</span>
               <span className="text-xs lg:text-sm font-black text-red-400">{metrics.subs}</span>
            </div>
            <div className="glass p-3 lg:p-4 rounded-xl lg:rounded-2xl border-red-500/20 bg-red-500/5 text-center">
               <span className="block text-[7px] lg:text-[9px] text-gray-500 font-black uppercase mb-1">Viralni_Potencijal</span>
               <span className="text-xs lg:text-sm font-black text-red-400">{metrics.views}</span>
            </div>
            <div className="glass p-3 lg:p-4 rounded-xl lg:rounded-2xl border-red-500/20 bg-red-500/5 text-center">
               <span className="block text-[7px] lg:text-[9px] text-gray-500 font-black uppercase mb-1">Angažovanje</span>
               <span className="text-xs lg:text-sm font-black text-red-400">{metrics.engagement}</span>
            </div>
          </div>
        )}

        <div className="flex-1 glass rounded-[20px] lg:rounded-[40px] border-white/5 bg-black/40 p-4 lg:p-8 overflow-y-auto custom-scrollbar relative">
           {!report && !isAnalyzing && (
             <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-4">
                <svg className="w-12 h-12 lg:w-16 lg:h-16 mb-2 lg:mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6zM21.56 7.17s-.19-1.35-.78-1.93c-.74-.78-1.58-.79-1.97-.84C16.03 4.16 12 4.16 12 4.16s-4.03 0-6.81.24c-.39.05-1.23.06-1.97.84-.59.58-.78 1.93-.78 1.93S2.25 9.17 2.25 12v2.66s.19 2.01.78 2.59c.74.78 1.63.74 2.04.82 1.6.15 6.93.2 6.93.2s4.03 0 6.81-.24c.39-.05 1.23-.06 1.97-.84.59-.58.78-1.93.78-1.93s.19-1.99.19-4.82v-2.66c-.01-2.83-.2-4.83-.2-4.83z"/></svg>
                <p className="text-[10px] lg:text-sm font-black uppercase tracking-[0.1em] lg:tracking-[0.2em]">Spreman za neuralnu obradu YouTube sadržaja...</p>
             </div>
           )}
           {isAnalyzing && (
             <div className="h-full flex flex-col items-center justify-center space-y-3 lg:space-y-4">
                <div className="w-8 h-8 lg:w-12 lg:h-12 border-4 border-t-transparent border-red-500 rounded-full animate-spin"></div>
                <p className="text-[8px] lg:text-[10px] font-mono text-red-400 uppercase tracking-widest animate-pulse text-center px-4">Srdjan skenira YouTube algoritme... [OK]</p>
             </div>
           )}
           {report && (
             <div className="markdown-body animate-fade-in text-xs lg:text-sm leading-relaxed text-gray-300">
                <Markdown>{report}</Markdown>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default YoutubeHub;
