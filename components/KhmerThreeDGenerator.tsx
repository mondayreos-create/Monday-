
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateConsistentStoryScript, generateImage, generateStoryIdeas, StoryIdea, generateYouTubeMetadata, YouTubeMetadata, generateVoiceover, generateVideo } from '../services/geminiService.ts';
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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

const AudioIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const VideoIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const YouTubeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

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
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
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

interface Scene {
    sceneNumber: number;
    action: string;
    consistentContext: string;
    imageUrl?: string;
    videoUrl?: string;
    isLoadingImage: boolean;
    isLoadingVideo: boolean;
}

const KhmerThreeDGenerator: React.FC = () => {
    const { t } = useLanguage();
    const [masterPrompt, setMasterPrompt] = useState('Kind Man Rescues Abandoned Mother Dog and Puppies - You Won\'t Believe The Ending!');
    const [sceneCount, setSceneCount] = useState(15);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [localHistory, setLocalHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Model Selection
    const [videoModel, setVideoModel] = useState('veo-3.1-fast-generate-preview');
    
    // Voice State
    const [sceneAudios, setSceneAudios] = useState<Record<number, { url: string | null; loading: boolean }>>({});

    const stopSignal = useRef(false);

    // Persistence
    useEffect(() => {
        const handleSave = (e: any) => {
            if (e.detail.tool !== 'khmer-three-d') return;
            const projectData = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'khmer-three-d',
                category: 'vip',
                title: "Khmer 3D Story Production",
                data: { masterPrompt, sceneCount, scenes, youtubeMeta, videoModel }
            };
            const existing = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([projectData, ...existing]));
            loadLocalHistory();
        };
        const handleLoad = (e: any) => {
            if (e.detail.tool !== 'khmer-three-d') return;
            const d = e.detail.data;
            if (d.masterPrompt) setMasterPrompt(d.masterPrompt);
            if (d.sceneCount) setSceneCount(d.sceneCount);
            if (d.scenes) setScenes(d.scenes);
            if (d.youtubeMeta) setYoutubeMeta(d.youtubeMeta);
            if (d.videoModel) setVideoModel(d.videoModel);
        };
        window.addEventListener('REQUEST_PROJECT_SAVE', handleSave);
        window.addEventListener('LOAD_PROJECT', handleLoad);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSave);
            window.removeEventListener('LOAD_PROJECT', handleLoad);
        };
    }, [masterPrompt, sceneCount, scenes, youtubeMeta, videoModel]);

    useEffect(() => {
        loadLocalHistory();
    }, []);

    const loadLocalHistory = () => {
        const historyRaw = localStorage.getItem('global_project_history');
        if (historyRaw) {
            try {
                const history = JSON.parse(historyRaw);
                const toolHistory = history.filter((p: any) => p.tool === 'khmer-three-d');
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
            const ideas = await generateStoryIdeas("Professional Khmer 3D Animation Idea: " + masterPrompt);
            setStoryIdeas(ideas);
        } catch (err) {
            setError("Failed to generate story ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleUseIdea = (idea: StoryIdea) => {
        setMasterPrompt(`Title: ${idea.title}\nSynopsis: ${idea.summary}\n\nFocus on professional storytelling in Khmer language, 3D character consistency, and high-impact emotional scenes.`);
        setStoryIdeas([]);
    };

    const handleGenerateScript = async () => {
        if (!masterPrompt.trim()) {
            setError("Please enter a master prompt.");
            return;
        }
        setIsLoading(true);
        setIsGeneratingScript(true);
        setError(null);
        setScenes([]);
        setYoutubeMeta(null);
        setSceneAudios({});

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = 'gemini-3-flash-preview';
            
            const prompt = `
                You are a professional Khmer storyteller and animation director.
                Create a highly detailed multi-scene animation script in 100% PURE KHMER LANGUAGE based on: "${masterPrompt}".
                
                STRICT REQUIREMENTS:
                1. Language: 100% Khmer (ភាសាខ្មែរ). DO NOT use any English words in the "action" text.
                2. Format: Exactly ${sceneCount} senses.
                3. Style: 3D Pixar Disney Style Animation.
                4. Continuity: Maintain strict character and setting consistency.
                5. Tone: Emotional and professional.
                
                OUTPUT JSON FORMAT:
                {
                    "senses": [
                        {
                            "sceneNumber": 1,
                            "action": "សាច់រឿងជាភាសាខ្មែរយ៉ាងត្រឹមត្រូវ ១០០%...",
                            "consistentContext": "English visual description for an AI image/video generator (detailed 3D style, lighting, character traits)..."
                        },
                        ...
                    ]
                }
            `;

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            senses: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sceneNumber: { type: Type.INTEGER },
                                        action: { type: Type.STRING },
                                        consistentContext: { type: Type.STRING }
                                    },
                                    required: ["sceneNumber", "action", "consistentContext"]
                                }
                            }
                        }
                    }
                }
            });

            const json = JSON.parse(response.text || "{}");
            if (json.senses && Array.isArray(json.senses)) {
                setScenes(json.senses.map((s: any) => ({ ...s, isLoadingImage: false, isLoadingVideo: false })));
            } else {
                throw new Error("Invalid response format.");
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate script.");
        } finally {
            setIsLoading(false);
            setIsGeneratingScript(false);
        }
    };

    const handleGenerateImage = async (index: number) => {
        const scene = scenes[index];
        if (!scene) return;

        setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingImage: true } : s));
        try {
            const prompt = `100% Realistic 3D Pixar Disney Animation Style, 8k. Action: ${scene.consistentContext}. Detailed textures, expressive characters, cinematic lighting. Maintain character face consistency. No text.`;
            const url = await generateImage(prompt, '16:9');
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: url, isLoadingImage: false } : s));
        } catch (err) {
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingImage: false } : s));
            setError("Image generation failed.");
        }
    };

    const handleGenerateVideoForSense = async (index: number) => {
        const scene = scenes[index];
        if (!scene || !scene.imageUrl) return;

        setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingVideo: true } : s));
        try {
            const [header, base64Data] = scene.imageUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
            
            const videoPrompt = `3D Animation, high quality, Pixar style. Motion: ${scene.consistentContext}. 100% Character consistency. No text in video. IMPORTANT: If there is any narration or speech generated, it MUST be in 100% PURE KHMER. No English speaking at all. Just ជាភាសារខ្មែរ យ៉ាងត្រឹមត្រូវ 100%.`;
            
            const blob = await generateVideo({
                model: videoModel,
                prompt: videoPrompt,
                image: { base64: base64Data, mimeType },
                aspectRatio: '16:9',
                resolution: '720p'
            });
            
            const url = URL.createObjectURL(blob);
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, videoUrl: url, isLoadingVideo: false } : s));
        } catch (err) {
            setScenes(prev => prev.map((s, i) => i === index ? { ...s, isLoadingVideo: false } : s));
            setError("Video generation failed.");
        }
    };

    const handlePlayKhmerVoice = async (index: number) => {
        const scene = scenes[index];
        if (!scene) return;
        
        // Use existing audio if available
        if (sceneAudios[index]?.url) {
            const audio = new Audio(sceneAudios[index].url!);
            audio.play();
            return;
        }

        setSceneAudios(prev => ({ ...prev, [index]: { url: null, loading: true } }));
        try {
            const base64Audio = await generateVoiceover(
                scene.action, 
                'Khmer', 
                'Zephyr', 
                undefined, 
                "Please read this Khmer text perfectly and clearly with a warm storytelling tone. Ensure 100% accurate Khmer pronunciation."
            );
            const bytes = decodeBase64ToUint8(base64Audio);
            const pcmInt16 = new Int16Array(bytes.buffer);
            const wavBlob = pcmToWav(pcmInt16, 1, 24000, 16);
            const url = URL.createObjectURL(wavBlob);
            
            setSceneAudios(prev => ({ ...prev, [index]: { url, loading: false } }));
            const audio = new Audio(url);
            audio.play();
        } catch (e) {
            setSceneAudios(prev => ({ ...prev, [index]: { url: null, loading: false } }));
            setError("Khmer TTS generation failed.");
        }
    };

    const handleGenerateMetadata = async () => {
        if (scenes.length === 0) return;
        setIsGeneratingMeta(true);
        setError(null);
        try {
            const context = `Khmer 3D Story Project: ${masterPrompt}\n\nStoryboard:\n${scenes.map(s => s.action).join('\n')}`;
            const meta = await generateYouTubeMetadata(
                "New Khmer 3D Animation Story | Emotional Rescues",
                context,
                "Khmer Animation & Storytelling"
            );
            setYoutubeMeta(meta);
        } catch (err) {
            setError("Failed to generate metadata.");
        } finally {
            setIsGeneratingMeta(false);
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
            sceneNumber: scene.sceneNumber,
            action: scene.action,
            visualPrompt: scene.consistentContext,
            fullPrompt: `100% Realistic 3D Pixar Disney Animation Style, 8k. Action: ${scene.consistentContext}. Detailed textures, expressive characters, cinematic lighting. Maintain character face consistency. No text.`
        };
        navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
        setCopyStatus(`json-${index}`);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleDownloadSingle = (url: string, num: number, ext: string = 'png') => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Khmer3D_Sense_${num}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setMasterPrompt('Kind Man Rescues Abandoned Mother Dog and Puppies - You Won\'t Believe The Ending!');
        setScenes([]);
        setStoryIdeas([]);
        setError(null);
        setYoutubeMeta(null);
        setSceneAudios({});
    };

    const handleReloadHistory = (project: any) => {
        window.dispatchEvent(new CustomEvent('LOAD_PROJECT', { detail: project }));
        setShowHistory(false);
    };

    const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
        <div className="w-full flex justify-end mb-4">
            <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200">
                <TrashIcon /> Clear Project | សម្អាត
            </button>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-fade-in">
            <ClearProjectButton onClick={handleClear} />
            
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
            </div>

            {/* History Overlay */}
            {showHistory && (
                <div className="w-full bg-gray-900/90 border-2 border-orange-500/50 p-6 rounded-2xl mb-8 animate-slide-down shadow-2xl relative z-20 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                            <HistoryIcon /> Khmer 3D History Vault
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
                                    <p className="text-white text-xs font-bold truncate mb-1">Khmer 3D Story</p>
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
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 mb-2 flex items-center gap-2">
                        <span>🇰🇭</span> Khmer 3D Story
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-700 pb-4">
                        100% Khmer Narrative Animation Studio.
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">{t('spins_box')}</label>
                            <button 
                                onClick={handleGenerateIdeas}
                                disabled={isGeneratingIdeas}
                                className="text-[10px] font-black text-orange-400 hover:text-orange-300 transition-colors uppercase flex items-center gap-1"
                            >
                                {isGeneratingIdeas ? <Spinner className="h-3 w-3 m-0"/> : <SparklesIcon className="h-3 w-3"/>}
                                Get Ideas
                            </button>
                        </div>
                        
                        {storyIdeas.length > 0 && (
                            <div className="space-y-2 animate-slide-down bg-black/40 p-3 rounded-xl border border-gray-700 mb-4">
                                <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-tighter mb-2">Select an Idea:</h4>
                                {storyIdeas.map((idea, idx) => (
                                    <div key={idx} className="bg-gray-800 p-2 rounded border border-gray-700 group">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-grow">
                                                <div className="text-[10px] font-bold text-white leading-tight mb-1">{idea.title}</div>
                                                <div className="text-[9px] text-gray-500 line-clamp-1 group-hover:line-clamp-none transition-all">{idea.description}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleUseIdea(idea)}
                                                className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-black rounded uppercase shadow"
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
                            placeholder="បញ្ចូលប្រធានបទរឿងរបស់អ្នកនៅទីនេះ..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white h-48 resize-none focus:ring-2 focus:ring-orange-500 outline-none shadow-inner text-sm leading-relaxed"
                        />
                    </div>

                    {/* Model Selection UI */}
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                            <span>🎥</span> Video Engine (Veo 3.1)
                        </label>
                        <div className="space-y-2">
                            {[
                                { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 - Fast', tag: 'Beta Audio', sub: '' },
                                { id: 'veo-3.1-fast-generate-preview-lp', label: 'Veo 3.1 - Fast [Lower Priority]', tag: 'Beta Audio', sub: '' },
                                { id: 'veo-3.1-generate-preview', label: 'Veo 3.1 - Quality', tag: 'Beta Audio', sub: '' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setVideoModel(m.id.replace('-lp', ''))}
                                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                        (videoModel === m.id || (m.id.includes('lp') && videoModel === 'veo-3.1-fast-generate-preview')) 
                                        ? 'bg-orange-900/20 border-orange-500 text-white shadow-lg' 
                                        : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            (videoModel === m.id || (m.id.includes('lp') && videoModel === 'veo-3.1-fast-generate-preview')) ? 'border-orange-400' : 'border-gray-600'
                                        }`}>
                                            {(videoModel === m.id || (m.id.includes('lp') && videoModel === 'veo-3.1-fast-generate-preview')) && <div className="w-2 h-2 rounded-full bg-orange-400"></div>}
                                        </div>
                                        <span className="text-[11px] font-bold text-left">{m.label}</span>
                                    </div>
                                    <span className="text-[8px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-black uppercase group-hover:bg-gray-600">{m.tag}</span>
                                </button>
                            ))}
                        </div>
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
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:brightness-110 text-white font-black rounded-xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        {isGeneratingScript ? <Spinner /> : '🛠️'} 
                        {isGeneratingScript ? 'កំពុងរៀបចំ...' : t('get_sense')}
                    </button>
                    
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-center text-xs animate-shake">{error}</div>}
                </div>

                {/* Right Panel: Sense Gallery */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700 shadow-xl flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 backdrop-blur gap-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Khmer Storyboard ({scenes.length} Senses)</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[85vh] overflow-y-auto custom-scrollbar pr-2 pb-20">
                        {scenes.map((scene, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col group hover:border-orange-500/50 transition-all duration-300">
                                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                                    {scene.videoUrl ? (
                                        <video src={scene.videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                                    ) : scene.imageUrl ? (
                                        <img src={scene.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={`Sense ${scene.sceneNumber}`} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            {scene.isLoadingImage ? (
                                                <>
                                                    <Spinner className="h-10 w-10 text-orange-500" />
                                                    <span className="text-[10px] text-gray-500 font-black uppercase animate-pulse">Rendering 3D Art...</span>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleGenerateImage(idx)}
                                                    className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-full text-[10px] uppercase shadow-lg transition-all"
                                                >
                                                    Render 3D Sense Art
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded font-black border border-gray-700 shadow-md">SENSE {scene.sceneNumber}</div>
                                    
                                    {/* Action Buttons Overlay for completed assets */}
                                    {(scene.imageUrl || scene.videoUrl) && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                            {scene.imageUrl && !scene.videoUrl && (
                                                <button 
                                                    onClick={() => handleGenerateVideoForSense(idx)}
                                                    disabled={scene.isLoadingVideo}
                                                    className="bg-purple-600 hover:bg-purple-500 p-3 rounded-full text-white transition transform hover:scale-110 shadow-xl"
                                                    title="Generate 4D Video"
                                                >
                                                    {scene.isLoadingVideo ? <Spinner className="h-5 w-5 m-0" /> : <VideoIcon />}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDownloadSingle(scene.videoUrl || scene.imageUrl!, scene.sceneNumber, scene.videoUrl ? 'mp4' : 'png')} 
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition transform hover:scale-110 shadow-xl" 
                                                title="Download Media"
                                            >
                                                <DownloadIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex-grow flex flex-col bg-gradient-to-b from-gray-900 to-black">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-gray-300 text-xs leading-relaxed italic border-l-2 border-orange-500 pl-3 line-clamp-3 group-hover:line-clamp-none transition-all flex-grow">
                                            "{scene.action}"
                                        </p>
                                        <button 
                                            onClick={() => handlePlayKhmerVoice(idx)}
                                            disabled={sceneAudios[idx]?.loading}
                                            className={`ml-3 p-2 rounded-full transition-all border ${sceneAudios[idx]?.loading ? 'bg-orange-900/20 border-orange-500' : 'bg-gray-800 border-gray-700 hover:bg-orange-600 text-white shadow-lg'}`}
                                            title="Speak Khmer Script"
                                        >
                                            {sceneAudios[idx]?.loading ? <Spinner className="h-4 w-4 m-0" /> : <AudioIcon />}
                                        </button>
                                    </div>
                                    <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-800 pt-3">
                                        <button 
                                            onClick={() => handleCopy(scene.action, `p-${idx}`)} 
                                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition font-black uppercase flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-700"
                                        >
                                            {copyStatus === `p-${idx}` ? '✓ Copied' : <><CopyIcon /> Prompt</>}
                                        </button>
                                        <button 
                                            onClick={() => handleCopyJson(idx)} 
                                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-orange-400 hover:text-orange-300 transition font-black uppercase flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-700"
                                        >
                                            {copyStatus === `json-${idx}` ? '✓ Done' : <><JsonIcon /> JSON</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {scenes.length === 0 && !isGeneratingScript && (
                            <div className="col-span-full py-20 text-center bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center">
                                 <div className="text-6xl mb-4 opacity-10">🇰🇭</div>
                                 <p className="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Canvas Ready for Storytelling</p>
                                 <p className="text-[10px] text-gray-700 mt-2">Enter your Story Concept and click "Get Sense Script" to start.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KhmerThreeDGenerator;
