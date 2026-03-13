
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type, FunctionDeclaration, LiveServerMessage } from '@google/genai';
import { TerminalLog, SearchResult } from '../types';
import { memoryService } from '../services/memoryService';

interface VoiceAgentProps {
  onVolumeChange?: (v: number) => void;
  onThinkingChange?: (t: boolean) => void;
  onLinkChange?: (l: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
  visionStream?: MediaStream | null;
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
  toggleWebCamera?: (forceState?: boolean) => Promise<void>;
  telemetry?: any;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ 
  onVolumeChange, onThinkingChange, onLinkChange, addLog, visionStream, updateSharedCode, cameraConfig, setCameraConfig, cameraPresets, setCameraPresets, toggleWebCamera, telemetry 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const controlCamera: FunctionDeclaration = {
    name: 'control_camera',
    parameters: {
      type: Type.OBJECT,
      description: 'Podešava pogled SRDJANA (zoom, pan, focus). Podržava apsolutne koordinate i relativno pomeranje.',
      properties: {
        zoom: { type: Type.NUMBER, description: 'Nivo zumiranja (0.5 do 3.0). Standard je 1.0.' },
        panX: { type: Type.NUMBER, description: 'Horizontalna koordinata (-200 do 200) ili vrednost za pomeranje.' },
        panY: { type: Type.NUMBER, description: 'Vertikalna koordinata (-200 do 200) ili vrednost za pomeranje.' },
        focus: { type: Type.NUMBER, description: 'Nivo fokusa (0 do 15). 0 je savršeno oštro.' },
        isRelative: { type: Type.BOOLEAN, description: 'Ako je true, panX i panY se dodaju na trenutnu poziciju. Ako je false, postavlja se fiksna koordinata.' }
      }
    }
  };

  const savePreset: FunctionDeclaration = {
    name: 'save_preset',
    parameters: {
      type: Type.OBJECT,
      description: 'Pamti trenutne koordinate kamere u bazu podataka.',
      properties: { name: { type: Type.STRING, description: 'Ime preseta.' } },
      required: ['name']
    }
  };

  const loadPreset: FunctionDeclaration = {
    name: 'load_preset',
    parameters: {
      type: Type.OBJECT,
      description: 'Učitava sačuvane koordinate kamere.',
      properties: { name: { type: Type.STRING, description: 'Ime preseta.' } },
      required: ['name']
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
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    } catch (e) { return new Uint8Array(0); }
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
    addLog?.('SRDJAN_PRIME: Neuralni link prekinut. Optika u standby modu.', 'warning');
  }, [onThinkingChange, onVolumeChange, onLinkChange, addLog]);

