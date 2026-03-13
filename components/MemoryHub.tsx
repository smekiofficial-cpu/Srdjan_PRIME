import React, { useState, useEffect } from 'react';
import { memoryService } from '../services/memoryService';
import { MemoryEntry, SearchResult, TerminalLog } from '../types';

interface MemoryHubProps {
  onThinkingChange?: (t: boolean) => void;
  addLog?: (message: string, type: TerminalLog['type']) => void;
}

const MemoryHub: React.FC<MemoryHubProps> = ({ onThinkingChange, addLog }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allMemories, setAllMemories] = useState<MemoryEntry[]>([]);

  const loadAllMemories = async () => {
    // We don't have a getAll in memoryService yet, let's add it or just use search with empty query if we want
    // For now, let's just show search results
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    onThinkingChange?.(true);
    try {
      const searchResults = await memoryService.search(query, 10);
      setResults(searchResults);
      addLog?.(`MEMORIJA: Pronađeno ${searchResults.length} relevantnih sećanja.`, 'success');
    } catch (err) {
      addLog?.('MEMORIJA_ERR: Neuspešna pretraga neuralnih zapisa.', 'error');
    } finally {
      setIsSearching(false);
      onThinkingChange?.(false);
    }
  };

  const clearMemory = async () => {
    if (confirm('Da li ste sigurni da želite da obrišete svu memoriju SRDJANA?')) {
      await memoryService.clearAll();
      setResults([]);
      addLog?.('MEMORIJA: Svi neuralni zapisi su obrisani.', 'warning');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full gap-4 lg:gap-6 p-4 lg:p-6 overflow-hidden font-sans">
      <div className="h-12 lg:h-16 glass rounded-2xl lg:rounded-3xl flex items-center justify-between px-4 lg:px-8 border-white/5 shrink-0 bg-black/40">
        <div className="flex flex-col">
          <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] text-cyan-500 italic">Neuralni_Arhiv</span>
          <span className="text-white text-[10px] lg:text-xs font-black tracking-widest uppercase">#DUGOTRAJNA_MEMORIJA</span>
        </div>
        <button 
          onClick={clearMemory}
          className="px-3 lg:px-5 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-[7px] lg:text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
        >
          Formatiraj Arhiv
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
        <div className="glass rounded-[20px] lg:rounded-[40px] p-4 lg:p-8 border-white/5 bg-black/40 space-y-4 lg:space-y-6 flex flex-col h-full">
          <div className="relative shrink-0">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Pretraži neuralne zapise..."
              className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-4 lg:px-8 py-4 lg:py-6 text-sm lg:text-lg text-gray-200 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-gray-600"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 px-4 lg:px-8 py-2 lg:py-4 bg-cyan-600 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-500 transition-all disabled:opacity-50"
            >
              {isSearching ? 'Analiziram...' : 'Pretraži'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 overflow-y-auto flex-1 custom-scrollbar pr-1 lg:pr-2">
            {results.length > 0 ? (
              results.map((res, i) => (
                <div key={res.entry.id} className="glass rounded-3xl p-6 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">
                      Relevantnost: {Math.round(res.similarity * 100)}%
                    </span>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                      {new Date(res.entry.metadata.timestamp).toLocaleString('sr-RS')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed italic">
                    "{res.entry.text.length > 200 ? res.entry.text.substring(0, 200) + '...' : res.entry.text}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                    <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[8px] font-black uppercase">
                      {res.entry.metadata.type}
                    </span>
                    {res.entry.metadata.context && (
                      <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-[8px] font-black uppercase">
                        {res.entry.metadata.context}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="text-gray-600 text-xs font-black uppercase tracking-[0.5em] mb-2">Nema_Rezultata</div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest">Unesite upit za pretragu neuralnih zapisa SRDJANA.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryHub;
