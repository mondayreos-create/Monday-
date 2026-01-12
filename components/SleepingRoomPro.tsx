
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    generateConsistentStoryScript, 
    generateImage, 
    generateRoomCleaningIdeas, 
    CarIdea, 
    generateYouTubeMetadata, 
    YouTubeMetadata,
    generatePromptFromImage
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
    imageUrlFirst?: string;
    imageUrlMid?: string;
    imageUrlLast?: string;
    isLoadingFirst: boolean;
    isLoadingMid: boolean;
    isLoadingLast: boolean;
}

const SleepingRoomPro: React.FC = () => {
    const { t } = useLanguage();
    const [masterPrompt, setMasterPrompt] = useState('Sleeping Room (ASMR): A professional crew arrives at a very old, messy bedroom. សម្អាតបន្ទប់គេងពីចាស់មកថ្មី។ Transforming total chaos into a 100% beautiful, peaceful sleeping sanctuary.');
    const [sceneCount, setSceneCount] = useState(15);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [bedroomIdeas, setBedroomIdeas] = useState<CarIdea[]>([]);
    const [noVoiceover, setNoVoiceover] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);

    // Reference Frame State
    const [firstFrameRef, setFirstFrameRef] = useState<{ base64: string, mimeType: string, url: string } | null>(null);
    const [lastFrameRef, setLastFrameRef] = useState<{ base64: string, mimeType: string, url: string } | null>(null);
    const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);

    // Fast Content State
    const [fastContentFrames, setFastContentFrames] = useState<{
        dirty?: string;
        cleaning?: string;
        perfect?: string;
        isLoadingDirty: boolean;
        isLoadingCleaning: boolean;
        isLoadingPerfect: boolean;
    }>({
        isLoadingDirty: false,
        isLoadingCleaning: false,
        isLoadingPerfect: false
    });

    // Persistence
    useEffect(() => {
        const handleSave = (e: any) => {
            if (e.detail.tool !== 'sleeping-room-asmr') return;
            const data = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'sleeping-room-asmr',
                category: 'vip',
                title: "Bedroom Restoration Project",
                data: { masterPrompt, sceneCount, scenes, noVoiceover, youtubeMeta, firstFrameRef, lastFrameRef, fastContentFrames }
            };
            const history = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([data, ...history]));
        };
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'sleeping-room-asmr') return;
            const d = e.detail.data;
            if (d.masterPrompt) setMasterPrompt(d.masterPrompt);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.scenes) setScenes(d.scenes);
            if (d.youtubeMeta) setYoutubeMeta(d.youtubeMeta);
            if (d.firstFrameRef) setFirstFrameRef(d.firstFrameRef);
            if (d.lastFrameRef) setLastFrameRef(d.lastFrameRef);
            if (d.noVoiceover !== undefined) setNoVoiceover(d.noVoiceover);
            if (d.fastContentFrames) setFastContentFrames(d.fastContentFrames);
        };
        window.addEventListener('REQUEST_PROJECT_SAVE', handleSave);
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSave);
            window.removeEventListener('LOAD_PROJECT', handleLoad);
        };
    }, [masterPrompt, sceneCount, scenes, youtubeMeta, firstFrameRef, lastFrameRef, noVoiceover, fastContentFrames]);

    const handleImageUpload = (slot: 'first' | 'last') => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                const url = URL.createObjectURL(file);
                const data = { base64, mimeType: file.type, url };
                if (slot === 'first') setFirstFrameRef(data);
                else setLastFrameRef(data);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateIdeas = async () => {
        setIsGeneratingIdeas(true);
        setError(null);
        try {
            const ideas = await generateRoomCleaningIdeas("Viral ASMR Bedroom Transformation: " + masterPrompt);
            setBedroomIdeas(ideas);
        } catch (err) {
            setError("Failed to generate ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleUseIdea = (idea: CarIdea) => {
        setMasterPrompt(`Bedroom Makeover: ${idea.title}\n\nTask: ${idea.description}\n\nFocus on the team of crew members (ក្រុមការងារមានមនុស្សច្រើន) transforming a disaster bedroom into a beautiful, high-end sleeping suite. 0% to 100% transformation.`);
        setBedroomIdeas([]);
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
            let imageContext = "";
            if (firstFrameRef || lastFrameRef) {
                setIsAnalyzingImages(true);
                const analyses = await Promise.all([
                    firstFrameRef ? generatePromptFromImage(firstFrameRef.base64, firstFrameRef.mimeType) : Promise.resolve(""),
                    lastFrameRef ? generatePromptFromImage(lastFrameRef.base64, lastFrameRef.mimeType) : Promise.resolve("")
                ]);
                imageContext = `\nVISUAL CONTEXT FROM REFERENCE IMAGES:\n- Initial State (0%): ${analyses[0] || 'Dirty, messy bedroom'}\n- Final State (100%): ${analyses[1] || 'Beautiful, clean bedroom'}\n`;
                setIsAnalyzingImages(false);
            }

            const voiceInstruction = noVoiceover ? "\nSTRICT RULE: No voiceover. Focus on ASMR sounds." : "";

            const result = await generateConsistentStoryScript(
                `BEDROOM CLEANING & DESIGN PRODUCTION. Context: ${masterPrompt}.${imageContext}${voiceInstruction}
                STYLE: 100% Realistic, Professional Interior Cinematic Photography. 
                STRICT PRODUCTION RULES:
                1. Scenes: Generate exactly ${sceneCount} scenes.
                2. Pacing: Fast-paced action showing a team of many workers (ក្រុមការងារមានមនុស្សច្រើន).
                3. Flow: Progression from Stage 0% (Dirty) -> Stage 75% (Fast Working) -> Stage 100% (Success).
                4. Focus: High-energy teamwork, professional cleaning equipment, and satisfying transformation.`,
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

    const handleGenerateFastContent = async (type: 'dirty' | 'cleaning' | 'perfect') => {
        setFastContentFrames(prev => ({
            ...prev,
            isLoadingDirty: type === 'dirty' ? true : prev.isLoadingDirty,
            isLoadingCleaning: type === 'cleaning' ? true : prev.isLoadingCleaning,
            isLoadingPerfect: type === 'perfect' ? true : prev.isLoadingPerfect,
        }));

        try {
            let stagePrompt = "";
            if (type === 'dirty') {
                stagePrompt = "FAST CONTENT STAGE 0%: Extremely dirty, old, messy bedroom with trash everywhere. A team of several professional cleaning crew members are standing looking at the camera, ready to start.";
            } else if (type === 'cleaning') {
                stagePrompt = "FAST CONTENT STAGE 75%: The same cleaning crew is working extremely fast, scrubbing, vacuuming, and organizing. Motion blur on tools to show intensity and satisfying progress.";
            } else {
                stagePrompt = "FAST CONTENT STAGE 100%: The bedroom is now 100% perfect, luxury, and beautiful. The same crew is standing together proudly in the finished room, smiling at the camera.";
            }

            const prompt = `100% Realistic, professional interior photography, 8k. Context: ${masterPrompt}. Stage: ${stagePrompt}. High-end lighting, wide lens, 100% character consistency.`;
            const url = await generateImage(prompt, '16:9');
            
            setFastContentFrames(prev => ({
                ...prev,
                dirty: type === 'dirty' ? url : prev.dirty,
                cleaning: type === 'cleaning' ? url : prev.cleaning,
                perfect: type === 'perfect' ? url : prev.perfect,
                isLoadingDirty: type === 'dirty' ? false : prev.isLoadingDirty,
                isLoadingCleaning: type === 'cleaning' ? false : prev.isLoadingCleaning,
                isLoadingPerfect: type === 'perfect' ? false : prev.isLoadingPerfect,
            }));
        } catch (err) {
            setFastContentFrames(prev => ({
                ...prev,
                isLoadingDirty: false,
                isLoadingCleaning: false,
                isLoadingPerfect: false
            }));
            setError("Fast frame generation failed.");
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
                stagePrompt = "STAGE 0%: The bedroom is messy and dirty. A team of cleaning crew members are standing in the room ready to start.";
            } else if (type === 'mid') {
                stagePrompt = "STAGE 75%: The crew is working extremely fast, scrubbing, vacuuming, and organizing. Motion blur on tools to show speed.";
            } else {
                stagePrompt = "STAGE 100%: The room is now 100% perfect, luxury, and beautiful. The same crew is standing proudly together in the finished room.";
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
        link.download = `Bedroom_Restoration_Senses_${Date.now()}.txt`;
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
        link.download = `Bedroom_Restoration_Storyboard_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateMetadata = async () => {
        if (scenes.length === 0) return;
        setIsGeneratingMeta(true);
        setError(null);
        try {
            const context = `Bedroom Transformation Project: ${masterPrompt}\n\nProduction Senses:\n${scenes.map(s => s.action).join('\n')}`;
            const meta = await generateYouTubeMetadata(
                "Satisfying Extreme Bedroom Transformation ASMR | Old to Luxury",
                context,
                "Room Restoration & Cleaning ASMR"
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
        link.download = `Bedroom_Pro_Sense_${num}_${slot}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setMasterPrompt('Sleeping Room (ASMR): A professional crew arrives at a very old, messy bedroom. សម្អាតបន្ទប់គេងពីចាស់មកថ្មី។ Transforming total chaos into a 100% beautiful, peaceful sleeping sanctuary.');
        setScenes([]);
        setBedroomIdeas([]);
        setYoutubeMeta(null);
        setError(null);
        setSceneCount(15);
        setFirstFrameRef(null);
        setLastFrameRef(null);
        setNoVoiceover(false);
        setFastContentFrames({
            isLoadingDirty: false,
            isLoadingCleaning: false,
            isLoadingPerfect: false
        });
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-fade-in">
            <ClearProjectButton onClick={handleClear} />
            
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Inputs */}
                <div className="bg-[#1e293b]/80 p-6 rounded-2xl border border-gray-700 h-fit space-y-6 shadow-xl backdrop-blur-sm">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-2 flex items-center gap-2">
                        <span>🛏️</span> បន្ទប់គេង (Sleeping Room)
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700 pb-4">
                        Professional Fast-Paced Restoration.
                    </p>

                    {/* Image References Section */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">🖼️ Reference Visuals</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="block text-[10px] text-purple-400 font-bold uppercase">1. First Frame (Dirty)</label>
                                <label className="flex flex-col items-center justify-center aspect-square bg-gray-900 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-500 cursor-pointer overflow-hidden transition-all group">
                                    {firstFrameRef ? (
                                        <img src={firstFrameRef.url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <span className="text-2xl mb-1 block opacity-30 group-hover:scale-110 transition-transform">🧹</span>
                                            <span className="text-[9px] text-gray-600 font-bold uppercase">Upload 0%</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload('first')} className="hidden" />
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] text-emerald-400 font-bold uppercase">2. Last Frame (Clean)</label>
                                <label className="flex flex-col items-center justify-center aspect-square bg-gray-900 rounded-xl border-2 border-dashed border-gray-700 hover:border-emerald-500 cursor-pointer overflow-hidden transition-all group">
                                    {lastFrameRef ? (
                                        <img src={lastFrameRef.url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <span className="text-2xl mb-1 block opacity-30 group-hover:scale-110 transition-transform">✨</span>
                                            <span className="text-[9px] text-gray-600 font-bold uppercase">Upload 100%</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload('last')} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">{t('spins_box')}</label>
                            <button 
                                onClick={handleGenerateIdeas}
                                disabled={isGeneratingIdeas}
                                className="text-[10px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase flex items-center gap-1"
                            >
                                {isGeneratingIdeas ? <Spinner className="h-3 w-3 m-0"/> : <SparklesIcon className="h-3 w-3"/>}
                                Get Ideas
                            </button>
                        </div>
                        
                        {bedroomIdeas.length > 0 && (
                            <div className="space-y-2 animate-slide-down bg-black/40 p-3 rounded-xl border border-gray-700 mb-4">
                                <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-tighter mb-2">Select a Project Plan:</h4>
                                {bedroomIdeas.map((idea, idx) => (
                                    <div key={idx} className="bg-gray-800 p-2 rounded border border-gray-700 group">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-grow">
                                                <div className="text-[10px] font-bold text-white leading-tight mb-1">{idea.title}</div>
                                                <div className="text-[9px] text-gray-500 line-clamp-1 group-hover:line-clamp-none transition-all">{idea.description}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleUseIdea(idea)}
                                                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black rounded uppercase shadow"
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
                            placeholder="Describe the bedroom state and restoration goals..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white h-40 resize-none focus:ring-2 focus:ring-purple-500 outline-none shadow-inner text-sm leading-relaxed"
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
                                <div className={`w-10 h-5 rounded-full transition-colors ${noVoiceover ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${noVoiceover ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-purple-400 uppercase tracking-tighter">No Voiceover</span>
                                <span className="text-[9px] text-gray-500 italic">Focus on ASMR sound effects.</span>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">{t('number_senses')}</label>
                        <input 
                            type="number" min="1" max="100" 
                            value={sceneCount}
                            onChange={(e) => setSceneCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white font-black text-center text-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleGenerateScript} 
                        disabled={isGeneratingScript || !masterPrompt.trim() || isAnalyzingImages}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-95 disabled:opacity-50 text-lg flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        {isGeneratingScript || isAnalyzingImages ? <Spinner /> : '🚀'} 
                        {isAnalyzingImages ? 'Analyzing Ref...' : isGeneratingScript ? 'Architecting...' : t('get_sense')}
                    </button>
                    
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-center text-xs animate-shake">{error}</div>}
                </div>

                {/* Right Panel: Sense Gallery */}
                <div className="lg:col-span-2 space-y-6">
                    {/* storyboard header with downloads */}
                    <div className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700 shadow-xl flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 backdrop-blur-md gap-4">
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

                    <div className="space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                        {scenes.map((scene, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col group hover:border-purple-500/50 transition-all duration-300">
                                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 font-black flex items-center justify-center border border-purple-500/30 text-xs shadow-inner">{scene.sceneNumber}</span>
                                        <p className="text-gray-300 text-xs italic line-clamp-1">"{scene.action}"</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleCopy(scene.action, `p-${idx}`)} className="text-[9px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-1 rounded-full transition border border-gray-700 font-black uppercase">{copyStatus === `p-${idx}` ? '✓ Copied' : t('copy_prompt')}</button>
                                        <button onClick={() => {
                                            const structuredData = {
                                                sense: scene.sceneNumber,
                                                action: scene.action,
                                                frames: ["0% Crew Standing", "75% Crew Cleaning", "100% Crew Success"]
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
                                                {scene.isLoadingFirst ? <Spinner className="h-6 w-6 text-red-500" /> : <button onClick={() => handleGenerateFrame(idx, 'first')} className="px-3 py-1 bg-gray-800 text-[10px] text-gray-400 hover:text-white rounded uppercase font-bold">0% Crew Ready</button>}
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-red-600/70 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-black backdrop-blur-md border border-red-500/50">Dirty 0%</div>
                                        {scene.imageUrlFirst && (
                                            <button onClick={() => handleDownload(scene.imageUrlFirst!, scene.sceneNumber, 'First')} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover/frame:opacity-100 transition hover:bg-purple-600 shadow-xl"><DownloadIcon className="h-3 w-3" /></button>
                                        )}
                                    </div>
                                    
                                    {/* Mid Frame (75%) */}
                                    <div className="aspect-video bg-gray-900 relative flex items-center justify-center border border-gray-800 rounded-xl overflow-hidden group/frame">
                                        {scene.imageUrlMid ? (
                                            <img src={scene.imageUrlMid} className="w-full h-full object-cover" alt="Mid" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-center p-2">
                                                {scene.isLoadingMid ? <Spinner className="h-6 w-6 text-yellow-500" /> : <button onClick={() => handleGenerateFrame(idx, 'mid')} className="px-3 py-1 bg-gray-800 text-[10px] text-gray-400 hover:text-white rounded uppercase font-bold">75% Crew Work</button>}
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
                                                {scene.isLoadingLast ? <Spinner className="h-6 w-6 text-emerald-500" /> : <button onClick={() => handleGenerateFrame(idx, 'last')} className="px-3 py-1 bg-gray-800 text-[10px] text-gray-400 hover:text-white rounded uppercase font-bold">100% Crew Done</button>}
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-emerald-600/70 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-black backdrop-blur-md border border-emerald-500/50">Perfect 100%</div>
                                        {scene.imageUrlLast && (
                                            <button onClick={() => handleDownload(scene.imageUrlLast!, scene.sceneNumber, 'Last')} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover/frame:opacity-100 transition hover:bg-purple-600 shadow-xl"><DownloadIcon className="h-3 w-3" /></button>
                                        )}
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

export default SleepingRoomPro;
