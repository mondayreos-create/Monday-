import React, { useState, useCallback, useRef, useEffect } from 'react';
import IdeaGenerator from './IdeaGenerator.tsx';
import StoryGenerator from './StoryGenerator.tsx';
import MovieTrailerGenerator from './MovieTrailerGenerator.tsx';
import { 
    generateLyrics, generateScenesFromLyrics, 
    generateCharacters, Character as ServiceCharacter,
    generateSimpleStory, generateVlogScript, VlogScriptResponse,
    generateVideo, generateYouTubeMetadata, YouTubeMetadata, analyzeCharacterReference,
    generateScenesFromStory, VisualScene, generateSongMusicPrompt,
    generateVlogStoryboardBatch, VlogStoryboardScene
} from '../services/geminiService.ts';
import { useLanguage } from './LanguageContext.tsx';
import { GoogleGenAI, Type } from "@google/genai";

// --- Icons ---
const CopyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h8M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const Spinner: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin h-5 w-5 ${className ?? 'mr-3'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const RefreshIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="w-full flex justify-end mb-4">
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200"
            aria-label="Clear current project"
        >
            <TrashIcon />
            Clear Project
        </button>
    </div>
);

const songStoryStyles = [
    'Disney Style 3D',
    'Pixar Animation',
    'Anime / Studio Ghibli',
    'Watercolor Illustration',
    'Storybook Hand-Drawn',
    'Paper Cutout',
    'Claymation',
    'Low Poly 3D',
    'Cinematic Realistic',
    '3D Cartoon, Cocomelon Style',
    '3D Cartoon, BabyBus Style'
];

interface GeneratedScene {
    number: number;
    text: string;
    prompt: string;
    lyric_segment?: string;
    narrative?: string;
    visual_prompt?: string;
    visual_description?: string;
}

const SongStoryCreator: React.FC = () => {
    const [audience, setAudience] = useState<'kids' | 'adults'>('kids');
    const [activeStep, setActiveStep] = useState<1 | 2>(1);
    const [contentType, setContentType] = useState<'lyrics' | 'story'>('lyrics');
    const [topic, setTopic] = useState('');
    const [characters, setCharacters] = useState<{id: number, name: string, desc: string}[]>([{id: 1, name: '', desc: ''}]);
    
    // New Settings
    const [visualStyle, setVisualStyle] = useState(songStoryStyles[0]);
    const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false);
    const [aiCharacterCount, setAiCharacterCount] = useState(2);
    
    // Updated Image Features (Array of Images)
    const [useRefImage, setUseRefImage] = useState(false);
    const [refImages, setRefImages] = useState<{base64: string, mimeType: string}[]>([]);
    const [refStyle, setRefStyle] = useState('');
    const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);

    // Duration Settings
    const [duration, setDuration] = useState(2); // Minutes (1-10)

    // Result
    const [generatedTitle, setGeneratedTitle] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [scenes, setScenes] = useState<GeneratedScene[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [sceneCopyStatus, setSceneCopyStatus] = useState<number | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    // YouTube Kit & Music Prompt
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [musicPrompt, setMusicPrompt] = useState('');
    const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);

    // PERSISTENCE LISTENER
    useEffect(() => {
        const handleSaveRequest = (e: any) => {
            if (e.detail.tool !== 'kids-story-generator') return;
            const projectData = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'kids-story-generator',
                category: 'writing',
                title: "Story Studio",
                data: {
                    audience,
                    contentType,
                    topic,
                    characters,
                    visualStyle,
                    duration,
                    generatedTitle,
                    generatedContent,
                    scenes
                }
            };
            const existing = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([projectData, ...existing]));
        };

        const handleLoadRequest = (e: any) => {
            if (e.detail.tool !== 'kids-story-generator') return;
            const d = e.detail.data;
            if (d.audience) setAudience(d.audience);
            if (d.contentType) setContentType(d.contentType);
            if (d.topic) setTopic(d.topic);
            if (d.characters) setCharacters(d.characters);
            if (d.visualStyle) setVisualStyle(d.visualStyle);
            if (d.duration) setDuration(d.duration);
            if (d.generatedTitle) setGeneratedTitle(d.generatedTitle);
            if (d.generatedContent) setGeneratedContent(d.generatedContent);
            if (d.scenes) setScenes(d.scenes);
            setError(null);
        };

        window.addEventListener('REQUEST_PROJECT_SAVE', handleSaveRequest);
        window.addEventListener('LOAD_PROJECT', handleLoadRequest);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSaveRequest);
            window.removeEventListener('LOAD_PROJECT', handleLoadRequest);
        };
    }, [audience, contentType, topic, characters, visualStyle, duration, generatedTitle, generatedContent, scenes]);

    const handleCharacterChange = (index: number, field: 'name' | 'desc', value: string) => {
        const newChars = [...characters];
        newChars[index][field] = value;
        setCharacters(newChars);
    };

    const addCharacter = () => {
        setCharacters([...characters, {id: Date.now(), name: '', desc: ''}]);
    };

    const removeCharacter = (index: number) => {
        const newChars = [...characters];
        newChars.splice(index, 1);
        setCharacters(newChars);
    };

    const handleRefImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (refImages.length >= 5) {
                setError("You can upload a maximum of 5 images.");
                return;
            }
            setIsAnalyzingRef(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const newRef = { base64, mimeType: file.type };
                setRefImages(prev => [...prev, newRef]);
                if (refImages.length === 0) {
                    try {
                        const analysis = await analyzeCharacterReference(base64, file.type);
                        setRefStyle(analysis.artStyle);
                        setVisualStyle(analysis.artStyle); 
                    } catch (e) {
                        console.error("Analysis failed", e);
                    }
                }
                setIsAnalyzingRef(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeRefImage = (index: number) => {
        setRefImages(prev => prev.filter((_, i) => i !== index));
        if (refImages.length <= 1) {
            setRefStyle('');
        }
    };

    const handleAutoGenerateCharacters = async () => {
        if (!topic.trim()) {
            setError("Please enter a topic first.");
            return;
        }
        setIsGeneratingCharacters(true);
        setError(null);
        try {
             const currentStyle = useRefImage && refStyle ? refStyle : visualStyle;
             const styleContext = currentStyle.toLowerCase().includes('3d') ? currentStyle : `${currentStyle} (3D Render Style)`;
             let prompt = `Create ${aiCharacterCount} detailed characters for a ${audience} ${contentType} about: "${topic}".
             Visual Style: ${styleContext}.
             IMPORTANT: Describe their appearance as 3D characters (textures, lighting, 3D features).`;
             if (useRefImage && refImages.length > 0) {
                 prompt += ` Based on the style of the uploaded reference image: ${refStyle}.`;
             }
             const chars = await generateCharacters(prompt, aiCharacterCount);
             const mapped = chars.map((c, i) => ({
                 id: Date.now() + i,
                 name: c.name,
                 desc: c.description
             }));
             setCharacters(mapped);
             setActiveStep(2);
        } catch (e) {
            setError("Failed to auto-generate characters.");
        } finally {
            setIsGeneratingCharacters(false);
        }
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Please describe what the song/story should be about.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedTitle('');
        setGeneratedContent('');
        setScenes([]);
        setYoutubeMeta(null);
        setMusicPrompt('');

        try {
            let enforcedStyle = visualStyle;
            if (useRefImage && refStyle) enforcedStyle = refStyle;
            if (useRefImage || !enforcedStyle.toLowerCase().includes('3d')) enforcedStyle = `${enforcedStyle} (3D Render Style)`;
            
            const charDesc = characters.filter(c => c.name).map(c => `${c.name}: ${c.desc}`).join(', ');
            const fullTopic = `${topic} (Story Summary). Audience: ${audience}. Visual Style: ${enforcedStyle}. ${charDesc ? `Characters: ${charDesc}` : ''}`;
            const sceneCount = Math.ceil((duration * 60) / 8);

            if (contentType === 'lyrics') {
                const res = await generateLyrics({
                    topic: fullTopic,
                    style: audience === 'kids' ? 'Nursery Rhyme/Fun' : 'Pop/Ballad',
                    mood: audience === 'kids' ? 'Happy' : 'Emotional'
                });
                setGeneratedTitle(res.songTitle);
                setGeneratedContent(res.songLyrics);
                const lyricScenes = await generateScenesFromLyrics(res.songLyrics, enforcedStyle, sceneCount, `Characters: ${charDesc}. Summary: ${topic}`);
                setScenes(lyricScenes.map(s => ({ number: s.scene_number, text: s.lyric_segment, prompt: s.prompt, visual_description: s.visual_description, lyric_segment: s.lyric_segment })));
            } else {
                const res = await generateSimpleStory({ topic: fullTopic, style: audience === 'kids' ? 'Fairy Tale' : 'Short Story', length: 'Short' });
                setGeneratedTitle(res.storyTitle);
                setGeneratedContent(res.storyContent);
                const storyContext = `Story: ${res.storyContent}\nCharacters: ${charDesc}\nStyle: ${enforcedStyle}\nSummary: ${topic}`;
                const visualScenes = await generateScenesFromStory(storyContext, sceneCount);
                setScenes(visualScenes.map(s => ({ number: s.scene_number, text: s.narrative, prompt: s.visual_prompt, narrative: s.narrative, visual_prompt: s.visual_prompt })));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateYoutubeKit = async () => {
        if (!generatedTitle || !generatedContent) return;
        setIsGeneratingMeta(true);
        try {
            const meta = await generateYouTubeMetadata(generatedTitle, generatedContent.substring(0, 500), contentType === 'lyrics' ? 'Song' : 'Story');
            setYoutubeMeta(meta);
        } catch (e) {
            setError("Failed to generate YouTube Metadata");
        } finally {
            setIsGeneratingMeta(false);
        }
    };

    const handleGenerateMusicPrompt = async () => {
         if (!generatedTitle || contentType !== 'lyrics') return;
         setIsGeneratingMusic(true);
         try {
             const prompt = await generateSongMusicPrompt(generatedTitle, audience === 'kids' ? 'Kids Song' : 'Pop');
             setMusicPrompt(prompt);
         } catch (e) {
             setError("Failed to generate music prompt");
         } finally {
             setIsGeneratingMusic(false);
         }
    };

    const handleCopy = () => {
        if (!generatedContent) return;
        const charText = characters.filter(c => c.name).map(c => `• ${c.name}: ${c.desc}`).join('\n');
        const text = `Title: ${generatedTitle}\n\nVisual Style: ${visualStyle}\n\n${charText ? `Character Detail:\n${charText}\n\n` : ''}Content:\n${generatedContent}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleCopyScene = (scene: GeneratedScene, index: number) => {
        const charText = characters.filter(c => c.name).map(c => `• ${c.name}: ${c.desc}`).join('\n');
        const text = `Character Detail:\n${charText}\n\nStyle Visual Style:\n${useRefImage ? refStyle + ' (3D)' : visualStyle}\n\nScene ${scene.number} Prompt:\n${scene.prompt}`;
        navigator.clipboard.writeText(text);
        setSceneCopyStatus(index);
        setTimeout(() => setSceneCopyStatus(null), 2000);
    };

    const handleClear = () => {
        setTopic('');
        setCharacters([{id: Date.now(), name: '', desc: ''}]);
        setGeneratedTitle('');
        setGeneratedContent('');
        setScenes([]);
        setError(null);
        setActiveStep(1);
        setVisualStyle(songStoryStyles[0]);
        setDuration(2);
        setUseRefImage(false);
        setRefImages([]);
        setYoutubeMeta(null);
        setMusicPrompt('');
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700 h-fit">
                <ClearProjectButton onClick={handleClear} />
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Song & Story Creator</h2>
                    <p className="text-gray-400 text-sm">Create lyrics or short stories for any audience.</p>
                </div>
                <div className="bg-gray-900/50 p-1 rounded-lg flex mb-6 border border-gray-700">
                    <button onClick={() => setAudience('kids')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${audience === 'kids' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>For Kids</button>
                    <button onClick={() => setAudience('adults')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${audience === 'adults' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>For Adults</button>
                </div>
                <div className="flex border-b border-gray-700 mb-6">
                     <button onClick={() => setActiveStep(1)} className={`flex-1 py-2 text-sm font-semibold border-b-2 transition ${activeStep === 1 ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>1. Details</button>
                    <button onClick={() => setActiveStep(2)} className={`flex-1 py-2 text-sm font-semibold border-b-2 transition ${activeStep === 2 ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>2. Characters</button>
                </div>
                {activeStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                         <div className="bg-gray-900/50 p-1 rounded-lg flex border border-gray-700">
                            <button onClick={() => setContentType('lyrics')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${contentType === 'lyrics' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Song Lyrics</button>
                            <button onClick={() => setContentType('story')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${contentType === 'story' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Short Story</button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">What should the {contentType === 'lyrics' ? 'song' : 'story'} be about?</label>
                            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={contentType === 'lyrics' ? "e.g., A song about sharing toys..." : "e.g., A magical adventure in a candy forest..."} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white h-24 resize-none focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                         <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
                             <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input type="checkbox" checked={useRefImage} onChange={e => setUseRefImage(e.target.checked)} className="w-4 h-4 text-cyan-500 rounded bg-gray-800 border-gray-600 focus:ring-cyan-500" />
                                <span className="font-bold text-cyan-400 text-sm">Updated Image (Visual Reference)</span>
                            </label>
                            {useRefImage && (
                                <div className="animate-fade-in">
                                    <p className="text-[10px] text-yellow-500 mb-2 font-semibold">* Note: Visual Style locked to 3D. Character Auto-gen disabled. Max 5 images.</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {refImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square bg-gray-800 rounded border border-gray-600 group">
                                                <img src={`data:${img.mimeType};base64,${img.base64}`} alt="Ref" className="w-full h-full object-cover rounded" />
                                                <button onClick={() => removeRefImage(idx)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition text-[10px]">✕</button>
                                            </div>
                                        ))}
                                        {refImages.length < 5 && (
                                            <label className="flex flex-col items-center justify-center aspect-square bg-gray-800 rounded border border-gray-600 cursor-pointer hover:bg-gray-700 transition">
                                                <span className="text-xl">📷</span>
                                                <input type="file" accept="image/*" onChange={handleRefImageUpload} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{isAnalyzingRef ? <span className="text-yellow-400 animate-pulse">Analyzing style...</span> : refStyle ? <span className="text-green-400">Detected: {refStyle}</span> : "Upload images to detect style."}</div>
                                </div>
                            )}
                        </div>
                        {!useRefImage && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Visual Style</label>
                                <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none">{songStoryStyles.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            </div>
                        )}
                    </div>
                )}
                {activeStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        {!useRefImage && (
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-4">
                                <label className="text-sm font-semibold text-gray-300">Auto-generate 🎭 Characters</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="number" min="1" max="5" value={aiCharacterCount} onChange={(e) => setAiCharacterCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))} className="w-16 bg-gray-800 border border-gray-600 rounded p-1.5 text-center text-white text-sm" />
                                    <button onClick={handleAutoGenerateCharacters} disabled={isGeneratingCharacters || !topic.trim()} className="flex-grow bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold py-2 px-4 rounded transition flex items-center justify-center gap-2 disabled:opacity-50">{isGeneratingCharacters ? <Spinner className="h-3 w-3"/> : '✨ Auto Generate'}</button>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-300">Manual Characters</label>
                            <button onClick={addCharacter} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white flex items-center gap-1">Add</button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {characters.map((char, idx) => (
                                <div key={char.id} className="bg-gray-900 p-3 rounded-lg border border-gray-700 relative">
                                    {characters.length > 1 && (<button onClick={() => removeCharacter(idx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500"><TrashIcon/></button>)}
                                    <input type="text" placeholder="Name" value={char.name} onChange={(e) => handleCharacterChange(idx, 'name', e.target.value)} className="w-full bg-transparent border-b border-gray-700 mb-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-bold" />
                                    <textarea placeholder="Description..." value={char.desc} onChange={(e) => handleCharacterChange(idx, 'desc', e.target.value)} className="w-full bg-transparent text-xs text-gray-300 focus:outline-none resize-none h-12" />
                                </div>
                            ))}
                        </div>
                         <div className="mt-4 pt-4 border-t border-gray-700">
                             <label className="block text-sm font-semibold text-gray-300 mb-2">Duration (Minutes)</label>
                             <div className="flex items-center bg-gray-900 rounded-lg border border-gray-600 overflow-hidden w-32">
                                <button onClick={() => setDuration(Math.max(1, duration - 1))} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold transition">-</button>
                                <input type="number" value={duration} onChange={(e) => setDuration(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} className="w-full text-center bg-transparent outline-none text-white font-bold text-sm" />
                                <button onClick={() => setDuration(Math.min(10, duration + 1))} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold transition">+</button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">{duration} mins ≈ {Math.ceil((duration * 60) / 8)} Scenes (8s each)</p>
                         </div>
                    </div>
                )}
                 <div className="mt-8">
                    <button onClick={handleGenerate} disabled={isLoading || !topic.trim()} className={`w-full py-3 font-bold text-white rounded-lg shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${contentType === 'lyrics' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'}`}>{isLoading ? <Spinner /> : '🎬'} {isLoading ? 'Craters Story...' : 'Craters Story'}</button>
                    {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
                </div>
            </div>
            <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700 min-h-[500px] flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-white">Generated Content</h3>
                     <div className="flex gap-2">
                        {generatedContent && (
                            <>
                                <button onClick={() => handleGenerateYoutubeKit()} disabled={isGeneratingMeta} className="text-xs flex items-center gap-1 text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded transition font-bold disabled:opacity-50">{isGeneratingMeta ? <Spinner className="h-3 w-3"/> : '📺 YouTube Kit'}</button>
                                {contentType === 'lyrics' && (<button onClick={() => handleGenerateMusicPrompt()} disabled={isGeneratingMusic} className="text-xs flex items-center gap-1 text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded transition font-bold disabled:opacity-50">{isGeneratingMusic ? <Spinner className="h-3 w-3"/> : '🎵 Music Prompt'}</button>)}
                                <button onClick={handleCopy} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white bg-gray-700 px-3 py-1.5 rounded transition font-medium">{copied ? 'Copied!' : <><CopyIcon /> Copy All</>}</button>
                            </>
                        )}
                     </div>
                 </div>
                 <div className="flex-grow bg-gray-900 rounded-lg p-6 overflow-y-auto border border-gray-700 shadow-inner custom-scrollbar">
                     {generatedTitle ? (
                         <div className="animate-fade-in space-y-4">
                             <h2 className="text-xl font-bold text-cyan-400 text-center border-b border-gray-700 pb-4">{generatedTitle}</h2>
                             {(youtubeMeta || musicPrompt) && (
                                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 space-y-4 mb-4">
                                     {youtubeMeta && (
                                         <div className="space-y-2">
                                             <h4 className="text-red-400 font-bold text-xs uppercase flex justify-between">YouTube Metadata <button onClick={() => handleCopyText(JSON.stringify(youtubeMeta, null, 2), 'meta')} className="text-gray-400 hover:text-white text-[10px]">{copyStatus === 'meta' ? 'Copied!' : 'Copy JSON'}</button></h4>
                                             <div className="text-xs text-gray-300"><p><strong>Title:</strong> {youtubeMeta.title}</p><p className="mt-1"><strong>Desc:</strong> {youtubeMeta.description.substring(0, 100)}...</p><p className="mt-1 text-blue-300"><strong>Tags:</strong> {youtubeMeta.hashtags.join(' ')}</p></div>
                                         </div>
                                     )}
                                     {musicPrompt && (<div><h4 className="text-purple-400 font-bold text-xs uppercase flex justify-between mb-1">Music Prompt <button onClick={() => handleCopyText(musicPrompt, 'music')} className="text-gray-400 hover:text-white text-[10px]">{copyStatus === 'music' ? 'Copied!' : 'Copy'}</button></h4><p className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded">{musicPrompt}</p></div>)}
                                 </div>
                             )}
                             <div className="bg-black/30 p-4 rounded-lg border border-gray-800 space-y-3">
                                <div className="text-xs"><span className="text-pink-400 font-bold uppercase tracking-wider">Style Visual Style:</span><p className="text-gray-300 mt-1 pl-2 border-l-2 border-pink-500">{useRefImage && refStyle ? `${refStyle} (3D)` : visualStyle}</p></div>
                                {characters.some(c => c.name) && (<div className="text-xs"><span className="text-blue-400 font-bold uppercase tracking-wider">Character Detail:</span><ul className="mt-1 space-y-1 pl-2 border-l-2 border-blue-500">{characters.filter(c => c.name).map((c, i) => (<li key={i} className="text-gray-300"><span className="text-white font-semibold">{c.name}:</span> {c.desc}</li>))}</ul></div>)}
                             </div>
                            {scenes.length > 0 && (
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-sm font-bold text-gray-300 uppercase">Scenes ({scenes.length})</h3>
                                    {scenes.map((scene, idx) => (
                                        <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-purple-500/50 transition">
                                            <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-purple-400 uppercase bg-purple-900/30 px-2 py-0.5 rounded border border-purple-900/50">Scene {scene.number}</span><button onClick={() => handleCopyScene(scene, idx)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white bg-gray-700 px-2 py-1 rounded transition font-medium">{sceneCopyStatus === idx ? <span className="text-green-400 font-bold">✓ Copied</span> : <><CopyIcon /> Copy Scene</>}</button></div>
                                            <p className="text-gray-300 text-sm mb-2 font-serif italic border-l-2 border-gray-600 pl-2">"{scene.text}"</p>
                                            <div className="bg-black/30 p-2 rounded border border-gray-800"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Visual Prompt</p><p className="text-gray-400 text-xs font-mono">{scene.prompt}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>
                     ) : (<div className="h-full flex flex-col items-center justify-center text-gray-500"><span className="text-4xl mb-4 opacity-30">{contentType === 'lyrics' ? '🎵' : '📖'}</span><p>Your generated scenes will appear here.</p></div>)}
                 </div>
            </div>
        </div>
    )
};

interface StandardVlogSceneWithMeta extends VisualScene {
    referenceImageUrl?: string;
    localCharacterDetail?: string;
}

const VlogGenerator: React.FC = () => {
    const [language, setLanguage] = useState<'km' | 'en'>('km');
    const [topic, setTopic] = useState('');
    const [vlogStyle, setVlogStyle] = useState('Realistic Daily Vlog');
    const [sceneCount, setSceneCount] = useState(25);
    const [isFullMv, setIsFullMv] = useState(false);
    
    // Character Detail State with Image Support
    const [useCharacterDetail, setUseCharacterDetail] = useState(false);
    const [vlogCharImage, setVlogCharImage] = useState<{ base64: string, mimeType: string } | null>(null);
    const [vlogCharImageUrl, setVlogCharImageUrl] = useState<string | null>(null);
    const [characterDetail, setCharacterDetail] = useState('');

    // Standard Results
    const [generatedVlog, setGeneratedVlog] = useState<VlogScriptResponse | null>(null);
    const [visualScenes, setVisualScenes] = useState<StandardVlogSceneWithMeta[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    // Scene Regeneration States
    const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
    const [isRegeneratingScene, setIsRegeneratingScene] = useState<number | null>(null);

    const vlogStyles = [
        { name: 'Realistic Daily Vlog', emoji: '📸' },
        { name: 'Realistic Travel Vlog', emoji: '✈️' },
        { name: 'Realistic Mukbang', emoji: '🍔' },
        { name: 'Realistic Tech Review', emoji: '💻' },
        { name: 'Realistic Tutorial', emoji: '💡' },
    ];

    const handleClear = () => {
        setTopic('');
        setVlogStyle('Realistic Daily Vlog');
        setSceneCount(25);
        setIsFullMv(false);
        setCharacterDetail('');
        setGeneratedVlog(null);
        setVisualScenes([]);
        setError(null);
        setUseCharacterDetail(false);
        setVlogCharImage(null);
        if (vlogCharImageUrl) URL.revokeObjectURL(vlogCharImageUrl);
        setVlogCharImageUrl(null);
        setEditingSceneIndex(null);
        setIsRegeneratingScene(null);
    };

    const handleCharImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const b64 = (reader.result as string).split(',')[1];
                setVlogCharImage({ base64: b64, mimeType: file.type });
                if (vlogCharImageUrl) URL.revokeObjectURL(vlogCharImageUrl);
                setVlogCharImageUrl(URL.createObjectURL(file));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAutoGenerateCharacter = async () => {
        if (!topic.trim()) {
            setError("Please enter a topic first to generate a character.");
            return;
        }
        setIsGeneratingCharacter(true);
        setError(null);
        try {
            const prompt = `Create a highly realistic and charismatic vlogger character for a vlog about: ${topic}. Describe their age, clothing, and features in detail for 3D/realistic consistency.`;
            const chars = await generateCharacters(prompt, 1);
            if (chars && chars.length > 0) {
                const char = chars[0];
                const detail = `Realistic Model: ${char.name}, ${char.age}. ${char.description}`;
                setCharacterDetail(detail);
            }
        } catch (err) {
            setError("Failed to auto-generate character.");
        } finally {
            setIsGeneratingCharacter(false);
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) {
            setError('Please enter a topic for your vlog.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVlog(null);
        setVisualScenes([]);

        try {
            // 1. Analyze Character Image if provided
            let analyzedTraits = characterDetail;
            if (useCharacterDetail && vlogCharImage) {
                const analysis = await analyzeCharacterReference(vlogCharImage.base64, vlogCharImage.mimeType);
                analyzedTraits = `VISUAL IDENTITY FROM IMAGE: ${analysis.characterDescription}. USER DETAIL: ${characterDetail}`;
            }

            // 2. Generate Vlog Script
            const scriptResult = await generateVlogScript(topic, vlogStyle);
            setGeneratedVlog(scriptResult);
            
            const introText = language === 'km' 
                ? `ដំបូង និយាយថា សួស្តីបងប្អូន ថ្ងៃនេះ ខ្ញុំ មាន Video ថ្មី Introduction : នែនាំមខ្លួន . ឈ្មោះ នឹង អាយុ  , ទីតាំង Done ✔️`
                : `First, say: Hello everyone, today I have a new video. Introduction: Introducing myself, name, age, and location. Done ✔️`;

            const fullMvLogic = isFullMv ? `
            STRICT PROFESSIONAL FILM NARRATIVE STRUCTURE (KITCHEN/COOKING VLOG):
            - The key points of the story and the ending are clearly defined, giving clarity to the entire storyline.
            - OPENING BEATS: The story begins with detailed food preparation activities: washing fresh vegetables, cleaning and washing meat, the process of marinating, and mixing spices/ingredients.
            - MID BEATS: Include the actual cooking process, steam, sizzling pans, and the hard work of creating a meal.
            - CLOSING BEATS: Transition to a scene of sitting down at a table to eat.
            - FINAL SCENE: Ends with the vlogger looking at the camera and saying: "Thanks for watching. See you next time, please."
            - Overall style: Cinematic, professional film look.
            ` : "";

            const styleConstraint = vlogStyle.toLowerCase().includes('realistic') 
                ? `${vlogStyle} (100% Realistic, Professional Cinematic Photography, High Detail)`
                : vlogStyle;

            const storyContext = `
                ${introText}
                ${fullMvLogic}
                STORY SCRIPT: ${scriptResult.vlogScript}
                VISUAL STYLE: ${styleConstraint}
                CHARACTER CONSISTENCY: The main vlogger is: "${analyzedTraits || 'A charismatic influencer'}". 
                CRITICAL: Every sense generated MUST follow the ${vlogStyle} aesthetic perfectly.
                GENERATE EXACTLY ${sceneCount} SENSES.
            `;
            
            const scenes = await generateScenesFromStory(storyContext, sceneCount);
            
            setVisualScenes(scenes.map(s => ({
                ...s,
                localCharacterDetail: analyzedTraits
            })));
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [topic, vlogStyle, sceneCount, characterDetail, language, useCharacterDetail, vlogCharImage, isFullMv]);

    const handleRegenerateScenePrompt = async (idx: number) => {
        const scene = visualScenes[idx];
        setIsRegeneratingScene(idx);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const vloggerContext = characterDetail || "A charismatic influencer";
            const styleConstraint = vlogStyle.toLowerCase().includes('realistic') 
                ? `${vlogStyle} (100% Realistic, Professional Cinematic Photography, High Detail)`
                : vlogStyle;

            const promptForAi = `
                REGENERATE SINGLE VLOG SCENE PROMPT: Sense #${scene.scene_number || idx + 1}
                VLOG TOPIC: ${topic}
                CURRENT ACTION: ${scene.narrative}
                VLOGGER DETAIL (UPDATED): ${vloggerContext}
                VISUAL STYLE: ${styleConstraint}
                
                TASK: Rewrite the scene action and generate a NEW detailed realistic 3D/photorealistic video generation prompt. 
                OUTPUT JSON: { "narrative": "new description", "visual_prompt": "new visual prompt" }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: promptForAi,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            narrative: { type: Type.STRING },
                            visual_prompt: { type: Type.STRING }
                        }
                    }
                }
            });

            const result = JSON.parse(response.text || "{}");
            
            if (result.narrative) {
                const updatedScenes = [...visualScenes];
                updatedScenes[idx] = {
                    ...scene,
                    narrative: result.narrative,
                    visual_prompt: result.visual_prompt,
                    localCharacterDetail: vloggerContext
                };
                setVisualScenes(updatedScenes);
                setEditingSceneIndex(null);
            }
        } catch (err) {
            console.error(err);
            setError("Prompt regeneration failed.");
        } finally {
            setIsRegeneratingScene(null);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const inputFieldClasses = "bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 placeholder-gray-400";

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 h-fit space-y-6">
                <ClearProjectButton onClick={handleClear} />
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Vlog Video Creator</h2>
                    <p className="text-gray-400 text-sm">Choose language and generate your viral vlog.</p>
                </div>

                <div className="bg-gray-900/50 p-1 rounded-lg flex border border-gray-700">
                    <button onClick={() => setLanguage('km')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${language === 'km' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Cambodia 🇰🇭</button>
                    <button onClick={() => setLanguage('en')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>English 🇺🇸</button>
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Vlog Topic / Story Synopsis</label>
                    <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., A day in my life visiting the beach..." className={`${inputFieldClasses} h-24 resize-y`} />
                </div>

                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" checked={isFullMv} onChange={e => setIsFullMv(e.target.checked)} className="w-5 h-5 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500"/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-red-400 uppercase tracking-widest">Full MV (Professional Film)</span>
                            <span className="text-[10px] text-gray-500 italic">Auto-structure: Food Prep, Cooking, Eating, Pro Ending.</span>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300">Vlog Style</label>
                        <select value={vlogStyle} onChange={e => setVlogStyle(e.target.value)} className={inputFieldClasses}>
                            {vlogStyles.map(s => <option key={s.name} value={s.name}>{s.emoji} {s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300">Scene Count (25 - 350)</label>
                        <div className="flex items-center bg-gray-700 rounded-lg border border-gray-700 overflow-hidden w-full">
                            <button onClick={() => setSceneCount(Math.max(25, sceneCount - 25))} className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold transition">-</button>
                            <input type="number" value={sceneCount} onChange={(e) => setSceneCount(Math.max(25, Math.min(350, parseInt(e.target.value) || 25)))} className="w-full text-center bg-transparent outline-none text-white font-bold" />
                            <button onClick={() => setSceneCount(Math.min(350, sceneCount + 25))} className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold">+</button>
                        </div>
                        <div className="mt-2">
                             <input 
                                type="range" min="25" max="350" step="1" 
                                value={sceneCount} onChange={e => setSceneCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                            <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase mt-1">
                                <span>Min: 25</span>
                                <span>Typical: 150</span>
                                <span>Max: 350</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Character Detail with Image Feature */}
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={useCharacterDetail} 
                                onChange={e => setUseCharacterDetail(e.target.checked)}
                                className="w-5 h-5 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500"
                            />
                            <span className="text-sm font-bold text-gray-200">តួអង្គ (Character Detail & Image)</span>
                        </label>
                        <button onClick={handleAutoGenerateCharacter} disabled={isGeneratingCharacter || !topic.trim()} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition disabled:opacity-50">
                            {isGeneratingCharacter ? <Spinner className="h-3 w-3"/> : '✨ Auto Create'}
                        </button>
                    </div>

                    {useCharacterDetail && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Face/Model Image</label>
                                <div className="aspect-square bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center relative overflow-hidden group">
                                    {vlogCharImageUrl ? (
                                        <img src={vlogCharImageUrl} alt="Vlogger" className="w-full h-full object-cover" />
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center gap-1">
                                            <span className="text-3xl opacity-30">👤</span>
                                            <span className="text-[10px] text-gray-500">UPLOAD PHOTO</span>
                                            <input type="file" accept="image/*" onChange={handleCharImageUpload} className="hidden" />
                                        </label>
                                    )}
                                    {vlogCharImageUrl && (
                                        <button onClick={() => { setVlogCharImageUrl(null); setVlogCharImage(null); }} className="absolute top-2 right-2 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><TrashIcon /></button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Character Traits</label>
                                <textarea value={characterDetail} onChange={(e) => setCharacterDetail(e.target.value)} placeholder="e.g., age, clothes, personality..." className={`${inputFieldClasses} h-[130px] resize-none text-xs`} />
                            </div>
                        </div>
                    )}
                </div>

                 <div className="pt-6 border-t border-gray-700 flex justify-center">
                     <button onClick={handleGenerate} disabled={isLoading || !topic.trim()} className="w-full py-4 px-6 font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-lg hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center justify-center gap-3 text-lg">
                        {isLoading ? <Spinner className="mr-2 h-6 w-6"/> : <span className="text-2xl">✍️</span>}
                        Generate Standard Vlog
                    </button>
                </div>
            </div>

            <div className="w-full space-y-6">
                {error && <div className="mb-4 p-3 w-full text-center bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}
                 
                {isLoading && (
                    <div className="bg-gray-800/80 p-8 rounded-xl border border-cyan-500/50 shadow-xl animate-pulse flex flex-col items-center justify-center">
                        <Spinner className="h-12 w-12 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Creating Your Realistic Vlog...</h3>
                        <p className="text-gray-400 text-sm">Drafting scenes and ensuring character consistency.</p>
                    </div>
                )}

                {/* Render Scenes */}
                {visualScenes.length > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span>🎥</span> Vlog Storyboard Results
                        </h3>
                        <div className="space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                            {visualScenes.map((scene, idx) => (
                                <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition">
                                    <div className="flex justify-between mb-3 items-center">
                                        <span className="text-[10px] font-black bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 uppercase tracking-widest">Sense {scene.scene_number || idx + 1}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setEditingSceneIndex(editingSceneIndex === idx ? null : idx)}
                                                className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase transition border ${editingSceneIndex === idx ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300'}`}
                                            >
                                                {isRegeneratingScene === idx ? <Spinner className="h-3 w-3 m-0"/> : <RefreshIcon className="mr-1" />}
                                                Get New Prompt
                                            </button>
                                            <button onClick={() => handleCopy(scene.visual_prompt, `p-${idx}`)} className="text-[10px] text-gray-500 hover:text-white bg-gray-800 px-2 py-1 rounded transition border border-gray-700 font-bold uppercase">{copyStatus === `p-${idx}` ? '✓ Copied' : 'Copy Prompt'}</button>
                                        </div>
                                    </div>

                                    {editingSceneIndex === idx && (
                                        <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-4 animate-fade-in">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xl">🧬</span>
                                                <h4 className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">Character Consistency Verification</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Vlogger Character Details</label>
                                                    <textarea 
                                                        value={characterDetail} 
                                                        onChange={(e) => setCharacterDetail(e.target.value)}
                                                        className="w-full bg-[#0f172a] border border-[#334155] text-white p-3 rounded-lg text-xs h-20 resize-none outline-none focus:ring-1 focus:ring-cyan-500"
                                                        placeholder="Adjust vlogger visual details (face, hair, clothing)..."
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingSceneIndex(null)} className="px-3 py-1 text-[10px] text-gray-500 hover:text-white font-bold transition">CANCEL</button>
                                                    <button 
                                                        onClick={() => handleRegenerateScenePrompt(idx)}
                                                        disabled={isRegeneratingScene === idx}
                                                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-black shadow-lg flex items-center gap-2"
                                                    >
                                                        {isRegeneratingScene === idx ? <Spinner className="h-3 w-3 m-0" /> : 'CONFIRM & REGENERATE ART'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Action Details</div>
                                            <p className="text-sm text-gray-200 leading-relaxed font-serif">
                                                {idx === 0 && <span className="text-cyan-400 font-bold mr-1">[Intro]</span>}
                                                {scene.narrative}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Visual Render Prompt</div>
                                            <p className="text-[11px] text-cyan-400 bg-black/40 p-2 rounded border border-gray-800 font-mono leading-relaxed">{scene.visual_prompt}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                 {!isLoading && visualScenes.length === 0 && (
                     <div className="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/30">
                         <span className="text-6xl mb-4 opacity-30">🤳</span>
                         <p className="text-lg">Your realistic vlog storyboard will appear here.</p>
                         <p className="text-xs mt-2">Setup characters and click Generate to start.</p>
                     </div>
                 )}
            </div>
        </div>
    );
};


const KidsStoryGenerator: React.FC = () => {
    type Tab = 'idea_generator' | 'song_story' | 'full_story' | 'movie_trailer' | 'vlog_video';
    const [activeTab, setActiveTab] = useState<Tab>('idea_generator');

    const getTabClass = (tabName: Tab) => {
        const base = "px-4 py-2 font-semibold rounded-md transition-colors duration-200 text-sm";
        if (activeTab === tabName) {
            return `${base} bg-cyan-600 text-white`;
        }
        return `${base} bg-gray-700 text-gray-300 hover:bg-gray-600`;
    };

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col">
            <div className="mb-6 flex flex-wrap justify-center gap-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                <button onClick={() => setActiveTab('idea_generator')} className={getTabClass('idea_generator')}>💡 Idea Generator</button>
                <button onClick={() => setActiveTab('song_story')} className={getTabClass('song_story')}>🎶 Song & Story Creator</button>
                <button onClick={() => setActiveTab('full_story')} className={getTabClass('full_story')}>📖 Story Script</button>
                <button onClick={() => setActiveTab('movie_trailer')} className={getTabClass('movie_trailer')}>🎟️ Movie Trailer</button>
                 <button onClick={() => setActiveTab('vlog_video')} className={getTabClass('vlog_video')}>🤳 Vlog Video</button>
            </div>
            <div className="relative">
                <div style={{ display: activeTab === 'idea_generator' ? 'block' : 'none' }}><IdeaGenerator /></div>
                <div style={{ display: activeTab === 'song_story' ? 'block' : 'none' }}><SongStoryCreator /></div>
                <div style={{ display: activeTab === 'full_story' ? 'block' : 'none' }}><StoryGenerator /></div>
                <div style={{ display: activeTab === 'movie_trailer' ? 'block' : 'none' }}><MovieTrailerGenerator /></div>
                <div style={{ display: activeTab === 'vlog_video' ? 'block' : 'none' }}><VlogGenerator /></div>
            </div>
        </div>
    );
}

export default KidsStoryGenerator;