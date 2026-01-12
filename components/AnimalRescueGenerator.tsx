
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    generateConsistentStoryScript, 
    generateImage, 
    generateYouTubeMetadata, 
    YouTubeMetadata,
    generateCharacters,
    analyzeCharacterReference,
    CharacterAnalysis,
    ImageReference,
    generatePromptFromImage
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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

const DownloadIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="w-full flex justify-end mb-4">
        <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200">
            <TrashIcon /> Clear Project | សម្អាត
        </button>
    </div>
);

interface CharacterSlot {
    id: number;
    name: string;
    description: string;
    image: ImageReference | null;
    isAnalyzing: boolean;
}

interface Scene {
    sceneNumber: number;
    action: string;
    consistentContext: string;
    imageUrl?: string;
    isLoadingImage: boolean;
}

const initialRescueIdeas = [
    { title: "Dog in Sewer", desc: "A kind man finds a dog trapped in a dirty sewer. When he sees it, he helps the dog by rescuing it, washing it clean with water, treating and bandaging its wounds. He gives the dog food to eat and takes good care of it. After the dog recovers and is well cared for, he releases the dog and lets it live freely." },
    { title: "Mother Dog & Puppies", desc: "Kind Man Rescues Abandoned Mother Dog and Puppies - Emotional journey from cold rain to warm shelter. Focus on the gentle approach, feeding, and the happy family ending." },
    { title: "Kitten in a Storm", desc: "Saving a tiny kitten trapped in a high-speed drain during a tropical storm. Intense water rescue, warm towel drying, and a new loving home." },
    { title: "Injured Hawk", desc: "A majestic hawk with a broken wing found in the tall grass. Gentle capture with a blanket, professional vet care, and a powerful release back into the wild sky." },
    { title: "Abandoned Horse", desc: "Rescuing a neglected horse from an empty field. Emotional first touch, satisfying grooming ASMR, fresh oats, and the return of its glossy coat." }
];

