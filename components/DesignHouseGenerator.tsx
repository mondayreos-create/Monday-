import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateConsistentStoryScript, generateImage, generateHomeRestorationIdeas, CarIdea, generateYouTubeMetadata, YouTubeMetadata } from '../services/geminiService.ts';
import { useLanguage } from './LanguageContext.tsx';

const Spinner: React.FC<{className?: string}> = ({className = "h-5 w-5 mr-2"}) => (
    <svg className={`animate-spin ${className} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CopyIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const JsonIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SparklesIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L15 12l-2.293-2.293a1 1 0 010-1.414L15 6m0 0l2.293-2.293a1 1 0 011.414 0L21 6m-6 12l2.293 2.293a1 1 0 001.414 0L21 18m-6-6l-2.293 2.293a1 1 0 000 1.414L15 18" />
    </svg>
);

const RefreshIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const HistoryIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const YouTubeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

interface Scene {
    sceneNumber: number;
    action: string;
    consistentContext: string;
    imageUrl?: string;
    isLoadingImage: boolean;
}

const DesignHouseGenerator: React.FC = () => {
    const { t } = useLanguage();
    const [masterPrompt, setMasterPrompt] = useState('Design House (ASMR): Transform an old, dirty, and broken traditional wooden house into a fresh and modern luxury home. ផ្ទះចាស់មក ផុសជុលបាញ់ថ្នាំពណ៍ មកថ្មីឡើង វិញ។ Focus on satisfying high-detail ASMR steps: water pressure cleaning, scraping moss, repairing wood, and final high-gloss spray painting to brand new state.');
    const [sceneCount, setSceneCount] = useState(15);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [houseIdeas, setHouseIdeas] = useState<CarIdea[]>([]);
    const [noVoiceover, setNoVoiceover] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [localHistory, setLocalHistory] = useState<any[]>([]);

    // PERSISTENCE
    useEffect(() => {
        const handleSave = (e: any) => {
            if (e.detail.tool !== 'design-house') return;
            const data = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'design-house',
                category: 'vip',
                title: "House Restoration ASMR",
                data: { masterPrompt, sceneCount, scenes, noVoiceover, youtubeMeta }
            };
            const history = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([data, ...history]));
            loadLocalHistory();
        };
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'design-house') return;
            const d = e.detail.data;
            if (d.masterPrompt) setMasterPrompt(d.masterPrompt);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.scenes) setScenes(d.scenes);
            if (d.noVoiceover !== undefined) setNoVoiceover(d.noVoiceover);
            if (d.youtubeMeta) setYoutubeMeta(d.youtubeMeta);
            setShowHistory(false);
        };
        window.addEventListener('REQUEST_PROJECT_SAVE', handleSave);
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSave);
            window.removeEventListener('LOAD_PROJECT', handleLoad);
        };
    }, [masterPrompt, sceneCount, scenes, noVoiceover, youtubeMeta]);

    useEffect(() => {
        loadLocalHistory();
    }, []);

    const loadLocalHistory = () => {
        const historyRaw = localStorage.getItem('global_project_history');
        if (historyRaw) {
            try {
                const history = JSON.parse(historyRaw);
                const toolHistory = history.filter((p: any) => p.tool === 'design-house');
                setLocalHistory(toolHistory);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleGenerateIdeas = async () => {
        setIsGeneratingIdeas(true);
        setError(null);
        try {
            const ideas = await generateHomeRestorationIdeas(masterPrompt || "Old to New house transformation");
            setHouseIdeas(ideas);
        } catch (err) {
            setError("Failed to generate house ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleUseIdea = (idea: CarIdea) => {
        setMasterPrompt(`House Restoration Concept: ${idea.title}\n\nTransformation Plan: ${idea.description}\n\nFocus on satisfying ASMR restoration: deep cleaning, repairing old structures, and repainting the entire house model to 100% brand new. ផ្ទះចាស់មក ផុសជុលបាញ់ថ្នាំពណ៍ មកថ្មីឡើងវិញ`);
        setHouseIdeas([]);
    };

    const handleGenerateScript = async () => {
        if (!masterPrompt.trim()) {
            setError("Please enter a master prompt.");
            return;
        }
        setIsGeneratingScript(true);
        setError(null);
        setScenes([]);
        setYoutubeMeta(null);

        const voiceInstruction = noVoiceover ? "\n\nSTRICT RULE: Do NOT include any spoken dialogue or narration. Focus purely on environmental ASMR sounds: water spraying, clinking tools, scraping wood, and high-pressure paint spraying." : "";

        try {
            const result = await generateConsistentStoryScript(
                `HOUSE MODEL RESTORATION ASMR PRODUCTION. Context: ${masterPrompt}. Style: 100% Realistic, Professional Architectural Restoration Photography. Show the satisfying progress from absolute ruin to modern house perfection.${voiceInstruction}`,
                sceneCount
            );
            setScenes(result.map(s => ({ ...s, isLoadingImage: false })));
        } catch (err) {
            setError("Failed to generate script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateMetadata = async () => {
        if (scenes.length === 0) return;
        setIsGeneratingMeta(true);
        setError(null);
        try {
            const context = `House Restoration Project: ${masterPrompt}\n\nStoryboard:\n${scenes.map(s => s.action).join('\n')}`;
            const meta = await generateYouTubeMetadata(
                "Ultimate Satisfying House Makeover ASMR",
                context,
                "House Restoration & DIY ASMR"
            );
            setYoutubeMeta(meta);
        } catch (err) {
            setError("Failed to generate metadata.");
        } finally {
            setIsGeneratingMeta(false);
        }
    };

    const handleGenerateImage = async (index: number) => {
        const scene = scenes[index];
        if (!scene) return;

        setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingImage: true } : s));
        try {
            const prompt = `100% Realistic, professional architectural photography of a house renovation, 8k. Action: ${scene.action}. Setting: ${scene.consistentContext}. Detailed textures of old vs new wood, wet fresh paint, cinematic lighting, wide angle. Strictly a house model.`;
            const url = await generateImage(prompt, '16:9');
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: url, isLoadingImage: false } : s));
        } catch (err) {
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingImage: false } : s));
            setError("Image generation failed.");
        }
    };

    const handleDownloadSenses = () => {
        if (scenes.length === 0) return;
        const text = scenes.map(s => `Sense ${s.sceneNumber}: ${s.action}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `House_Restoration_Senses_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadJsonAll = () => {
        if (scenes.length === 0) return;
        const blob = new Blob([JSON.stringify(scenes, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `House_Restoration_Storyboard_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleCopyJson = (index: number) => {
        const scene = scenes[index];
        if (!scene) return;
        const structuredData = {
            sense: scene.sceneNumber,
            action: scene.action,
            voiceover: noVoiceover ? "" : scene.action,
            prompt: `100% Realistic, high-end house architectural photography, 8k. Action: ${scene.action}. Context: ${scene.consistentContext}.`
        };
        navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
        setCopyStatus(`json-${index}`);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleDownloadSingle = (url: string, num: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `HouseMakeover_Sense_${num}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setMasterPrompt('Design House (ASMR): Transform an old, dirty, and broken traditional wooden house into a fresh and modern luxury home. ផ្ទះចាស់មក ផុសជុលបាញ់ថ្នាំពណ៍ មកថ្មីឡើង វិញ។ Focus on satisfying high-detail ASMR steps: water pressure cleaning, scraping moss, repairing wood, and final high-gloss spray painting to brand new state.');
        setScenes([]);
        setHouseIdeas([]);
        setNoVoiceover(false);
        setYoutubeMeta(null);
        setError(null);
        setSceneCount(15);
    };

    const handleReloadHistory = (project: any) => {
        window.dispatchEvent(new CustomEvent('LOAD_PROJECT', { detail: project }));
        setShowHistory(false);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-fade-in">
            {/* Action Bar */}
            <div className="w-full flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            loadLocalHistory();
                            setShowHistory(!showHistory);
                        }} 
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 border ${showHistory ? 'bg-orange-600 border-orange-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                    >
                        <HistoryIcon /> {showHistory ? 'Hide History' : 'Reload History | ប្រវត្តផលិត'}
                    </button>
                </div>
                <button 
                    onClick={handleClear} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200"
                >
                    <RefreshIcon /> Reset Project | សម្អាត
                </button>
            </div>

            {/* History Overlay */}
            {showHistory && (
                <div className="w-full bg-gray-900/90 border-2 border-orange-500/50 p-6 rounded-2xl mb-8 animate-slide-down shadow-2xl relative z-20 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                            <HistoryIcon /> Restoration History Vault
                        </h4>
                        <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        {localHistory.length > 0 ? (
                            localHistory.map((project, idx) => (
                                <div 
                                    key={project.id} 
                                    onClick={() => handleReloadHistory(project)}
                                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded font-black border border-orange-800/50 uppercase">#{localHistory.length - idx}</span>
                                        <span className="text-[9px] text-gray-500 font-bold">{new Date(project.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-white text-xs font-bold truncate mb-1">House Content</p>
                                    <p className="text-gray-400 text-[10px] line-clamp-2 italic">"{project.data.masterPrompt}"</p>
                                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-orange-400 font-black uppercase">Click to Reload ➜</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-10 text-center text-gray-500 font-bold uppercase tracking-widest italic opacity-40">No previous productions found.</div>
                        )}
                    </div>
                </div>
            )}
            
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Inputs */}
                <div className="bg-gray-800/60 p-6 rounded-2xl border border-gray-700 h-fit space-y-6 shadow-xl">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-2 flex items-center gap-2">
                        <span>🏠</span> Design House (ASMR)
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700 pb-4">
                        Restore old structures to brand new state.
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Master Prompt Spins Box</label>
                            <button 
                                onClick={handleGenerateIdeas}
                                disabled={isGeneratingIdeas}
                                className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase flex items-center gap-1"
                            >
                                {isGeneratingIdeas ? <Spinner className="h-3 w-3 m-0"/> : <SparklesIcon className="h-3 w-3"/>}
                                Get Ideas
                            </button>
                        </div>
                        
                        {houseIdeas.length > 0 && (
                            <div className="space-y-2 animate-slide-down bg-black/40 p-3 rounded-xl border border-gray-700 mb-4">
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mb-2">Select a House Project:</h4>
                                {houseIdeas.map((idea, idx) => (
                                    <div key={idx} className="bg-gray-800 p-2 rounded border border-gray-700 group">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-grow">
                                                <div className="text-[10px] font-bold text-white leading-tight mb-1">{idea.title}</div>
                                                <div className="text-[9px] text-gray-500 line-clamp-1 group-hover:line-clamp-none transition-all">{idea.description}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleUseIdea(idea)}
                                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black rounded uppercase shadow"
                                            >
                                                Use
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <textarea 
                            value={masterPrompt}
                            onChange={(e) => setMasterPrompt(e.target.value)}
                            placeholder="Describe the house transformation..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white h-48 resize-none focus:ring-2 focus:ring-red-500 outline-none shadow-inner text-sm leading-relaxed"
                        />
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    checked={noVoiceover} 
                                    onChange={e => setNoVoiceover(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-10 h-5 rounded-full transition-colors ${noVoiceover ? 'bg-emerald-600' : 'bg-gray-700'}`}></div>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${noVoiceover ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-emerald-400 uppercase tracking-tighter">No Voiceover (ASMR Only)</span>
                                <span className="text-[9px] text-gray-500 italic">Purely focus on restoration sounds.</span>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">{t('number_senses')}</label>
                        <input 
                            type="number" min="1" max="100" 
                            value={sceneCount}
                            onChange={(e) => setSceneCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white font-black text-center text-xl focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleGenerateScript} 
                        disabled={isGeneratingScript || !masterPrompt.trim()}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        {isGeneratingScript ? <Spinner /> : '🛠️'} 
                        {isGeneratingScript ? 'Drafting...' : t('get_sense')}
                    </button>
                    
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-center text-xs animate-shake">{error}</div>}
                </div>

                {/* Right Panel: Sense Gallery */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 shadow-xl flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 backdrop-blur gap-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">storyboard ({scenes.length} Senses)</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {scenes.length > 0 && (
                                <>
                                    <button 
                                        onClick={handleDownloadSenses}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition shadow-md"
                                    >
                                        <DownloadIcon /> Download all Senses
                                    </button>
                                    <button 
                                        onClick={handleDownloadJsonAll}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition shadow-md"
                                    >
                                        <JsonIcon /> Download JSON all senses
                                    </button>
                                    <button 
                                        onClick={handleGenerateMetadata}
                                        disabled={isGeneratingMeta}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50"
                                    >
                                        {isGeneratingMeta ? <Spinner className="h-4 w-4 m-0"/> : <YouTubeIcon />} YouTube Info
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {youtubeMeta && (
                        <div className="bg-gray-900/80 p-6 rounded-2xl border border-red-500/30 animate-fade-in space-y-4 shadow-2xl">
                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                <YouTubeIcon />
                                <h4 className="text-sm font-black uppercase tracking-widest">YouTube Distribution Kit</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Title Post Video</label>
                                        <button onClick={() => handleCopy(youtubeMeta.title, 'metaTitle')} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase">{copyStatus === 'metaTitle' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-white text-sm font-bold">{youtubeMeta.title}</div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Description for YouTube</label>
                                        <button onClick={() => handleCopy(youtubeMeta.description, 'metaDesc')} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase">{copyStatus === 'metaDesc' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-gray-300 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar italic">{youtubeMeta.description}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                        {scenes.map((scene, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col group hover:border-emerald-500/50 transition-all duration-300">
                                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                                    {scene.imageUrl ? (
                                        <img src={scene.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={`Sense ${scene.sceneNumber}`} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            {scene.isLoadingImage ? (
                                                <>
                                                    <Spinner className="h-10 w-10 text-emerald-500" />
                                                    <span className="text-[10px] text-gray-500 font-black uppercase animate-pulse">Rendering Realistic Art...</span>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleGenerateImage(idx)}
                                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-full text-[10px] uppercase shadow-lg transition-all"
                                                >
                                                    Render Sense Art
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded font-black border border-gray-700 shadow-md">SENSE {scene.sceneNumber}</div>
                                    {scene.imageUrl && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                            <button 
                                                onClick={() => handleDownloadSingle(scene.imageUrl!, scene.sceneNumber)} 
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition transform hover:scale-110 shadow-xl" 
                                                title="Download Image"
                                            >
                                                <DownloadIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex-grow flex flex-col bg-gradient-to-b from-gray-900 to-black">
                                    <p className="text-gray-300 text-xs leading-relaxed italic border-l-2 border-emerald-500 pl-3 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
                                        "{scene.action}"
                                    </p>
                                    <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-800 pt-3">
                                        <button 
                                            onClick={() => handleCopy(scene.action, `p-${idx}`)} 
                                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition font-black uppercase flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-700"
                                        >
                                            {copyStatus === `p-${idx}` ? '✓ Copied' : <><CopyIcon /> Prompt</>}
                                        </button>
                                        <button 
                                            onClick={() => handleCopyJson(idx)} 
                                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-emerald-400 hover:text-emerald-300 transition font-black uppercase flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-700"
                                        >
                                            {copyStatus === `json-${idx}` ? '✓ Done' : <><JsonIcon /> JSON</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignHouseGenerator;