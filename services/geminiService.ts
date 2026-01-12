
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize AI
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry logic
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

// Clean JSON helper
function cleanJson(text: string): string {
  if (!text) return "";
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

// --- Types ---
export interface Character {
  name: string;
  gender: string;
  age: string;
  description: string;
}

export interface StoryScene {
  scene_number: number;
  title: string;
  slug: string;
  scene_description: { line: string };
  dialog: { character: string; line: string }[];
  prompt: string;
  voiceover: string;
}

export interface StoryIdea {
  title: string;
  summary: string;
}

export interface CarIdea {
  title: string;
  description: string;
}

export interface ScriptOutline {
    title: string;
    outline: { chapter: number; title: string; summary: string }[];
}

export type PrebuiltVoice = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface LyricsResponse {
    songTitle: string;
    songLyrics: string;
}

export interface LyricScene {
    scene_number: number;
    title: string;
    lyric_segment: string;
    visual_description: string;
    prompt: string;
}

export interface SimpleStoryResponse {
    storyTitle: string;
    storyContent: string;
}

export interface VlogScriptResponse {
    youtubeTitle: string;
    youtubeDescription: string;
    vlogScript: string;
}

export interface YouTubeMetadata {
    title: string;
    description: string;
    hashtags: string[];
    keywords: string[];
}

export interface ImageReference {
    base64: string;
    mimeType: string;
}

export interface VideoIdea {
    title: string;
    summary: string;
    sampleScriptLine: string;
}

export interface KhmerScene {
    sceneNumber: number;
    dialogues: { character: string; text: string }[];
    visualPrompt: string;
}

export interface TriviaQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    imagePrompt: string;
}

export interface TriviaResponse {
    questions: TriviaQuestion[];
}

export interface WebtoonPanel {
    panelNumber: number;
    visualDescription: string;
    dialogue: { character: string; text: string; type: 'speech' | 'thought' | 'narration' }[];
}

export interface RelaxingPromptsResponse {
    videoSegments: { segmentNumber: number; prompt: string }[];
    musicPrompt: string;
}

export interface DetailedOutline {
    title: string;
    chapters: { chapter: number; title: string; summary: string; purpose: string }[];
}

export interface KidsMusicProject {
    title: string;
    lyrics: string;
    musicPrompt: string;
    scenes: { sceneNumber: number; lyricSegment: string; visualPrompt: string }[];
}

export interface DanceProject {
    masterPrompt: string;
    musicPrompt: string;
    scenes: { sceneNumber: number; action: string; videoPrompt: string }[];
}

export interface ShortFilmProject {
    title: string;
    synopsis: string;
    genre: string;
    visualStyle: string;
    scenes: { sceneNumber: number; action: string; videoPrompt: string }[];
}

export interface ComicPanel {
    panel_number: number;
    visual_prompt: string;
    dialogue: string;
    speaker: string;
}

export interface VisualScene {
    scene_number: number;
    narrative: string;
    visual_prompt: string;
}

export interface MvScene {
    scene_number: number;
    timestamp: string;
    lyrics: string;
    visual_description: string;
    video_prompt: string;
}

export interface HollywoodMvScene {
    scene_number: number;
    time_range: string;
    description: string;
    video_prompt: string;
}

export interface MvDetailedScene {
    scene_number: number;
    action: string;
    character_detail: string;
    style: string;
    full_prompt: string;
}

export interface CharacterAnalysis {
    artStyle: string;
    characterDescription: string;
}

export interface Dialog {
    character: string;
    line: string;
}

export interface VlogStoryboardScene {
    scene_number: number;
    narrative_en: string;
    narrative_km: string;
    visual_prompt: string;
}

export interface ConsistentScene {
    sceneNumber: number;
    action: string;
    consistentContext: string;
    voiceover?: string;
}

// --- Implementation ---

/**
 * Generates a high-quality animation script using gemini-3-flash-preview or gemini-3-pro-preview.
 */
