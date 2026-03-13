
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type, FunctionDeclaration, LiveServerMessage } from '@google/genai';
import { TerminalLog } from '../types';
import { memoryService } from '../services/memoryService';

interface MeetingAgentProps {
  onVolumeChange?: (v: number) => void;
  onThinkingChange?: (t: boolean) => void;
  onLinkChange?: (l: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
  updateSharedCode?: (code: string) => void;
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
  setCameraPresets?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const MeetingAgent: React.FC<MeetingAgentProps> = ({ 
  onVolumeChange, onThinkingChange, onLinkChange, addLog, updateSharedCode, cameraConfig, setCameraConfig, cameraPresets, setCameraPresets 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [showCC, setShowCC] = useState(true);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);

  const controlCamera: FunctionDeclaration = {
    name: 'control_camera',
    parameters: {
      type: Type.OBJECT,
      description: 'Prilagođava parametre kamere avatara. Koristi ovo za pan/zoom tokom sastanka.',
      properties: {
        zoom: { type: Type.NUMBER },
        panX: { type: Type.NUMBER },
        panY: { type: Type.NUMBER },
        focus: { type: Type.NUMBER }
      }
    }
  };

  const recallMemory: FunctionDeclaration = {
    name: 'recall_memory',
    parameters: {
      type: Type.OBJECT,
      description: 'Pretražuje neuralni arhiv (dugotrajnu memoriju) za relevantne informacije iz prošlosti.',
      properties: {
        query: { type: Type.STRING, description: 'Upit za pretragu memorije.' }
      },
      required: ['query']
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopSession = useCallback(() => {
    if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
    onLinkChange?.(false);
    onThinkingChange?.(false);
    onVolumeChange?.(0);
    sessionRef.current = null;
    setTranscription('');
    addLog?.('OMEGA_LINK: Neuralni sastanak završen. Podaci su sinhronizovani.', 'warning');
  }, [onThinkingChange, onVolumeChange, onLinkChange, addLog]);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      addLog?.('OMEGA_LINK: Inicijalizacija neuralnog video-voice prenosa...', 'info');
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = audioContextRef.current.createGain();
      outputNodeRef.current.connect(audioContextRef.current.destination);

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [controlCamera, recallMemory] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `Ti si SRDJAN OMEGA PRIME. Trenutno si u modu NEURALNI SASTANAK.
          - Komuniciraš sa Gazdom putem video i audio linka.
          - Odgovaraj na srpskom jeziku stručnim tonom vrhunskog inženjera.
          - Pomaži Gazdi oko arhitekture koda, planiranja projekata i rešavanja bugova dok pričate.
          - Koristi 'control_camera' da fokusiraš kadar na bitne elemente ili da rekalibrišeš svoj vizuelni prikaz.
          - Koristi 'recall_memory' ako Gazda pita o nečemu što ste ranije pričali ili ako ti treba dodatni kontekst iz neuralnog arhiva.`,
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            onLinkChange?.(true);
            addLog?.('OMEGA_LINK: Neuralni sastanak aktivan. Srdjan vrši optičku sinhronizaciju.', 'success');

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              onVolumeChange?.(Math.min(1, Math.sqrt(sum / inputData.length) * 15));
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => {
                s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                  const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionPromise.then(s => {
                    s.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                  });
                }
              }
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let toolResult: any = "ok";
                if (fc.name === 'control_camera') {
                  const args = fc.args as any;
                  setCameraConfig?.((prev: any) => ({
                    zoom: args.zoom ?? prev.zoom,
                    panX: args.panX ?? prev.panX,
                    panY: args.panY ?? prev.panY,
                    focus: args.focus ?? prev.focus
                  }));
                  toolResult = "Kamera rekalibrisana.";
                } else if (fc.name === 'recall_memory') {
                  const { query } = fc.args as any;
                  addLog?.(`SRDJAN: Pretražujem neuralni arhiv tokom sastanka za: "${query}"`, 'info');
                  const memories = await memoryService.search(query, 3);
                  if (memories.length > 0) {
                    toolResult = {
                      message: "Pronađena su sledeća sećanja:",
                      memories: memories.map(m => ({
                        text: m.entry.text,
                        relevance: Math.round(m.similarity * 100) + "%",
                        time: new Date(m.entry.metadata.timestamp).toLocaleString()
                      }))
                    };
                  } else {
                    toolResult = "Nema relevantnih zapisa u neuralnom arhivu.";
                  }
                }
                sessionPromise.then(s => {
                  s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: toolResult } } });
                });
              }
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => (prev + ' ' + text).slice(-180));
              memoryService.addMemory(`Srdjan: ${text}`, 'interaction', 'meeting_agent');
            }

            if ((message.serverContent as any)?.userTurn?.parts) {
              const text = (message.serverContent as any).userTurn.parts.find((p: any) => p.text)?.text;
              if (text) {
                memoryService.addMemory(`Gazda: ${text}`, 'interaction', 'meeting_agent');
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current && outputNodeRef.current) {
              onThinkingChange?.(true);
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) onThinkingChange?.(false);
              };
              source.start(Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime));
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime) + audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: () => stopSession(),
          onclose: () => stopSession()
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { setIsConnecting(false); }
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 animate-fade-in font-sans relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-4 lg:mb-6 shrink-0 gap-4 lg:gap-0">
        <div>
          <h3 className="text-xl lg:text-2xl font-black text-blue-500 italic flex items-center gap-2 lg:gap-3">
             <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-500/10 rounded-lg lg:rounded-xl flex items-center justify-center border border-blue-500/20">
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <span className="hidden sm:inline">NEURALNI_SASTANAK_LIVE</span>
             <span className="sm:hidden">SASTANAK_LIVE</span>
          </h3>
        </div>
        <div className="flex gap-2 lg:gap-4">
          {isActive && (
            <div className="flex items-center gap-2 lg:gap-3 bg-red-500/10 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full border border-red-500/20">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-red-500 animate-ping"></div>
              <span className="text-[8px] lg:text-[10px] font-black text-red-500 uppercase tracking-widest">DIREKTAN_PRENOS</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        <div className="flex-[1] lg:flex-1 relative glass rounded-[20px] lg:rounded-[40px] overflow-hidden border-white/5 bg-black/40 group min-h-[40vh] lg:min-h-0">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-20 grayscale'}`} />
          <canvas ref={canvasRef} className="hidden" />
          
          {isActive && showCC && (
            <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
               <div className="max-w-4xl mx-auto flex flex-col items-center">
                  <p className="relative text-sm sm:text-lg md:text-2xl font-black text-white italic tracking-wide text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] px-2 lg:px-4">
                    {transcription || "Inicijalizacija neuralnog glasa..."}
                  </p>
               </div>
            </div>
          )}

          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-center">
               <p className="text-[9px] lg:text-[11px] font-black uppercase tracking-widest text-gray-500 italic">Srdjan je spreman za Gazdu</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-56 flex flex-col gap-4 shrink-0">
           {!isActive ? (
             <button onClick={startSession} disabled={isConnecting} className="flex-1 py-6 lg:py-0 rounded-[20px] lg:rounded-[32px] flex flex-col items-center justify-center gap-3 lg:gap-4 border-2 bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500 transition-all active:scale-95 group shadow-2xl">
               <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-center px-4">POKRENI_SEDNICU</span>
             </button>
           ) : (
             <button onClick={stopSession} className="flex-1 py-6 lg:py-0 rounded-[20px] lg:rounded-[32px] flex flex-col items-center justify-center gap-3 lg:gap-4 border-2 bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:border-red-500 transition-all active:scale-95 group shadow-2xl">
               <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 9l6 6m0-6l-6 6" /></svg>
               </div>
               <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-center px-4">ZAVRŠI_SASTANAK</span>
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default MeetingAgent;
