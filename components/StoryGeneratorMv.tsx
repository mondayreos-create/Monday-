import React, { useState, useCallback, useEffect, useRef } from 'react';
// Added missing imports from geminiService: Character, MvDetailedScene, StoryIdea, generateMvStoryIdeas, generateDetailedMvScript, generateImage
import { 
    generateHollywoodMvScript, 
    generateVideo, 
    HollywoodMvScene, 
    generateYouTubeMetadata, 
    YouTubeMetadata,
    analyzeCharacterReference,
    generateHollywoodNarration,
    generateHollywoodMusicPrompt,
    generateCharacters,
    generateSimpleStory,
    ImageReference,
    Character,
    MvDetailedScene,
    StoryIdea,
    generateMvStoryIdeas,
    generateDetailedMvScript,
    generateImage
} from '../services/geminiService.ts';
import { GoogleGenAI, Type } from "@google/genai";

const Spinner: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className || 'h-5 w-5 text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CopyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

const JsonIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

// FIX: Added missing TrashIcon component
const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L15 12l-2.293-2.293a1 1 0 010-1.414L15 6m0 0l2.293-2.293a1 1 0 011.414 0L21 6m-6 12l2.293 2.293a1 1 0 001.414 0L21 18m-6-6l-2.293 2.293a1 1 0 000 1.414L15 18" />
    </svg>
);

// Added missing CheckIcon component to resolve compilation error
const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const styleOptions = [
    '3D Pixar/Disney',
    'Hyper-Realistic Cinematic',
    'Anime (Studio Ghibli)',
    'Cyberpunk Neon',
    'Watercolor Art',
    'Dark Fantasy',
    'Claymation',
    'Vintage Film 1950s'
];

interface ExtendedCharacter extends Character {
    id: number;
    isSelected?: boolean;
}

interface SceneWithReference extends MvDetailedScene {
    imageUrl?: string;
    isLoading: boolean;
}

// --- Audio Utilities ---
const decodeBase64ToUint8 = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const pcmToWav = (pcmData: Int16Array, numChannels: number, sampleRate: number, bitsPerSample: number): Blob => {
    const dataSize = pcmData.length * (bitsPerSample / 8);
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    view.setUint32(0, 0x52494646, false); 
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    view.setUint32(28, byteRate, true);
    const blockAlign = numChannels * (bitsPerSample / 8);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, dataSize, true);
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }
    return new Blob([view], { type: 'audio/wav' });
};