export const generateStory = async (params: { 
    topic?: string, genderFocus?: string, smartThinking?: boolean, pastedStory?: string, style?: string, sceneCount?: number, characters?: Character[] 
}): Promise<StoryScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const visualStyleStr = params.style || "3D Animation Style (Pixar/Disney/4D Render aesthetic)";

        const prompt = `
            TASK: Generate a high-quality animation script with EXACTLY ${params.sceneCount || 5} scenes.
            STORY THEME/TOPIC: ${params.topic || params.pastedStory}
            VISUAL STYLE (MANDATORY): ${visualStyleStr}.
            STRICT INSTRUCTION: Maintain 100% character and style consistency. Provide description, prompt, and voiceover for each scene.
            CHARACTERS: ${JSON.stringify(params.characters || [])}
        `;
        
        const response = await ai.models.generateContent({
            model: params.smartThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            title: { type: Type.STRING },
                            slug: { type: Type.STRING },
                            scene_description: { type: Type.OBJECT, properties: { line: { type: Type.STRING } } },
                            dialog: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { character: { type: Type.STRING }, line: { type: Type.STRING } } } },
                            prompt: { type: Type.STRING },
                            voiceover: { type: Type.STRING }
                        },
                        required: ["scene_number", "title", "scene_description", "prompt", "voiceover"]
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates characters based on a context using gemini-3-flash-preview.
 */
export const generateCharacters = async (context: string, count: number, styleExtra?: string, thinking: boolean = false): Promise<Character[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const prompt = `Create ${count} detailed characters for: ${context}. ${styleExtra || ""}`;
        const response = await ai.models.generateContent({
            model: thinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            gender: { type: Type.STRING },
                            age: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["name", "gender", "age", "description"]
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates speech audio from text using gemini-2.5-flash-preview-tts.
 */
export const generateVoiceover = async (text: string, lang: string = 'en', voice: PrebuiltVoice = 'Kore', emotion?: string, instruction?: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const prompt = `${instruction ? instruction + "\n" : ""}${emotion ? "(" + emotion + ") " : ""}Speak this in ${lang}: ${text}`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Voice generation failed.");
        return base64Audio;
    });
};

/**
 * Generates multi-speaker speech audio from dialogue lines.
 */
export const generateDialog = async (dialogs: Dialog[], speakers: { speaker: string; voiceName: PrebuiltVoice }[], instruction?: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const prompt = `${instruction ? instruction + "\n" : ""}TTS the following conversation:\n${dialogs.map(d => `${d.character}: ${d.line}`).join('\n')}`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: speakers.map(s => ({
                            speaker: s.speaker,
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voiceName } }
                        }))
                    }
                }
            }
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Dialog generation failed.");
        return base64Audio;
    });
};

/**
 * Edits an image based on a prompt using gemini-2.5-flash-image.
 */
export const editImage = async (base64: string, mimeType: string, prompt: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: prompt }
                ]
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
        }
        throw new Error("No image generated.");
    });
};

/**
 * Generates an image from a prompt using gemini-2.5-flash-image.
 */
export const generateImage = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: aspectRatio as any }
            }
        });
         for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
        }
        throw new Error("No image generated.");
    });
};

/**
 * Mixes two images into a new one using gemini-2.5-flash-image.
 */
export const mixImages = async (base64A: string, mimeA: string, base64B: string, mimeB: string, prompt: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeA, data: base64A } },
                    { inlineData: { mimeType: mimeB, data: base64B } },
                    { text: prompt }
                ]
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
        }
        throw new Error("Mixing failed.");
    });
};

/**
 * Extracts a prompt describing an image.
 */
export const generatePromptFromImage = async (base64: string, mimeType: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Describe this image in extreme detail for use as a generative AI prompt." }
                ]
            }
        });
        return response.text || "";
    });
};

/**
 * Extracts a video generation prompt from an image.
 */
export const generateVideoPromptFromImage = async (base64: string, mimeType: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Describe this image in detail and suggest cinematic movements, lighting changes, and action for a high-quality AI video generation prompt based on this scene." }
                ]
            }
        });
        return response.text || "";
    });
};

/**
 * Extracts a prompt describing a video.
 */
export const generatePromptFromVideo = async (base64: string, mimeType: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Describe this video in detail, focusing on style, characters, and movement, to create a clone prompt." }
                ]
            }
        });
        return response.text || "";
    });
};

/**
 * Extracts a prompt from a URL using web search tool.
 */
