import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    generateConsistentStoryScript, 
    generateImage, 
    generateYouTubeMetadata, 
    YouTubeMetadata 
} from '../services/geminiService.ts';
import { useLanguage } from './LanguageContext.tsx';
import { GoogleGenAI, Type } from "@google/genai";

const Spinner: React.FC<{className?: string}> = ({className = "h-5 w-5 mr-2"}) => (
    <svg className={`animate-spin ${className} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const LightningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
);

const constructionSpins = [
    { label: "Fast x2 (0% to 100%)", count: 12, icon: "⚡", prompt: "Fast Action x2: 0% dirty to 100% luxury new room. (ធ្វើលឿនៗ x2). A professional team moves at high speed. Same camera position. Satisfying cleaning and repair ASMR." },
    { label: "Pool Remodel", count: 12, icon: "🏊", prompt: "Luxury Pool Renovation: From broken concrete hole to crystal blue paradise. Tiling, lighting, and waterfall installation. Same location lock." },
    { label: "Kitchen Flip", count: 10, icon: "🍳", prompt: "Fast x2 Kitchen Flip: Old messy cabinets to modern marble kitchen. Professional team working at 2x speed, camera locked in one position." }
];

interface Scene {
    sceneNumber: number;
    action: string;
    consistentContext: string;
    imageUrl?: string;
    isLoadingImage: boolean;
}

const ConstructionBuildingGenerator: React.FC = () => {
    const { t } = useLanguage();
    const [masterPrompt, setMasterPrompt] = useState(constructionSpins[0].prompt);
    const [sceneCount, setSceneCount] = useState(12);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [noVoiceover, setNoVoiceover] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);

    // Persistence
    useEffect(() => {
        const handleSave = (e: any) => {
            if (e.detail.tool !== 'construction-building') return;
            const data = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'construction-building',
                category: 'vip',
                title: "Production Hub Project",
                data: { masterPrompt, sceneCount, scenes, noVoiceover }
            };
            const history = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([data, ...history]));
        };
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'construction-building') return;
            const d = e.detail.data;
            if (d.masterPrompt) setMasterPrompt(d.masterPrompt);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.scenes) setScenes(d.scenes);
            if (d.noVoiceover !== undefined) setNoVoiceover(d.noVoiceover);
        };
        window.addEventListener('REQUEST_PROJECT_SAVE', handleSave);
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSave);
            window.removeEventListener('LOAD_PROJECT', handleLoad);
        };
    }, [masterPrompt, sceneCount, scenes, noVoiceover]);

    const handleGenerateScript = async () => {
        if (!masterPrompt.trim()) {
            setError("Please enter a construction concept.");
            return;
        }
        setIsGeneratingScript(true);
        setError(null);
        setScenes([]);

        const coreDirective = `
        STRICT PRODUCTION RULES:
        1. LOCATION LOCK: The camera must remain in the EXACT SAME POSITION for every scene.
        2. FAST ACTION x2: The workers must move at high speed, high energy, time-lapse style.
        3. TRANSFORMATION: Clear path from 0% (Worn/Dirty/Old) to 100% (Refreshed/New/Luxury).
        4. SUBJECT: Skilled professional team repairing and renovating.
        `;

        const voiceInstruction = noVoiceover ? "\nSTRICT RULE: No voiceover. Focus on satisfying industrial/mechanical ASMR sounds." : "";

        try {
            const result = await generateConsistentStoryScript(
                `PRODUCTION HUB SCRIPT. Context: ${masterPrompt}. Style: 100% Realistic, Professional Cinematic Industrial Photography. ${coreDirective}${voiceInstruction}`,
                sceneCount
            );
            setScenes(result.map(s => ({ ...s, isLoadingImage: false })));
        } catch (err) {
            setError("Failed to generate script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateImage = async (index: number) => {
        const scene = scenes[index];
        if (!scene) return;

        setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingImage: true } : s));
        try {
            const prompt = `100% Realistic, professional industrial photography, 8k. Action: ${scene.action}. Environment: ${scene.consistentContext}. Detailed textures, dust, materials, cinematic industrial lighting, sharp focus. No text. 100% camera position consistency. 99% similarity to previous stages. High speed motion blur on workers.`;
            const url = await generateImage(prompt, '16:9');
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: url, isLoadingImage: false } : s));
        } catch (err) {
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingImage: false } : s));
            setError("Image generation failed.");
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleCopyAllSenses = () => {
        if (scenes.length === 0) return;
        const text = scenes.map(s => `Sense ${s.sceneNumber}:\n${s.consistentContext}`).join('\n\n');
        handleCopy(text, 'all-senses-bulk');
    };

    const handleCopyAllJSON = () => {
        if (scenes.length === 0) return;
        const data = scenes.map(s => ({
            id: s.sceneNumber,
            video_prompt: s.consistentContext
        }));
        handleCopy(JSON.stringify(data, null, 2), 'all-json-bulk');
    };

    // FIX: Implemented handleDownloadSingle function to fix "Cannot find name 'handleDownloadSingle'" error.
    const handleDownloadSingle = (url: string, num: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Construction_Sense_${num}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // FIX: Implemented handleCopyJson function to fix "Cannot find name 'handleCopyJson'" error.
    const handleCopyJson = (index: number) => {
        const scene = scenes[index];
        if (!scene) return;
        const structuredData = {
            scene: scene.sceneNumber,
            action: scene.action,
            voiceover: noVoiceover ? "" : scene.action,
            prompt: scene.consistentContext
        };
        navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
        setCopyStatus(`json-${index}`);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-fade-in font-sans pb-24">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Panel: Inputs */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#1e293b]/90 p-6 rounded-[2.5rem] border border-gray-700 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform rotate-2">
                                <span className="text-2xl">🏗️</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase tracking-tighter leading-none">
                                    Architect X
                                </h2>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">High-Speed Construction</p>
                            </div>
                        </div>

                        {/* Presets */}
                        <div className="p-4 bg-black/40 rounded-2xl border border-gray-800 mb-6 shadow-inner">
                            <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Fast Activity Presets</label>
                            <div className="grid grid-cols-1 gap-2">
                                {constructionSpins.map((opt) => (
                                    <button 
                                        key={opt.label}
                                        onClick={() => { setMasterPrompt(opt.prompt); setSceneCount(opt.count); setScenes([]); }}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-3 border shadow-sm ${masterPrompt === opt.prompt ? 'bg-blue-900/40 border-blue-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-blue-500 hover:text-gray-300'}`}
                                    >
                                        <span className="text-lg">{opt.icon}</span> 
                                        <span className="truncate">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-[#0f172a] rounded-2xl border border-gray-700 shadow-inner relative group">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Setup by me paste (Full Prompts)</label>
                                <textarea 
                                    value={masterPrompt}
                                    onChange={(e) => setMasterPrompt(e.target.value)}
                                    placeholder="Paste full prompts for detail..."
                                    className="w-full bg-transparent border-none text-white h-48 resize-none text-xs focus:ring-0 outline-none placeholder-gray-800 leading-relaxed custom-scrollbar"
                                />
                            </div>

                            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={noVoiceover} 
                                        onChange={e => setNoVoiceover(e.target.checked)}
                                        className="w-5 h-5 appearance-none border border-gray-700 rounded bg-black checked:bg-blue-600 transition-all cursor-pointer relative"
                                    />
                                    {noVoiceover && <span className="absolute ml-1.5 text-[10px] pointer-events-none">✓</span>}
                                    <span className="text-xs font-bold text-gray-300">Lock ASMR (No Voiceover)</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-2">Number of Senses (Steps)</label>
                                <input 
                                    type="number" 
                                    min="1" max="100" 
                                    value={sceneCount}
                                    onChange={e => setSceneCount(parseInt(e.target.value) || 1)}
                                    className="w-full bg-[#0f172a] border border-gray-800 rounded-2xl p-4 text-white font-black text-center text-xl focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <button 
                                onClick={handleGenerateScript} 
                                disabled={isGeneratingScript || !masterPrompt}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-3xl shadow-2xl transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm border-t border-white/20"
                            >
                                {isGeneratingScript ? <Spinner className="h-6 w-6" /> : <span className="text-xl">🚀</span>} 
                                {isGeneratingScript ? 'Architecting...' : 'Build Production Hub'}
                            </button>
                        </div>
                    </div>
                    {error && <div className="p-3 bg-red-900/20 border border-red-700 text-red-300 rounded-2xl text-center text-sm font-bold animate-shake">{error}</div>}
                </div>

                {/* Right Panel: Production Hub Display */}
                <div className="lg:col-span-8 flex flex-col h-full min-h-[700px]">
                    <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-gray-800 shadow-2xl flex flex-col h-full relative overflow-hidden">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-6">
                            <div>
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter">PRODUCTION HUB</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.15em] flex items-center gap-2 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                        CAMERA LOCKED 🔒 (រក្សានៅទីតាំងដដែល)
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap items-center">
                                {scenes.length > 0 && (
                                    <>
                                        <button onClick={handleCopyAllSenses} className="px-5 py-2.5 bg-[#1e293b] text-white rounded-xl border border-gray-700 text-[11px] font-black uppercase hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg">
                                            <CopyIcon /> COPY ALL SENSES
                                        </button>
                                        <button onClick={handleCopyAllJSON} className="px-5 py-2.5 bg-[#1e293b] text-white rounded-xl border border-gray-700 text-[11px] font-black uppercase hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg">
                                            <span className="text-blue-400 font-mono">{"</>"}</span> COPY ALL JSON CODE
                                        </button>
                                        <button onClick={handleGenerateScript} className="px-6 py-2.5 bg-[#ef4444] text-white rounded-xl text-[11px] font-black uppercase shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
                                            <span className="text-lg">▶️</span> Update Info
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-8 relative z-10 pb-20">
                            {scenes.length > 0 ? (
                                scenes.map((scene, idx) => (
                                    <div key={idx} className="bg-[#1e293b]/40 rounded-[2.5rem] border border-gray-800 p-8 group hover:border-cyan-500/30 transition-all duration-500 shadow-xl">
                                        <div className="flex flex-col xl:flex-row gap-10">
                                            {/* Visual Frame */}
                                            <div className="w-full xl:w-80 aspect-video xl:aspect-square bg-black rounded-[2rem] overflow-hidden relative border border-gray-700 shrink-0 flex items-center justify-center shadow-2xl">
                                                {scene.imageUrl ? (
                                                    <img src={scene.imageUrl} className="w-full h-full object-cover" alt="Production Scene" />
                                                ) : (
                                                    <div className="text-center p-6">
                                                        {scene.isLoadingImage ? (
                                                            <div className="flex flex-col items-center gap-3">
                                                                <Spinner className="h-10 w-10 text-blue-500 m-0" />
                                                                <span className="text-[10px] font-black text-blue-400 uppercase animate-pulse">Rendering...</span>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleGenerateImage(idx)}
                                                                className="flex flex-col items-center gap-3 text-gray-700 hover:text-cyan-400 transition transform hover:scale-110"
                                                            >
                                                                <span className="text-4xl">🖼️</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Generate Art</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4 bg-cyan-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl uppercase tracking-tighter border border-white/20">SENSE {scene.sceneNumber}</div>
                                                {scene.imageUrl && (
                                                    <button onClick={() => handleDownloadSingle(scene.imageUrl!, scene.sceneNumber)} className="absolute bottom-4 right-4 p-2.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-cyan-600 shadow-xl border border-white/10">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Meta & Context */}
                                            <div className="flex-grow flex flex-col justify-between py-2">
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">FAST X2 ACTION</span>
                                                            <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                                                                <div className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" style={{ width: `${Math.round((scene.sceneNumber / scenes.length) * 100)}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-cyan-400">{Math.round((scene.sceneNumber / scenes.length) * 100)}%</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleCopy(scene.action, `p-${idx}`)}
                                                            className={`p-3 rounded-xl bg-[#0f172a] border border-gray-800 transition shadow-lg ${copyStatus === `p-${idx}` ? 'text-green-500' : 'text-gray-500 hover:text-white hover:border-gray-600'}`}
                                                        >
                                                            {copyStatus === `p-${idx}` ? '✓' : <CopyIcon />}
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <span className="absolute -top-6 left-0 text-3xl text-gray-800 font-serif">"</span>
                                                        <p className="text-gray-200 text-xl font-medium leading-relaxed font-serif italic">
                                                            {scene.action}
                                                        </p>
                                                        <span className="absolute -bottom-6 right-0 text-3xl text-gray-800 font-serif">"</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-12 flex flex-wrap justify-between items-center pt-6 border-t border-gray-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <LightningIcon />
                                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">99% SIMILARITY MODE</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleCopyJson(idx)}
                                                        className="text-[11px] font-black text-cyan-400 hover:text-cyan-200 transition-colors uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        {copyStatus === `json-${idx}` ? '✓ DATA EXTRACTED' : 'JSON DATA'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-800 opacity-20 select-none py-32">
                                    <span className="text-[12rem] mb-8">🏗️</span>
                                    <p className="text-3xl font-black uppercase tracking-[0.5em]">Blueprint Loading</p>
                                    <p className="text-xs mt-4 font-bold tracking-widest uppercase text-gray-600">Enter your master idea on the left to activate production</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConstructionBuildingGenerator;