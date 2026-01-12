import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateStory, StoryScene, Character as ServiceCharacter, generateCharacters, generateStoryIdeas, StoryIdea, generateImage, generateImageWithReferences, generateVoiceover, PrebuiltVoice, ImageReference } from '../services/geminiService.ts';
import { styles, Style } from './styles.ts';

const Spinner: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className || '-ml-1 mr-3 h-5 w-5 text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CopyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const JsonIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const CrossIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011-1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const RefreshIcon: React.FC<{className?: string}> = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const UserGroupIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const AudioIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

// --- Audio Utilities ---
const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const pcmToWavBlob = (pcmData: Int16Array, numChannels: number, sampleRate: number, bitsPerSample: number): Blob => {
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

const ClearProjectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="w-full flex justify-end mb-4">
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 bg-red-900/40 border border-red-800 rounded-lg hover:bg-red-900/80 transition-colors duration-200"
        >
            <TrashIcon /> Clear Project | សម្អាតគម្រោង
        </button>
    </div>
);

const StoryGeneratorKh: React.FC = () => {
    // UI State
    const [mainTab, setMainTab] = useState<'create' | 'script' | 'ideas'>('script');
    const [subTab, setSubTab] = useState<'chars' | 'settings'>('settings');
    const [styleCategory, setStyleCategory] = useState<'roblox' | '3d' | 'anime' | '2d' | 'stickman' | 'fantasy' | '4d'>('3d');
    
    // Data State
    const [style, setStyle] = useState<string>(styles.find(s => s.category === '3d')?.value || styles[0].value);
    const [charPrompt, setCharPrompt] = useState('');
    const [aiCharacterCount, setAiCharacterCount] = useState(2);
    const [characters, setCharacters] = useState<(ServiceCharacter & { id: number; isSelected?: boolean; image?: ImageReference })[]>([]);
    const [scriptInput, setScriptInput] = useState('');
    const [ideaTheme, setIdeaTheme] = useState('');
    const [smartThinking, setSmartThinking] = useState(true);
    const [fastGeneration, setFastGeneration] = useState(true);
    const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([]);
    const [storyResults, setStoryResults] = useState<StoryScene[]>([]);
    const [targetSceneCount, setTargetSceneCount] = useState(15);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('16:9');
    
    // Process State
    const [isLoading, setIsLoading] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [perSceneCopyStatus, setPerSceneCopyStatus] = useState<Record<string, string>>({});
    
    // Image & Extension State
    const [sceneImages, setSceneImages] = useState<Record<number, { url: string | null; loading: boolean }>>({});
    const [audioUrls, setAudioUrls] = useState<Record<number, { url: string | null; loading: boolean }>>({});
    const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
    const [isRegeneratingImage, setIsRegeneratingImage] = useState<number | null>(null);
    const [sceneCharSelection, setSceneCharSelection] = useState<Record<number, number[]>>({});

    // GLOBAL SAVE/LOAD PERSISTENCE
    useEffect(() => {
        const handleSaveRequest = (e: any) => {
            if (e.detail.tool !== 'story-gen-kh') return;
            const projectData = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'story-gen-kh',
                category: 'writing',
                title: scriptInput ? scriptInput.substring(0, 30) + "..." : "Story Script",
                data: {
                    style,
                    characters,
                    scriptInput,
                    storyResults,
                    targetSceneCount,
                    mainTab,
                    subTab,
                    styleCategory,
                    selectedAspectRatio
                }
            };
            const existing = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([projectData, ...existing]));
        };

        const handleLoadRequest = (e: any) => {
            if (e.detail.tool !== 'story-gen-kh') return;
            const d = e.detail.data;
            if (d.style) setStyle(d.style);
            if (d.characters) setCharacters(d.characters);
            if (d.scriptInput) setScriptInput(d.scriptInput);
            if (d.storyResults) setStoryResults(d.storyResults);
            if (d.targetSceneCount) setTargetSceneCount(d.targetSceneCount);
            if (d.mainTab) setMainTab(d.mainTab);
            if (d.subTab) setSubTab(d.subTab);
            if (d.styleCategory) setStyleCategory(d.styleCategory);
            if (d.selectedAspectRatio) setSelectedAspectRatio(d.selectedAspectRatio);
            setError(null);
        };

        window.addEventListener('REQUEST_PROJECT_SAVE', handleSaveRequest);
        window.addEventListener('LOAD_PROJECT', handleLoadRequest);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSaveRequest);
            window.removeEventListener('LOAD_PROJECT', handleLoadRequest);
        };
    }, [style, characters, scriptInput, storyResults, targetSceneCount, mainTab, subTab, styleCategory, selectedAspectRatio]);

    const handleAddCharacter = () => {
        if (characters.length >= 8) return;
        setCharacters([...characters, { id: Date.now(), name: '', gender: 'Female', age: '', description: '', isSelected: true }]);
    };

    const handleRemoveCharacter = (id: number) => {
        setCharacters(characters.filter(c => c.id !== id));
    };

    const updateCharacter = (id: number, field: keyof (ServiceCharacter & { isSelected?: boolean; image?: ImageReference }), value: any) => {
        setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleCharImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const base64 = base64String.split(',')[1];
                const char = characters[index];
                if (char) {
                    updateCharacter(char.id, 'image', { base64, mimeType: file.type });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCopyCharacter = (char: ServiceCharacter & { id: number }) => {
        const text = `Character Detail: ${char.name} (${char.gender}, ${char.age}). Appearance: ${char.description}\nVisual Style: ${style}\nConstraint: Maintain 100% facial and outfit consistency across all scenes. No 3D if Anime style.`;
        navigator.clipboard.writeText(text);
        setPerSceneCopyStatus(prev => ({ ...prev, [`char-${char.id}`]: 'Done' }));
        setTimeout(() => setPerSceneCopyStatus(prev => ({ ...prev, [`char-${char.id}`]: '' })), 2000);
    };

    const handleGenerateCharsAI = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const context = charPrompt || scriptInput || ideaTheme || "Fantasy adventure";
            
            let styleExtra = "";
            if (styleCategory === 'anime') {
                styleExtra = `CRITICAL: Describe characters in a 2D Anime style (hand-drawn, cel-shaded, vibrant flat colors). Avoid any 3D/Pixar/CGI terminology. Focus on anime-specific facial and hair aesthetics.`;
            } else if (styleCategory === 'fantasy') {
                styleExtra = `CRITICAL: Describe characters in a highly detailed fantasy style. Use keywords like mythological, realistic cinematic, ultra-realistic, and hyper-realism. Focus on intricate textures of skin, hair, and clothing matching an epic fantasy setting.`;
            } else if (styleCategory === '4d') {
                styleExtra = `CRITICAL: Describe characters for a high-end 4D cinematic production. Focus on realistic human-like detail, high-quality fabric textures, and expressive micro-expressions.`;
            } else {
                styleExtra = `Visual Style theme is: ${styleCategory}. Describe characters matching this look.`;
            }

            const gen = await generateCharacters(context, aiCharacterCount, styleExtra, fastGeneration ? false : smartThinking);
            setCharacters(gen.map((c, i) => ({ ...c, id: Date.now() + i, isSelected: true })));
            setSubTab('chars');
        } catch (err) {
            setError("Failed to generate characters.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeScript = () => {
        if (!scriptInput.trim()) return;
        setSubTab('chars');
    };

    const handleGenerateIdeas = async () => {
        if (!ideaTheme.trim()) {
            setError("Please enter a theme or topic for your ideas.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setStoryIdeas([]);
        try {
            const ideas = await generateStoryIdeas(`Create 5 of your best professional, creative and viral story synopses for: ${ideaTheme}`, fastGeneration ? false : smartThinking);
            setStoryIdeas(ideas);
        } catch (err) {
            setError("Failed to generate story ideas.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseIdea = (idea: StoryIdea) => {
        setScriptInput(idea.summary);
        setMainTab('script');
        setSubTab('chars');
    };

    const handleGenerateStory = async () => {
        const activeChars = characters.filter(c => c.isSelected);
        if (activeChars.length === 0) {
            setError("Please select at least one character. | សូមជ្រើសរើសតួអង្គយ៉ាងហោចណាស់ម្នាក់។");
            return;
        }
        setIsLoading(true);
        setError(null);
        setStoryResults([]);
        setGenerationProgress(0);
        setSceneImages({});
        setAudioUrls({});

        const characterContext = activeChars
            .map(c => `Character Name: ${c.name}, Gender: ${c.gender}, Age: ${c.age}, Appearance: ${c.description}`)
            .join('\n');

        const isAnime = style.toLowerCase().includes('anime');
        const isFantasy = styleCategory === 'fantasy';
        const is4D = styleCategory === '4d';

        const narrativeStructure = `
        STORY STRUCTURE GUIDE:
        1. Compelling Beginning: Scenes 1 to ${Math.ceil(targetSceneCount * 0.2)}. Set the world, introduce characters, and establish conflict.
        2. Key Highlights & Climax: Scenes ${Math.ceil(targetSceneCount * 0.2) + 1} to ${Math.floor(targetSceneCount * 0.8)}. Build intense action.
        3. Perfect Ending: Scenes ${Math.floor(targetSceneCount * 0.8) + 1} to ${targetSceneCount}. Resolve beautifully.
        `;

        const consistencyPrompt = `
        CRITICAL VISUAL STYLE AND CONSISTENCY INSTRUCTIONS:
        THE MANDATORY VISUAL STYLE IS: ${style}. 
        ${isAnime ? 'STRICTLY ENFORCE 2D ANIME STYLE. FORBIDDEN: 3D, CGI, PIXAR, OCTANE RENDER, 4K RENDER LOOK. IT MUST BE HAND-DRAWN CEL-SHADED ANIME ART FROM START TO FINISH. ALL CHARACTER ACTIONS MUST BE DESCRIBED IN 2D ANIME TERMS.' : ''}
        ${isFantasy ? 'STRICTLY ENFORCE AN EPIC FANTASY AESTHETIC. USE KEYWORDS: Mythological, realistic cinematic fantasy, hyper-realism. Focus on high-detail textures, dramatic lighting, and intricate fantasy environments.' : ''}
        ${is4D ? 'STRICTLY ENFORCE A 4D CINEMATIC AESTHETIC. USE KEYWORDS: Ultra-realistic, high dynamic range, volumetric lighting, IMAX depth, film-grade textures. Focus on fluid motion potential and extreme realism.' : ''}
        IMPORTANT: APPLY THIS STYLE TO EVERY SINGLE SENSE, DIALOGUE DESCRIPTION, AND PANEL PROMPT. 
        If ${style} is chosen, the entire story script itself and every visual scene must be in ${style} from the very first scene to the very end.
        
        Please keep the characters’ faces and characteristics exactly the same in every scene.
        Do not change the characters’ faces or introduce new places.
        Please maintain everything exactly the same from Scene 1 all the way to Scene ${targetSceneCount} — keep the characters’ faces and characteristics consistent in every scene.
        
        VISUAL STYLE:
        ${style}
        
        STORY CHARACTERS:
        ${characterContext}

        ${narrativeStructure}
        `;

        try {
            const BATCH_SIZE = fastGeneration ? 20 : 10;
            const totalBatches = Math.ceil(targetSceneCount / BATCH_SIZE);
            let accumulatedScenes: StoryScene[] = [];

            for (let i = 0; i < totalBatches; i++) {
                const currentStart = i * BATCH_SIZE + 1;
                const count = Math.min(BATCH_SIZE, targetSceneCount - accumulatedScenes.length);
                
                let context = `Topic: ${scriptInput || ideaTheme}. Part ${i + 1}/${totalBatches}. Scene ${currentStart} of ${targetSceneCount}. ${consistencyPrompt}`;
                if (accumulatedScenes.length > 0) {
                    const lastScene = accumulatedScenes[accumulatedScenes.length - 1];
                    context += `\nPreviously: ${lastScene.scene_description.line}`;
                }

                const res = await generateStory({
                    topic: context,
                    characters: activeChars.map(({ id, isSelected, image, ...rest }) => rest),
                    style: style, 
                    sceneCount: count,
                    smartThinking: fastGeneration ? false : smartThinking
                });

                accumulatedScenes = [...accumulatedScenes, ...res];
                setStoryResults([...accumulatedScenes]);
                setGenerationProgress(Math.round(((i + 1) / totalBatches) * 100));

                if (i < totalBatches - 1) await new Promise(r => setTimeout(r, 1000));
            }
        } catch (err) {
            setError("Story generation failed.");
        } finally {
            setIsLoading(false);
            setGenerationProgress(0);
        }
    };

    const handleGenerateImageForScene = async (index: number) => {
        const scene = storyResults[index];
        if (!scene) return;
        
        setSceneImages(prev => ({ ...prev, [index]: { url: null, loading: true } }));
        try {
            const chosenIds = sceneCharSelection[index] || characters.map(c => c.id);
            const sceneChars = characters.filter(c => chosenIds.includes(c.id));
            const charContext = sceneChars.map(c => `${c.name}: ${c.description}`).join(' | ');
            const isAnime = style.toLowerCase().includes('anime');
            const isFantasy = styleCategory === 'fantasy';
            const is4D = styleCategory === '4d';
            
            const fullPrompt = `Style: ${style}. ${isAnime ? '2D Anime style, hand-drawn look, NO 3D, NO CGI.' : ''} ${isFantasy ? 'Ultra-detailed mythological fantasy painting, realistic cinematic, hyper-realism fantasy style.' : ''} ${is4D ? 'Ultra-realistic cinematic, 8k, volumetric lighting, high dynamic range.' : ''} Character Detail: ${charContext}. Scene Action: ${scene.scene_description.line}. Prompt: ${scene.prompt}. Maintain 100% character face and outfit consistency. No text.`;
            
            // Gather subjects from characters who have reference images
            const subjectRefs = sceneChars
                .filter(c => c.image)
                .map(c => c.image!);

            let url;
            if (subjectRefs.length > 0) {
                url = await generateImageWithReferences(fullPrompt, { subjects: subjectRefs }, selectedAspectRatio);
            } else {
                url = await generateImage(fullPrompt, selectedAspectRatio);
            }
            
            setSceneImages(prev => ({ ...prev, [index]: { url, loading: false } }));
        } catch (e) {
            setSceneImages(prev => ({ ...prev, [index]: { url: null, loading: false } }));
        }
    };

    const handleGenerateVoiceoverForScene = async (index: number) => {
        const scene = storyResults[index];
        if (!scene) return;
        
        setAudioUrls(prev => ({ ...prev, [index]: { url: null, loading: true } }));
        try {
            const base64Audio = await generateVoiceover(scene.voiceover, 'en', 'Kore');
            const pcmBytes = decode(base64Audio);
            const pcmInt16 = new Int16Array(pcmBytes.buffer);
            const wavBlob = pcmToWavBlob(pcmInt16, 1, 24000, 16);
            const url = URL.createObjectURL(wavBlob);
            
            setAudioUrls(prev => ({ ...prev, [index]: { url, loading: false } }));
            new Audio(url).play();
        } catch (e) {
            setAudioUrls(prev => ({ ...prev, [index]: { url: null, loading: false } }));
            setError("Voiceover generation failed.");
        }
    };

    const handleRegenerateWithReselect = async (index: number) => {
        const scene = storyResults[index];
        if (!scene) return;
        
        setIsRegeneratingImage(index);
        try {
            const chosenIds = sceneCharSelection[index] || characters.map(c => c.id);
            const sceneChars = characters.filter(c => chosenIds.includes(c.id));
            const charContext = sceneChars.map(c => `${c.name}: ${c.description}`).join(' | ');
            const isAnime = style.toLowerCase().includes('anime');
            const isFantasy = styleCategory === 'fantasy';
            const is4D = styleCategory === '4d';
            
            const fullPrompt = `Style: ${style}. ${isAnime ? '2D Anime style, hand-drawn look, NO 3D, NO CGI.' : ''} ${isFantasy ? 'Ultra-detailed mythological fantasy painting, realistic cinematic, hyper-realism fantasy style.' : ''} ${is4D ? 'Ultra-realistic cinematic, 8k, volumetric lighting, high dynamic range.' : ''} Character Detail: ${charContext}. Scene Action: ${scene.scene_description.line}. High quality render. Maintain 100% character face and outfit consistency. No text.`;
            
            const subjectRefs = sceneChars
                .filter(c => c.image)
                .map(c => c.image!);

            let url;
            if (subjectRefs.length > 0) {
                url = await generateImageWithReferences(fullPrompt, { subjects: subjectRefs }, selectedAspectRatio);
            } else {
                url = await generateImage(fullPrompt, selectedAspectRatio);
            }
            
            setSceneImages(prev => ({ ...prev, [index]: { url, loading: false } }));
            setEditingSceneIndex(null);
        } catch (e) {
            setError("Regeneration failed.");
        } finally {
            setIsRegeneratingImage(null);
        }
    };

    const toggleSceneCharacter = (sceneIdx: number, charId: number) => {
        setSceneCharSelection(prev => {
            const current = prev[sceneIdx] || characters.map(c => c.id);
            if (current.includes(charId)) {
                return { ...prev, [sceneIdx]: current.filter(id => id !== charId) };
            } else {
                return { ...prev, [sceneIdx]: [...current, charId] };
            }
        });
    };

    const handleCopyAllJson = () => {
        if (storyResults.length === 0) return;
        const text = JSON.stringify(storyResults, null, 2);
        navigator.clipboard.writeText(text);
        setPerSceneCopyStatus(prev => ({ ...prev, 'all-json': 'Done' }));
        setTimeout(() => setPerSceneCopyStatus(prev => ({ ...prev, 'all-json': '' })), 2000);
    };

    const handleCopyAllPrompts = () => {
        if (storyResults.length === 0) return;
        const text = storyResults.map(s => {
            const chosenIds = sceneCharSelection[s.scene_number - 1] || characters.map(c => c.id);
            const charDetail = characters.filter(c => chosenIds.includes(c.id)).map(c => `${c.name}: ${c.description}`).join(', ');
            return `Scene ${s.scene_number}\nCharacter Detail: ${charDetail}\nStyle: ${style}\nPrompt: ${s.prompt}\n-------------------`;
        }).join('\n\n');
        navigator.clipboard.writeText(text);
        setPerSceneCopyStatus(prev => ({ ...prev, 'all-prompts': 'Done' }));
        setTimeout(() => setPerSceneCopyStatus(prev => ({ ...prev, 'all-prompts': '' })), 2000);
    };

    const handleCopySingleText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setPerSceneCopyStatus(prev => ({ ...prev, [id]: 'Done' }));
        setTimeout(() => setPerSceneCopyStatus(prev => ({ ...prev, [id]: '' })), 2000);
    };

    const handleCopySceneJson = (index: number) => {
        const scene = storyResults[index];
        if (scene) {
            navigator.clipboard.writeText(JSON.stringify(scene, null, 2));
            setPerSceneCopyStatus(prev => ({ ...prev, [`json-${index}`]: 'Done' }));
            setTimeout(() => setPerSceneCopyStatus(prev => ({ ...prev, [`json-${index}`]: '' })), 2000);
        }
    };

    const handleReset = () => {
        setMainTab('script');
        setSubTab('settings');
        setStyleCategory('3d');
        setCharacters([]);
        setScriptInput('');
        setIdeaTheme('');
        setStoryResults([]);
        setStoryIdeas([]);
        setSceneImages({});
        setAudioUrls({});
        setSceneCharSelection({});
        setError(null);
        setSelectedAspectRatio('16:9');
    };

    const tabBtnClass = (active: boolean) => `flex-1 py-3 text-sm font-bold transition-all border-2 rounded-t-lg ${active ? 'bg-[#1e293b] text-white border-[#334155] border-b-transparent' : 'bg-[#0f172a] text-gray-500 border-transparent hover:text-gray-300'}`;
    const subTabBtnClass = (active: boolean) => `flex-1 py-2 text-xs font-bold transition-all border-b-2 ${active ? 'text-cyan-400 border-cyan-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`;
    const styleCategoryBtnClass = (active: boolean, color: string) => `flex-1 py-2.5 px-3 rounded-lg text-[10px] font-bold transition-all border-2 flex items-center justify-center gap-2 ${active ? `${color} text-white shadow-lg scale-105` : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`;

    return (
        <div className="w-full max-w-7xl mx-auto p-6 bg-[#0f172a] rounded-2xl shadow-2xl border border-[#1e293b]">
            <div className="flex justify-end mb-6">
                <ClearProjectButton onClick={handleReset} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT COLUMN: INPUTS */}
                <div className="flex flex-col gap-4">
                    {/* Main Tabs */}
                    <div className="flex bg-[#0f172a] gap-2 px-1">
                        <button onClick={() => setMainTab('script')} className={tabBtnClass(mainTab === 'script')}>From Script | ពីស្គ្រីប</button>
                        <button onClick={() => setMainTab('create')} className={tabBtnClass(mainTab === 'create')}>Create New | បង្កើតថ្មី</button>
                        <button onClick={() => setMainTab('ideas')} className={tabBtnClass(mainTab === 'ideas')}>Get Ideas | ស្វែងរកគំនិត</button>
                    </div>

                    {/* Content Panel */}
                    <div className="bg-[#1e293b]/50 p-6 rounded-xl border border-[#334155] flex flex-col min-h-[600px]">
                        
                        {(mainTab === 'create' || mainTab === 'script') && (
                            <>
                                <div className="flex mb-6 gap-8 border-b border-[#334155]">
                                    <button onClick={() => setSubTab('settings')} className={subTabBtnClass(subTab === 'settings')}>2. Story Settings | ២. ការកំណត់សាច់រឿង</button>
                                    <button onClick={() => setSubTab('chars')} className={subTabBtnClass(subTab === 'chars')}>1. Character Details | ១. ព័ត៌មានតួអង្គ</button>
                                </div>

                                {subTab === 'chars' ? (
                                    <div className="flex-grow space-y-6 overflow-y-auto custom-scrollbar pr-2">
                                        <div className="bg-[#0f172a]/80 p-5 rounded-xl border border-[#334155]">
                                            <h4 className="text-[11px] font-bold text-gray-300 uppercase mb-4 flex items-center gap-2">
                                                <CrossIcon /> generate Characters (Smart Thinking) | បង្កើតតួអង្គ (ការគិតវៃឆ្លាត)
                                            </h4>
                                            
                                            {/* Style Studio Studio Selector */}
                                            <div className="mb-6 space-y-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Visual Style Studio | រចនាប័ទ្មរូបភាព</label>
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('4d');
                                                            const firstStyle = styles.find(s => s.category === '4d');
                                                            if (firstStyle) setStyle(firstStyle.value);
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse border ${styleCategory === '4d' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-gray-800 border-gray-700 text-emerald-400'}`}
                                                    >
                                                        ✨ Pro 4D Quick Select
                                                    </button>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('4d');
                                                            setStyle(styles.find(s => s.category === '4d')?.value || '');
                                                        }}
                                                        className={styleCategoryBtnClass(styleCategory === '4d', 'bg-emerald-600 border-emerald-400')}
                                                    >
                                                        📹 4D Style
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('3d');
                                                            setStyle(styles.find(s => s.category === '3d')?.value || '');
                                                        }}
                                                        className={styleCategoryBtnClass(styleCategory === '3d', 'bg-cyan-600 border-cyan-400')}
                                                    >
                                                        🧊 3D Style
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('anime');
                                                            setStyle(styles.find(s => s.category === 'anime')?.value || '');
                                                        }}
                                                        className={styleCategoryBtnClass(styleCategory === 'anime', 'bg-indigo-600 border-indigo-400')}
                                                    >
                                                        🎨 Anime
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('fantasy');
                                                            setStyle(styles.find(s => s.category === 'fantasy')?.value || '');
                                                        }}
                                                        className={styleCategoryBtnClass(styleCategory === 'fantasy', 'bg-purple-700 border-purple-500')}
                                                    >
                                                        ✨ Fantasy
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('roblox');
                                                            setStyle(styles.find(s => s.category === 'roblox')?.value || '');
                                                        }}
                                                        className={styleCategoryBtnClass(styleCategory === 'roblox', 'bg-red-600 border-red-400')}
                                                    >
                                                        🎮 Roblox
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('2d');
                                                            setStyle(styles.find(s => s.category === '2d')?.value || '');
                                                        }}
                                                        className={styleCategoryBtnClass(styleCategory === '2d', 'bg-emerald-600 border-emerald-400')}
                                                    >
                                                        🖼️ 2D Style
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setStyleCategory('stickman');
                                                            setStyle(styles.find(s => s.category === 'stickman')?.value || '');
                                                        }}
                                                        className={styleCategoryBtnClass(styleCategory === 'stickman', 'bg-gray-600 border-gray-400')}
                                                    >
                                                        🖊️ Stickman
                                                    </button>
                                                </div>

                                                {/* Sub-Style Grid */}
                                                <div className="bg-black/30 p-3 rounded-lg border border-[#334155] animate-slide-down">
                                                    <label className="text-[9px] text-cyan-400 uppercase font-black mb-2 block tracking-tighter">Choose variation for {styleCategory}:</label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                        {styles.filter(s => s.category === styleCategory).map(s => (
                                                            <button
                                                                key={s.name}
                                                                onClick={() => setStyle(s.value)}
                                                                className={`px-2 py-1.5 rounded border text-[9px] font-bold transition-all text-left truncate ${style === s.value ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-inner' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300'}`}
                                                                title={s.name}
                                                            >
                                                                {s.name.split(' | ')[0]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Paste Prompt for Characters (Optional) | បិទភ្ជាប់ប្រអប់បញ្ចូលសម្រាប់តួអង្គ (ស្រេចចិត្ត)</label>
                                                    <textarea 
                                                        value={charPrompt} 
                                                        onChange={(e) => setCharPrompt(e.target.value)}
                                                        placeholder="e.g., Create a friendly alien with blue skin and a robotic pet. | បង្កើតមនុស្សភពផ្កាយដែលមានស្បែកពណ៌ខៀវ..."
                                                        className="w-full bg-[#1e293b] border border-[#334155] text-white p-3 rounded-lg text-sm h-24 resize-none outline-none focus:ring-1 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <input 
                                                        type="number" 
                                                        value={aiCharacterCount} 
                                                        onChange={e => setAiCharacterCount(parseInt(e.target.value) || 2)} 
                                                        className="w-20 bg-[#1e293b] border border-[#334155] text-white text-center rounded-lg text-sm font-bold" 
                                                    />
                                                    <button 
                                                        onClick={handleGenerateCharsAI}
                                                        disabled={isLoading}
                                                        className="flex-grow py-3 bg-[#134e4a]/60 hover:bg-[#134e4a] text-cyan-300 text-sm font-bold rounded-lg transition border border-[#115e59] flex items-center justify-center gap-2"
                                                    >
                                                        {isLoading ? <Spinner /> : 'Generate with AI | បង្កើតដោយ AI'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {characters.map((char, index) => (
                                                <div key={char.id} className="bg-[#1e293b] p-5 rounded-xl border border-[#334155] shadow-lg animate-fade-in flex gap-4">
                                                    <div className="flex-shrink-0 w-20">
                                                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-700 border-dashed rounded-xl cursor-pointer bg-gray-900/50 hover:bg-gray-800 transition relative overflow-hidden group">
                                                            {char.image ? (
                                                                <img src={`data:${char.image.mimeType};base64,${char.image.base64}`} className="w-full h-full object-cover" alt="ref" />
                                                            ) : (
                                                                <span className="text-xl opacity-30">👤</span>
                                                            )}
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCharImageUpload(index, e)} />
                                                        </label>
                                                        {char.image && (
                                                            <button 
                                                                onClick={() => updateCharacter(char.id, 'image', undefined)}
                                                                className="text-[9px] text-red-500 hover:underline w-full mt-1 uppercase font-bold text-center"
                                                            >
                                                                Remove | លុប
                                                            </button>
                                                        )}
                                                        <p className="text-[8px] text-gray-600 mt-1 text-center uppercase leading-tight">Ref Image (រូបថតតួអង្គ)</p>
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={char.isSelected} 
                                                                    onChange={() => setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, isSelected: !c.isSelected } : c))}
                                                                    className="w-4 h-4 text-cyan-500 rounded bg-gray-900 border-gray-600 focus:ring-cyan-500"
                                                                />
                                                                <span className="text-sm font-bold text-cyan-400 uppercase">Character | តួអង្គ {index + 1}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => handleCopyCharacter(char)} 
                                                                    className="p-2 text-gray-600 hover:text-cyan-400 transition-colors"
                                                                    title="Copy Character Details"
                                                                >
                                                                    {perSceneCopyStatus[`char-${char.id}`] === 'Done' ? <span className="text-[10px] font-bold text-green-500">✓</span> : <CopyIcon className="h-4 w-4" />}
                                                                </button>
                                                                <button onClick={() => handleRemoveCharacter(char.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                                                    <TrashIcon />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                                            <input 
                                                                placeholder="Name | ឈ្មោះ" value={char.name} 
                                                                onChange={e => updateCharacter(char.id, 'name', e.target.value)}
                                                                className="bg-[#0f172a] border border-[#334155] text-white text-sm p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                                                            />
                                                            <input 
                                                                placeholder="Age (e.g., 20s) | អាយុ" value={char.age} 
                                                                onChange={e => updateCharacter(char.id, 'age', e.target.value)}
                                                                className="bg-[#0f172a] border border-[#334155] text-white text-sm p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                                                            />
                                                        </div>
                                                        <select 
                                                            value={char.gender} 
                                                            onChange={e => updateCharacter(char.id, 'gender', e.target.value)}
                                                            className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm p-3 rounded-lg outline-none mb-3 focus:ring-1 focus:ring-cyan-500"
                                                        >
                                                            <option value="Male">Male | ប្រុស</option>
                                                            <option value="Female">Female | ស្រី</option>
                                                        </select>
                                                        <textarea 
                                                            placeholder="Characteristics..."
                                                            value={char.description}
                                                            onChange={e => updateCharacter(char.id, 'description', e.target.value)}
                                                            className="w-full bg-[#0f172a] border border-[#334155] text-white text-xs p-3 rounded-lg h-24 resize-none outline-none focus:ring-1 focus:ring-cyan-500"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={handleAddCharacter}
                                            className="w-full py-4 text-cyan-400 font-bold hover:text-cyan-300 transition-colors flex items-center justify-start gap-2 border-2 border-dashed border-[#334155] rounded-xl hover:bg-[#1e293b]/50 px-4"
                                        >
                                            <span className="text-2xl">+</span> Add Character Manually | បន្ថែមតួអង្គដោយដៃ
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-grow space-y-6 animate-fade-in">
                                        <div className="space-y-4">
                                            {mainTab === 'script' && (
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-gray-300 uppercase mb-4 flex items-center gap-2">
                                                        <CrossIcon /> Paste Your Script | បិទភ្ជាប់ស្គ្រីបរបស់អ្នក
                                                    </h4>
                                                    <textarea 
                                                        value={scriptInput}
                                                        onChange={e => setScriptInput(e.target.value)}
                                                        placeholder="Paste your full story or script here..."
                                                        className="w-full bg-[#0f172a] border border-[#334155] text-white p-4 rounded-xl h-60 resize-none outline-none text-sm focus:ring-1 focus:ring-cyan-500"
                                                    />
                                                    <button 
                                                        onClick={handleAnalyzeScript}
                                                        disabled={isLoading || !scriptInput.trim()}
                                                        className="w-full mt-4 py-4 bg-[#1e3a8a]/60 hover:bg-[#1e3a8a] text-blue-300 font-bold rounded-xl border border-[#1e40af] transition flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isLoading ? <Spinner /> : 'Analyze Script & Find Characters | វិភាគស្គ្រីប និងស្វែងរកតួអង្គ'}
                                                    </button>
                                                </div>
                                            )}

                                            {mainTab === 'create' && (
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2">Short Synopsis / Idea | សង្ខេប / គំនិត</label>
                                                    <textarea 
                                                        value={scriptInput}
                                                        onChange={e => setScriptInput(e.target.value)}
                                                        placeholder="e.g., A small rabbit travels to the moon..."
                                                        className="w-full bg-[#0f172a] border border-[#334155] text-white p-4 rounded-xl h-32 resize-none outline-none text-sm focus:ring-1 focus:ring-cyan-500"
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2">Number of Scenes | ចំនួនឈុត (1-500)</label>
                                                <div className="flex items-center bg-[#0f172a] rounded-xl border border-[#334155] overflow-hidden w-40">
                                                    <button onClick={() => setTargetSceneCount(Math.max(1, targetSceneCount - 1))} className="px-4 py-3 bg-[#1e293b] hover:bg-gray-700 text-white font-bold transition">-</button>
                                                    <input 
                                                        type="number" 
                                                        value={targetSceneCount} 
                                                        onChange={(e) => setTargetSceneCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))} 
                                                        className="w-full text-center bg-transparent outline-none text-white font-bold text-lg"
                                                    />
                                                    <button onClick={() => setTargetSceneCount(Math.min(500, targetSceneCount + 1))} className="px-4 py-3 bg-[#1e293b] hover:bg-gray-700 text-white font-bold transition">+</button>
                                                </div>
                                            </div>

                                            <div className="bg-[#0f172a]/50 p-3 rounded-lg border border-[#334155]">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={fastGeneration} 
                                                            onChange={e => {
                                                                setFastGeneration(e.target.checked);
                                                                if (e.target.checked) setSmartThinking(false);
                                                            }}
                                                            className="w-5 h-5 appearance-none border border-gray-600 rounded bg-gray-900 checked:bg-red-600 checked:border-transparent transition-all cursor-pointer relative"
                                                        />
                                                        {fastGeneration && (
                                                            <span className="absolute text-white text-[10px] font-bold pointer-events-none">✓</span>
                                                        )}
                                                    </div>
                                                    <span className="text-orange-500 text-sm">⚡</span>
                                                    <span className="text-sm font-bold text-[#4ade80] group-hover:brightness-110 transition-all">Fast Generation | បង្កើតរហ័ស</span>
                                                </label>
                                            </div>

                                            <div className="bg-[#0f172a]/50 p-4 rounded-xl border border-[#334155]">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={smartThinking} 
                                                            onChange={e => {
                                                                setSmartThinking(e.target.checked);
                                                                if (e.target.checked) setFastGeneration(false);
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-10 h-5 rounded-full transition-colors ${smartThinking ? 'bg-cyan-600' : 'bg-gray-700'}`}></div>
                                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${smartThinking ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-300 group-hover:text-white">Enable Smart Thinking | បើកដំណើរការការគិតវៃឆ្លាត</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Aspect Ratio Selector */}
                                <div className="mt-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-4">
                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                        📐 ទំហំរូបភាព (Aspect Ratio)
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: '16:9 (Landscape)', value: '16:9', icon: '📺' },
                                            { label: '9:16 (Portrait)', value: '9:16', icon: '📱' },
                                            { label: '1:1 (Square)', value: '1:1', icon: '🔳' },
                                            { label: '4:3 (Classic)', value: '4:3', icon: '🖼️' },
                                            { label: '3:4 (Tall)', value: '3:4', icon: '📏' }
                                        ].map((ratio) => (
                                            <button
                                                key={ratio.value}
                                                onClick={() => setSelectedAspectRatio(ratio.value)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border flex items-center gap-2 ${selectedAspectRatio === ratio.value ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg scale-105' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'}`}
                                            >
                                                <span>{ratio.icon}</span> {ratio.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerateStory}
                                    disabled={isLoading || characters.length === 0}
                                    className="w-full py-4 mt-8 bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold rounded-xl shadow-xl transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                                >
                                    {isLoading ? <Spinner /> : '🎬'} Generate Story Scenes | បង្កើតឈុតរឿង
                                </button>
                            </>
                        )}

                        {mainTab === 'ideas' && (
                            <div className="flex-grow space-y-6 overflow-y-auto custom-scrollbar pr-2 animate-fade-in">
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-300 uppercase mb-4 flex items-center gap-2">
                                        <CrossIcon /> Story Theme | ប្រធានបទរឿង
                                    </h4>
                                    <input 
                                        type="text" 
                                        value={ideaTheme}
                                        onChange={(e) => setIdeaTheme(e.target.value)}
                                        placeholder="e.g., Friendship, Adventure..."
                                        className="w-full bg-[#0f172a] border border-[#334155] text-white p-4 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
                                    />
                                </div>

                                <button 
                                    onClick={handleGenerateIdeas}
                                    disabled={isLoading || !ideaTheme.trim()}
                                    className="w-full py-4 bg-[#134e4a]/60 hover:bg-[#134e4a] text-cyan-300 font-bold rounded-xl transition border border-[#115e59] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    {isLoading ? <Spinner /> : '💡'} Generate 5 Story Ideas | បង្កើតគំនិតរឿង ៥
                                </button>
                                
                                {storyIdeas.length > 0 && (
                                    <div className="space-y-4 pt-2">
                                        {storyIdeas.map((idea, idx) => (
                                            <div key={idx} className="bg-[#0f172a]/80 p-5 rounded-xl border border-[#334155] hover:border-cyan-500/50 transition-colors group">
                                                <h5 className="font-bold text-cyan-400 mb-2 group-hover:text-white transition-colors">{idea.title}</h5>
                                                <p className="text-xs text-gray-400 mb-4 leading-relaxed">{idea.summary}</p>
                                                <button 
                                                    onClick={() => handleUseIdea(idea)}
                                                    className="w-full py-2.5 bg-cyan-900/30 hover:bg-cyan-800 text-cyan-200 text-xs font-bold rounded-lg border border-cyan-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Use This Story Idea | ប្រើគំនិតរឿងនេះ →
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: RESULTS */}
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Storyboard Output | លទ្ធផល Storyboard</h2>
                        {storyResults.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={handleCopyAllPrompts} className="px-3 py-2 bg-blue-900/40 hover:bg-blue-800 text-blue-300 text-xs font-bold rounded-lg transition border border-blue-800 flex items-center gap-2">
                                    {perSceneCopyStatus['all-prompts'] === 'Done' ? '✅ Copied' : <><CopyIcon /> Copy Prompts</>}
                                </button>
                                <button onClick={handleCopyAllJson} className="px-3 py-2 bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 text-xs font-bold rounded-lg transition border border-emerald-800 flex items-center gap-2">
                                    {perSceneCopyStatus['all-json'] === 'Done' ? '✅ Copied' : <><JsonIcon /> Copy JSON</>}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-grow bg-[#0f172a] rounded-2xl border border-[#334155] shadow-inner relative overflow-hidden flex flex-col min-h-[600px]">
                        {storyResults.length > 0 ? (
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {storyResults.map((s, i) => (
                                    <div key={i} className="bg-[#1e293b] p-5 rounded-2xl border border-[#334155] text-left hover:border-cyan-500/30 transition-all group animate-fade-in shadow-xl">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="w-10 h-10 bg-[#0f172a] text-cyan-400 font-black rounded-full flex items-center justify-center border border-[#334155] shadow-inner">{s.scene_number}</span>
                                                <h5 className="font-bold text-gray-200 uppercase text-xs tracking-widest">Scene Detail</h5>
                                            </div>
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                <button 
                                                    onClick={() => handleCopySceneJson(i)}
                                                    className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 shadow-sm hover:bg-gray-600"
                                                >
                                                    <JsonIcon className="h-3 w-3" />
                                                    {perSceneCopyStatus[`json-${i}`] === 'Done' ? 'COPIED' : 'COPY JSON'}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleCopySingleText(s.voiceover, `vo-${i}`)}
                                                    className="px-3 py-1.5 bg-indigo-900/40 border border-indigo-700 text-indigo-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 shadow-sm hover:bg-indigo-900"
                                                >
                                                    <CopyIcon className="h-3 w-3" />
                                                    {perSceneCopyStatus[`vo-${i}`] === 'Done' ? 'COPIED' : 'GET TEXT VOICE'}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleGenerateVoiceoverForScene(i)}
                                                    disabled={audioUrls[i]?.loading}
                                                    className="px-3 py-1.5 bg-purple-900/40 border border-purple-700 text-purple-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 shadow-sm hover:bg-purple-900 disabled:opacity-50"
                                                >
                                                    {audioUrls[i]?.loading ? <Spinner className="h-3 w-3 m-0"/> : <AudioIcon />}
                                                    GET VOICE OVER
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setEditingSceneIndex(editingSceneIndex === i ? null : i)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 shadow-sm border ${editingSceneIndex === i ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                                >
                                                    {isRegeneratingImage === i ? <Spinner className="h-3 w-3 m-0"/> : <RefreshIcon className="h-3 w-3" />}
                                                    {editingSceneIndex === i ? 'CLOSE EXTENSION' : 'GET NEW PROMPT'}
                                                </button>
                                            </div>
                                        </div>

                                        {editingSceneIndex === i && (
                                            <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-4 animate-slide-down">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xl">🧬</span>
                                                    <h4 className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">Character Consistency Verification</h4>
                                                </div>
                                                <div className="mb-4">
                                                    <h5 className="text-[9px] font-black text-gray-500 uppercase mb-2 tracking-widest">Reselect Characters:</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {characters.map(char => (
                                                            <button
                                                                key={char.id}
                                                                onClick={() => toggleSceneCharacter(i, char.id)}
                                                                className={`px-2 py-1 rounded-full text-[9px] font-bold border transition-all flex items-center gap-1.5 ${
                                                                    (sceneCharSelection[i] || characters.map(c => c.id)).includes(char.id)
                                                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                                        : 'bg-gray-800 border-gray-700 text-gray-600'
                                                                }`}
                                                            >
                                                                <UserGroupIcon /> {char.name || 'Unnamed'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {characters.filter(char => (sceneCharSelection[i] || characters.map(c => c.id)).includes(char.id)).map((c, cIdx) => (
                                                        <div key={c.id} className="bg-black/40 p-2 rounded border border-gray-700">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="text-[10px] font-bold text-cyan-400">{c.name}</span>
                                                            </div>
                                                            <textarea 
                                                                value={c.description} 
                                                                onChange={(e) => updateCharacter(c.id, 'description', e.target.value)}
                                                                className="w-full bg-transparent border-none text-[9px] text-gray-300 h-12 resize-none focus:ring-0 p-0"
                                                                placeholder="Adjust visual details..."
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingSceneIndex(null)} className="px-3 py-1 text-[10px] text-gray-500 hover:text-white font-bold transition">CANCEL</button>
                                                    <button 
                                                        onClick={() => handleRegenerateWithReselect(i)}
                                                        disabled={isRegeneratingImage === i}
                                                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-black shadow-lg flex items-center gap-2"
                                                    >
                                                        {isRegeneratingImage === i ? <Spinner className="h-3 w-3 m-0" /> : 'CONFIRM & GENERATE ART'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-3">
                                                <p className="text-sm text-gray-300 leading-relaxed font-serif italic border-l-2 border-cyan-600 pl-3 py-1">
                                                    "{s.scene_description.line}"
                                                </p>
                                            </div>
                                            
                                            {/* IMAGE SECTION */}
                                            <div className="flex flex-col items-center justify-center bg-black/40 rounded-xl border border-gray-800 overflow-hidden relative aspect-video min-h-[220px]">
                                                {sceneImages[i]?.url ? (
                                                    <div className="relative w-full h-full group">
                                                        <img src={sceneImages[i].url!} className="w-full h-full object-contain" alt={`Scene ${i+1}`} />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                                            <a href={sceneImages[i].url!} download={`Scene_${i+1}.png`} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm">
                                                                <DownloadIcon />
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        {sceneImages[i]?.loading ? (
                                                            <>
                                                                <Spinner className="h-6 w-6 text-cyan-500" />
                                                                <span className="text-[9px] text-cyan-500 font-bold animate-pulse">RENDERING...</span>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleGenerateImageForScene(i)}
                                                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 text-xs font-bold rounded-lg border border-gray-700 shadow-lg"
                                                            >
                                                                GENERATE ART
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* PROMPT BELOW IMAGE */}
                                            <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Prompt Used</span>
                                                    <button onClick={() => handleCopySingleText(s.prompt, `prompt-${i}`)} className="text-[9px] text-cyan-400 hover:underline">
                                                        {perSceneCopyStatus[`prompt-${i}`] === 'Done' ? 'Copied' : 'Copy'}
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">{s.prompt}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <p className="text-xl font-black uppercase tracking-[0.2em]">Ready for Production</p>
                            </div>
                        )}
                        
                        {isLoading && (
                            <div className="absolute top-4 right-4 bg-gray-900/90 border border-cyan-500/50 backdrop-blur px-4 py-2 rounded-full z-20 flex items-center gap-3 shadow-2xl">
                                <Spinner className="h-4 w-4 m-0 text-cyan-400" />
                                <span className="text-xs font-bold text-white tracking-widest uppercase">
                                    Rendering: {generationProgress}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StoryGeneratorKh;