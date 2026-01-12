
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    generateConsistentStoryScript, 
    generateImage, 
    generateRoomCleaningIdeas, // Reusing similar logic but for forest house
    generateYouTubeMetadata, 
    YouTubeMetadata,
    analyzeCharacterReference,
    generateCharacters,
    generateSongMusicPrompt,
    ImageReference
} from '../services/geminiService.ts';
import { useLanguage } from './LanguageContext.tsx';
import { GoogleGenAI, Type } from "@google/genai";

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

const SparklesIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L15 12l-2.293-2.293a1 1 0 010-1.414L15 6m0 0l2.293-2.293a1 1 0 011.414 0L21 6m-6 12l2.293 2.293a1 1 0 001.414 0L21 18m-6-6l-2.293 2.293a1 1 0 000 1.414L15 18" />
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const HistoryIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const RefreshIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const YouTubeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

const BanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="w-full flex justify-end mb-4">
        <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200">
            <TrashIcon /> Clear Project | សម្អាត
        </button>
    </div>
);

interface Scene {
    sceneNumber: number;
    action: string;
    consistentContext: string;
    imageUrl?: string;
    isLoadingImage: boolean;
}

const forestHouseBlueprints = [
    { label: "A-Frame Cabin", icon: "📐", prompt: "Building House in Forest (ASMR): Construction of a luxury wooden A-frame house deep in the forest. សាងសង់ផ្ទះពីចាស់មកថ្មី ក្នុងព្រៃ។ Focus on satisfying high-detail ASMR steps: clearing the ground, building the wood frame, installing glass windows, and interior decoration." },
    { label: "Tree Mansion", icon: "🌳", prompt: "Building a massive multi-level treehouse mansion wrapped around an ancient oak tree. ផ្ទះលើដើមឈើធំ។ Focus on woodworking ASMR: rope bridge assembly, wooden railing installation, and cozy leaf-filtered lighting." },
    { label: "Modern Glass Pod", icon: "🛸", prompt: "A futuristic round glass forest pod house being assembled. ផ្ទះកញ្ចក់ទំនើបក្នុងព្រៃ។ Focus on precision engineering: robotic arms placing glass panels, glowing interior lights, and 100% realistic reflection of nature." },
    { label: "Stone & Log Hut", icon: "🪨", prompt: "Building a traditional stone and log forest sanctuary. ផ្ទះថ្មនឹងឈើ។ Focus on the heavy lifting: placing boulders, carving thick logs, and thatched roof layering." }
];