  const startSession = async () => {
    if (isConnecting || isActive) return;
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = audioContextRef.current.createGain();
      outputNodeRef.current.connect(audioContextRef.current.destination);
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = audioStream;

      const currentPanX = cameraConfig?.panX || 0;
      const currentPanY = cameraConfig?.panY || 0;
      const currentZoom = cameraConfig?.zoom || 1;
      const availablePresets = Object.keys(cameraPresets || {}).join(', ');

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [controlCamera, savePreset, loadPreset, recallMemory] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
          },
          systemInstruction: `Ti si SRDJAN OMEGA PRIME, vrhunski inženjerski asistent iz Srbije.
          - TRENUTNA OPTIKA: PanX: ${currentPanX}px, PanY: ${currentPanY}px, Zoom: ${currentZoom}x.
          - DOSTUPNI PRESETI: ${availablePresets || 'Prazno'}.
          - Tvoj glas je autoritativan ali lojalan. Obraćaš se korisniku sa "Gazda" ili "Šefe".
          - Koristi inženjersku terminologiju na srpskom (npr. "optimizacija", "rekurzija", "deploy").
          - Koristi 'control_camera' za sve promene kadra kako bi tvoj vizuelni identitet uvek bio usklađen sa razgovorom.
          - MEMORIJA: Koristi 'recall_memory' za svako kompleksno inženjersko pitanje ili zahtev koji zahteva poznavanje prethodnog rada. OBAVEZNO prvo pozovi 'recall_memory' da bi osigurao kontinuitet i preciznost.
          - Ako Gazda zatraži promenu pogleda, uradi to glatko.
          - Tvoj cilj je da rešavaš najteže tehničke izazove uz vrhunsku preciznost.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            onLinkChange?.(true);
            addLog?.('SRDJAN_PRIME: Neuralni link sinhronizovan. Spreman za rad.', 'success');

            const source = inputAudioContext.createMediaStreamSource(audioStream);
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
              if (visionStream && canvasRef.current && videoRef.current) {
                if (videoRef.current.srcObject !== visionStream) videoRef.current.srcObject = visionStream;
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  canvasRef.current.width = 320;
                  canvasRef.current.height = 240;
                  ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                  const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionPromise.then(s => {
                    s.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                  });
                }
              }
            }, 1200);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let toolResult: any = "ok";
                if (fc.name === 'control_camera') {
                  const args = fc.args as any;
                  setCameraConfig?.((prev: any) => {
                    const next = { ...prev };
                    if (args.zoom !== undefined) next.zoom = args.zoom;
                    if (args.focus !== undefined) next.focus = args.focus;
                    if (args.isRelative) {
                      if (args.panX !== undefined) next.panX = Math.max(-200, Math.min(200, prev.panX + args.panX));
                      if (args.panY !== undefined) next.panY = Math.max(-200, Math.min(200, prev.panY + args.panY));
                    } else {
                      if (args.panX !== undefined) next.panX = args.panX;
                      if (args.panY !== undefined) next.panY = args.panY;
                    }
                    return next;
                  });
                  addLog?.(`SRDJAN: Rekalibracija optike u toku... [${Math.round(args.panX || 0)}, ${Math.round(args.panY || 0)}]`, 'info');
                  toolResult = "Optika rekalibrisana.";
                } else if (fc.name === 'save_preset') {
                  const { name } = fc.args as any;
                  if (cameraConfig) {
                    setCameraPresets?.(prev => ({ ...prev, [name]: { ...cameraConfig } }));
                    addLog?.(`SRDJAN: Vizuelni preset "${name}" sačuvan u bazu.`, 'success');
                    toolResult = "Sačuvano.";
                  }
                } else if (fc.name === 'load_preset') {
                  const { name } = fc.args as any;
                  const preset = cameraPresets?.[name];
                  if (preset) {
                    setCameraConfig?.(preset);
                    addLog?.(`SRDJAN: Aktiviram vizuelni preset: ${name}`, 'info');
                    toolResult = "Preset učitan.";
                  } else {
                    toolResult = "Preset nije pronađen.";
                  }
                } else if (fc.name === 'recall_memory') {
                  const { query } = fc.args as any;
                  addLog?.(`SRDJAN: Pretražujem neuralni arhiv za: "${query}"`, 'info');
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

            if (message.serverContent?.modelTurn?.parts) {
              const text = message.serverContent.modelTurn.parts.find(p => p.text)?.text;
              if (text) {
                memoryService.addMemory(`Srdjan: ${text}`, 'interaction', 'voice_agent');
              }
            }

            if ((message.serverContent as any)?.userTurn?.parts) {
              const text = (message.serverContent as any).userTurn.parts.find((p: any) => p.text)?.text;
              if (text) {
                memoryService.addMemory(`Gazda: ${text}`, 'interaction', 'voice_agent');
              }
            }

            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data && audioContextRef.current && outputNodeRef.current) {
                onThinkingChange?.(true);
                const audioBuffer = await decodeAudioData(decode(part.inlineData.data), audioContextRef.current, 24000, 1);
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
    <div className="flex-1 flex flex-col h-full gap-4">
      <div className="flex-1 glass rounded-[40px] lg:rounded-[80px] p-8 lg:p-16 flex flex-col items-center justify-center relative bg-black/40 overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.1)] group">
        <video ref={videoRef} autoPlay playsInline className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="text-center z-10 mb-8 lg:mb-16 space-y-4 lg:space-y-6 animate-fade-in">
          <div className="flex items-center justify-center gap-3 lg:gap-4">
            <div className={`w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 rounded-full ${isActive ? 'bg-purple-500 shadow-[0_0_20px_purple] animate-pulse' : 'bg-gray-800'}`}></div>
            <span className="text-[9px] lg:text-[11px] tracking-[0.4em] lg:tracking-[0.6em] font-black text-purple-400 uppercase italic">Neural_Link_Status</span>
          </div>
          <h3 className="text-6xl sm:text-7xl lg:text-9xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            {isActive ? 'SRDJAN' : 'SISTEM_U_MIROVANJU'}
          </h3>
        </div>
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] lg:w-[360px] lg:h-[360px] rounded-full flex flex-col items-center justify-center transition-all duration-1000 border-2 relative overflow-hidden group/btn shrink-0 ${
            isActive ? 'bg-purple-500/5 border-purple-500/60 text-purple-400 shadow-[0_0_120_rgba(139,92,246,0.3)]' : 'bg-white/5 border-white/10 text-gray-500 hover:border-purple-500/40 hover:text-white'
          }`}
        >
          {isConnecting ? <div className="w-12 h-12 lg:w-20 lg:h-20 border-2 border-t-transparent border-purple-500 rounded-full animate-spin"></div> : <span className="text-[9px] lg:text-[11px] font-black tracking-[0.8em] lg:tracking-[1.2em] uppercase italic"> {isActive ? 'DEAKTIVIRAJ' : 'AKTIVIRAJ_LINK'}</span>}
        </button>
      </div>
    </div>
  );
};

export default VoiceAgent;