export const generatePromptFromUrl = async (url: string, platform: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Describe the content and style of this ${platform} video for use as an AI prompt: ${url}`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "";
    });
};

/**
 * Generates video using veo-3.1-fast-generate-preview.
 */
export const generateVideo = async (params: { prompt: string, model?: string, aspectRatio?: '16:9' | '9:16', resolution?: '720p' | '1080p', image?: { base64: string, mimeType: string } }): Promise<Blob> => {
    const ai = getAi();
    const model = params.model || 'veo-3.1-fast-generate-preview'; 
    const config = {
        numberOfVideos: 1,
        resolution: params.resolution || '720p',
        aspectRatio: params.aspectRatio || '16:9'
    };
    let operation = await ai.models.generateVideos({
        model,
        prompt: params.prompt,
        image: params.image ? { imageBytes: params.image.base64, mimeType: params.image.mimeType } : undefined,
        config
    });
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed.");
    const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    return await res.blob();
};

/**
 * Generates story ideas based on a topic.
 */
export const generateStoryIdeas = async (topic: string, smart: boolean = false): Promise<StoryIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: smart ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
            contents: `Generate 5 creative story ideas for topic: ${topic}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a simple story response.
 */
export const generateSimpleStory = async (params: { topic: string, style?: string, length?: string }): Promise<SimpleStoryResponse> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a ${params.length || 'short'} story about ${params.topic} in ${params.style || 'any'} style.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        storyTitle: { type: Type.STRING },
                        storyContent: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates a vlog script with metadata.
 */
export const generateVlogScript = async (topic: string, style: string): Promise<VlogScriptResponse> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a vlog script for: ${topic}. Style: ${style}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        youtubeTitle: { type: Type.STRING },
                        youtubeDescription: { type: Type.STRING },
                        vlogScript: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates YouTube metadata for a project.
 */
export const generateYouTubeMetadata = async (title: string, context: string, type: string): Promise<YouTubeMetadata> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate YouTube metadata for this ${type} project: ${title}. Context: ${context}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Analyzes an image reference for character traits and style.
 */
export const analyzeCharacterReference = async (base64: string, mimeType: string): Promise<CharacterAnalysis> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Analyze this image for character traits and artistic style." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        artStyle: { type: Type.STRING },
                        characterDescription: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Translates text from one language to another.
 */
export const translateText = async (text: string, from: string, to: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following text from ${from} to ${to}:\n\n${text}`
        });
        return response.text || "";
    });
};

/**
 * Generates an image using reference images for subjects, scene, or style.
 */
export const generateImageWithReferences = async (prompt: string, refs: { subjects?: ImageReference[], scene?: ImageReference, style?: ImageReference }, aspectRatio: string = '1:1'): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const parts: any[] = [{ text: prompt }];
        if (refs.subjects) refs.subjects.forEach(r => parts.push({ inlineData: { mimeType: r.mimeType, data: r.base64 } }));
        if (refs.scene) parts.push({ inlineData: { mimeType: refs.scene.mimeType, data: refs.scene.base64 } });
        if (refs.style) parts.push({ inlineData: { mimeType: refs.style.mimeType, data: refs.style.base64 } });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { imageConfig: { aspectRatio: aspectRatio as any } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
        }
        throw new Error("Image reference generation failed.");
    });
};

/**
 * Generates a consistent story script with scene actions and context.
 */
export const generateConsistentStoryScript = async (synopsis: string, sceneCount: number): Promise<ConsistentScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate exactly ${sceneCount} consistent story scenes for: ${synopsis}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sceneNumber: { type: Type.INTEGER },
                            action: { type: Type.STRING },
                            consistentContext: { type: Type.STRING },
                            voiceover: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates scenes from a text story.
 */
export const generateScenesFromStory = async (story: string, sceneCount: number): Promise<VisualScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Break this story into ${sceneCount} visual scenes: ${story}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            narrative: { type: Type.STRING },
                            visual_prompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a music prompt for a song.
 */
export const generateSongMusicPrompt = async (title: string, style: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a music generation prompt (for Suno/Udio) for a ${style} song titled: ${title}`
        });
        return response.text || "";
    });
};

/**
 * Generates an image prompt based on a scene text.
 */