const BuildingForestHouseGenerator: React.FC = () => {
    const { t } = useLanguage();
    const [masterPrompt, setMasterPrompt] = useState(forestHouseBlueprints[0].prompt);
    const [sceneCount, setSceneCount] = useState(15);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [houseIdeas, setHouseIdeas] = useState<any[]>([]);
    const [noVoiceover, setNoVoiceover] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [localHistory, setLocalHistory] = useState<any[]>([]);
    
    // FIX: Defined missing state variables used in JSX.
    const [selectedPreset, setSelectedPreset] = useState('');
    const [visualReferences, setVisualReferences] = useState<ImageReference[]>([]);
    const [isGeneratingExtras, setIsGeneratingExtras] = useState(false);
    const [displayPresets, setDisplayPresets] = useState(forestHouseBlueprints);
    const [lockCamera, setLockCamera] = useState(true);
    const [bannedMotion, setBannedMotion] = useState(false);

    const stopSignal = useRef(false);

    // Persistence
    useEffect(() => {
        const handleSave = (e: any) => {
            if (e.detail.tool !== 'building-forest-house') return;
            const data = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'building-forest-house',
                category: 'vip',
                title: "Forest House Build",
                data: { masterPrompt, sceneCount, scenes, noVoiceover, youtubeMeta, visualReferences, selectedPreset }
            };
            const history = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([data, ...history]));
            loadLocalHistory();
        };
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'building-forest-house') return;
            const d = e.detail.data;
            if (d.masterPrompt) setMasterPrompt(d.masterPrompt);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.scenes) setScenes(d.scenes);
            if (d.noVoiceover !== undefined) setNoVoiceover(d.noVoiceover);
            if (d.youtubeMeta) setYoutubeMeta(d.youtubeMeta);
            if (d.visualReferences) setVisualReferences(d.visualReferences);
            if (d.selectedPreset) setSelectedPreset(d.selectedPreset);
            setShowHistory(false);
        };
        window.addEventListener('REQUEST_PROJECT_SAVE', handleSave);
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSave);
            window.removeEventListener('LOAD_PROJECT', handleLoad);
        };
    }, [masterPrompt, sceneCount, scenes, noVoiceover, youtubeMeta, visualReferences, selectedPreset]);

    const loadLocalHistory = useCallback(() => {
        const historyRaw = localStorage.getItem('global_project_history');
        if (historyRaw) {
            try {
                const history = JSON.parse(historyRaw);
                const toolHistory = history.filter((p: any) => p.tool === 'building-forest-house');
                setLocalHistory(toolHistory);
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    useEffect(() => {
        loadLocalHistory();
    }, [loadLocalHistory]);

    const handleReloadHistory = (project: any) => {
        window.dispatchEvent(new CustomEvent('LOAD_PROJECT', { detail: project }));
        setShowHistory(false);
    };

    // FIX: Defined missing handleShufflePresets function.
    const handleShufflePresets = () => {
        const shuffled = [...forestHouseBlueprints].sort(() => Math.random() - 0.5);
        setDisplayPresets(shuffled);
        setSelectedPreset('');
        setScenes([]);
    };

    // FIX: Defined missing handlePresetChange function to resolve "Cannot find name 'handlePresetChange'" error.
    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
        const val = typeof e === 'string' ? e : e.target.value;
        setSelectedPreset(val);
        setMasterPrompt(val);
        setScenes([]);
        setYoutubeMeta(null);
    };

    // FIX: Defined missing handleImageUpload function.
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (visualReferences.length >= 5) {
                setError("Maximum 5 visual references allowed.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setVisualReferences(prev => [...prev, {
                    base64: base64String.split(',')[1],
                    mimeType: file.type
                }]);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // FIX: Defined missing removeImage function.
    const removeImage = (index: number) => {
        setVisualReferences(prev => prev.filter((_, i) => i !== index));
    };

    // FIX: Defined missing handleAutoSetup function.
    const handleAutoSetup = async (customSynopsis?: string, customTitle?: string) => {
        const activeSynopsis = customSynopsis || masterPrompt;
        if (!activeSynopsis.trim()) {
            setError("Please enter a synopsis first.");
            return;
        }
        setIsGeneratingExtras(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Create 2 highly detailed 3D atmosphere or architectural elements for this forest build: "${activeSynopsis}". Describe them as cinematic 3D models.`;
            const gen = await generateCharacters(prompt, 2);
            
            if (visualReferences.length === 0) {
                 setStatusText("Rendering reference art...");
                 for (let i = 0; i < gen.length; i++) {
                     const imgUrl = await generateImage(`Forest House 3D render, high-quality, cinematic: ${gen[i].description}`, '1:1');
                     const [header, base64] = imgUrl.split(',');
                     const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
                     setVisualReferences(prev => [...prev, { base64, mimeType: mime }]);
                     if (i < gen.length - 1) await new Promise(r => setTimeout(r, 1000));
                 }
            }
            setStatusText("");
        } catch (err) {
            setError("Auto-setup failed.");
        } finally {
            setIsGeneratingExtras(false);
        }
    };

    const handleGenerateIdeas = async () => {
        setIsGeneratingIdeas(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Generate 5 creative forest house architectural ideas for an ASMR building series. 
                Focus on satisfying construction steps and unique nature integration.
                Output JSON ARRAY of 5 objects: { "title": "short title", "desc": "detailed visual description" }`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            ideas: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        desc: { type: Type.STRING }
                                    },
                                    required: ["title", "desc"]
                                }
                            }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text || "{}");
            if (data.ideas && data.ideas.length > 0) {
                setHouseIdeas(data.ideas);
            }
        } catch (err) {
            setError("Failed to generate house ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleUseIdea = (idea: any) => {
        setMasterPrompt(`Forest House Vision: ${idea.title}\n\nConstruction Details: ${idea.desc}\n\nStyle: 100% Realistic, Professional Cinematic Nature Photography. 0% to 100% Build Process.`);
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

        const voiceInstruction = noVoiceover ? "\n\nSTRICT RULE: Do NOT include any spoken dialogue or narration. Focus purely on environmental ASMR sounds: birds, wood cutting, drilling, and satisfying clinks." : "";

        try {
            const result = await generateConsistentStoryScript(
                `FOREST HOUSE BUILDING ASMR PRODUCTION. Context: ${masterPrompt}. Style: 100% Realistic, Professional Architectural & Nature Photography. Show the satisfying progress from an empty forest patch to a modern wood cabin masterpiece.${voiceInstruction}`,
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
            const prompt = `100% Realistic, professional architectural photography of a forest house build, 8k. Action: ${scene.action}. Environment: ${scene.consistentContext}. Detailed textures of raw wood, forest floor, morning sun rays through trees, cinematic lighting, wide angle. 100% building model consistency. No text.`;
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

    const handleCopyJson = (index: number) => {
        const scene = scenes[index];
        if (!scene) return;
        const structuredData = {
            sense: scene.sceneNumber,
            action: scene.action,
            voiceover: noVoiceover ? "" : scene.action,
            prompt: `100% Realistic, professional forest house architecture photography, 8k. Action: ${scene.action}. Context: ${scene.consistentContext}.`
        };
        navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
        setCopyStatus(`json-${index}`);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleDownloadSingle = (url: string, num: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `ForestHouse_Sense_${num}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateMetadata = async () => {
        if (scenes.length === 0) return;
        setIsGeneratingMeta(true);
        setError(null);
        try {
            const context = `Forest House Build Project: ${masterPrompt}\n\nStoryboard:\n${scenes.map(s => s.action).join('\n')}`;
            const meta = await generateYouTubeMetadata(
                "Ultimate Forest House Build ASMR Transformation | 0% to 100% Luxury",
                context,
                "House Building & Woodworking ASMR"
            );
            setYoutubeMeta(meta);
        } catch (err) {
            setError("Failed to generate metadata.");
        } finally {
            setIsGeneratingMeta(false);
        }
    };

    const setStatusText = (text: string) => {
        setError(text); // Using error state as status text for now for simplicity
    };

    const handleClear = () => {
        setMasterPrompt(forestHouseBlueprints[0].prompt);
        setScenes([]);
        setHouseIdeas([]);
        setNoVoiceover(true);
        setYoutubeMeta(null);
        setError(null);
        setSceneCount(15);
        setVisualReferences([]);
        setSelectedPreset('');
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-fade-in">
             <div className="w-full flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            loadLocalHistory();
                            setShowHistory(!showHistory);
                        }} 
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 border ${showHistory ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                    >
                        <HistoryIcon /> {showHistory ? 'Hide History' : 'Reload History | ប្រវត្តផលិត'}
                    </button>
                </div>
                <button onClick={handleClear} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-300 bg-red-950/20 border border-red-900/50 rounded-xl hover:bg-red-900/40 transition-colors duration-200">
                    <TrashIcon className="h-4 w-4" /> Reset Studio | សម្អាត
                </button>
            </div>

            {showHistory && (
                <div className="w-full bg-[#0f172a]/95 border-2 border-indigo-500/50 p-6 rounded-3xl mb-8 animate-slide-down shadow-2xl relative z-20 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                            <HistoryIcon className="h-5 w-5" /> Forest Build History Vault
                        </h4>
                        <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white text-3xl transition-colors">&times;</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto custom-scrollbar pr-3">
                        {localHistory.length > 0 ? (
                            localHistory.map((project, idx) => (
                                <div 
                                    key={project.id} 
                                    onClick={() => handleReloadHistory(project)}
                                    className="bg-[#1e293b]/60 hover:bg-[#1e293b] border border-gray-700 p-5 rounded-2xl cursor-pointer transition-all group shadow-inner"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-2.5 py-1 rounded-full font-black border border-indigo-800/50 uppercase tracking-tighter">#{localHistory.length - idx}</span>
                                        <span className="text-[10px] text-gray-500 font-bold">{new Date(project.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-white text-xs font-bold truncate mb-1">{project.data.masterPrompt || "Untitled Project"}</p>
                                    <p className="text-gray-400 text-[10px] line-clamp-1 italic">{project.data.sceneCount} Senses</p>
                                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-1">Click to Reload ➜</span>
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
                <div className="bg-[#1e293b]/80 p-6 rounded-2xl border border-gray-700 h-fit space-y-6 shadow-xl backdrop-blur-sm">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600 mb-2 flex items-center gap-2">
                        <span>📦🏠</span> សាងសង់ផ្ទះក្រដាស
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700 pb-4">
                        Cardboard DIY Miniature Studio.
                    </p>

                    <div className="space-y-6">
                        {/* 20 Contents More Selector */}
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                                    <SparklesIcon /> Choose 20 Contents More
                                </label>
                                <button 
                                    onClick={handleShufflePresets}
                                    className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition"
                                    title="Get new content suggestions"
                                >
                                    <RefreshIcon /> New Contents
                                </button>
                            </div>
                            <select 
                                value={selectedPreset}
                                onChange={handlePresetChange}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                            >
                                <option value="">-- Select a Theme (Auto Create) --</option>
                                {displayPresets.map((p, i) => (
                                    <option key={i} value={p.prompt}>{i + 1}. {p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Visual Reference Slot */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-gray-300">1. Visual Reference (តួអង្គ/ប្លង់) ({visualReferences.length}/5)</label>
                                {selectedPreset && visualReferences.length === 0 && (
                                    <button 
                                        onClick={() => handleAutoSetup()} 
                                        disabled={isGeneratingExtras}
                                        className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded font-bold transition flex items-center gap-1"
                                    >
                                        {isGeneratingExtras ? <Spinner className="h-3 w-3 m-0"/> : '✨ Auto Setup'}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {visualReferences.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square bg-gray-900 rounded-lg border border-gray-600 overflow-hidden group">
                                        <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <TrashIcon className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {visualReferences.length < 5 && (
                                    <label className="cursor-pointer aspect-square bg-gray-900 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center hover:border-teal-400 transition-colors">
                                        <span className="text-2xl mb-1 text-gray-500">+</span>
                                        <span className="text-[10px] text-gray-500">Add</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Master Prompt Spins Box</label>
                                <button 
                                    onClick={handleGenerateIdeas}
                                    disabled={isGeneratingIdeas}
                                    className="text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors uppercase flex items-center gap-1"
                                >
                                    {isGeneratingIdeas ? <Spinner className="h-3 w-3 m-0"/> : <SparklesIcon className="h-3 w-3"/>}
                                    Get New Idea
                                </button>
                            </div>
                            
                            <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-gray-700 mb-4">
                                <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-tighter mb-2">Recommended Blueprints:</h4>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {forestHouseBlueprints.map((idea, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handlePresetChange(idea.prompt)}
                                            className={`p-2 rounded border text-left transition-all ${masterPrompt === idea.prompt ? 'bg-amber-900/40 border-amber-500 text-amber-200' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                        >
                                            <div className="text-[10px] font-bold leading-tight mb-1">{idx + 1}. {idea.label}</div>
                                            <div className="text-[9px] line-clamp-1">{idea.prompt}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea 
                                value={masterPrompt}
                                onChange={(e) => setMasterPrompt(e.target.value)}
                                placeholder="Describe your paper house project..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white h-48 resize-none focus:ring-2 focus:ring-amber-500 outline-none shadow-inner text-sm leading-relaxed"
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
                                    <div className={`w-10 h-5 rounded-full transition-colors ${noVoiceover ? 'bg-amber-600' : 'bg-gray-700'}`}></div>
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${noVoiceover ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-amber-400 uppercase tracking-tighter">No Voiceover (ASMR Only)</span>
                                    <span className="text-[9px] text-gray-500 italic">Focus on satisfying crafting sounds.</span>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Number Senses (Scenes)</label>
                            <input 
                                type="number" min="1" max="100" 
                                value={sceneCount}
                                onChange={(e) => setSceneCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white font-black text-center text-xl focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>

                        <button 
                            onClick={handleGenerateScript} 
                            disabled={isGeneratingScript || !masterPrompt.trim()}
                            className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-700 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-3 uppercase tracking-widest"
                        >
                            {isGeneratingScript ? <Spinner /> : '📐'} 
                            {isGeneratingScript ? 'Drafting blueprint...' : t('get_sense')}
                        </button>
                    </div>
                    
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-center text-xs animate-shake">{error}</div>}
                </div>

                {/* Right Panel: Sense Gallery */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 shadow-xl flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 backdrop-blur-md gap-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Production storyboard ({scenes.length} Senses)</h3>
                        {scenes.length > 0 && (
                            <button 
                                onClick={handleGenerateMetadata}
                                disabled={isGeneratingMeta}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50"
                            >
                                {isGeneratingMeta ? <Spinner className="h-4 w-4 m-0"/> : <YouTubeIcon />} YouTube Info
                            </button>
                        )}
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
                                        <button onClick={() => handleCopy(youtubeMeta.title, 'metaTitle')} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase">{copyStatus === 'metaTitle' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-white text-sm font-bold">{youtubeMeta.title}</div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Description for youtube</label>
                                        <button onClick={() => handleCopy(youtubeMeta.description, 'metaDesc')} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase">{copyStatus === 'metaDesc' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-gray-300 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar italic">{youtubeMeta.description}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                        {scenes.map((scene, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col group hover:border-amber-500/50 transition-all duration-300">
                                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                                    {scene.imageUrl ? (
                                        <img src={scene.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={`Sense ${scene.sceneNumber}`} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            {scene.isLoadingImage ? (
                                                <>
                                                    <Spinner className="h-10 w-10 text-amber-500" />
                                                    <span className="text-[10px] text-gray-500 font-black uppercase animate-pulse">Rendering Macro DIY Art...</span>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleGenerateImage(idx)}
                                                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-full text-[10px] uppercase shadow-lg transition-all"
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
                                    <p className="text-gray-300 text-xs leading-relaxed italic border-l-2 border-amber-500 pl-3 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
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
                                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-amber-300 transition font-black uppercase flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-700"
                                        >
                                            {copyStatus === `json-${idx}` ? '✓ Done' : <><JsonIcon /> JSON</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {scenes.length === 0 && !isGeneratingScript && (
                            <div className="col-span-full py-20 text-center bg-gray-900/20 rounded-[3rem] border-4 border-dashed border-gray-800 flex flex-col items-center justify-center">
                                 <div className="text-8xl mb-4 opacity-10 grayscale">📦</div>
                                 <p className="text-xl font-black text-gray-600 uppercase tracking-[0.4em]">Crafting Table Ready</p>
                                 <p className="text-sm text-gray-700 mt-4 max-w-md">Describe your project or click "Get Sense Script" to begin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildingForestHouseGenerator;
