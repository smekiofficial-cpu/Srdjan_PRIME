
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { VideoGenerationState } from '../types';

interface VideoCreatorProps {
  apiKeySelected: boolean;
  onOpenKey: () => void;
  onThinkingChange?: (t: boolean) => void;
}

const VideoCreator: React.FC<VideoCreatorProps> = ({ apiKeySelected, onOpenKey, onThinkingChange }) => {
  const [prompt, setPrompt] = useState('');
  const [videoState, setVideoState] = useState<VideoGenerationState>({ status: 'idle' });
  const [selectedImage, setSelectedImage] = useState<{ base64: string; preview: string; mimeType: string } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage({
        base64: result.split(',')[1],
        preview: result,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if ((!prompt.trim() && !selectedImage) || videoState.status === 'generating') return;
    
    if (!apiKeySelected) {
      onOpenKey();
      return;
    }

    setVideoState({ status: 'generating', progressMessage: 'Srdjan inicijalizuje Veo engine...' });
    onThinkingChange?.(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const config: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Animate this image naturally with cinematic motion',
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      };

      // Ako imamo sliku, dodajemo je kao referencu za animaciju
      if (selectedImage) {
        config.image = {
          imageBytes: selectedImage.base64,
          mimeType: selectedImage.mimeType
        };
      }

      let operation = await ai.models.generateVideos(config);

      setVideoState({ status: 'generating', progressMessage: 'Neuralno renderovanje pokreta (2-4 min)...' });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoState({ status: 'generating', progressMessage: 'Finalizacija fajla...' });
        const videoResponse = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.API_KEY || '',
          },
        });
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoState({ status: 'completed', url: videoUrl });
      } else {
        throw new Error("Link za video nije generisan.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
          onOpenKey();
      }
      setVideoState({ status: 'error', error: "Srdjan nije uspeo da generiše video. Proveri parametre ili kvotu." });
    } finally {
      onThinkingChange?.(false);
    }
  };

  const resetSelection = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8 font-sans h-full overflow-hidden animate-fade-in relative">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-8 shrink-0">
        <div>
          <h3 className="text-xl lg:text-3xl font-black text-purple-400 italic flex items-center gap-2 lg:gap-4">
             <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-500/10 rounded-xl lg:rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <svg className="w-5 h-5 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             NEURAL_MOTION_LAB
          </h3>
          <p className="text-[8px] lg:text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-1 lg:mt-2">VEO ENGINE v3.1 // Image-to-Motion Processor</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-hidden">
        {/* Input Controls */}
        <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-y-auto custom-scrollbar pr-1 lg:pr-2">
          {/* Aspect Ratio Selection */}
          <div className="flex flex-col gap-2 lg:gap-3 ml-2 lg:ml-4">
            <label className="text-[8px] lg:text-[10px] font-black text-gray-600 uppercase tracking-widest">Format_Videa</label>
            <div className="flex gap-2 lg:gap-3">
              <button 
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 py-2 lg:py-3 rounded-xl lg:rounded-2xl text-[8px] lg:text-[10px] font-black tracking-widest transition-all border ${aspectRatio === '16:9' ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_purple]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
              >
                16:9 (CINEMA)
              </button>
              <button 
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 py-2 lg:py-3 rounded-xl lg:rounded-2xl text-[8px] lg:text-[10px] font-black tracking-widest transition-all border ${aspectRatio === '9:16' ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_purple]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
              >
                9:16 (PORTRAIT)
              </button>
            </div>
          </div>

          {/* Image Upload Area */}
          <div 
            onClick={() => !selectedImage && fileInputRef.current?.click()}
            className={`relative h-48 lg:h-64 rounded-[20px] lg:rounded-[40px] border-2 border-dashed transition-all flex flex-col items-center justify-center group overflow-hidden shrink-0 ${selectedImage ? 'border-purple-500/40 bg-black/40' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer'}`}
          >
            {selectedImage ? (
              <>
                <img src={selectedImage.preview} alt="Selected" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                   <p className="text-[8px] lg:text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 lg:mb-4">Image_Reference_Locked</p>
                   <button 
                    onClick={(e) => { e.stopPropagation(); resetSelection(); }}
                    className="px-4 lg:px-6 py-1.5 lg:py-2 bg-red-500/20 border border-red-500/40 text-red-500 rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30"
                   >
                     Remove_Image
                   </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/5 flex items-center justify-center text-gray-600 mb-2 lg:mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002-2z" /></svg>
                </div>
                <p className="text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest text-center px-4">Klikni da učitaš sliku za animaciju</p>
                <p className="text-[7px] lg:text-[8px] text-gray-700 mt-1 lg:mt-2">JPG, PNG, WEBP (Neural Scan Ready)</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>

          <div className="space-y-2 lg:space-y-4 shrink-0">
            <label className="text-[8px] lg:text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2 lg:ml-4">Motion_Description</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Opiši pokret (npr. 'vetar njiše kosu i drveće, kinematografsko osvetljenje')..."
              className="w-full h-24 lg:h-32 glass bg-black/40 border border-white/10 rounded-[20px] lg:rounded-[32px] p-4 lg:p-6 text-xs lg:text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={videoState.status === 'generating' || (!prompt.trim() && !selectedImage)}
            className={`w-full py-4 lg:py-6 rounded-[20px] lg:rounded-[32px] font-black text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.4em] transition-all flex items-center justify-center gap-2 lg:gap-4 relative overflow-hidden group shadow-2xl shrink-0 ${
              videoState.status === 'generating' 
                ? 'bg-purple-950/20 text-purple-400 cursor-wait' 
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
            }`}
          >
            {videoState.status === 'generating' ? (
              <>
                <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-t-transparent border-purple-400 rounded-full animate-spin"></div>
                <span className="animate-pulse text-[10px] lg:text-sm">{videoState.progressMessage}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                POKRENI_ANIMACIJU
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>

          {videoState.status === 'error' && (
            <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
              {videoState.error}
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="flex-1 flex flex-col min-h-[40vh] lg:min-h-0">
          <div className="flex-1 glass bg-black/40 rounded-[20px] lg:rounded-[40px] border-white/5 relative overflow-hidden flex flex-col items-center justify-center">
            {videoState.url ? (
              <div className="w-full h-full flex flex-col p-2 lg:p-4">
                 <div className="flex-1 rounded-[16px] lg:rounded-[30px] overflow-hidden border border-white/10 relative">
                    <video 
                      src={videoState.url} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-contain bg-black"
                    />
                    <div className="absolute top-4 lg:top-6 right-4 lg:right-6 glass px-2 lg:px-3 py-1 rounded-lg border-emerald-500/30">
                       <span className="text-[6px] lg:text-[8px] font-black text-emerald-400 uppercase tracking-widest">Render_Success</span>
                    </div>
                 </div>
                 <div className="mt-2 lg:mt-4 flex flex-col sm:flex-row gap-2 lg:gap-4">
                    <a 
                      href={videoState.url} 
                      download="Srdjan_Neural_Motion.mp4"
                      className="flex-1 py-3 lg:py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl lg:rounded-2xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-center transition-all"
                    >
                      Preuzmi_Fajl
                    </a>
                    <button 
                      onClick={() => setVideoState({ status: 'idle' })}
                      className="px-6 lg:px-8 py-3 lg:py-4 glass border-white/10 rounded-xl lg:rounded-2xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-white/5"
                    >
                      New_Project
                    </button>
                 </div>
              </div>
            ) : videoState.status === 'generating' ? (
              <div className="flex flex-col items-center space-y-4 lg:space-y-8 p-6 lg:p-12 text-center">
                 <div className="w-24 h-24 lg:w-32 lg:h-32 relative">
                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 lg:inset-4 border border-dashed border-purple-400/20 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <svg className="w-8 h-8 lg:w-10 lg:h-10 text-purple-500/40 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                    </div>
                 </div>
                 <div className="space-y-1 lg:space-y-2">
                    <h4 className="text-[10px] lg:text-sm font-black text-white uppercase tracking-[0.2em] lg:tracking-[0.3em]">{videoState.progressMessage}</h4>
                    <p className="text-[7px] lg:text-[9px] text-gray-500 font-mono uppercase">Neuralna rekonstrukcija piksela u toku...</p>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-20 text-center space-y-4 lg:space-y-6">
                 <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-full border-2 border-dashed border-purple-500/40 flex items-center justify-center">
                    <svg className="w-10 h-10 lg:w-16 lg:h-16 text-purple-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] lg:tracking-[0.5em]">Waiting_for_Neural_Link</p>
              </div>
            )}
            
            {/* Scanline overlay for the output viewport */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent h-20 animate-[scan_5s_linear_infinite]"></div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 lg:mt-8 pt-4 lg:pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center opacity-60 gap-2 sm:gap-0">
         <div className="flex gap-4 lg:gap-6">
            <div className="flex flex-col items-center sm:items-start">
               <span className="text-[6px] lg:text-[8px] font-black text-gray-600 uppercase">Engine:</span>
               <span className="text-[7px] lg:text-[9px] font-mono text-purple-400">VEO_3.1_FAST_PREVIEW</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
               <span className="text-[6px] lg:text-[8px] font-black text-gray-600 uppercase">Input:</span>
               <span className="text-[7px] lg:text-[9px] font-mono text-emerald-400">{selectedImage ? 'IMAGE + PROMPT' : 'PROMPT ONLY'}</span>
            </div>
         </div>
         <div className="text-[6px] lg:text-[8px] font-mono text-gray-700 tracking-[0.2em] lg:tracking-[0.3em] uppercase">Srdjan_AI_Video_Lab_v2.0</div>
      </div>

      <style>{`
        @keyframes scan {
          from { transform: translateY(-100px); }
          to { transform: translateY(600px); }
        }
      `}</style>
    </div>
  );
};

export default VideoCreator;
