
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    generateConsistentStoryScript, 
    generateImage, 
    generateRoomCleaningIdeas, 
    CarIdea, 
    generateYouTubeMetadata, 
    YouTubeMetadata 
} from '../services/geminiService.ts';
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
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

const YouTubeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

/* FIX: Defined missing ClearProjectButton component to resolve "Cannot find name 'ClearProjectButton'" error. */
const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="w-full flex justify-end mb-4">
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200"
            aria-label="Clear current project"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Clear Project | សម្អាត
        </button>
    </div>
);

interface Scene {
    sceneNumber: number;
    action: string;
    consistentContext: string;
    imageUrlFirst?: string;
    imageUrlMid?: string;
    imageUrlLast?: string;
    isLoadingFirst: boolean;
    isLoadingMid: boolean;
    isLoadingLast: boolean;
}

const RoomCleaningPro: React.FC = () => {
    const { t } = useLanguage();
    const [masterPrompt, setMasterPrompt] = useState('Room Cleaning (ASMR): A professional cleaning crew of many people arrives at an extremely dirty, abandoned house. សម្អាតបន្ទប់ពីចាស់មកថ្មី។ High-impact transformation where the crew cleans every corner.');
    const [sceneCount, setSceneCount] = useState(10);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [cleaningIdeas, setCleaningIdeas] = useState<CarIdea[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);

    // Persistence logic
    useEffect(() => {
        const handleSave = (e: any) => {
            if (e.detail.tool !== 'room-cleaning-asmr') return;
            const data = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'room-cleaning-asmr',
                category: 'vip',
                title: "Cleaning Crew Production",
                data: { masterPrompt, sceneCount, scenes, youtubeMeta }
            };
            const history = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([data, ...history]));
        };
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'room-cleaning-asmr') return;
            const d = e.detail.data;
            if (d.masterPrompt) setMasterPrompt(d.masterPrompt);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.scenes) setScenes(d.scenes);
            if (d.youtubeMeta) setYoutubeMeta(d.youtubeMeta);
        };
        window.addEventListener('REQUEST_PROJECT_SAVE', handleSave);
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSave);
            window.removeEventListener('LOAD_PROJECT', handleLoad);
        };
    }, [masterPrompt, sceneCount, scenes, youtubeMeta]);

    const handleGenerateIdeas = async () => {
        setIsGeneratingIdeas(true);
        setError(null);
        try {
            const ideas = await generateRoomCleaningIdeas(masterPrompt || "Extreme room deep cleaning with crew");
            setCleaningIdeas(ideas);
        } catch (err) {
            setError("Failed to generate ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleUseIdea = (idea: CarIdea) => {
        setMasterPrompt(`Cleaning Mission: ${idea.title}\n\nTask: ${idea.description}\n\nFocus on the team of many people (ក្រុមការងារ) working together to transform this room from 0% dirty to 100% beautiful.`);
        setCleaningIdeas([]);
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

        try {
            const result = await generateConsistentStoryScript(
                `ROOM CLEANING CREW PRODUCTION. Context: ${masterPrompt}. 
                STYLE: 100% Realistic, Professional Cinematic Photography. 
                STRICT RULE: Every scene must feature a professional CLEANING CREW OF MANY PEOPLE (ក្រុមការងារមានមនុស្សច្រើន). 
                Show the progression from 0% (Dirty/Old) -> 75% (Cleaning/Working) -> 100% (Beautiful/Perfect).`,
                sceneCount
            );
            setScenes(result.map(s => ({ 
                ...s, 
                isLoadingFirst: false, 
                isLoadingMid: false, 
                isLoadingLast: false 
            })));
        } catch (err) {
            setError("Failed to generate senses script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateFrame = async (index: number, type: 'first' | 'mid' | 'last') => {
        const scene = scenes[index];
        if (!scene) return;

        setScenes(prev => prev.map((s, i) => i === index ? { 
            ...s, 
            isLoadingFirst: type === 'first' ? true : s.isLoadingFirst,
            isLoadingMid: type === 'mid' ? true : s.isLoadingMid,
            isLoadingLast: type === 'last' ? true : s.isLoadingLast
        } : s));

        try {
            let stagePrompt = "";
            if (type === 'first') {
                stagePrompt = "FIRST FRAME (0%): The room is extremely old, filthy, and messy. A team of several cleaning crew members in professional uniforms are standing in the middle of the mess, looking at the camera, ready to start. There is trash and dust everywhere.";
            } else if (type === 'mid') {
                stagePrompt = "MID FRAME (75%): The same cleaning crew is actively working. Some are scrubbing the walls, others are organizing. The room is 75% clean, surfaces are starting to shine, but some cleaning buckets and tools are still visible.";
            } else {
                stagePrompt = "LAST FRAME (100%): The room is now 100% beautiful, modern, and luxury. The same cleaning crew is standing proudly in the sparkling clean room, smiling at the camera. The result is perfect and organized.";
            }

            const prompt = `100% Realistic, professional interior photography, 8k. Action context: ${scene.action}. Stage: ${stagePrompt}. Environment: ${scene.consistentContext}. High-end lighting, wide lens, 100% character consistency.`;
            const url = await generateImage(prompt, '16:9');
            
            setScenes(prev => prev.map((s, i) => i === index ? { 
                ...s, 
                imageUrlFirst: type === 'first' ? url : s.imageUrlFirst,
                imageUrlMid: type === 'mid' ? url : s.imageUrlMid,
                imageUrlLast: type === 'last' ? url : s.imageUrlLast,
                isLoadingFirst: type === 'first' ? false : s.isLoadingFirst,
                isLoadingMid: type === 'mid' ? false : s.isLoadingMid,
                isLoadingLast: type === 'last' ? false : s.isLoadingLast
            } : s));
        } catch (err) {
            setScenes(prev => prev.map((s, i) => i === index ? { 
                ...s, 
                isLoadingFirst: false, 
                isLoadingMid: false, 
                isLoadingLast: false 
            } : s));
            setError("Frame generation failed.");
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleDownloadSenses = () => {
        if (scenes.length === 0) return;
        const text = scenes.map(s => `Sense ${s.sceneNumber}: ${s.action}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cleaning_Crew_Senses_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadJson = () => {
        if (scenes.length === 0) return;
        const blob = new Blob([JSON.stringify(scenes, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cleaning_Crew_Storyboard_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateMetadata = async () => {
        if (scenes.length === 0) return;
        setIsGeneratingMeta(true);
        setError(null);
        try {
            const context = `Deep Cleaning Project: ${masterPrompt}\n\nProduction Senses:\n${scenes.map(s => s.action).join('\n')}`;
            const meta = await generateYouTubeMetadata(
                "Extreme Deep Cleaning ASMR | Satisfying Room Transformation with Crew",
                context,
                "Cleaning & Restoration ASMR"
            );
            setYoutubeMeta(meta);
        } catch (err) {
            setError("Failed to generate metadata.");
        } finally {
            setIsGeneratingMeta(false);
        }
    };

    const handleDownload = (url: string, num: number, slot: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cleaning_Crew_Sense_${num}_${slot}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setMasterPrompt('Room Cleaning (ASMR): A professional cleaning crew of many people arrives at an extremely dirty, abandoned house. សម្អាតបន្ទប់ពីចាស់មកថ្មី។ High-impact transformation where the crew cleans every corner.');
        setScenes([]);
        setCleaningIdeas([]);
        setYoutubeMeta(null);
        setError(null);
        setSceneCount(10);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-fade-in">
            <ClearProjectButton onClick={handleClear} />
            
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Inputs */}
                <div className="bg-[#1e293b]/80 p-6 rounded-2xl border border-gray-700 h-fit space-y-6 shadow-xl backdrop-blur-sm">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2 flex items-center gap-2">
                        <span>🧼</span> សំអាតបន្ទប់ (PRO)
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700 pb-4">
                        Cleaning Crew Workflow (0% -> 75% -> 100%).
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">{t('spins_box')}</label>
                            <button 
                                onClick={handleGenerateIdeas}
                                disabled={isGeneratingIdeas}
                                className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase flex items-center gap-1"
                            >
                                {isGeneratingIdeas ? <Spinner className="h-3 w-3 m-0"/> : <SparklesIcon className="h-3 w-3"/>}
                                Get Ideas
                            </button>
                        </div>
                        
                        {cleaningIdeas.length > 0 && (
                            <div className="space-y-2 animate-slide-down bg-black/40 p-3 rounded-xl border border-gray-700 mb-4">
                                <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-tighter mb-2">Select a Scenario:</h4>
                                {cleaningIdeas.map((idea, idx) => (
                                    <div key={idx} className="bg-gray-800 p-2 rounded border border-gray-700 group">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-grow">
                                                <div className="text-[10px] font-bold text-white leading-tight mb-1">{idea.title}</div>
                                                <div className="text-[9px] text-gray-500 line-clamp-1 group-hover:line-clamp-none transition-all">{idea.description}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleUseIdea(idea)}
                                                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black rounded uppercase shadow"
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
                            placeholder="Describe the room and cleaning goals..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white h-48 resize-none focus:ring-2 focus:ring-cyan-500 outline-none shadow-inner text-sm leading-relaxed"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">{t('number_senses')}</label>
                        <input 
                            type="number" min="1" max="100" 
                            value={sceneCount}
                            onChange={(e) => setSceneCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white font-black text-center text-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleGenerateScript} 
                        disabled={isGeneratingScript || !masterPrompt.trim()}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        {isGeneratingScript ? <Spinner /> : '🚀'} 
                        {isGeneratingScript ? 'Architecting...' : t('get_sense')}
                    </button>
                    
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-center text-xs animate-shake">{error}</div>}
                </div>

                {/* Right Panel: Sense Gallery */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1e293b]/80 p-5 rounded-2xl border border-gray-700 shadow-xl flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 backdrop-blur-md gap-4">
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
                                        onClick={handleDownloadJson}
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
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">title post Video</label>
                                        <button onClick={() => handleCopy(youtubeMeta.title, 'metaTitle')} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase">{copyStatus === 'metaTitle' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-white text-sm font-bold">{youtubeMeta.title}</div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Description for youtube</label>
                                        <button onClick={() => handleCopy(youtubeMeta.description, 'metaDesc')} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase">{copyStatus === 'metaDesc' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-gray-300 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar italic">{youtubeMeta.description}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                        {scenes.map((scene, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col group hover:border-cyan-500/50 transition-all duration-300">
                                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-cyan-900/30 text-cyan-400 font-black flex items-center justify-center border border-cyan-500/30 text-xs shadow-inner">{scene.sceneNumber}</span>
                                        <p className="text-gray-300 text-xs italic line-clamp-1">"{scene.action}"</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleCopy(scene.action, `p-${idx}`)} className="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-1 rounded-full transition border border-gray-700 font-black uppercase">{copyStatus === `p-${idx}` ? '✓ Copied' : t('copy_prompt')}</button>
                                        <button onClick={() => {
                                            const structuredData = {
                                                sense: scene.sceneNumber,
                                                action: scene.action,
                                                frames: ["0%", "75%", "100%"]
                                            };
                                            handleCopy(JSON.stringify(structuredData, null, 2), `json-${idx}`);
                                        }} className="text-[9px] bg-gray-800 hover:bg-gray-700 text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-full transition border border-gray-700 font-black uppercase">{copyStatus === `json-${idx}` ? '✓ Done' : t('copy_json')}</button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-gray-800 bg-black p-1">
                                    {/* First Frame (0%) */}
                                    <div className="aspect-video bg-gray-900 relative flex items-center justify-center border border-gray-800 rounded-xl overflow-hidden group/frame">
                                        {scene.imageUrlFirst ? (
                                            <img src={scene.imageUrlFirst} className="w-full h-full object-cover" alt="First" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-center p-2">
                                                {scene.isLoadingFirst ? <Spinner className="h-6 w-6 text-red-500" /> : <button onClick={() => handleGenerateFrame(idx, 'first')} className="px-3 py-1 bg-gray-800 text-[10px] text-gray-400 hover:text-white rounded uppercase font-bold">First Frame (0%)</button>}
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-red-600/70 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-black backdrop-blur-md border border-red-500/50">Dirty 0%</div>
                                        {scene.imageUrlFirst && (
                                            <button onClick={() => handleDownload(scene.imageUrlFirst!, scene.sceneNumber, 'First')} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover/frame:opacity-100 transition hover:bg-cyan-600 shadow-xl"><DownloadIcon className="h-3 w-3" /></button>
                                        )}
                                    </div>
                                    
                                    {/* Mid Frame (75%) */}
                                    <div className="aspect-video bg-gray-900 relative flex items-center justify-center border border-gray-800 rounded-xl overflow-hidden group/frame">
                                        {scene.imageUrlMid ? (
                                            <img src={scene.imageUrlMid} className="w-full h-full object-cover" alt="Mid" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-center p-2">
                                                {scene.isLoadingMid ? <Spinner className="h-6 w-6 text-yellow-500" /> : <button onClick={() => handleGenerateFrame(idx, 'mid')} className="px-3 py-1 bg-gray-800 text-[10px] text-gray-400 hover:text-white rounded uppercase font-bold">Mid Frame (75%)</button>}
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-yellow-600/70 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-black backdrop-blur-md border border-yellow-500/50">Cleaning 75%</div>
                                        {scene.imageUrlMid && (
                                            <button onClick={() => handleDownload(scene.imageUrlMid!, scene.sceneNumber, 'Mid')} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover/frame:opacity-100 transition hover:bg-cyan-600 shadow-xl"><DownloadIcon className="h-3 w-3" /></button>
                                        )}
                                    </div>
                                    
                                    {/* Last Frame (100%) */}
                                    <div className="aspect-video bg-gray-900 relative flex items-center justify-center border border-gray-800 rounded-xl overflow-hidden group/frame">
                                        {scene.imageUrlLast ? (
                                            <img src={scene.imageUrlLast} className="w-full h-full object-cover" alt="Last" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-center p-2">
                                                {scene.isLoadingLast ? <Spinner className="h-6 w-6 text-emerald-500" /> : <button onClick={() => handleGenerateFrame(idx, 'last')} className="px-3 py-1 bg-gray-800 text-[10px] text-gray-400 hover:text-white rounded uppercase font-bold">Last Frame (100%)</button>}
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-emerald-600/70 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-black backdrop-blur-md border border-emerald-500/50">Organized 100%</div>
                                        {scene.imageUrlLast && (
                                            <button onClick={() => handleDownload(scene.imageUrlLast!, scene.sceneNumber, 'Last')} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover/frame:opacity-100 transition hover:bg-cyan-600 shadow-xl"><DownloadIcon className="h-3 w-3" /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {scenes.length === 0 && !isGeneratingScript && (
                            <div className="col-span-full py-20 text-center bg-gray-900/20 rounded-[3rem] border-4 border-dashed border-gray-800 flex flex-col items-center justify-center">
                                 <div className="text-8xl mb-4 opacity-10">🧹</div>
                                 <p className="text-xl font-black text-gray-600 uppercase tracking-[0.4em]">Production Floor Ready</p>
                                 <p className="text-sm text-gray-700 mt-4 max-w-md">Choose a theme or describe your room transformation and click "Get Sense Script" to begin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomCleaningPro;
