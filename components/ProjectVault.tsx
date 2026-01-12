import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from './LanguageContext.tsx';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CloudIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const LoadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    </svg>
);

const ProjectVault: React.FC = () => {
  const { t } = useLanguage();
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  const loadHistory = () => {
    const raw = localStorage.getItem('global_project_history');
    if (raw) {
      try {
        setHistory(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadHistory();
    window.addEventListener('HISTORY_UPDATED', loadHistory);
    return () => window.removeEventListener('HISTORY_UPDATED', loadHistory);
  }, []);

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("តើអ្នកប្រាកដជាចង់លុបគម្រោងនេះមែនទេ? (Are you sure you want to delete this project?)")) return;
    const updated = history.filter(p => p.id !== id);
    localStorage.setItem('global_project_history', JSON.stringify(updated));
    setHistory(updated);
    window.dispatchEvent(new Event('HISTORY_UPDATED'));
  };

  const handleDeleteAll = () => {
    if (history.length === 0) return;
    if (!window.confirm("តើអ្នកប្រាកដជាចង់លុបប្រវត្តិការងារទាំងអស់មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ។ (Are you sure you want to delete ALL history? This action cannot be undone.)")) return;
    
    localStorage.setItem('global_project_history', JSON.stringify([]));
    setHistory([]);
    window.dispatchEvent(new Event('HISTORY_UPDATED'));
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STUDIO_PRO_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = JSON.parse(evt.target?.result as string);
            if (Array.isArray(data)) {
                const existing = JSON.parse(localStorage.getItem('global_project_history') || '[]');
                const combined = [...data, ...existing].reduce((acc: any[], current: any) => {
                    const x = acc.find(item => item.id === current.id);
                    if (!x) return acc.concat([current]);
                    else return acc;
                }, []);
                localStorage.setItem('global_project_history', JSON.stringify(combined));
                setHistory(combined);
                window.dispatchEvent(new Event('HISTORY_UPDATED'));
            }
        } catch (err) {
            alert("Invalid backup file.");
        }
    };
    reader.readAsText(file);
  };

  const handleLoadProject = (project: any) => {
    setLoadingProjectId(project.id);
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('LOAD_PROJECT', { detail: project }));
        setLoadingProjectId(null);
    }, 500);
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history;
    return history.filter(p => 
        (p.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (p.tool?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, any[]> = {
        'Today': [],
        'Yesterday': [],
        'Older': []
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - (24 * 60 * 60 * 1000);

    filteredHistory.forEach(project => {
        const time = project.timestamp || Date.now();
        if (time >= today) groups['Today'].push(project);
        else if (time >= yesterday) groups['Yesterday'].push(project);
        else groups['Older'].push(project);
    });

    return groups;
  }, [filteredHistory]);

  const totalProjects = history.length;
  const storageSize = Math.round((JSON.stringify(history).length / 1024 / 1024) * 100) / 100;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in pb-20">
      
      {/* Premium Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-[2rem] border border-cyan-500/20 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-3xl mb-2">📊</span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Projects</span>
              <span className="text-4xl font-black text-white mt-1">{totalProjects}</span>
          </div>
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-[2rem] border border-purple-500/20 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-3xl mb-2">💾</span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vault Storage</span>
              <span className="text-4xl font-black text-white mt-1">{storageSize} <span className="text-sm">MB</span></span>
          </div>
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-[2rem] border border-pink-500/20 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-3xl mb-2">🛡️</span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Safety Status</span>
              <span className="text-xl font-black text-emerald-400 mt-1 uppercase tracking-tighter">Auto-Backup ON</span>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                  <SearchIcon />
              </div>
              <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your work... | ស្វែងរកការងារ"
                  className="w-full bg-[#0f172a] border-2 border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-gray-600 font-bold text-sm shadow-inner"
              />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto flex-wrap justify-center">
              <button 
                onClick={handleExportBackup}
                className="px-6 py-3.5 bg-[#1e293b] hover:bg-gray-800 text-gray-300 hover:text-white font-black rounded-2xl border-2 border-gray-700 transition-all flex items-center justify-center gap-3 shadow-xl uppercase tracking-tighter text-xs active:scale-95"
              >
                  <ExportIcon /> EXPORT
              </button>
              <label className="px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:brightness-110 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer uppercase tracking-tighter text-xs transform hover:scale-105 active:scale-95 border-2 border-blue-400/20">
                  <CloudIcon /> IMPORT
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
              <button 
                onClick={handleDeleteAll}
                disabled={history.length === 0}
                className="px-6 py-3.5 bg-red-950/20 hover:bg-red-600 text-red-500 hover:text-white font-black rounded-2xl border-2 border-red-900/50 transition-all flex items-center justify-center gap-3 shadow-xl uppercase tracking-tighter text-xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                  <TrashIcon /> DELETE ALL
              </button>
          </div>
      </div>

      <div className="space-y-12">
          {(Object.entries(groupedHistory) as [string, any[]][]).map(([groupName, projects]) => {
              if (projects.length === 0) return null;
              return (
                  <div key={groupName} className="animate-fade-in">
                      <div className="flex items-center gap-4 mb-6">
                          <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] whitespace-nowrap">{groupName}</h3>
                          <div className="h-px bg-gray-800 w-full"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {projects.map((project) => {
                              const daysOld = Math.floor((Date.now() - (project.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                              const daysRemaining = Math.max(0, 30 - daysOld);
                              const isLoading = loadingProjectId === project.id;
                              
                              return (
                                  <div 
                                    key={project.id} 
                                    className={`bg-[#1e293b]/60 p-6 rounded-[2rem] border-2 transition-all duration-500 flex justify-between items-center group cursor-pointer relative overflow-hidden ${isLoading ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] scale-[1.02]' : 'border-gray-800 hover:border-cyan-500/50 hover:bg-[#1e293b]/80 shadow-2xl'}`}
                                    onClick={() => handleLoadProject(project)}
                                  >
                                      {isLoading && (
                                          <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                              <div className="flex flex-col items-center">
                                                  <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                                  <span className="text-[10px] font-black text-cyan-400 mt-2 uppercase tracking-widest">Restoring...</span>
                                              </div>
                                          </div>
                                      )}
                                      
                                      <div className="flex items-center gap-5 overflow-hidden">
                                          <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 border-2 border-gray-800 shadow-inner">
                                              {project.tool?.includes('video') ? '🎬' : (project.tool?.includes('image') || project.tool === 'generate') ? '🎨' : '📄'}
                                          </div>
                                          <div className="overflow-hidden">
                                              <p className="text-white font-black text-sm truncate uppercase tracking-tight mb-1">{project.title || "Untitled Project"}</p>
                                              <div className="flex items-center gap-2">
                                                  <span className="text-[9px] bg-cyan-900/40 text-cyan-400 font-black px-2.5 py-1 rounded-full border border-cyan-800 uppercase tracking-tighter">
                                                      {project.tool?.replace(/-/g, ' ')}
                                                  </span>
                                                  <span className="text-[10px] text-gray-600 font-bold">{new Date(project.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 shrink-0">
                                           <div className="text-right hidden sm:block">
                                              <p className={`text-[10px] font-black uppercase tracking-tighter ${daysRemaining < 5 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                                                  Expires {daysRemaining}d
                                              </p>
                                          </div>
                                          <div className="flex gap-2">
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handleLoadProject(project); }}
                                                className="p-3 bg-cyan-900/20 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-2xl transition-all border border-cyan-800/50 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                                                title="Load into Studio"
                                              >
                                                  <LoadIcon />
                                              </button>
                                              <button 
                                                onClick={(e) => handleDeleteProject(project.id, e)}
                                                className="p-3 bg-red-900/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all border border-red-900/20 group-hover:scale-105 active:scale-95"
                                                title="Delete permanently"
                                              >
                                                  <TrashIcon />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              );
          })}
          
          {history.length === 0 && (
              <div className="py-32 text-center bg-gray-900/30 rounded-[3rem] border-4 border-dashed border-gray-800/50 animate-pulse">
                   <span className="text-8xl mb-8 block opacity-10">📂</span>
                   <p className="text-lg font-black text-gray-600 uppercase tracking-[0.4em]">Vault is empty | ធុងផ្ទុកទំនេរ</p>
                   <p className="text-xs text-gray-700 mt-4 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">Your creative work is automatically saved here when you generate content.</p>
              </div>
          )}

          {history.length > 0 && filteredHistory.length === 0 && (
              <div className="py-20 text-center text-gray-500">
                  <p className="text-sm font-bold uppercase tracking-widest">No results found for "{searchQuery}"</p>
              </div>
          )}
      </div>
      
      <div className="mt-20 text-center">
        <p className="text-[10px] text-gray-700 uppercase tracking-[0.5em] font-black opacity-30">
            SECURE MEDIA VAULT PIPELINE • 2026
        </p>
      </div>
    </div>
  );
};

export default ProjectVault;