const StoryGeneratorMv: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [inputStory, setInputStory] = useState('');
    const [isDirectMode, setIsDirectMode] = useState(false);
    const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<StoryIdea | null>(null);
    const [selectedStyle, setSelectedStyle] = useState(styleOptions[0]);
    const [charCount, setCharCount] = useState(2);
    const [sceneCount, setSceneCount] = useState(15);
    const [characters, setCharacters] = useState<ExtendedCharacter[]>([]);
    const [finalScenes, setFinalScenes] = useState<SceneWithReference[]>([]);
    const [copyStatus, setCopyStatus] = useState<number | string | null>(null);
    
    // Audio State
    const [sceneAudios, setSceneAudios] = useState<Record<number, { url: string | null; loading: boolean }>>({});

    const stopSignal = useRef(false);

    // Persistence
    useEffect(() => {
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'story-gen-mv') return;
            const d = e.detail.data;
            if (d.inputStory) setInputStory(d.inputStory);
            if (d.isDirectMode !== undefined) setIsDirectMode(d.isDirectMode);
            if (d.selectedIdea) setSelectedIdea(d.selectedIdea);
            if (d.selectedStyle) setSelectedStyle(d.selectedStyle);
            if (d.charCount) setCharCount(d.charCount);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.characters) setCharacters(d.characters);
            if (d.finalScenes) setFinalScenes(d.finalScenes);
            setStep(d.finalScenes?.length > 0 ? 3 : d.selectedIdea ? 2 : 1);
        };
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => window.removeEventListener('LOAD_PROJECT', handleLoad);
    }, []);

    const handleGenerateIdeas = async () => {
        if (!inputStory.trim()) {
            setError("Please enter your story idea or topic.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const ideas = await generateMvStoryIdeas(inputStory);
            setStoryIdeas(ideas);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate ideas.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoDirectMode = () => {
        if (!inputStory.trim()) {
            setError("Please paste your full story first.");
            return;
        }
        setSelectedIdea({ title: "Direct Story", summary: inputStory });
        setStep(2);
        setCharacters([]);
    };

    const handleSelectIdea = (idea: StoryIdea) => {
        setSelectedIdea(idea);
        setStep(2);
        setCharacters([]);
    };

    const handleGenerateCharacters = async () => {
        if (!selectedIdea) return;
        setIsLoading(true);
        setError(null);
        try {
            const context = `Story Title: ${selectedIdea.title}. Summary: ${selectedIdea.summary}. Visual Style: ${selectedStyle}`;
            const gen = await generateCharacters(context, charCount);
            setCharacters(gen.map((c, i) => ({ ...c, id: Date.now() + i, isSelected: true })));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate characters.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCharacter = (index: number, field: keyof Character, value: string) => {
        const updated = [...characters];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            setCharacters(updated);
        }
    };

    // FIX: Added the missing removeCharacter function
    const removeCharacter = (id: number) => {
        if (characters.length > 1) {
            setCharacters(prev => prev.filter(c => c.id !== id));
            setCharCount(prev => Math.max(1, prev - 1));
        }
    };

    const handleCreateStory = async () => {
        if (!selectedIdea || characters.length === 0) {
            setError("Please ensure you have a selected story and set up your characters.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setFinalScenes([]);
        setProgress(0);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const BATCH_SIZE = 10;
            const totalBatches = Math.ceil(sceneCount / BATCH_SIZE);
            let allScenes: SceneWithReference[] = [];
            
            const charNames = characters.map(c => c.name).join(', ');
            const charContext = characters.map((c, idx) => 
                `Character ${idx + 1} (${c.name}): ${c.description} (${c.gender}, ${c.age})`
            ).join('\n\n');

            const consistencyInstruction = `
            CRITICAL SYSTEM INSTRUCTION: Without changing the characters or the original format, from beginning to end.
            1. Character Faces & Characteristics: Please keep the characters’ faces and characteristics exactly the same in every scene.
            2. Project Scope: Please maintain everything exactly the same from Scene 1 to Scene ${sceneCount} — keep the characters’ faces and characteristics consistent in every scene.
            3. Art Style: Strictly maintain the ${selectedStyle} aesthetic throughout the entire storyboard.
            `;

            for (let i = 0; i < totalBatches; i++) {
                if (stopSignal.current) break;
                const startNum = i * BATCH_SIZE + 1;
                const scenesInThisBatch = Math.min(BATCH_SIZE, sceneCount - (i * BATCH_SIZE));
                
                const batchSummary = `
                ${consistencyInstruction}
                TASK: Generate detailed script for scenes ${startNum} to ${startNum + scenesInThisBatch - 1} of a ${sceneCount}-scene storyboard.
                STORY CONTEXT: ${selectedIdea.summary}
                CHARACTERS (PERSISTENT): ${charContext}
                STYLE: ${selectedStyle}
                `;

                const batchResult = await generateDetailedMvScript(batchSummary, characters, selectedStyle);
                
                const correctedBatch = batchResult.slice(0, scenesInThisBatch).map((s, idx) => ({
                    ...s,
                    scene_number: startNum + idx,
                    style: selectedStyle,
                    character_detail: charNames,
                    full_prompt: `Style: ${selectedStyle}. Character Detail: ${charContext}. Scene Action: ${s.action}. ${consistencyInstruction}`,
                    isLoading: false
                }));

                allScenes = [...allScenes, ...correctedBatch];
                setFinalScenes([...allScenes]);
                setProgress(Math.round(((i + 1) / totalBatches) * 100));

                if (i < totalBatches - 1) await new Promise(r => setTimeout(r, 1000));
            }
            
            setStep(3);
        } catch (err) {
            setError("Failed to create storyboard.");
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    };

    const handleGenerateImage = async (index: number) => {
        const scene = finalScenes[index];
        if (!scene) return;

        setFinalScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoading: true } : s));
        try {
            const url = await generateImage(scene.full_prompt, '16:9');
            setFinalScenes(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: url, isLoading: false } : s));
        } catch (err) {
            setFinalScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoading: false } : s));
        }
    };

    const handleCopyRaw = (text: string, index: number | string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(index);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleDownloadSingle = (url: string, num: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `MV_Sense_${num}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setStep(1);
        setInputStory('');
        setStoryIdeas([]);
        setSelectedIdea(null);
        setCharacters([]);
        setFinalScenes([]);
        setError(null);
        setSceneAudios({});
    };

    const handleStop = () => { stopSignal.current = true; setIsLoading(false); };

    useEffect(() => {
        if (step === 2) {
            setCharacters(prev => {
                if (charCount > prev.length) {
                    const newChars = [];
                    for (let i = prev.length; i < charCount; i++) {
                        newChars.push({ id: Date.now() + i, name: '', gender: 'Female', age: '', description: '', isSelected: true });
                    }
                    return [...prev, ...newChars];
                } else if (charCount < prev.length) {
                    return prev.slice(0, charCount);
                }
                return prev;
            });
        }
    }, [charCount, step]);

    // FIX: Defined missing ClearProjectButton component
    const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
        <div className="w-full flex justify-end mb-4">
            <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200">
                <TrashIcon /> Clear Project | សម្អាត
            </button>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center">
            <ClearProjectButton onClick={handleClear} />
            
            <div className="w-full mb-8 max-w-2xl">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-700 -z-10"></div>
                    {[1, 2, 3].map((s) => (
                        <div 
                            key={s} 
                            className={`flex flex-col items-center gap-2 ${step >= s ? 'text-purple-400' : 'text-gray-500'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all ${step >= s ? 'bg-purple-600 border-gray-800 text-white' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                                {s}
                            </div>
                            <span className="text-xs font-semibold bg-gray-900 px-2 rounded">
                                {s === 1 ? 'Ideas' : s === 2 ? 'Characters' : 'Production'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {step === 1 && (
                <div className="w-full bg-gray-800/60 p-6 rounded-xl border border-gray-700 animate-fade-in">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 text-center">Step 1: Get Story Ideas</h2>
                    <div className="mb-6 space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-900 p-3 rounded-lg border border-gray-600 hover:border-purple-500 transition">
                            <input type="checkbox" checked={isDirectMode} onChange={(e) => setIsDirectMode(e.target.checked)} className="w-5 h-5 text-purple-600 rounded bg-gray-800 border-gray-600 focus:ring-purple-500" />
                            <span className="text-sm font-bold text-gray-300">Paste Full Story (Direct Mode)</span>
                        </label>
                        <textarea value={inputStory} onChange={(e) => setInputStory(e.target.value)} placeholder={isDirectMode ? "Paste your full story..." : "e.g. A young girl finds a lost dragon..."} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-white h-48 resize-none focus:ring-2 focus:ring-purple-500 outline-none" />
                        {isDirectMode ? (
                             <button onClick={handleGoDirectMode} disabled={!inputStory.trim()} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black rounded-lg shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-widest">GO (Setup Characters) ➜</button>
                        ) : (
                            <button onClick={handleGenerateIdeas} disabled={isLoading || !inputStory.trim()} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">{isLoading ? <Spinner /> : '✨'} Get Story Ideas</button>
                        )}
                    </div>
                    {!isDirectMode && storyIdeas.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {storyIdeas.map((idea, idx) => (
                                <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition flex flex-col">
                                    <h3 className="font-bold text-white mb-2">{idea.title}</h3>
                                    <p className="text-xs text-gray-400 mb-4 flex-grow line-clamp-4">{idea.summary}</p>
                                    <button onClick={() => handleSelectIdea(idea)} className="w-full py-2 bg-gray-800 hover:bg-purple-600 text-white text-xs font-bold rounded border border-gray-600 hover:border-purple-500 transition">Choose Story</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 2 && selectedIdea && (
                <div className="w-full bg-gray-800/60 p-6 rounded-xl border border-gray-700 animate-fade-in">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 text-center">Step 2: Setup Cast & Style</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-6">
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 max-h-48 overflow-y-auto custom-scrollbar">
                                <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">Story Summary</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">{selectedIdea.summary}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Subject Count (1-6)</label>
                                    <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                                        <button onClick={() => setCharCount(Math.max(1, charCount - 1))} className="px-3 py-2 bg-gray-700 text-white hover:bg-gray-600">-</button>
                                        <input type="number" readOnly value={charCount} className="w-full text-center bg-transparent text-white font-bold" />
                                        <button onClick={() => setCharCount(Math.min(6, charCount + 1))} className="px-3 py-2 bg-gray-700 text-white hover:bg-gray-600">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Scenes (1-500)</label>
                                    <input type="number" value={sceneCount} onChange={e => setSceneCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white font-bold text-center focus:ring-1 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Visual Style</label>
                                <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none">
                                    {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <button onClick={handleGenerateCharacters} disabled={isLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg transition flex items-center justify-center gap-2">{isLoading ? <Spinner /> : '👥'} Auto-Generate Cast</button>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest px-1">Characters (Editable)</h3>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {characters.map((char, index) => (
                                    <div key={char.id} className="p-4 bg-[#252b3d] rounded-xl border border-gray-700 space-y-3 shadow-inner">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">CHARACTER {index + 1}</span>
                                            <button onClick={() => removeCharacter(char.id)} className="text-gray-500 hover:text-red-500 transition"><TrashIcon /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input value={char.name} onChange={e => handleUpdateCharacter(index, 'name', e.target.value)} placeholder="Name" className="bg-[#0f172a] border border-gray-600 rounded p-1.5 text-xs text-white" />
                                            <input value={char.age} onChange={e => handleUpdateCharacter(index, 'age', e.target.value)} placeholder="Age" className="bg-[#0f172a] border border-gray-600 rounded p-1.5 text-xs text-white" />
                                        </div>
                                        <textarea value={char.description} onChange={e => handleUpdateCharacter(index, 'description', e.target.value)} placeholder="Visual traits..." className="w-full bg-[#0f172a] border border-gray-600 rounded p-2 text-xs text-gray-300 resize-none h-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleCreateStory} disabled={isLoading || characters.length === 0} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-[0.98] text-lg flex items-center justify-center gap-3">{isLoading ? <><Spinner /> Architecting Story...</> : '🎬 Generate Storyboard 🚀'}</button>
                </div>
            )}

            {step === 3 && finalScenes.length > 0 && (
                <div className="w-full space-y-6 animate-fade-in h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                    <div className="bg-[#1a1f2e] p-5 rounded-2xl border border-gray-700 sticky top-0 z-10 backdrop-blur shadow-xl flex justify-between items-center">
                        <h3 className="text-xl font-black text-white">Storyboard Canvas ({finalScenes.length} Senses)</h3>
                        <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-bold transition border border-gray-700">Edit Settings</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {finalScenes.map((scene, idx) => (
                            <div key={idx} className="bg-[#1a1f2e] rounded-2xl overflow-hidden border border-gray-800 shadow-lg flex flex-col group hover:border-indigo-500/50 transition-all">
                                <div className="aspect-video bg-black relative flex items-center justify-center">
                                    {scene.imageUrl ? (
                                        <img src={scene.imageUrl} className="w-full h-full object-cover" alt="scene" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            {scene.isLoading ? <Spinner className="h-10 w-10 text-purple-500" /> : <button onClick={() => handleGenerateImage(idx)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg">Render Image</button>}
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded font-black border border-gray-700 shadow-md uppercase">Sense {scene.scene_number}</div>
                                    {scene.imageUrl && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                            <button onClick={() => handleDownloadSingle(scene.imageUrl!, scene.scene_number)} className="bg-white/20 p-3 rounded-full text-white backdrop-blur-md hover:scale-110 transition shadow-xl"><DownloadIcon /></button>
                                            <button onClick={() => handleGenerateImage(idx)} className="bg-white/20 p-3 rounded-full text-white backdrop-blur-md hover:scale-110 transition shadow-xl"><RefreshIcon /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-gray-900 to-black">
                                    <p className="text-gray-300 text-xs italic font-serif leading-relaxed mb-4 flex-grow">"{scene.action}"</p>
                                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-800">
                                        <button onClick={() => handleCopyRaw(scene.full_prompt, idx)} className="text-[10px] text-gray-500 hover:text-white transition font-black uppercase flex items-center gap-1">
                                            {copyStatus === idx ? <CheckIcon /> : <CopyIcon />} {copyStatus === idx ? 'Done' : 'Copy Prompt'}
                                        </button>
                                        <button onClick={() => handleCopyRaw(JSON.stringify(scene, null, 2), `json-${idx}`)} className="text-[10px] text-purple-400 hover:text-purple-300 transition font-black uppercase">JSON Code</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {error && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-4 bg-red-900 text-white rounded-lg shadow-2xl z-50">{error}</div>}
        </div>
    );
};

export default StoryGeneratorMv;
