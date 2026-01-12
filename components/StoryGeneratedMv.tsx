import React, { useState, useRef, useEffect } from 'react';
import { analyzeCharacterReference, generateImage, generateYouTubeMetadata, ImageReference, CharacterAnalysis, YouTubeMetadata, Character } from '../services/geminiService.ts';
import { GoogleGenAI, Type } from "@google/genai";

const Spinner: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className || 'h-5 w-5 text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CopyIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const JsonIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const YouTubeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="w-full flex justify-end mb-4">
        <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Clear Project
        </button>
    </div>
);

interface CharacterSlot {
    id: number;
    name: string;
    gender: string;
    age: string;
    description: string;
    image: ImageReference | null;
    analysis?: CharacterAnalysis;
}

interface GeneratedScene {
    sceneNumber: number;
    description: string;
    imageUrl?: string;
    isLoading: boolean;
    promptUsed?: string;
}

const StoryGeneratedMv: React.FC = () => {
    const [characterCount, setCharacterCount] = useState(2);
    const [characters, setCharacters] = useState<CharacterSlot[]>(
        Array.from({ length: 6 }, (_, i) => ({ 
            id: i + 1, 
            name: '', 
            gender: 'Female', 
            age: '', 
            description: '', 
            image: null 
        }))
    );
    const [synopsis, setSynopsis] = useState('');
    const [sceneCount, setSceneCount] = useState(12);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [scenes, setScenes] = useState<GeneratedScene[]>([]);
    const [copyState, setCopyState] = useState<string | null>(null);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    
    const stopSignal = useRef(false);

    const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setCharacters(prev => prev.map((c, i) => i === index ? {
                    ...c,
                    image: { base64: base64String.split(',')[1], mimeType: file.type }
                } : c));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateCharacter = (index: number, field: keyof CharacterSlot, value: string) => {
        setCharacters(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    };

    const handleCopyCharPrompt = (index: number) => {
        const char = characters[index];
        if (!char) return;
        const prompt = `Character Name: ${char.name}. Gender: ${char.gender}. Age: ${char.age}. Appearance: ${char.description}. Style: 3D Animation, Consistent Face.`;
        navigator.clipboard.writeText(prompt);
        setCopyState(`char-${index}`);
        setTimeout(() => setCopyState(null), 2000);
    };

    const handleStart = async () => {
        const activeChars = characters.slice(0, characterCount);
        if (activeChars.some(c => !c.image) || !synopsis.trim()) {
            setError("Please upload images for all selected characters and provide a story synopsis.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setScenes([]);
        setYoutubeMeta(null);
        setProgress(0);
        stopSignal.current = false;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            setStatusText('Analyzing Character References...');
            setProgress(5);
            
            const updatedChars = [...characters];
            for (let i = 0; i < characterCount; i++) {
                if (stopSignal.current) break;
                setStatusText(`Analyzing Character ${i + 1}/${characterCount}...`);
                const char = activeChars[i];
                if (char.image) {
                    const analysis = await analyzeCharacterReference(char.image.base64, char.image.mimeType);
                    updatedChars[i] = { ...char, analysis, description: char.description || analysis.characterDescription };
                }
            }
            setCharacters(updatedChars);
            setProgress(15);

            const consistencyInstruction = `
            CRITICAL: Without changing the characters or the original format, from beginning to end.
            1. Character Faces: Keep every character face 100% identical and recognizable across all scenes.
            2. Character Outfits: Maintain the same clothing throughout.
            3. Style: High-quality 3D Pixar/Disney Animation Render.
            `;

            const charContext = updatedChars.slice(0, characterCount).map((c, idx) => 
                `Character ${idx + 1} (${c.name}): ${c.description}`
            ).join('\n\n');

            setStatusText('Writing Story Script...');
            // Batch size reduced to 10 to prevent JSON truncation
            const BATCH_SIZE = 10;
            const numBatches = Math.ceil(sceneCount / BATCH_SIZE);
            let fullScript: any[] = [];

            for (let b = 0; b < numBatches; b++) {
                if (stopSignal.current) break;
                const startNum = b * BATCH_SIZE + 1;
                const countInBatch = Math.min(BATCH_SIZE, sceneCount - fullScript.length);
                setStatusText(`Writing Batch ${b + 1}/${numBatches}...`);

                const scriptPrompt = `
                    Generate a script for scenes ${startNum} to ${startNum + countInBatch - 1} of a ${sceneCount}-scene storyboard.
                    SYNOPSIS: ${synopsis}
                    CHARACTERS: ${charContext}
                    ${consistencyInstruction}
                    
                    OUTPUT JSON ARRAY: { "sceneNumber": number, "action": string, "consistentContext": string }
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: scriptPrompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    sceneNumber: { type: Type.INTEGER },
                                    action: { type: Type.STRING },
                                    consistentContext: { type: Type.STRING }
                                }
                            }
                        }
                    }
                });

                const batch = JSON.parse(response.text || "[]");
                fullScript = [...fullScript, ...batch];
                setProgress(15 + Math.round(((b + 1) / numBatches) * 10));
            }

            if (stopSignal.current) return;

            const initialScenes: GeneratedScene[] = fullScript.map(s => ({
                sceneNumber: s.sceneNumber,
                description: s.action,
                isLoading: true
            }));
            setScenes(initialScenes);
            setProgress(25);

            for (let i = 0; i < initialScenes.length; i++) {
                if (stopSignal.current) break;
                setStatusText(`Rendering Scene ${i + 1} of ${sceneCount}...`);

                const scene = initialScenes[i];
                const fullPrompt = `
                    Style: 3D Pixar Animation. ${consistencyInstruction}
                    Characters: ${charContext}
                    Action: ${fullScript[i].action}
                    Setting: ${fullScript[i].consistentContext}
                `;

                try {
                    const imageUrl = await generateImage(fullPrompt, '16:9');
                    setScenes(prev => prev.map(s => 
                        s.sceneNumber === scene.sceneNumber 
                            ? { ...s, imageUrl: imageUrl, isLoading: false, promptUsed: fullPrompt } 
                            : s
                    ));
                } catch (err) {
                    setScenes(prev => prev.map(s => 
                        s.sceneNumber === scene.sceneNumber 
                            ? { ...s, isLoading: false, promptUsed: fullPrompt } 
                            : s
                    ));
                }

                setProgress(25 + Math.round(((i + 1) / initialScenes.length) * 75));
                if (i < initialScenes.length - 1) await new Promise(r => setTimeout(r, 1000));
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setIsProcessing(false);
            setStatusText('');
        }
    };

    const handleStop = () => {
        stopSignal.current = true;
        setIsProcessing(false);
    };

    const handleClear = () => {
        setCharacters(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: '', gender: 'Female', age: '', description: '', image: null })));
        setSynopsis('');
        setScenes([]);
        setError(null);
        setProgress(0);
        setSceneCount(12);
        setYoutubeMeta(null);
    };

    const handleDownloadImage = (url: string, num: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `MV_Sense_${num}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // FIX: Implemented handleRegenerateImage to fix "Cannot find name 'handleRegenerateImage'" error.
    const handleRegenerateImage = async (index: number) => {
        const scene = scenes[index];
        if (!scene || !scene.promptUsed) return;

        setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoading: true, imageUrl: undefined } : s));

        try {
            const imageUrl = await generateImage(scene.promptUsed, '16:9');
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: imageUrl, isLoading: false } : s));
        } catch (err) {
            console.error(`Failed to regenerate image for scene ${scene.sceneNumber}`, err);
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoading: false } : s));
        }
    };

    // FIX: Implemented handleCopySceneJson to fix "Cannot find name 'handleCopySceneJson'" error.
    const handleCopySceneJson = (index: number) => {
        const scene = scenes[index];
        if (scene) {
            navigator.clipboard.writeText(JSON.stringify(scene, null, 2));
            setCopyState(`json-${index}`);
            setTimeout(() => setCopyState(null), 2000);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center">
            <ClearProjectButton onClick={handleClear} />
            
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Inputs */}
                <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-gray-800 h-fit space-y-6 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📽️</span>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                            Story Generated MV (Pro)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">1. Number of Characters (1-6)</label>
                            <div className="flex items-center bg-[#0f172a] rounded-xl border border-gray-700 overflow-hidden w-full">
                                <button onClick={() => setCharacterCount(Math.max(1, characterCount - 1))} className="px-5 py-3 bg-[#1e293b] hover:bg-gray-700 text-white font-bold transition">-</button>
                                <input readOnly value={characterCount} className="w-full text-center bg-transparent outline-none text-white font-black text-xl" />
                                <button onClick={() => setCharacterCount(Math.min(6, characterCount + 1))} className="px-5 py-3 bg-[#1e293b] hover:bg-gray-700 text-white font-bold transition">+</button>
                            </div>
                        </div>

                        {/* Character Cards List */}
                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                            {characters.slice(0, characterCount).map((char, index) => (
                                <div key={char.id} className="p-4 bg-[#252b3d] rounded-xl border border-gray-700/50 shadow-inner flex flex-col gap-3 group">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-[#0f172a] rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center shrink-0 overflow-hidden relative">
                                            {char.image ? (
                                                <img src={`data:${char.image.mimeType};base64,${char.image.base64}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <label className="cursor-pointer text-[10px] text-gray-500 font-bold uppercase p-2 text-center">📷 Upload</label>
                                            )}
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-[11px] text-indigo-400 font-black uppercase tracking-widest">CHARACTER {index + 1}</div>
                                                <button 
                                                    onClick={() => handleCopyCharPrompt(index)}
                                                    className="text-[9px] bg-[#1e293b] hover:bg-[#334155] text-gray-400 hover:text-white px-2 py-1 rounded transition border border-gray-700 flex items-center gap-1"
                                                >
                                                    <CopyIcon className="h-3 w-3" /> Copy Prompt
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-1">
                                                    <label className="text-[8px] text-gray-500 font-bold uppercase block mb-0.5">Name</label>
                                                    <input value={char.name} onChange={e => handleUpdateCharacter(index, 'name', e.target.value)} className="w-full bg-[#0f172a] border-none rounded p-1.5 text-xs text-white" />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-[8px] text-gray-500 font-bold uppercase block mb-0.5">Age</label>
                                                    <input value={char.age} onChange={e => handleUpdateCharacter(index, 'age', e.target.value)} className="w-full bg-[#0f172a] border-none rounded p-1.5 text-xs text-white" />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-[8px] text-gray-500 font-bold uppercase block mb-0.5">Female</label>
                                                    <select value={char.gender} onChange={e => handleUpdateCharacter(index, 'gender', e.target.value)} className="w-full bg-[#0f172a] border-none rounded p-1.5 text-xs text-white">
                                                        <option>Female</option><option>Male</option><option>Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <textarea 
                                        value={char.description}
                                        onChange={(e) => handleUpdateCharacter(index, 'description', e.target.value)}
                                        placeholder="Detailed visual characteristics..."
                                        className="w-full bg-[#0f172a] border-none rounded-lg p-2 text-xs text-gray-300 resize-none h-14 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">2. Story Synopsis (សាច់រឿងសង្ខេប)</label>
                            <textarea 
                                value={synopsis}
                                onChange={(e) => setSynopsis(e.target.value)}
                                placeholder="Describe the story path..."
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-4 text-white h-40 resize-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">3. Total Senses (1-600)</label>
                            <input 
                                type="number" min="1" max="600" 
                                value={sceneCount}
                                onChange={(e) => setSceneCount(Math.max(1, Math.min(600, parseInt(e.target.value) || 1)))}
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl p-3 text-white font-black text-center text-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <button 
                            onClick={handleStart} 
                            disabled={isProcessing || synopsis === ''}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-3"
                        >
                            {isProcessing ? <Spinner /> : '🚀'} Get Go (Auto Create) 🚀
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl animate-fade-in">
                            <p className="text-red-400 text-xs font-medium leading-relaxed">{error}</p>
                        </div>
                    )}
                    
                    {isProcessing && (
                        <div className="space-y-2">
                             <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                <span>PRODUCTION PROGRESS</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-[10px] text-center text-indigo-300 animate-pulse font-bold">{statusText}</p>
                        </div>
                    )}
                </div>

                {/* Right side: Results */}
                <div className="lg:col-span-2 space-y-6 h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                    <div className="bg-[#1a1f2e] p-5 rounded-2xl border border-gray-800 sticky top-0 z-10 backdrop-blur shadow-xl flex justify-between items-center">
                        <h3 className="text-xl font-black text-white">Project Canvas ({scenes.length} Senses)</h3>
                        <div className="flex gap-2">
                            {scenes.length > 0 && (
                                <button onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(scenes, null, 2));
                                    setCopyState('all-json');
                                    setTimeout(() => setCopyState(null), 2000);
                                }} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs font-bold transition border border-gray-700 flex items-center gap-2">
                                    {copyState === 'all-json' ? '✓' : <JsonIcon />} {copyState === 'all-json' ? 'Copied' : 'Copy All'}
                                </button>
                            )}
                            <button onClick={handleStop} disabled={!isProcessing} className="px-4 py-2 bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-xs font-bold transition">Stop</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {scenes.map((scene, idx) => (
                            <div key={idx} className="bg-[#1a1f2e] rounded-2xl overflow-hidden border border-gray-800 shadow-lg flex flex-col group hover:border-indigo-500/50 transition-all">
                                <div className="aspect-video bg-black relative flex items-center justify-center">
                                    {scene.imageUrl ? (
                                        <img src={scene.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            {scene.isLoading ? (
                                                <>
                                                    <Spinner className="h-10 w-10 text-indigo-500" />
                                                    <span className="text-[10px] text-gray-500 font-black uppercase animate-pulse">Rendering...</span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-gray-600 font-bold">READY TO RENDER</span>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded font-black border border-gray-700 shadow-md">SENSE {scene.sceneNumber}</div>
                                    {scene.imageUrl && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                            <button onClick={() => handleDownloadImage(scene.imageUrl!, scene.sceneNumber)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition transform hover:scale-110 shadow-xl"><DownloadIcon /></button>
                                            <button onClick={() => handleRegenerateImage(idx)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition transform hover:scale-110 shadow-xl"><RefreshIcon /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex-grow flex flex-col">
                                    <p className="text-gray-300 text-[11px] leading-relaxed italic mb-4 line-clamp-3 min-h-[3.3rem]">"{scene.description}"</p>
                                    <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-800">
                                        <button onClick={() => {
                                            navigator.clipboard.writeText(scene.promptUsed || '');
                                            setCopyState(`prompt-${idx}`);
                                            setTimeout(() => setCopyState(null), 2000);
                                        }} className="text-[10px] text-gray-500 hover:text-white transition font-black uppercase" disabled={!scene.promptUsed}>
                                            {copyState === `prompt-${idx}` ? '✓ Copied' : 'Prompt'}
                                        </button>
                                        <button onClick={() => handleCopySceneJson(idx)} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition font-black uppercase">
                                            {copyState === `json-${idx}` ? '✓ Done' : 'JSON'}
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

export default StoryGeneratedMv;