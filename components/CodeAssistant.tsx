
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { ChatMessage, TerminalLog, SearchResult } from '../types';
import { memoryService } from '../services/memoryService';

interface EditorTheme {
  id: string;
  name: string;
  bg: string;
  text: string;
  gutter: string;
  gutterText: string;
  selection: string;
  accent: string;
  caret: string;
}

const THEMES: EditorTheme[] = [
  {
    id: 'prime',
    name: 'Omega Dark',
    bg: '#050508',
    text: '#8b5cf6',
    gutter: 'rgba(255, 255, 255, 0.02)',
    gutterText: '#4b5563',
    selection: 'rgba(139, 92, 246, 0.2)',
    accent: '#8b5cf6',
    caret: '#a855f7'
  },
  {
    id: 'nova',
    name: 'Nova Light',
    bg: '#f1f5f9',
    text: '#0f172a',
    gutter: 'rgba(0, 0, 0, 0.05)',
    gutterText: '#64748b',
    selection: 'rgba(139, 92, 246, 0.15)',
    accent: '#6366f1',
    caret: '#6366f1'
  }
];

interface Collaborator {
  id: string;
  name: string;
  color: string;
  pos: { x: number, y: number };
}

interface CodeAssistantProps {
  onThinkingChange?: (t: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
  sharedCode: string;
  setSharedCode: (code: string | ((prev: string) => string)) => void;
  isCollaborating?: boolean;
  setIsCollaborating?: (v: boolean) => void;
}

const CodeAssistant: React.FC<CodeAssistantProps> = ({ 
  onThinkingChange, addLog, sharedCode, setSharedCode, isCollaborating = false, setIsCollaborating 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'editor' | 'split'>('split');
  const [currentTheme, setCurrentTheme] = useState<EditorTheme>(THEMES[0]);
  const [isRefactoring, setIsRefactoring] = useState(false);
  
  // Simulirani kolaboratori za demo efekat
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: '1', name: 'Marko_Dev', color: '#10b881', pos: { x: 45, y: 120 } },
    { id: '2', name: 'Jelena_QA', color: '#f59e0b', pos: { x: 12, y: 300 } }
  ]);
  
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          tools: [{ googleSearch: {} }],
          systemInstruction: `Ti si SRDJAN_PRIME, najnapredniji inženjer softvera na Balkanu. 
          Specijalista si za:
          - Moderni Web (React, Next.js, Node.js).
          - Mobilni razvoj (Kotlin, Swift, Flutter).
          - Sistemsko inženjerstvo (Rust, C++, Python).
          
          Kada Gazda zatraži refaktorisanje ili kodiranje:
          1. Piši kod koji je otporan na greške i visoko optimizovan.
          2. Odgovaraj isključivo na srpskom jeziku stručnim tonom.
          3. Uvek objasni ključne arhitektonske odluke.
          4. Koristi informacije iz prethodnih sesija ako su dostupne u tvojoj memoriji.
          Tvoj kod je standard kvaliteta.`,
        }
      });
  }, []);

  const toggleCollab = () => {
    const nextState = !isCollaborating;
    setIsCollaborating?.(nextState);
    if (nextState) {
      addLog?.('NEURAL_COLLAB: Mod za rad u realnom vremenu aktiviran. Povezivanje čvorova...', 'success');
    } else {
      addLog?.('NEURAL_COLLAB: Kolaboracija prekinuta. Lokalni radni prostor aktivan.', 'warning');
    }
  };

  const handleRefactor = async () => {
    if (!chatRef.current || isLoading) return;
    
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart || 0;
    const end = textarea?.selectionEnd || 0;
    const selectedText = sharedCode.substring(start, end);
    const codeToRefactor = selectedText || sharedCode;

    setIsLoading(true);
    setIsRefactoring(true);
    onThinkingChange?.(true);
    addLog?.('SRDJAN: Analiziram strukturu koda za refaktorisanje...', 'command');

    try {
      const prompt = `Analiziraj ovaj kod i optimizuj ga. Fokusiraj se na performanse i čitljivost. Vrati mi kompletan refaktorisan kod sa objašnjenjem na srpskom jeziku.\n\nKOD:\n\`\`\`\n${codeToRefactor}\n\`\`\``;

      const result = await chatRef.current.sendMessage({ message: prompt });
      const assistantMsg = { 
        role: 'assistant', 
        text: `**SRDJAN REFAKTOR IZVEŠTAJ:**\n\n${result.text}`, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, assistantMsg as ChatMessage]);
      addLog?.('SRDJAN: Kod je uspešno optimizovan po Omega Prime standardu.', 'success');
    } catch (err) {
      addLog?.('REFAKTOR_ERR: Neuspešna analiza logičkih struktura.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefactoring(false);
      onThinkingChange?.(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current || isLoading) return;
    const userMsg = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg as ChatMessage]);
    setInput('');
    setIsLoading(true);
    onThinkingChange?.(true);
    
    try {
      // Pre-search memory for context
      const memories = await memoryService.search(input, 2);
      const memoryContext = memories.length > 0 
        ? `\n\nRELEVANTNA SEĆANJA IZ ARHIVA:\n${memories.map(m => `- ${m.entry.text}`).join('\n')}`
        : '';

      const result = await chatRef.current.sendMessage({ 
        message: input + `\nTrenutno stanje koda u editoru:\n${sharedCode}${memoryContext}` 
      });
      const assistantMsg = { role: 'assistant', text: result.text || "Zadatak izvršen.", timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg as ChatMessage]);

      // Store memory
      await memoryService.addMemory(
        `Korisnik: ${input}\nSrdjan: ${result.text}`,
        'interaction',
        'code_assistant'
      );
    } catch (err) { 
      addLog?.('ARCH_ERR: Greška u neuralnom procesiranju koda.', 'error');
    } finally { 
      setIsLoading(false); 
      onThinkingChange?.(false); 
    }
  };

  const handleDownload = () => {
    const blob = new Blob([sharedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'srdjan_code.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog?.('SISTEM: Kod je uspešno preuzet.', 'success');
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full gap-4 lg:gap-6 p-4 lg:p-6 overflow-hidden font-sans" style={{ backgroundColor: currentTheme.bg }}>
      <div className="h-auto min-h-[4rem] lg:h-16 glass rounded-[20px] lg:rounded-3xl flex flex-col lg:flex-row items-center justify-between px-4 lg:px-8 py-4 lg:py-0 border-white/5 shrink-0 bg-black/40 gap-4 lg:gap-0">
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 lg:gap-6 w-full lg:w-auto">
          <div className="flex flex-col items-center lg:items-start w-full lg:w-auto mb-2 lg:mb-0">
             <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] text-purple-500 italic">Inženjerska_Laboratorija</span>
             <span className="text-white text-[10px] lg:text-xs font-black tracking-widest uppercase">#GLAVNI_ARHITEKTA</span>
          </div>
          
          <button 
            onClick={toggleCollab}
            className={`px-3 lg:px-5 py-1.5 lg:py-2 rounded-xl text-[7px] lg:text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 lg:gap-3 ${
              isCollaborating ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,184,129,0.3)]' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${isCollaborating ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="hidden sm:inline">Neuralna Kolaboracija</span>
            <span className="sm:hidden">Kolab</span>
          </button>

          <button 
            onClick={handleRefactor}
            disabled={isLoading}
            className={`px-3 lg:px-5 py-1.5 lg:py-2 rounded-xl text-[7px] lg:text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
              isRefactoring ? 'bg-purple-600 text-white shadow-[0_0_15px_purple]' : 'bg-white/5 text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
            }`}
          >
            Refaktoriši
          </button>

          <button 
            onClick={handleDownload}
            className="px-3 lg:px-5 py-1.5 lg:py-2 rounded-xl text-[7px] lg:text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 bg-white/5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            Preuzmi
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 lg:gap-6 w-full lg:w-auto">
          <div className="flex items-center gap-1 lg:gap-2 glass rounded-2xl p-1 bg-black/40 border-white/10">
            {THEMES.map(theme => (
              <button 
                key={theme.id}
                onClick={() => {
                  setCurrentTheme(theme);
                  addLog?.(`TEMA_PROMENJENA: Aktiviran "${theme.name}" profil.`, 'info');
                }}
                className={`w-6 h-6 rounded-lg transition-all border ${currentTheme.id === theme.id ? 'border-purple-500 scale-110' : 'border-white/5 opacity-50 hover:opacity-100'}`}
                style={{ backgroundColor: theme.bg }}
                title={theme.name}
              />
            ))}
          </div>

          <div className="h-6 lg:h-8 w-[1px] bg-white/10 mx-1 lg:mx-2 hidden sm:block"></div>

          {isCollaborating && (
            <div className="flex -space-x-2 lg:-space-x-3 mr-2 lg:mr-4">
               {collaborators.map((c) => (
                 <div key={c.id} className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-black flex items-center justify-center text-[8px] lg:text-[10px] font-black text-white group relative" style={{ backgroundColor: c.color }}>
                    {c.name.charAt(0)}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                       {c.name}
                    </div>
                 </div>
               ))}
               <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-black bg-white/5 flex items-center justify-center text-[8px] lg:text-[10px] font-black text-gray-400 border-dashed">
                 +1
               </div>
            </div>
          )}
          
          <div className="flex glass rounded-2xl p-1 bg-black/40 border-white/10">
            {[ {id: 'chat', label: 'ČAT'}, {id: 'split', label: 'PODELJENO'}, {id: 'editor', label: 'EDITOR'} ].map(m => (
              <button key={m.id} onClick={() => setViewMode(m.id as any)} className={`px-2 lg:px-4 py-1 lg:py-1.5 rounded-xl text-[7px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === m.id ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        {(viewMode === 'chat' || viewMode === 'split') && (
          <div className={`flex flex-col glass rounded-[20px] lg:rounded-[40px] border-white/5 bg-black/40 relative overflow-hidden ${viewMode === 'chat' ? 'w-full h-full' : 'w-full lg:w-1/3 h-1/2 lg:h-full'}`}>
            <div ref={scrollRef} className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4 lg:space-y-6 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[95%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/[0.02] border border-white/5'}`}>
                    <div className="text-[13px] leading-relaxed text-gray-300 whitespace-pre-wrap font-sans">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 lg:p-4 bg-black/60 border-t border-white/5">
              <div className="relative">
                 <input 
                   value={input} 
                   onChange={(e) => setInput(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                   placeholder="Unesi instrukcije za inženjering..." 
                   className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition-all" 
                 />
                 <button onClick={handleSend} disabled={isLoading} className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 w-6 h-6 lg:w-8 lg:h-8 bg-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center text-white hover:bg-purple-500 transition-all">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                 </button>
              </div>
            </div>
          </div>
        )}

        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`flex flex-col rounded-[20px] lg:rounded-[40px] border border-white/5 relative overflow-hidden shadow-2xl transition-colors duration-500 ${viewMode === 'editor' ? 'w-full h-full' : 'w-full lg:w-2/3 h-1/2 lg:h-full'}`} style={{ backgroundColor: currentTheme.bg }}>
            <div className="flex-1 relative font-mono text-[11px] lg:text-[13px] leading-relaxed p-4 lg:p-6">
              <textarea
                ref={textareaRef}
                value={sharedCode}
                onChange={(e) => setSharedCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none pl-12 custom-scrollbar transition-all font-mono"
                style={{ color: currentTheme.text, caretColor: currentTheme.caret }}
              />
              
              {/* Simulirani sinhronizovani kursori */}
              {isCollaborating && collaborators.map(c => (
                <div key={c.id} className="absolute pointer-events-none transition-all duration-500 z-10" style={{ left: `${c.pos.x}%`, top: `${c.pos.y}px` }}>
                   <div className="w-0.5 h-5 animate-pulse" style={{ backgroundColor: c.color }}></div>
                   <div className="px-2 py-0.5 rounded-sm text-[8px] font-black text-white uppercase whitespace-nowrap -mt-4 ml-1" style={{ backgroundColor: c.color }}>
                      {c.name}
                   </div>
                </div>
              ))}

              <style>{`textarea::selection { background: ${currentTheme.selection}; }`}</style>
              <div className="absolute left-6 top-6 w-10 select-none text-right pr-4 border-r border-white/5 font-mono opacity-20" style={{ color: currentTheme.gutterText }}>
                {sharedCode.split('\n').map((_, i) => <div key={i} className="leading-relaxed">{i + 1}</div>)}
              </div>
            </div>
            
            <div className="h-8 bg-black/60 border-t border-white/5 px-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">UTF-8</span>
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">TypeScript / React</span>
                  <span className="text-[8px] font-black text-purple-500/60 uppercase tracking-widest">Tema: {currentTheme.name}</span>
               </div>
               {isCollaborating && (
                 <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest animate-pulse">Sinhronizacija aktivna sa 3 čvora...</span>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeAssistant;
