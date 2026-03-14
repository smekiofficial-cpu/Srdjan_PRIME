import React, { useState } from 'react';
import { TerminalLog } from '../types';

interface WindowsControlProps {
  onThinkingChange?: (t: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
}

const WindowsControl: React.FC<WindowsControlProps> = ({ onThinkingChange, addLog }) => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim()) return;
    
    setIsExecuting(true);
    onThinkingChange?.(true);
    addLog?.(`Izvršavam Windows komandu: ${cmdToRun}`, 'command');
    setOutput(prev => prev + `\n> ${cmdToRun}\n`);

    try {
      const response = await fetch('/api/windows/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: cmdToRun }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nepoznata greška');
      }

      if (data.stdout) {
        setOutput(prev => prev + data.stdout + '\n');
        addLog?.('Komanda uspešno izvršena.', 'success');
      }
      if (data.stderr) {
        setOutput(prev => prev + `[STDERR] ${data.stderr}\n`);
        addLog?.('Upozorenje tokom izvršavanja komande.', 'warning');
      }
    } catch (error: any) {
      setOutput(prev => prev + `[GRESKA] ${error.message}\n`);
      addLog?.(`Greška: ${error.message}`, 'error');
    } finally {
      setIsExecuting(false);
      onThinkingChange?.(false);
      setCommand('');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(command);
  };

  const quickCommands = [
    { label: 'Sistemske Informacije', cmd: 'systeminfo' },
    { label: 'Aktivni Procesi', cmd: 'tasklist' },
    { label: 'Mrežne Postavke', cmd: 'ipconfig /all' },
    { label: 'Otvori Notepad', cmd: 'start notepad' },
    { label: 'Otvori Kalkulator', cmd: 'start calc' },
  ];

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 animate-fade-in font-sans overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-4 lg:mb-8 shrink-0 gap-4 lg:gap-0">
        <div>
          <h3 className="text-xl lg:text-2xl font-black text-blue-500 italic flex items-center gap-2 lg:gap-3">
             <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/></svg>
             <span className="hidden sm:inline">WINDOWS_KONTROLA</span>
             <span className="sm:hidden">WIN_CTRL</span>
          </h3>
          <p className="text-[8px] lg:text-[10px] font-mono text-gray-500 uppercase tracking-widest text-center lg:text-left mt-1 lg:mt-0">Direktna veza sa lokalnim OS-om</p>
        </div>
        <div className="px-3 lg:px-4 py-1 lg:py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-2 lg:gap-3">
           <span className="text-[7px] lg:text-[8px] font-black text-blue-400 uppercase tracking-widest">Lokalni_Režim</span>
           <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:gap-6 flex-1 overflow-hidden">
        <div className="flex flex-col gap-3 lg:gap-4 shrink-0">
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl lg:rounded-2xl">
            <p className="text-yellow-400 text-xs font-mono uppercase tracking-widest">
              UPOZORENJE: Ove komande će se izvršiti na vašem lokalnom Windows računaru. Koristite sa oprezom.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickCommands.map((qc) => (
              <button
                key={qc.cmd}
                onClick={() => executeCommand(qc.cmd)}
                disabled={isExecuting}
                className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[7px] lg:text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap shrink-0 bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 disabled:opacity-50"
              >
                {qc.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <input 
              type="text" 
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Unesi prilagođenu Windows komandu (npr. dir, ping google.com)..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 focus:outline-none focus:border-blue-500 transition-all text-xs lg:text-sm font-mono"
            />
            <button 
              type="submit"
              disabled={isExecuting || !command.trim()}
              className="bg-blue-600 hover:bg-blue-500 px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {isExecuting ? 'Izvršavam...' : 'Izvrši'}
            </button>
          </form>
        </div>

        <div className="flex-1 glass rounded-[20px] lg:rounded-[40px] border-white/5 bg-black/80 p-4 lg:p-6 overflow-hidden flex flex-col relative">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="ml-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Windows_Terminal_Output</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs lg:text-sm text-green-400 whitespace-pre-wrap">
            {output || <span className="text-gray-600 opacity-50">Čekam komandu...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindowsControl;