export const generateVisualPromptFromText = async (text: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a detailed AI image prompt for this scene: ${text}`
        });
        return response.text || "";
    });
};

/**
 * Generates an image clone.
 */
export const generateCloneImage = async (base64: string, mimeType: string, prompt: string, ratio: string = '1:1'): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: `Create a high-fidelity clone of this subject. Prompt: ${prompt}` }
                ]
            },
            config: { imageConfig: { aspectRatio: ratio as any } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
        }
        throw new Error("Clone failed.");
    });
};

/**
 * Generates a home design.
 */
export const generateHomeDesign = async (img: ImageReference | null, mode: string, type: string, style: string, prompt: string, ratio: string): Promise<string> => {
    const fullPrompt = `Mode: ${mode}. Room/Space Type: ${type}. Style: ${style}. Extra: ${prompt}`;
    if (img) return editImage(img.base64, img.mimeType, fullPrompt);
    return generateImage(fullPrompt, ratio);
};

/**
 * Transcribes a video file.
 */
export const transcribeVideo = async (base64: string, mimeType: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Transcribe the speech in this video accurately." }
                ]
            }
        });
        return response.text || "";
    });
};

/**
 * Extracts lyrics from a media file.
 */
export const extractLyricsFromMedia = async (base64: string, mimeType: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Extract the lyrics from this song accurately." }
                ]
            }
        });
        return response.text || "";
    });
};

/**
 * Generates lyrics based on a title.
 */
export const generateLyricsFromTitle = async (title: string, gender: string = 'Any'): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write song lyrics for a title: ${title}. Intended singer: ${gender}.`
        });
        return response.text || "";
    });
};

/**
 * Translates song lyrics while preserving rhythm.
 */
export const translateSongLyrics = async (lyrics: string, from: string, to: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate these lyrics from ${from} to ${to}, maintaining the musical rhythm and feel:\n\n${lyrics}`
        });
        return response.text || "";
    });
};

/**
 * Generates a detailed MV script.
 */
export const generateMvScript = async (title: string, artist: string): Promise<MvScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a music video storyboard script for: ${title} by ${artist}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            timestamp: { type: Type.STRING },
                            lyrics: { type: Type.STRING },
                            visual_description: { type: Type.STRING },
                            video_prompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a detailed production storyboard.
 */
export const generateDetailedMvScript = async (prompt: string, characters: Character[], style: string): Promise<MvDetailedScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            action: { type: Type.STRING },
                            character_detail: { type: Type.STRING },
                            style: { type: Type.STRING },
                            full_prompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a trivia quiz.
 */
export const generateTrivia = async (topic: string, count: number, diff: string, lang: string, style: string): Promise<TriviaQuestion[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate ${count} ${diff} trivia questions about ${topic} in ${lang}. Art Style for images: ${style}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswer: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            imagePrompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a webtoon script.
 */
export const generateWebtoonScript = async (topic: string, style: string, count: number, lang: string, chars: Character[]): Promise<WebtoonPanel[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a webtoon script with ${count} panels for: ${topic}. Style: ${style}. Characters: ${JSON.stringify(chars)}. Language: ${lang}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            panelNumber: { type: Type.INTEGER },
                            visualDescription: { type: Type.STRING },
                            dialogue: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        character: { type: Type.STRING },
                                        text: { type: Type.STRING },
                                        type: { type: Type.STRING, enum: ["speech", "thought", "narration"] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates relaxing video prompts and matching music prompt.
 */
export const generateRelaxingPrompts = async (params: any): Promise<RelaxingPromptsResponse> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate ${params.segments} relaxing video segments. Context: ${params.customPrompt || params.vibe}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        videoSegments: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    segmentNumber: { type: Type.INTEGER },
                                    prompt: { type: Type.STRING }
                                }
                            }
                        },
                        musicPrompt: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates a story outline in JSON format.
 */
export const generateStoryOutlineJson = async (topic: string, count: number): Promise<DetailedOutline> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a ${count}-chapter story outline for: ${topic}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        chapters: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    chapter: { type: Type.INTEGER },
                                    title: { type: Type.STRING },
                                    summary: { type: Type.STRING },
                                    purpose: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates a single story chapter.
 */
export const generateStoryChapter = async (topic: string, num: number, total: number, context: string, plan: any): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write Chapter ${num} of ${total} for story: ${topic}. Plan: ${JSON.stringify(plan)}. Context: ${context}`
        });
        return response.text || "";
    });
};

/**
 * Generates lyrics for kids or adults.
 */
