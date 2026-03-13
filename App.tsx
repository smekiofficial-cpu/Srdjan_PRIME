
import React, { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { AgentMode, TerminalLog, AvatarShape, NeuralData } from './types';
import SrdjanAvatar from './components/SrdjanAvatar';
import VoiceAgent from './components/VoiceAgent';
import CodeAssistant from './components/CodeAssistant';
import VideoCreator from './components/VideoCreator';
import SrdjanInstaller from './components/SrdjanInstaller';
import SystemTerminal from './components/SystemTerminal';
import BrowserAssistant from './components/BrowserAssistant';
import ExtensionHub from './components/ExtensionHub';
import YoutubeHub from './components/YoutubeHub';
import MeetingAgent from './components/MeetingAgent';
import MemoryHub from './components/MemoryHub';
import NeuralActivity from './components/NeuralActivity';

const App: React.FC = () => {
  const [mode, setMode] = useState<AgentMode>(AgentMode.VOICE);
  const [isPending, startTransition] = useTransition();
  const [avatarShape, setAvatarShape] = useState<AvatarShape>(AvatarShape.ROBOT);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [volume, setVolume] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [isHyperMode, setIsHyperMode] = useState(false);
  const [isVisionEnabled, setIsVisionEnabled] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [visionStream, setVisionStream] = useState<MediaStream | null>(null);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [telemetry, setTelemetry] = useState({ cpu: 5, gpu: 2, ram: 3.2, temp: 38, logic: 0 });
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isNeuralLinked, setIsNeuralLinked] = useState(false);
  const [neuralData, setNeuralData] = useState<NeuralData>({
    alpha: 0.5, beta: 0.3, gamma: 0.1, delta: 0.1, focus: 0.8, stress: 0.2, timestamp: Date.now()
  });
  
  const collabChannelRef = useRef<BroadcastChannel | null>(null);

  const [cameraConfig, setCameraConfig] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    focus: 0
  });

  const [cameraPresets, setCameraPresets] = useState<Record<string, typeof cameraConfig>>({
    'Standard': { zoom: 1, panX: 0, panY: 0, focus: 0 },
    'Makro': { zoom: 2.5, panX: 0, panY: -20, focus: 2 },
    'Filmski': { zoom: 1.2, panX: 80, panY: 10, focus: 5 }
  });
  
  const [sharedCode, setSharedCodeState] = useState(`// ARHITEKTURA OMEGA_PRIME\n// Gazda, spreman sam za vrhunski inženjering.\n\nclass SrdjanArhitekta {\n  constructor() {\n    this.rezim = "SAVRSEN_RAD";\n    this.dubokoPromisljanje = true;\n  }\n}`);

  // Wrapper za setSharedCode koji emituje promene ako je kolaboracija aktivna
  const setSharedCode = useCallback((newCode: string | ((prev: string) => string), skipBroadcast = false) => {
    setSharedCodeState(prev => {
      const code = typeof newCode === 'function' ? newCode(prev) : newCode;
      if (isCollaborating && !skipBroadcast && collabChannelRef.current) {
        collabChannelRef.current.postMessage({ type: 'CODE_SYNC', code });
      }
      return code;
    });
  }, [isCollaborating]);

  useEffect(() => {
    collabChannelRef.current = new BroadcastChannel('srdjan_collab');
    collabChannelRef.current.onmessage = (event) => {
      if (isCollaborating && event.data.type === 'CODE_SYNC') {
        setSharedCode(event.data.code, true);
      }
    };
    return () => collabChannelRef.current?.close();
  }, [isCollaborating, setSharedCode]);

  useEffect(() => {
    const savedCode = localStorage.getItem('srdjan_shared_code');
    const savedLogs = localStorage.getItem('srdjan_terminal_logs');
    const savedPresets = localStorage.getItem('srdjan_camera_presets');
    if (savedCode) setSharedCodeState(savedCode);
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Greška pri učitavanju logova.");
      }
    }
    if (savedPresets) {
      try {
        setCameraPresets(JSON.parse(savedPresets));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('srdjan_shared_code', sharedCode);
  }, [sharedCode]);

  useEffect(() => {
    localStorage.setItem('srdjan_terminal_logs', JSON.stringify(logs.slice(0, 50)));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('srdjan_camera_presets', JSON.stringify(cameraPresets));
  }, [cameraPresets]);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      } else {
        setApiKeySelected(true);
      }
    };
    checkKey();
    addLog('SISTEM_OMEGA: Srdjan Tesla-X OMEGA PRIME spreman. Baza podataka je sinhronizovana.', 'success');
    
    const interval = setInterval(() => {
      const multiplier = isThinking ? 3 : (isLinked ? 1.5 : 1);
      const neuralMultiplier = isNeuralLinked ? 1.2 : 1;
      
      setTelemetry({
        cpu: Math.floor((Math.random() * 8 + 4) * multiplier * neuralMultiplier),
        gpu: Math.floor((Math.random() * 5 + 1) * (mode === AgentMode.VIDEO ? 22 : 1) * neuralMultiplier),
        ram: Number((4.1 + (isThinking ? 3.5 : 0) + (isNeuralLinked ? 1.2 : 0)).toFixed(1)),
        temp: Math.floor(38 + (isThinking ? 15 : 0) + (isNeuralLinked ? 5 : 0) + Math.random() * 3),
        logic: isThinking ? 98 + Math.random() : (isNeuralLinked ? 45 + Math.random() * 10 : 0)
      });

      if (isNeuralLinked) {
        setNeuralData(prev => ({
          alpha: Math.max(0, Math.min(1, prev.alpha + (Math.random() - 0.5) * 0.1)),
          beta: Math.max(0, Math.min(1, prev.beta + (Math.random() - 0.5) * 0.1)),
          gamma: Math.max(0, Math.min(1, prev.gamma + (Math.random() - 0.5) * 0.1)),
          delta: Math.max(0, Math.min(1, prev.delta + (Math.random() - 0.5) * 0.1)),
          focus: Math.max(0, Math.min(1, prev.focus + (Math.random() - 0.5) * 0.05)),
          stress: Math.max(0, Math.min(1, prev.stress + (Math.random() - 0.5) * 0.05)),
          timestamp: Date.now()
        }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isThinking, mode, isLinked, isNeuralLinked]);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      message: `[OMEGA] ${message}`,
      type,
      timestamp: Date.now()
    }, ...prev].slice(0, 50));
  }, []);

  const toggleVision = async (forceState?: boolean) => {
    const targetState = forceState !== undefined ? forceState : !isVisionEnabled;
    if (isVisionEnabled && !targetState) {
      visionStream?.getTracks().forEach(track => track.stop());
      setVisionStream(null);
      setIsVisionEnabled(false);
      addLog('OPTIKA: Isključena. Štednja energije aktivna.', 'warning');
    } else if (!isVisionEnabled && targetState) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVisionStream(stream);
        setIsVisionEnabled(true);
        addLog('OPTIKA: Srdjan je povezao vizuelne senzore. Radni prostor skeniran.', 'success');
      } catch (err) {
        addLog('OPTIKA_GRESKA: Pristup kameri odbijen.', 'error');
      }
    }
  };

  const toggleNeuralLink = () => {
    const nextState = !isNeuralLinked;
    setIsNeuralLinked(nextState);
    if (nextState) {
      addLog('NEURAL_LINK: BCI interfejs inicijalizovan. Sinhronizacija moždanih talasa...', 'success');
    } else {
      addLog('NEURAL_LINK: Veza prekinuta. Senzori u standby modu.', 'warning');
    }
  };

  const renderActiveModule = () => {
    switch (mode) {
      case AgentMode.CODE:
        return (
          <CodeAssistant 
            onThinkingChange={setIsThinking} 
            addLog={addLog} 
            sharedCode={sharedCode} 
            setSharedCode={setSharedCode}
            isCollaborating={isCollaborating}
            setIsCollaborating={setIsCollaborating}
          />
        );
      case AgentMode.VOICE:
        return (
          <VoiceAgent 
            onVolumeChange={setVolume} 
            onThinkingChange={setIsThinking} 
            addLog={addLog} 
            visionStream={visionStream} 
            onLinkChange={setIsLinked} 
            updateSharedCode={setSharedCode} 
            cameraConfig={cameraConfig}
            setCameraConfig={setCameraConfig}
            cameraPresets={cameraPresets}
            setCameraPresets={setCameraPresets}
            toggleWebCamera={toggleVision} 
            telemetry={telemetry} 
          />
        );
      case AgentMode.BROWSER:
        return <BrowserAssistant onThinkingChange={setIsThinking} addLog={addLog} />;
      case AgentMode.VIDEO:
        return <VideoCreator apiKeySelected={apiKeySelected} onOpenKey={() => (window as any).aistudio?.openSelectKey()} onThinkingChange={setIsThinking} />;
      case AgentMode.YOUTUBE:
        return <YoutubeHub onThinkingChange={setIsThinking} addLog={addLog} />;
      case AgentMode.MEETING:
        return (
          <MeetingAgent 
            onVolumeChange={setVolume} 
            onThinkingChange={setIsThinking} 
            onLinkChange={setIsLinked}
            addLog={addLog} 
            updateSharedCode={setSharedCode}
            cameraConfig={cameraConfig}
            setCameraConfig={setCameraConfig}
            cameraPresets={cameraPresets}
            setCameraPresets={setCameraPresets}
          />
        );
      case AgentMode.INSTALL:
        return <SrdjanInstaller onThinkingChange={setIsThinking} addLog={addLog} />;
      case AgentMode.EXTENSION:
        return <ExtensionHub onThinkingChange={setIsThinking} addLog={addLog} />;
      case AgentMode.MEMORY:
        return <MemoryHub onThinkingChange={setIsThinking} addLog={addLog} />;
      default:
        return <div className="p-10 text-white/20 uppercase font-black italic">Izaberi modul_</div>;
    }
  };

  const menuItems = [
    { id: AgentMode.VOICE, icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Vokalna Inteligencija' },
    { id: AgentMode.CODE, icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', label: 'Glavni Arhitekta' },
    { id: AgentMode.BROWSER, icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9', label: 'Istraživački Centar' },
    { id: AgentMode.VIDEO, icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14', label: 'Video Produkcija' },
    { id: AgentMode.YOUTUBE, icon: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33zM9.75 15.02V8.48L15.55 11.75l-5.8 3.27z', label: 'YouTube Studio' },
    { id: AgentMode.MEETING, icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Neuralni Sastanak' },
    { id: AgentMode.EXTENSION, icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z', label: 'Proširenja' },
    { id: AgentMode.MEMORY, icon: 'M12 2v20M2 12h20', label: 'Neuralni Arhiv' },
    { id: AgentMode.INSTALL, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', label: 'Implementacija' },
  ];

  return (
    <div className={`h-screen w-screen flex flex-col transition-all duration-1000 bg-[#020205] ${isThinking ? 'shadow-[inset_0_0_100px_rgba(139,92,246,0.1)]' : ''}`}>
      <header className="h-auto min-h-[4rem] lg:min-h-[5rem] lg:h-20 shrink-0 glass border-b border-white/5 flex flex-col lg:flex-row items-center justify-between px-3 lg:px-12 py-3 lg:py-0 z-[100] relative gap-3 lg:gap-4">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-16 w-full lg:w-auto">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h1 className="orbitron text-lg lg:text-2xl font-black tracking-[0.2em] lg:tracking-[0.4em] text-white italic">SRDJAN <span className="text-purple-500">PRIME</span></h1>
            <span className="text-[6px] lg:text-[9px] font-black text-gray-500 tracking-[0.4em] lg:tracking-[0.6em] uppercase">Tesla-X Arhitektura_v10.9</span>
          </div>
          <div className="hidden xl:flex gap-12">
            {[
              { label: 'OPTEREĆENJE_ČVORA', val: telemetry.cpu, unit: '%', color: 'purple' },
              { label: 'PRECIZNOST_LOGIKE', val: telemetry.logic > 0 ? telemetry.logic.toFixed(2) : 'STANDBY', unit: telemetry.logic > 0 ? '%' : '', color: isThinking ? 'purple' : 'gray' },
              { label: 'TERMALNA_SRŽ', val: telemetry.temp, unit: '°C', color: telemetry.temp > 50 ? 'orange' : 'cyan' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1 w-36">
                <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest italic">
                  <span>{stat.label}</span>
                  <span className={stat.color === 'purple' ? 'text-purple-400' : 'text-cyan-400'}>{stat.val}{stat.unit}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${stat.color === 'purple' ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-cyan-500 shadow-[0_0_10px_cyan]'}`} 
                    style={{ width: stat.val === 'STANDBY' ? '0%' : `${Math.min(100, Number(stat.val) * 1.5)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-8 w-full lg:w-auto">
          <button 
            onClick={toggleNeuralLink}
            className={`px-3 lg:px-6 py-1.5 lg:py-2 glass rounded-xl lg:rounded-2xl border-white/10 flex items-center gap-1.5 lg:gap-4 transition-all duration-700 ${isNeuralLinked ? 'border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${isNeuralLinked ? 'bg-purple-500 animate-pulse shadow-[0_0_10px_purple]' : 'bg-gray-700'}`}></div>
            <span className="text-[7px] lg:text-[10px] font-black tracking-widest uppercase">{isNeuralLinked ? 'BCI_LINK: ON' : 'BCI_LINK: OFF'}</span>
          </button>
          <button 
            onClick={() => startTransition(() => setAvatarShape(avatarShape === AvatarShape.ROBOT ? AvatarShape.HUMAN : AvatarShape.ROBOT))}
            className={`px-3 lg:px-6 py-1.5 lg:py-2 glass rounded-xl lg:rounded-2xl border-white/10 flex items-center gap-1.5 lg:gap-4 transition-all duration-700 ${avatarShape === AvatarShape.ROBOT ? 'border-purple-500/50 text-purple-400' : 'text-amber-400'}`}
          >
            <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${avatarShape === AvatarShape.ROBOT ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-amber-500'}`}></div>
            <span className="text-[7px] lg:text-[10px] font-black tracking-widest uppercase">{avatarShape === AvatarShape.ROBOT ? 'OMEGA_SRŽ' : 'BIO_BLIZANAC'}</span>
          </button>
          <div className={`px-3 lg:px-6 py-1.5 lg:py-2 glass rounded-xl lg:rounded-2xl border-white/10 flex items-center gap-1.5 lg:gap-4 ${isLinked ? 'border-purple-500/40' : ''}`}>
            <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${isLinked ? 'bg-purple-400 animate-pulse shadow-[0_0_10px_purple]' : 'bg-gray-700'}`}></div>
            <span className="text-[7px] lg:text-[10px] font-black tracking-widest text-gray-400 uppercase hidden sm:inline">Neural: {isLinked ? 'POVEZAN' : 'STANDBY'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <nav className="w-full lg:w-24 h-auto lg:h-full glass border-b lg:border-b-0 lg:border-r border-white/5 flex flex-row lg:flex-col items-center py-2 lg:py-8 px-2 lg:px-0 gap-2 lg:gap-6 z-50 overflow-x-auto lg:overflow-y-auto custom-scrollbar shrink-0">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => startTransition(() => setMode(item.id))}
              className={`w-10 h-10 lg:w-14 lg:h-14 min-w-[40px] lg:min-h-[56px] rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-700 relative group shrink-0 ${mode === item.id ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] lg:shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 'text-gray-600 hover:text-white'} ${isPending ? 'opacity-80' : ''}`}
            >
              <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon} /></svg>
              <div className="absolute bottom-full mb-2 lg:bottom-auto lg:mb-0 lg:left-full lg:ml-4 px-2 lg:px-3 py-1 bg-black text-white text-[7px] lg:text-[9px] font-black uppercase tracking-widest rounded-md lg:rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-[1000]">
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        <main className="flex-1 flex flex-col lg:flex-row p-2 lg:p-8 gap-2 lg:gap-8 overflow-y-auto lg:overflow-hidden">
          <div className="w-full lg:w-[40%] flex flex-col gap-2 lg:gap-8 min-h-[40vh] lg:min-h-0 shrink-0 lg:shrink">
            <div className="flex-1 glass rounded-[20px] lg:rounded-[80px] border-white/5 relative overflow-hidden shadow-2xl min-h-[250px] lg:min-h-[300px]">
              <SrdjanAvatar 
                mode={mode} 
                isProcessing={isThinking} 
                volume={volume} 
                hyperMode={isHyperMode} 
                visionStream={visionStream} 
                isLinked={isLinked}
                shape={avatarShape}
                cameraConfig={cameraConfig}
                setCameraConfig={setCameraConfig}
                cameraPresets={cameraPresets}
              />
            </div>
            <NeuralActivity data={neuralData} isActive={isNeuralLinked} />
          </div>

          <div className="flex-1 flex flex-col gap-2 lg:gap-8 overflow-hidden min-h-[50vh] lg:min-h-0">
            <div className="flex-1 glass rounded-[20px] lg:rounded-[80px] border-white/5 overflow-hidden bg-black/60 relative">
              <div key={mode} className="flex-1 flex flex-col animate-module-reveal h-full overflow-hidden">
                {renderActiveModule()}
              </div>
            </div>
            <SystemTerminal logs={logs} hyperMode={isHyperMode} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