const AnimalRescueGenerator: React.FC = () => {
    const { t } = useLanguage();
    const [masterPrompt, setMasterPrompt] = useState(initialRescueIdeas[0].desc);
    const [sceneCount, setSceneCount] = useState(12);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [rescueIdeas, setRescueIdeas] = useState(initialRescueIdeas);
    const [noVoiceover, setNoVoiceover] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [localHistory, setLocalHistory] = useState<any[]>([]);

    // Character State
    const [characterCount, setCharacterCount] = useState(2);
    const [characters, setCharacters] = useState<CharacterSlot[]>([
        { id: 1, name: 'Rescuer', description: '', image: null, isAnalyzing: false },
        { id: 2, name: 'Animal', description: '', image: null, isAnalyzing: false }
    ]);
    const [isAutoGeneratingChars, setIsAutoGeneratingChars] = useState(false);
    
    // Scene Extension State
    const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
    const [isRegeneratingScene, setIsRegeneratingScene] = useState<number | null>(null);

    // Persistence
    useEffect(() => {
        const handleSave = (e: any) => {
            if (e.detail.tool !== 'animal-rescue') return;
            const data = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'animal-rescue',
                category: 'vip',
                title: "Animal Rescue Production",
                data: { masterPrompt, sceneCount, scenes, noVoiceover, youtubeMeta, rescueIdeas, characters, characterCount }
            };
            const history = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([data, ...history]));
            loadLocalHistory();
        };
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'animal-rescue') return;
            const d = e.detail.data;
            if (d.masterPrompt) setMasterPrompt(d.masterPrompt);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.scenes) setScenes(d.scenes);
            if (d.noVoiceover !== undefined) setNoVoiceover(d.noVoiceover);
            if (d.youtubeMeta) setYoutubeMeta(d.youtubeMeta);
            if (d.rescueIdeas) setRescueIdeas(d.rescueIdeas);
            if (d.characters) setCharacters(d.characters);
            if (d.characterCount) setCharacterCount(d.characterCount);
            setShowHistory(false);
        };
        window.addEventListener('REQUEST_PROJECT_SAVE', handleSave);
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSave);
            window.removeEventListener('LOAD_PROJECT', handleLoad);
        };
    }, [masterPrompt, sceneCount, scenes, noVoiceover, youtubeMeta, rescueIdeas, characters, characterCount]);

    useEffect(() => {
        loadLocalHistory();
    }, []);

    const loadLocalHistory = () => {
        const historyRaw = localStorage.getItem('global_project_history');
        if (historyRaw) {
            try {
                const history = JSON.parse(historyRaw);
                const toolHistory = history.filter((p: any) => p.tool === 'animal-rescue');
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Generate 5 creative and highly emotional animal rescue story ideas for a viral video series. 
                Focus on the transformation from suffering to happiness.
                Output JSON ARRAY of 5 objects: { "title": "catchy title", "desc": "detailed emotional visual description" }`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            desc: { type: Type.STRING }
                        },
                        required: ["title", "desc"]
                    }
                }
            });
            const ideas = JSON.parse(response.text || "[]");
            if (ideas.length > 0) {
                setRescueIdeas(ideas);
            }
        } catch (err) {
            setError("Failed to generate rescue ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleShuffleIdeas = () => {
        const shuffled = [...rescueIdeas].sort(() => Math.random() - 0.5);
        setRescueIdeas(shuffled);
    };

    const handleGetCharacters = async () => {
        if (!masterPrompt.trim()) {
            setError("Please enter a story topic first.");
            return;
        }
        setIsAutoGeneratingChars(true);
        setError(null);
        try {
            const generatedChars = await generateCharacters(`Animal rescue story characters for: ${masterPrompt}. Style: 100% Realistic Cinematic.`, characterCount);
            setCharacters(prev => prev.map((c, i) => {
                if (generatedChars[i]) {
                    return { ...c, name: generatedChars[i].name, description: generatedChars[i].description };
                }
                return c;
            }));
        } catch (err) {
            setError("Failed to auto-generate characters.");
        } finally {
            setIsAutoGeneratingChars(false);
        }
    };

    const handleCharImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const imageRef = { base64, mimeType: file.type };
                setCharacters(prev => prev.map((c, i) => i === index ? { ...c, image: imageRef, isAnalyzing: true } : c));
                try {
                    const analysis = await analyzeCharacterReference(imageRef.base64, imageRef.mimeType);
                    setCharacters(prev => prev.map((c, i) => i === index ? { ...c, description: analysis.characterDescription, isAnalyzing: false } : c));
                } catch (err) {
                    setCharacters(prev => prev.map((c, i) => i === index ? { ...c, isAnalyzing: false } : c));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateCharacter = (index: number, field: keyof CharacterSlot, value: string) => {
        setCharacters(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
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

        const charContext = characters
            .filter(c => c.description.trim())
            .map((c, i) => `Character ${i + 1} (${c.name}): ${c.description}`)
            .join('\n\n');

        const voiceInstruction = noVoiceover ? "\n\nSTRICT RULE: Do NOT include any spoken dialogue or narration. Focus purely on the emotional visual actions and environmental sounds." : "";
        const styleInstruction = "\n\nSTYLE: 100% Realistic, Professional Cinematic Emotional Photography. High detail, 8k render quality.";
        
        const consistencyDirective = `
        STRICT VISUAL DIRECTIVE (សូមរក្សារ តួអង្គ និង ទីតាំងដ៏ដែល គ្រាន់តែធ្វើការផ្លាស់ប្តូរ សកម្មភាព):
        1. Keep the SAME character faces, SAME clothing, and the SAME setting (location) in every single scene.
        2. Only the actions and story beats should change as the scenes progress.
        3. Authenticity: The environment should look real and authentic, including being 'just a little bit of a mess' (e.g. realistic dirt, mud, or clutter) where appropriate to reflect realistic life rescue situations.
        4. No new characters or settings should be introduced unless the story logically moves to a new phase (e.g. from the muddy sewer to the clean safety of a home).
        `;

        try {
            const result = await generateConsistentStoryScript(
                `ANIMAL RESCUE STORYBOARD. Context: ${masterPrompt}. 
                ${consistencyDirective}
                CHARACTERS (PERSISTENT):
                ${charContext}
                The story must flow through these phases: 1. Discovery (Sad/Dirty/Messy), 2. First Contact, 3. Rescue, 4. Healing/Caring (Clean/Safe), 5. Happy Ending (Healthy/Loved).${voiceInstruction}${styleInstruction}`,
                sceneCount
            );
            setScenes(result.map(s => ({ ...s, isLoadingImage: false })));
        } catch (err) {
            setError("Failed to generate script.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleRegenerateScenePrompt = async (idx: number) => {
        const scene = scenes[idx];
        setIsRegeneratingScene(idx);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const charContext = characters.map((c, i) => 
                `Character ${i + 1} (${c.name}): ${c.description}`
            ).join('\n\n');

            const promptForAi = `
                REGENERATE SINGLE ANIMAL RESCUE SCENE PROMPT: Sense #${scene.sceneNumber}
                STORY CONTEXT: ${masterPrompt}
                CURRENT ACTION: ${scene.action}
                CHARACTERS (UPDATED):
                ${charContext}
                
                TASK: Generate a NEW detailed realistic emotional video generation prompt for this scene. 
                STRICT: Maintain same character faces, same clothing, and same setting consistency. Keep the atmosphere authentic and naturally 'a bit of a mess'.
                OUTPUT JSON: { "action": "new description", "visual_prompt": "new visual prompt" }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: promptForAi,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            action: { type: Type.STRING },
                            visual_prompt: { type: Type.STRING }
                        }
                    }
                }
            });

            const result = JSON.parse(response.text || "{}");
            
            if (result.action) {
                const updatedScenes = [...scenes];
                updatedScenes[idx] = {
                    ...scene,
                    action: result.action,
                    consistentContext: result.visual_prompt || scene.consistentContext
                };
                setScenes(updatedScenes);
                setEditingSceneIndex(null);
            }
        } catch (err) {
            setError("Prompt regeneration failed.");
        } finally {
            setIsRegeneratingScene(null);
        }
    };

    const handleGenerateImage = async (index: number) => {
        const scene = scenes[index];
        if (!scene) return;

        setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingImage: true } : s));
        try {
            const prompt = `100% Realistic, professional cinematic emotional photography, 8k. Action: ${scene.action}. Environment: ${scene.consistentContext}. Intense emotion, authentic textures, dramatic natural lighting. Keep the characters and setting exactly the same. Authentically slightly messy environment for realism. No text. 100% character face consistency.`;
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

    const handleDownloadSenses = () => {
        if (scenes.length === 0) return;
        const text = scenes.map(s => `Sense ${s.sceneNumber}: ${s.action}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rescue_Project_Senses_${Date.now()}.txt`;
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
        link.download = `Rescue_Project_Storyboard_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyJson = (index: number) => {
        const scene = scenes[index];
        if (!scene) return;
        const structuredData = {
            sense: scene.sceneNumber,
            action: scene.action,
            voiceover: noVoiceover ? "" : scene.action,
            prompt: `100% Realistic, professional emotional rescue cinematography, 8k. Action: ${scene.action}. Context: ${scene.consistentContext}.`
        };
        navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
        setCopyStatus(`json-${index}`);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleGenerateMetadata = async () => {
        if (scenes.length === 0) return;
        setIsGeneratingMeta(true);
        setError(null);
        try {
            const context = `Animal Rescue Project: ${masterPrompt}\n\nProduction Senses:\n${scenes.map(s => s.action).join('\n')}`;
            const meta = await generateYouTubeMetadata(
                "Most Emotional Animal Rescue Ever | Transformation from Sewer to Home",
                context,
                "Animal Rescue & Caring Story"
            );
            setYoutubeMeta(meta);
        } catch (err) {
            setError("Failed to generate metadata.");
        } finally {
            setIsGeneratingMeta(false);
        }
    };

    const handleDownloadSingle = (url: string, num: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rescue_Sense_${num}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setMasterPrompt(initialRescueIdeas[0].desc);
        setScenes([]);
        setCharacters([
            { id: 1, name: 'Rescuer', description: '', image: null, isAnalyzing: false },
            { id: 2, name: 'Animal', description: '', image: null, isAnalyzing: false }
        ]);
        setYoutubeMeta(null);
        setError(null);
        setSceneCount(12);
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
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 border ${showHistory ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
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
                <div className="w-full bg-gray-900/90 border-2 border-emerald-500/50 p-6 rounded-2xl mb-8 animate-slide-down shadow-2xl relative z-20 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <HistoryIcon /> Production History Vault
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
                                        <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-black border border-emerald-800/50 uppercase">#{localHistory.length - idx}</span>
                                        <span className="text-[9px] text-gray-500 font-bold">{new Date(project.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-white text-xs font-bold truncate mb-1">Rescue Content</p>
                                    <p className="text-gray-400 text-[10px] line-clamp-2 italic">"{project.data.masterPrompt}"</p>
                                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-emerald-400 font-black uppercase">Click to Reload ➜</span>
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
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-2 flex items-center gap-2">
                        <span>🐾</span> សង្គ្រោះសត្វ (Rescue)
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700 pb-4">
                        Consistent Characters & Setting Storyteller.
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">{t('spins_box')}</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleShuffleIdeas}
                                    className="text-[10px] text-gray-500 hover:text-white transition"
                                >
                                    <RefreshIcon className="h-3 w-3" />
                                </button>
                                <button 
                                    onClick={handleGenerateIdeas}
                                    disabled={isGeneratingIdeas}
                                    className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase flex items-center gap-1"
                                >
                                    {isGeneratingIdeas ? <Spinner className="h-3 w-3 m-0"/> : <SparklesIcon className="h-3 w-3"/>}
                                    Get Ideas
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-gray-700 mb-4">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mb-2">Select a Rescue Case:</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {rescueIdeas.map((idea, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setMasterPrompt(idea.desc)}
                                        className={`p-2 rounded border text-left transition-all ${masterPrompt === idea.desc ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        <div className="text-[10px] font-bold leading-tight mb-1">{idx + 1}. {idea.title}</div>
                                        <div className="text-[9px] line-clamp-1">{idea.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea 
                            value={masterPrompt}
                            onChange={(e) => setMasterPrompt(e.target.value)}
                            placeholder="Describe the rescue journey..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white h-48 resize-none focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner text-sm leading-relaxed"
                        />
                    </div>

                    {/* Character Reference Section */}
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold text-gray-300">Dramatis Personae</label>
                            <button 
                                onClick={handleGetCharacters} 
                                disabled={isAutoGeneratingChars || !masterPrompt.trim()}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-bold transition flex items-center gap-1 disabled:opacity-50"
                            >
                                {isAutoGeneratingChars ? <Spinner className="h-3 w-3"/> : '✨'} Auto-Gen Cast
                            </button>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {characters.map((char, index) => (
                                <div key={char.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-16">
                                            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition relative overflow-hidden group">
                                                {char.image ? <img src={`data:${char.image.mimeType};base64,${char.image.base64}`} alt="Ref" className="w-full h-full object-cover" /> : <span className="text-xl">{index === 0 ? '👨' : '🐾'}</span>}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCharImageUpload(index, e)} />
                                            </label>
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <input value={char.name} onChange={e => handleUpdateCharacter(index, 'name', e.target.value)} placeholder="Actor Name" className="w-full bg-gray-900 border-none rounded p-1 text-[10px] text-emerald-400 font-bold"/>
                                            <textarea value={char.description} onChange={(e) => handleUpdateCharacter(index, 'description', e.target.value)} placeholder="Traits..." className="w-full h-10 bg-gray-900 border-none rounded p-1 text-[10px] text-gray-300 resize-none outline-none"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                <span className="text-sm font-black text-emerald-400 uppercase tracking-tighter">No Voiceover</span>
                                <span className="text-[9px] text-gray-500 italic">Purely emotional visuals & sounds.</span>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">{t('number_senses')}</label>
                        <input 
                            type="number" min="1" max="200" 
                            value={sceneCount}
                            onChange={(e) => setSceneCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white font-black text-center text-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleGenerateScript} 
                        disabled={isGeneratingScript || !masterPrompt.trim()}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        {isGeneratingScript ? <Spinner /> : '🚀'} 
                        {isGeneratingScript ? 'Architecting...' : t('get_sense')}
                    </button>
                    
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-center text-xs animate-shake">{error}</div>}
                </div>

                {/* Right Panel: Sense Gallery */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1e293b]/80 p-5 rounded-2xl border border-gray-700 shadow-xl flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 backdrop-blur-md gap-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Rescue storyboard ({scenes.length} Senses)</h3>
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
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Title</label>
                                        <button onClick={() => handleCopy(youtubeMeta.title, 'metaTitle')} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase">{copyStatus === 'metaTitle' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-white text-sm font-bold">{youtubeMeta.title}</div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Description</label>
                                        <button onClick={() => handleCopy(youtubeMeta.description, 'metaDesc')} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase">{copyStatus === 'metaDesc' ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-gray-300 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar italic">{youtubeMeta.description}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                        {scenes.map((scene, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col group hover:border-emerald-500/50 transition-all duration-300">
                                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                                    {scene.imageUrl ? (
                                        <img src={scene.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={`Sense ${scene.sceneNumber}`} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            {scene.isLoadingImage ? (
                                                <>
                                                    <Spinner className="h-10 w-10 text-emerald-500" />
                                                    <span className="text-[10px] text-gray-500 font-black uppercase animate-pulse">Rendering Emotional Art...</span>
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
                                <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-gray-900 to-black">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-gray-300 text-xs leading-relaxed italic border-l-2 border-emerald-500 pl-3 line-clamp-3 group-hover:line-clamp-none transition-all flex-grow">
                                            "{scene.action}"
                                        </p>
                                        <button 
                                            onClick={() => setEditingSceneIndex(editingSceneIndex === idx ? null : idx)}
                                            className={`ml-2 text-[9px] px-2 py-1 rounded border transition-all flex items-center gap-1 font-bold ${editingSceneIndex === idx ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                        >
                                            {isRegeneratingScene === idx ? <Spinner className="h-3 w-3 m-0"/> : <RefreshIcon className="h-3 w-3" />}
                                            {editingSceneIndex === idx ? 'CLOSE' : 'GET NEW PROMPT'}
                                        </button>
                                    </div>

                                    {editingSceneIndex === idx && (
                                        <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-4 animate-fade-in">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xl">🧬</span>
                                                <h4 className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Character Verification</h4>
                                            </div>
                                            <p className="text-[9px] text-gray-400 mb-4 italic leading-tight">
                                                Verify or change character details to maintain 100% facial consistency.
                                            </p>
                                            <div className="grid grid-cols-1 gap-3 mb-4">
                                                {characters.map((c, cIdx) => (
                                                    <div key={c.id} className="bg-black/40 p-2 rounded border border-gray-700">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-[9px] font-black text-emerald-400 uppercase">{c.name || `Actor ${c.id}`}</span>
                                                        </div>
                                                        <textarea 
                                                            value={c.description} 
                                                            onChange={(e) => handleUpdateCharacter(cIdx, 'description', e.target.value)}
                                                            className="w-full bg-transparent border-none text-[9px] text-gray-400 h-10 resize-none focus:ring-0 p-0"
                                                            placeholder="Adjust facial features, clothing, etc..."
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingSceneIndex(null)} className="text-[9px] text-gray-500 hover:text-white font-black uppercase">Cancel</button>
                                                <button 
                                                    onClick={() => handleRegenerateScenePrompt(idx)}
                                                    disabled={isRegeneratingScene === idx}
                                                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[9px] font-black shadow-lg flex items-center gap-2 transition transform active:scale-95"
                                                >
                                                    {isRegeneratingScene === idx ? <Spinner className="h-3 w-3 m-0" /> : 'REGENERATE SENSE'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-800 pt-3">
                                        <button 
                                            onClick={() => handleCopy(scene.action, `p-${idx}`)} 
                                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition font-black uppercase flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-700"
                                        >
                                            {copyStatus === `p-${idx}` ? '✓ Copied' : t('copy_prompt')}
                                        </button>
                                        <button 
                                            onClick={() => handleCopyJson(idx)} 
                                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-emerald-400 hover:text-emerald-300 transition font-black uppercase flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-700"
                                        >
                                            {copyStatus === `json-${idx}` ? '✓ Done' : t('copy_json')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {scenes.length === 0 && !isGeneratingScript && (
                            <div className="col-span-full py-20 text-center bg-gray-900/20 rounded-[3rem] border-4 border-dashed border-gray-800 flex flex-col items-center justify-center">
                                 <div className="text-8xl mb-4 opacity-10">🐾</div>
                                 <p className="text-xl font-black text-gray-600 uppercase tracking-[0.4em]">Rescue Floor Ready</p>
                                 <p className="text-sm text-gray-700 mt-4 max-w-md">Choose a theme or describe your rescue story and click "Get Sense Script" to begin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimalRescueGenerator;