export const generateLyrics = async (params: { topic: string, style: string, mood: string }): Promise<LyricsResponse> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write ${params.style} lyrics about ${params.topic}. Mood: ${params.mood}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        songTitle: { type: Type.STRING },
                        songLyrics: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates scenes from lyrics.
 */
export const generateScenesFromLyrics = async (lyrics: string, style: string, count: number, context: string): Promise<LyricScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create ${count} visual scenes for these lyrics: ${lyrics}. Style: ${style}. Context: ${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            title: { type: Type.STRING },
                            lyric_segment: { type: Type.STRING },
                            visual_description: { type: Type.STRING },
                            prompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a full kids music project.
 */
export const generateKidsMusicProject = async (topic: string, music: string, charType: string, visual: string, count: number, chars: Character[]): Promise<KidsMusicProject> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a kids music project. Topic: ${topic}. Music: ${music}. Character Type: ${charType}. Visual: ${visual}. Scene Count: ${count}. Characters: ${JSON.stringify(chars)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        lyrics: { type: Type.STRING },
                        musicPrompt: { type: Type.STRING },
                        scenes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    sceneNumber: { type: Type.INTEGER },
                                    lyricSegment: { type: Type.STRING },
                                    visualPrompt: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates dance prompts.
 */
export const generateDancePrompts = async (music: string, visual: string, charType: string, count: number, chars: Character[]): Promise<DanceProject> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a dance video project. Music: ${music}. Visual: ${visual}. Type: ${charType}. Count: ${count}. Chars: ${JSON.stringify(chars)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            masterPrompt: { type: Type.STRING },
                            musicPrompt: { type: Type.STRING },
                            scenes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sceneNumber: { type: Type.INTEGER },
                                        action: { type: Type.STRING },
                                        videoPrompt: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates a short film project.
 */
export const generateShortFilmProject = async (title: string, synopsis: string, genre: string, style: string, type: string, count: number, chars: Character[]): Promise<ShortFilmProject> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a short film project. Title: ${title}. Synopsis: ${synopsis}. Genre: ${genre}. Style: ${style}. Type: ${type}. Count: ${count}. Chars: ${JSON.stringify(chars)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        synopsis: { type: Type.STRING },
                        genre: { type: Type.STRING },
                        visualStyle: { type: Type.STRING },
                        scenes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    sceneNumber: { type: Type.INTEGER },
                                    action: { type: Type.STRING },
                                    videoPrompt: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates restortation ideas for cars.
 */
export const generateCarRestorationIdeas = async (prompt: string): Promise<CarIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 car restoration ideas for: ${prompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates restortation ideas for homes.
 */
export const generateHomeRestorationIdeas = async (prompt: string): Promise<CarIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 home transformation ideas for: ${prompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates design ideas for rooms.
 */
export const generateRoomDesignIdeas = async (prompt: string): Promise<CarIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 room design ideas for: ${prompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates restortation ideas for phones.
 */
export const generatePhoneRestorationIdeas = async (prompt: string): Promise<CarIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 phone restoration ideas for: ${prompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates restortation ideas for bicycles.
 */
export const generateBicycleRestorationIdeas = async (prompt: string): Promise<CarIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 bicycle restoration ideas for: ${prompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates cleaning ideas for rooms.
 */
export const generateRoomCleaningIdeas = async (prompt: string): Promise<CarIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 room cleaning/transformation ideas for: ${prompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a conversation script.
 */
export const generateConversationScript = async (topic: string, chars: Character[], dur: number): Promise<Dialog[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a ${dur} minute conversation script for: ${topic}. Characters: ${JSON.stringify(chars)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            character: { type: Type.STRING },
                            line: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a script outline for a story.
 */
export const generateScriptOutline = async (story: string, prompt: string, lang: string): Promise<ScriptOutline> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a script outline in ${lang} for story: ${story}. Instruction: ${prompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        outline: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    chapter: { type: Type.INTEGER },
                                    title: { type: Type.STRING },
                                    summary: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates a podcast script.
 */
export const generatePodcastScript = async (params: any): Promise<Dialog[] | string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a podcast script. Topic: ${params.topic}. Lang: ${params.language}. Type: ${params.podcastType}. Characters: ${JSON.stringify(params.characters)}. Duration: ${params.durationInMinutes} mins. Style: ${params.speakingStyle}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            character: { type: Type.STRING },
                            line: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates Quotify prompts.
 */
export const generateQuotifyPrompts = async (speaker: string, count: number, style: string, focus: boolean): Promise<string[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate ${count} image prompts for ${speaker}. Style: ${style}. Focus on characters: ${focus}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Enhances existing prompts.
 */
export const enhanceQuotifyPrompts = async (prompts: string[]): Promise<string[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Enhance these prompts for higher quality generation: ${JSON.stringify(prompts)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates an image for a specific story scene.
 */
export const generateImageForScene = async (prompt: string, ratio: string): Promise<string> => {
    return generateImage(prompt, ratio);
};

/**
 * Translates story content for all scenes.
 */
export const translateStoryContent = async (story: KhmerScene[], to: string): Promise<KhmerScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate all dialogues and prompts in this story to ${to}:\n\n${JSON.stringify(story)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sceneNumber: { type: Type.INTEGER },
                            dialogues: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        character: { type: Type.STRING },
                                        text: { type: Type.STRING }
                                    }
                                }
                            },
                            visualPrompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a visual story prompt and text.
 */
export const generateVisualStory = async (topic: string, style: string, lang: string): Promise<{ content: string, imagePrompt: string }> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a visual story in ${lang} about ${topic}. Style: ${style}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        content: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    });
};

/**
 * Generates a Hollywood-style MV script.
 */
export const generateHollywoodMvScript = async (topic: string, style: string, count: number, chars: any[]): Promise<HollywoodMvScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a Hollywood MV script. Topic: ${topic}. Style: ${style}. Scenes: ${count}. Chars: ${JSON.stringify(chars)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            time_range: { type: Type.STRING },
                            description: { type: Type.STRING },
                            video_prompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates a Hollywood-style narration script.
 */
export const generateHollywoodNarration = async (topic: string, style: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a professional Hollywood narrator script for a story about ${topic} in ${style} style.`
        });
        return response.text || "";
    });
};

/**
 * Generates a music generation prompt for a Hollywood project.
 */
export const generateHollywoodMusicPrompt = async (topic: string, style: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a cinematic music prompt (Suno/Udio) for a Hollywood film about ${topic} in ${style} style.`
        });
        return response.text || "";
    });
};

/**
 * Generates a Khmer-specific story script.
 */
export const generateKhmerStory = async (topic: string, style: string, count: number, chars: any[]): Promise<KhmerScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a Khmer 3D story script. Topic: ${topic}. Style: ${style}. Count: ${count}. Chars: ${JSON.stringify(chars)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sceneNumber: { type: Type.INTEGER },
                            dialogues: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        character: { type: Type.STRING },
                                        text: { type: Type.STRING }
                                    }
                                }
                            },
                            visualPrompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Assists in writing or extending a story.
 */
export const assistWriting = async (params: { story: string, instruction: string, genre: string, tone: string }): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Instruction: ${params.instruction}. Genre: ${params.genre}. Tone: ${params.tone}. Story context: ${params.story}`
        });
        return response.text || "";
    });
};

/**
 * Extends a story using an image context.
 */
export const extendStoryWithImage = async (story: string, base64: string, mimeType: string): Promise<string> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: `Continue this story based on the image: ${story}` }
                ]
            }
        });
        return response.text || "";
    });
};

/**
 * Generates story ideas specifically for MVs.
 */
export const generateMvStoryIdeas = async (context: string): Promise<StoryIdea[]> => {
    return generateStoryIdeas(`Create MV story ideas for: ${context}`);
};

/**
 * Generates a batch of vlog storyboard scenes.
 */
export const generateVlogStoryboardBatch = async (topic: string, count: number): Promise<VlogStoryboardScene[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate ${count} vlog storyboard scenes for: ${topic}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            narrative_en: { type: Type.STRING },
                            narrative_km: { type: Type.STRING },
                            visual_prompt: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};

/**
 * Generates video ideas for different categories.
 */
export const generateVideoIdeas = async (params: any): Promise<VideoIdea[]> => {
    return withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate ${params.ideaCount} ${params.videoType} video ideas about ${params.customTopic} in ${params.language}. Style: ${params.characterStyle}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            sampleScriptLine: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "[]"));
    });
};
