import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generatePodcastScript, generateVoiceover, generateDialog, generateImage, generateCharacters, VisualScene, generatePromptFromImage, generateYouTubeMetadata, YouTubeMetadata } from '../services/geminiService.ts';
import type { PrebuiltVoice, Dialog } from '../services/geminiService.ts';
import { styles as styleLibrary } from './styles.ts';

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
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }
    return new Blob([view], { type: 'audio/wav' });
};

// --- Character ---
interface Character {
    id: number;
    name: string;
    voice: PrebuiltVoice;
    gender: string;
    age: string;
    description?: string;
    imageUrl?: string;
    isGeneratingImage?: boolean;
}

const allVoices: PrebuiltVoice[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const ageOptions = ['Child', 'Teenager', 'Adult', 'Senior'];
const genderOptions = ['Male', 'Female'];

const speakingStyles = [
    { key: 'conversational', emoji: '🗣️', km: 'សំណេះសំណាល', en: 'Friendly Conversational' },
    { key: 'storytelling', emoji: '🎞️', km: 'និទានរឿង', en: 'Storytelling' },
    { key: 'news', emoji: '💼', km: 'ព័ត៌មាន', en: 'News Style' },
];

const roomStyles = [
    'Modern Podcast Studio',
    'Cozy Living Room with Bookshelves',
    'Neon Gaming Room',
    'Professional News Desk',
];

const coverAspectRatios = [
    { label: '1:1 (Square)', value: '1:1' },
    { label: '16:9 (Landscape)', value: '16:9' },
    { label: '9:16 (Portrait)', value: '9:16' },
    { label: '4:3 (Classic)', value: '4:3' },
    { label: '3:4 (Tall)', value: '3:4' },
    { label: '4:5 (Insta Portrait)', value: '4:5' },
    { label: '5:4 (Landscape)', value: '5:4' },
];

const downloadResolutions = [
    { label: 'Original', scale: 1 },
    { label: '720p', width: 1280 },
    { label: '1080p', width: 1920 },
    { label: '2K', width: 2560 },
    { label: '4K', width: 3840 },
    { label: '8K', width: 7680 },
];

// --- Helper Components ---
const Spinner: React.FC<{className?: string}> = ({className = "-ml-1 mr-3 h-5 w-5 text-white"}) => (
    <svg className={`animate-spin text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const YouTubeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

const PodcastGenerator: React.FC = () => {
    const [podcastType, setPodcastType] = useState<'solo' | 'team'>('solo');
    const [language, setLanguage] = useState<'km' | 'en'>('km');
    const [topic, setTopic] = useState('');
    const [characters, setCharacters] = useState<Character[]>([
        { id: Date.now(), name: 'Host', voice: 'Kore', gender: 'Male', age: 'Adult', description: 'MC / Host (អ្នកសម្ភាសន៍)' }
    ]);
    const [durationInMinutes, setDurationInMinutes] = useState<number>(2);
    const [speakingStyle, setSpeakingStyle] = useState<string>(speakingStyles[0].en);
    const [isLoading, setIsLoading] = useState(false);
    const [isVoiceoverLoading, setIsVoiceoverLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [script, setScript] = useState<string | Dialog[] | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedScriptText, setEditedScriptText] = useState('');
    const [roomStyle, setRoomStyle] = useState(roomStyles[0]);
    const [youtubeMeta, setYoutubeMeta] = useState<YouTubeMetadata | null>(null);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    // --- Cover Art State ---
    const [isCoverStudioOpen, setIsCoverStudioOpen] = useState(false);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);
    const [coverSize, setCoverSize] = useState(coverAspectRatios[0].value);
    const [coverArtStyle, setCoverArtStyle] = useState('Realistic photography, professional studio setup');
    const [overlayText, setOverlayText] = useState('');
    const [overlayTextColor, setOverlayTextColor] = useState('#ffffff');
    const [overlayLogo, setOverlayLogo] = useState<string | null>(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    // PERSISTENCE LISTENER
    useEffect(() => {
        const handleSaveRequest = (e: any) => {
            if (e.detail.tool !== 'podcast') return;
            const projectData = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                tool: 'podcast',
                category: 'podcast',
                title: topic.substring(0, 30) || "Podcast Studio",
                data: {
                    podcastType,
                    language,
                    topic,
                    characters,
                    durationInMinutes,
                    speakingStyle,
                    script,
                    youtubeMeta,
                    coverImage,
                    roomStyle
                }
            };
            const existing = JSON.parse(localStorage.getItem('global_project_history') || '[]');
            localStorage.setItem('global_project_history', JSON.stringify([projectData, ...existing]));
        };

        const handleLoadRequest = (e: any) => {
            if (e.detail.tool !== 'podcast') return;
            const d = e.detail.data;
            if (d.podcastType) setPodcastType(d.podcastType);
            if (d.language) setLanguage(d.language);
            if (d.topic) setTopic(d.topic);
            if (d.characters) setCharacters(d.characters);
            if (d.durationInMinutes) setDurationInMinutes(d.durationInMinutes);
            if (d.speakingStyle) setSpeakingStyle(d.speakingStyle);
            if (d.script) setScript(d.script);
            if (d.youtubeMeta) setYoutubeMeta(d.youtubeMeta);
            if (d.coverImage) setCoverImage(d.coverImage);
            if (d.roomStyle) setRoomStyle(d.roomStyle);
            setError(null);
        };

        window.addEventListener('REQUEST_PROJECT_SAVE', handleSaveRequest);
        window.addEventListener('LOAD_PROJECT', handleLoadRequest);
        return () => {
            window.removeEventListener('REQUEST_PROJECT_SAVE', handleSaveRequest);
            window.removeEventListener('LOAD_PROJECT', handleLoadRequest);
        };
    }, [topic, podcastType, language, characters, durationInMinutes, speakingStyle, script, youtubeMeta, coverImage, roomStyle]);

    useEffect(() => {
        return () => { 
            if (audioUrl) URL.revokeObjectURL(audioUrl); 
            if (overlayLogo) URL.revokeObjectURL(overlayLogo);
        };
    }, [audioUrl, overlayLogo]);

    const handlePodcastTypeChange = (type: 'solo' | 'team') => {
        setPodcastType(type);
        if (type === 'solo') {
            setCharacters([{ 
                id: Date.now(), 
                name: 'Host', 
                voice: 'Kore', 
                gender: 'Male', 
                age: 'Adult',
                description: 'MC / Host (អ្នកសម្ភាសន៍)' 
            }]);
        } else {
            setCharacters([
                { id: Date.now(), name: 'Socheata', voice: 'Zephyr', gender: 'Female', age: 'Adult', description: 'MC / Host (អ្នកសម្ភាសន៍)' },
                { id: Date.now() + 1, name: 'Mr. Saroeun', voice: 'Fenrir', gender: 'Male', age: 'Senior', description: 'Guest (អ្នកឆ្លើយ)' }
            ]);
        }
    };

    const updateCharacter = (id: number, field: keyof Omit<Character, 'id'>, value: any) => {
        setCharacters(chars => chars.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const formatScriptForEditing = (scriptData: string | Dialog[]): string => {
        if (typeof scriptData === 'string') return scriptData;
        return scriptData.map(d => `${d.character}: ${d.line}`).join('\n\n');
    };

    const parseEditedScript = (text: string): Dialog[] => {
        const dialogs: Dialog[] = [];
        const entries = text.split('\n\n'); 
        for (const entry of entries) {
            const parts = entry.split(/:\s*(.*)/s); 
            if (parts.length >= 2) {
                dialogs.push({ character: parts[0].trim(), line: parts[1].trim() });
            }
        }
        return dialogs;
    };

    const handleStart = async () => {
        setError(null);
        if (!topic.trim()) {
            setError('Please provide a topic for the podcast.');
            return;
        }

        setIsLoading(true);
        setAudioUrl(null);
        setScript(null);
        setIsEditing(false);
        setProgress('Writing Emotional Script...');

        try {
            const emotionalConstraint = `
IMPORTANT: The podcast must be natural, high-quality, and full of "Feeling" (Emotions).
- For every line, include a sensory or feeling tag in brackets at the start, e.g. [excitedly], [passionately], [laughs], [thoughtful pause].
- Target Duration: ${durationInMinutes} Minutes.
- You MUST generate a full, verbose script that will last for the requested time.
- Every response must convey a specific feeling.
- Style: Professional Studio Broadcast Quality.
`;
            const scriptToUse = await generatePodcastScript({
                topic: topic + emotionalConstraint,
                language, 
                podcastType, 
                characters: characters.map(c => ({ name: c.name })), 
                durationInMinutes: durationInMinutes, 
                speakingStyle,
            });

            setScript(scriptToUse);
            setEditedScriptText(formatScriptForEditing(scriptToUse));

            setProgress('Designing Characters...');
            const updatedCharacters = [...characters];
            for (let i = 0; i < updatedCharacters.length; i++) {
                const char = updatedCharacters[i];
                const role = i === 0 ? "MC / Host (អ្នកសម្ភាសន៍)" : "Guest (អ្នកឆ្លើយ)";
                setProgress(`Designing ${role}...`);
                const imgPrompt = `3D animated portrait of a podcast character. Name: ${char.name}. Gender: ${char.gender}. Age: ${char.age}. Role: ${role}. Style: High-quality Pixar 3D Animation. Setting: ${roomStyle}. Expressive face with a warm emotion, cinematic lighting, 8k resolution.`;
                
                try {
                    const imgUrl = await generateImage(imgPrompt, '1:1');
                    updatedCharacters[i] = { ...char, imageUrl: imgUrl };
                    setCharacters([...updatedCharacters]); 
                } catch (imgErr) {
                    console.error(`Failed to generate image for ${char.name}`, imgErr);
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setProgress('');
        }
    };

    const handleGenerateVoiceoverAction = async () => {
        if (!script) return;
        setIsVoiceoverLoading(true);
        setError(null);
        setProgress('Generating High Quality Voiceover...');
        
        try {
            const voiceConsistencyInstruction = language === 'km' 
                ? "សំខាន់៖ នេះគឺជាផតខាសដែលមានគុណភាពខ្ពស់បំផុត។ សូមប្រើសំឡេងស្ទូឌីយោអាជីព រក្សាសំឡេងឱ្យនៅថេរ និងបញ្ចេញអារម្មណ៍ឱ្យបានល្អបំផុតតាមខ្លឹមសារ។" 
                : "IMPORTANT: This is a Very High Quality Studio Podcast. Use a professional, high-fidelity studio voice. Ensure the voices match the emotional tags perfectly.";

            let base64Audio: string;
            const scriptToUse = isEditing ? parseEditedScript(editedScriptText) : script;

            if (podcastType === 'solo') {
                base64Audio = await generateVoiceover(typeof scriptToUse === 'string' ? scriptToUse : editedScriptText, language, characters[0].voice, undefined, voiceConsistencyInstruction);
            } else {
                const speakerConfigs = characters.map(c => ({ speaker: c.name, voiceName: c.voice }));
                const dialogArray = Array.isArray(scriptToUse) ? scriptToUse : parseEditedScript(editedScriptText);
                base64Audio = await generateDialog(dialogArray, speakerConfigs, voiceConsistencyInstruction);
            }

            const pcmBytes = decode(base64Audio);
            const pcmInt16 = new Int16Array(pcmBytes.buffer);
            const wavBlob = pcmToWavBlob(pcmInt16, 1, 24000, 16);
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Voiceover generation failed.');
        } finally {
            setIsVoiceoverLoading(false);
            setProgress('');
        }
    };

    // --- Cover Art Methods ---
    const handleGenerateCover = async () => {
        setIsGeneratingCover(true);
        setError(null);
        try {
            const prompt = `Podcast Cover Art for topic: "${topic}". Style: ${coverArtStyle}. Composition: Clean, professional, minimal text space. IMPORTANT: Any visible text in the background or graphics must be in English language only. Absolutely no Cambodian or non-English script. 8k resolution, cinematic lighting.`;
            const imageUrl = await generateImage(prompt, coverSize as any);
            setCoverImage(imageUrl);
        } catch (err) {
            setError("Cover Art generation failed.");
        } finally {
            setIsGeneratingCover(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (overlayLogo) URL.revokeObjectURL(overlayLogo);
            const url = URL.createObjectURL(file);
            setOverlayLogo(url);
        }
    };

    const processCoverForDownload = async (resConfig: { label: string; scale?: number; width?: number }): Promise<string> => {
        if (!coverImage) return '';
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("Canvas context error");

                let targetWidth = img.width;
                let targetHeight = img.height;

                if (resConfig.width) {
                    const ratio = img.height / img.width;
                    targetWidth = resConfig.width;
                    targetHeight = Math.round(targetWidth * ratio);
                } else if (resConfig.scale) {
                    targetWidth = img.width * resConfig.scale;
                    targetHeight = img.height * resConfig.scale;
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // Draw Text
                if (overlayText) {
                    const fontSize = Math.max(30, targetHeight * 0.08);
                    ctx.font = `bold ${fontSize}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    
                    // Shadow
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = fontSize * 0.15;
                    ctx.strokeText(overlayText, targetWidth / 2, targetHeight - (fontSize * 0.5));
                    
                    ctx.fillStyle = overlayTextColor;
                    ctx.fillText(overlayText, targetWidth / 2, targetHeight - (fontSize * 0.5));
                }

                // Draw Logo
                if (overlayLogo) {
                    const logoImg = new Image();
                    logoImg.crossOrigin = "anonymous";
                    await new Promise((res) => {
                        logoImg.onload = () => {
                            const logoSize = Math.min(targetWidth, targetHeight) * 0.2;
                            const padding = logoSize * 0.2;
                            ctx.drawImage(logoImg, targetWidth - logoSize - padding, padding, logoSize, logoSize);
                            res(null);
                        };
                        logoImg.onerror = () => res(null);
                        logoImg.src = overlayLogo;
                    });
                }

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = coverImage;
        });
    };

    const handleDownloadCover = async (resConfig: any) => {
        try {
            const finalDataUrl = await processCoverForDownload(resConfig);
            const link = document.createElement('a');
            link.href = finalDataUrl;
            link.download = `podcast-cover-${Date.now()}-${resConfig.label}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShowDownloadMenu(false);
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    const handleGenerateMetadata = async () => {
        if (!script) return;
        setIsGeneratingMeta(true);
        try {
            const scriptText = typeof script === 'string' ? script : script.map(d => `${d.character}: ${d.line}`).join('\n');
            const meta = await generateYouTubeMetadata(topic, scriptText.substring(0, 2000), 'Podcast');
            setYoutubeMeta(meta);
        } catch (e) {
            setError("Failed to generate metadata");
        } finally {
            setIsGeneratingMeta(false);
        }
    };

    const handleCopyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleClear = () => {
        setTopic('');
        setCharacters([{ id: Date.now(), name: 'Host', voice: 'Kore', gender: 'Male', age: 'Adult', description: 'MC / Host (អ្នកសម្ភាសន៍)' }]);
        setPodcastType('solo');
        setDurationInMinutes(2);
        setError(null);
        setAudioUrl(null);
        setScript(null);
        setYoutubeMeta(null);
        setCoverImage(null);
        setOverlayText('');
        setOverlayLogo(null);
    };

    const inputClasses = "bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 placeholder-gray-400 disabled:opacity-50";

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col">
            <ClearProjectButton onClick={handleClear} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls Panel */}
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-6 h-fit">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
                            <span>🎙️</span> Podcast Generator
                        </h2>
                        <span className="bg-cyan-900/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-800 uppercase tracking-widest">Studio Quality V2</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-300">Type</label>
                            <div className="flex bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => handlePodcastTypeChange('solo')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${podcastType === 'solo' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}>Solo</button>
                                <button onClick={() => handlePodcastTypeChange('team')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${podcastType === 'team' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}>Team</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-300">Lang</label>
                            <div className="flex bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => setLanguage('km')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${language === 'km' ? 'bg-cyan-500 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}>KH</button>
                                <button onClick={() => setLanguage('en')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${language === 'en' ? 'bg-cyan-500 text-white shadow' : 'text-gray-300 hover:bg-gray-600'}`}>EN</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Duration (Minutes)</label>
                            <div className="flex items-center bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
                                <button onClick={() => setDurationInMinutes(Math.max(1, durationInMinutes - 1))} className="px-3 py-2 bg-gray-700 hover:bg-gray-500 text-white transition hover:bg-gray-500">-</button>
                                <input readOnly value={durationInMinutes} className="w-full text-center bg-transparent text-white font-bold" />
                                <button onClick={() => setDurationInMinutes(Math.min(10, durationInMinutes + 1))} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white transition hover:bg-gray-500">+</button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Supports up to 10 minutes session.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Studio Backdrop</label>
                            <select value={roomStyle} onChange={(e) => setRoomStyle(e.target.value)} className={inputClasses}>
                                {roomStyles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300">Podcast Topic</label>
                        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's the podcast about?" className={`${inputClasses} h-24 resize-none`} />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-300">Speaker Setup</h3>
                        {characters.map((char, index) => (
                            <div key={char.id} className={`p-4 rounded-xl border transition-all ${index === 0 ? 'bg-red-900/10 border-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-blue-900/10 border-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 relative group shrink-0 shadow-xl">
                                        {char.imageUrl ? <img src={char.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl opacity-30">👤</div>}
                                        {isLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Spinner className="h-4 w-4 m-0"/></div>}
                                    </div>
                                    <div className="flex-grow space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-bold uppercase tracking-widest ${index === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                {char.description}
                                            </span>
                                            <button 
                                                onClick={() => handleCopyText(`${char.name}: ${char.gender}, ${char.age}`, `char-${index}`)}
                                                className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${index === 0 ? 'text-red-400 border-red-900/50 hover:bg-red-900/30' : 'text-blue-400 border-blue-500/50 hover:bg-blue-500/30'}`}
                                            >
                                                {copyStatus === `char-${index}` ? '✓ Copied' : 'Copy Detail'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="Name" value={char.name} onChange={e => updateCharacter(char.id, 'name', e.target.value)} className={`${inputClasses} py-1 text-xs`} />
                                            <select value={char.age} onChange={e => updateCharacter(char.id, 'age', e.target.value)} className={`${inputClasses} py-1 text-xs`}>
                                                {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select value={char.gender} onChange={e => updateCharacter(char.id, 'gender', e.target.value)} className={`${inputClasses} py-1 text-xs`}>
                                                {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                            <select value={char.voice} onChange={e => updateCharacter(char.id, 'voice', e.target.value)} className={`${inputClasses} py-1 text-xs`}>
                                                {allVoices.map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={handleStart} disabled={isLoading || !topic.trim()} className="w-full py-4 font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl shadow-lg border-b-4 border-purple-800 hover:from-purple-500 hover:to-cyan-500 transform transition active:translate-y-1 active:border-b-0 disabled:opacity-50">
                        {isLoading ? <><Spinner /> {progress || 'Generating...'}</> : 'Get Go (Create Story) 🚀'}
                    </button>
                </div>
                
                {/* Output Panel */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 min-h-[500px] flex flex-col space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-300">Podcast Master Console</h2>
                        <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                             <span className="text-[10px] text-gray-500 font-bold uppercase">Ready</span>
                        </div>
                    </div>

                    {/* Cover Art Studio Section */}
                    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                        <button 
                            onClick={() => setIsCoverStudioOpen(!isCoverStudioOpen)}
                            className="w-full p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
                        >
                            <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                🖼️ Cover Art Studio
                            </h3>
                            <span className={`transform transition-transform ${isCoverStudioOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {isCoverStudioOpen && (
                            <div className="p-4 border-t border-gray-700 space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Size</label>
                                        <select value={coverSize} onChange={(e) => setCoverSize(e.target.value)} className={inputClasses}>
                                            {coverAspectRatios.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Art Style</label>
                                        <select value={coverArtStyle} onChange={(e) => setCoverArtStyle(e.target.value)} className={inputClasses}>
                                            <option value="Realistic photography, professional studio setup">Realistic Photography</option>
                                            {styleLibrary.map(s => <option key={s.name} value={s.value}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Color</label>
                                        <input type="color" value={overlayTextColor} onChange={e => setOverlayTextColor(e.target.value)} className="w-full h-10 bg-transparent border-0 cursor-pointer p-0" />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Overlay Text</label>
                                        <input type="text" value={overlayText} onChange={e => setOverlayText(e.target.value)} placeholder="Add English title..." className={inputClasses} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Logo Overlay</label>
                                    <label className="flex items-center justify-center w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700 transition">
                                        <span className="text-xs text-gray-400 truncate px-2">{overlayLogo ? "Logo Loaded" : "Upload Logo (PNG/GIF/JPG)"}</span>
                                        <input type="file" accept="image/*,.ico,.gif" onChange={handleLogoUpload} className="hidden" />
                                    </label>
                                </div>

                                <button 
                                    onClick={handleGenerateCover}
                                    disabled={isGeneratingCover || !topic.trim()}
                                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 transition active:scale-95 flex items-center justify-center"
                                >
                                    {isGeneratingCover ? <Spinner className="h-4 w-4" /> : 'Generate Cover'}
                                </button>

                                {coverImage && (
                                    <div className="relative group rounded-lg overflow-hidden border border-gray-700 aspect-video bg-black flex items-center justify-center">
                                        <img src={coverImage} className="w-full h-full object-contain" alt="Generated Cover" />
                                        
                                        <div className="absolute inset-0 pointer-events-none">
                                            {overlayLogo && <img src={overlayLogo} className="absolute top-4 right-4 w-[15%] aspect-square object-contain drop-shadow-lg" />}
                                            {overlayText && (
                                                <div className="absolute bottom-4 w-full text-center px-4">
                                                    <span className="font-bold drop-shadow-lg break-words" style={{ color: overlayTextColor, fontSize: '1.25rem', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                                                        {overlayText}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold flex items-center gap-2 shadow-lg transition"
                                                >
                                                    💾 Download ▾
                                                </button>
                                                {showDownloadMenu && (
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 overflow-hidden">
                                                        {downloadResolutions.map(res => (
                                                            <button 
                                                                key={res.label} 
                                                                onClick={() => handleDownloadCover(res)}
                                                                className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition block border-b border-gray-800 last:border-none"
                                                            >
                                                                {res.label} {res.width ? `(${res.width}w)` : ''}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow bg-gray-900 rounded-xl p-4 flex flex-col relative overflow-hidden">
                        {isLoading && !script ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Spinner className="h-10 w-10 text-cyan-400 mb-4" />
                                <p className="text-white font-bold animate-pulse">{progress}</p>
                                <p className="text-xs text-gray-500 mt-2 italic">Generating script first...</p>
                            </div>
                        ) : error ? (
                             <div className="m-auto p-4 text-center bg-red-900/20 border border-red-700 text-red-300 rounded-lg">
                                {error}
                            </div>
                        ) : script ? (
                            <div className="flex flex-col h-full space-y-4 animate-fade-in">
                                {!audioUrl && (
                                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/50 p-6 rounded-xl text-center shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="text-4xl mb-4">🎙️</div>
                                        <h3 className="text-white font-bold text-lg mb-2">Script & Art Ready</h3>
                                        <p className="text-gray-400 text-xs mb-6 px-4">Now generate the high-quality multi-speaker voiceover.</p>
                                        <button 
                                            onClick={handleGenerateVoiceoverAction}
                                            disabled={isVoiceoverLoading}
                                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            {isVoiceoverLoading ? <><Spinner /> PRODUCING HQ AUDIO...</> : <><SpeakerIcon /> GENERATE HQ VOICEOVER</>}
                                        </button>
                                    </div>
                                )}

                                {audioUrl && (
                                    <div className="bg-gray-800 p-4 rounded-xl border border-emerald-500/30 space-y-3 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Master Audio Produced</span>
                                                <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded">High Fidelity</span>
                                            </div>
                                            <a href={audioUrl} download={`podcast-hq-${Date.now()}.wav`} className="text-[10px] bg-emerald-600 px-2 py-1 rounded text-white font-bold hover:bg-emerald-500 transition shadow-sm">💾 Download Master</a>
                                        </div>
                                        <audio controls src={audioUrl} className="w-full h-10" />
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Script Preview</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(!isEditing)} className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition">{isEditing ? 'Save' : 'Edit'}</button>
                                        <button onClick={handleGenerateMetadata} disabled={isGeneratingMeta} className="text-[10px] bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-white transition flex items-center gap-1">
                                            {isGeneratingMeta ? <Spinner className="h-3 w-3 m-0"/> : <YouTubeIcon />} Metadata
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-grow relative overflow-hidden flex flex-col">
                                    {isEditing ? (
                                        <textarea
                                            value={editedScriptText}
                                            onChange={(e) => setEditedScriptText(e.target.value)}
                                            className="w-full h-full bg-black/40 text-gray-300 p-4 rounded-lg text-sm font-serif leading-relaxed resize-none outline-none border border-cyan-500 focus:border-cyan-400 transition-colors"
                                        />
                                    ) : (
                                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                            {Array.isArray(script) ? (
                                                script.map((line, idx) => (
                                                    <div key={idx} className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${line.character === characters[0]?.name ? 'bg-red-900/10 border-red-900/30' : 'bg-blue-900/10 border-blue-500/30'} group`}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className={`text-xs font-black uppercase tracking-tighter ${line.character === characters[0]?.name ? 'text-red-400' : 'text-blue-400'}`}>
                                                                {line.character}
                                                            </span>
                                                            <button onClick={() => handleCopyText(`${line.character}: ${line.line}`, `line-${idx}`)} className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all text-gray-500 hover:text-white">
                                                                {copyStatus === `line-${idx}` ? '✓' : <CopyIcon />}
                                                            </button>
                                                        </div>
                                                        <p className="text-gray-200 text-sm leading-relaxed font-serif">{line.line}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-red-900/10 border border-red-900/30 p-5 rounded-xl shadow-inner">
                                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-serif">{editedScriptText}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center text-3xl shadow-inner border border-gray-700 animate-pulse">🎙️</div>
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-400">Professional Studio Ready</p>
                                    <p className="text-xs max-w-[250px]">Select characters and duration to begin your high-quality broadcast.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PodcastGenerator;
