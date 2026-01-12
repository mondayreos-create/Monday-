import React, { useState, useMemo, useEffect, useRef } from 'react';

// Import all components
import ImageEditor from './components/ImageEditor.tsx';
import ImageGenerator from './components/ImageGenerator.tsx';
import ImageMixer from './components/ImageMixer.tsx';
import ImageToPrompt from './components/ImageToPrompt.tsx';
import ImageIdeaGenerator from './components/ImageIdeaGenerator.tsx';
import ImageXXGenerator from './components/ImageXXGenerator.tsx';
import StoryGenerator from './components/StoryGenerator.tsx';
import MovieTrailerGenerator from './components/MovieTrailerGenerator.tsx';
import StoryWriter from './components/StoryWriter.tsx';
import KidsStoryGenerator from './components/KidsStoryGenerator.tsx';
import PodcastGenerator from './components/PodcastGenerator.tsx';
import QuotifyGenerator from './components/QuotifyGenerator.tsx';
import WorkTimer from './components/WorkTimer.tsx';
import AnimatedTitle from './components/AnimatedTitle.tsx';
import FaceSwapper from './components/FaceSwapper.tsx';
import { useAuth } from './components/AuthContext.tsx';
import { useLanguage } from './components/LanguageContext.tsx';
import UserProfile from './components/UserProfile.tsx';
import TextToVideo from './components/TextToVideo.tsx';
import ImageToVideo from './components/ImageToVideo.tsx';
import AnimationGenerator from './components/AnimationGenerator.tsx';
import VideoTranslatedScript from './components/VideoTranslatedScript.tsx';
import ImageToVideoPrompt from './components/ImageToVideoPrompt.tsx';
import KhmerStoryGenerator from './components/KhmerStoryGenerator.tsx';
import TriviaGenerator from './components/TriviaGenerator.tsx';
import WebtoonGenerator from './components/WebtoonGenerator.tsx';
import VideoTranscriber from './components/VideoTranscriber.tsx';
import ThumbnailGenerator from './components/ThumbnailGenerator.tsx';
import RelaxingMusicGenerator from './components/RelaxingMusicGenerator.tsx';
import CoverSongGenerator from './components/CoverSongGenerator.tsx';
import SettingsMenu from './components/SettingsMenu.tsx';
import VideoCaptionTranslator from './components/VideoCaptionTranslator.tsx';
import VideoToPrompt from './components/VideoToPrompt.tsx';
import AvaLabGenerator from './components/AvaLabGenerator.tsx';
import ReferenceCanvasGenerator from './components/ReferenceCanvasGenerator.tsx';
import VipPlan from './components/VipPlan.tsx';
import KaMongKhnhomGenerator from './components/KaMongKhnhomGenerator.tsx';
import SamrayRueungGenerator from './components/SamrayRueungGenerator.tsx';
import TextToVoiceV2 from './components/TextToVoiceV2.tsx';
import KidsMusicGenerator from './components/KidsMusicGenerator.tsx';
import LetsDanceGenerator from './components/LetsDanceGenerator.tsx';
import ShortFilmGenerator from './components/ShortFilmGenerator.tsx';
import CloneImageXGenerator from './components/CloneImageXGenerator.tsx';
import HomeDesignGenerator from './components/HomeDesignGenerator.tsx';
import ComicStripGenerator from './components/ComicStripGenerator.tsx';
import ImageStoryXGenerator from './components/ImageStoryXGenerator.tsx';
import ImageStoryV1Generator from './components/ImageStoryV1Generator.tsx';
import SongMvGenerator from './components/SongMvGenerator.tsx';
import HollywoodMvGenerator from './components/HollywoodMvGenerator.tsx';
import StoryGeneratorMv from './components/StoryGeneratorMv.tsx';
import TextVoiceoverModels from './components/TextVoiceoverModels.tsx';
import LoveWildlifeGenerator from './components/LoveWildlifeGenerator.tsx';
import LoveSeaFishGenerator from './components/LoveSeaFishGenerator.tsx';
import LoveFlyingBirdsGenerator from './components/LoveFlyingBirdsGenerator.tsx';
import LoveForestRiverGenerator from './components/LoveForestRiverGenerator.tsx';
import BuildingDitGenerator from './components/BuildingDitGenerator.tsx';
import BuildingRoomGenerator from './components/BuildingRoomGenerator.tsx';
import MegaRcTruckGenerator from './components/MegaRcTruckGenerator.tsx';
import Animals4DGenerator from './components/Animals4DGenerator.tsx';
import Kidde4DGenerator from './components/Kidde4DGenerator.tsx';
import BuildDiyProGenerator from './components/BuildDiyProGenerator.tsx';
import StoryGeneratedMv from './components/StoryGeneratedMv.tsx';
import StoryGeneratorKh from './components/StoryGeneratorKh.tsx';
import RelaxingContentsGenerator from './components/RelaxingContentsGenerator.tsx';
import ClonePromptX from './components/ClonePromptX.tsx';
import ThreeDStudioPro from './components/ThreeDStudioPro.tsx';
import ProjectVault from './components/ProjectVault.tsx';
import DesignCarGenerator from './components/DesignCarGenerator.tsx';
import DesignHouseGenerator from './components/DesignHouseGenerator.tsx';
import DesignMotoGenerator from './components/DesignMotoGenerator.tsx';
import DesignRoomAsmr from './components/DesignRoomAsmr.tsx';
import DesignPhoneGenerator from './components/DesignPhoneGenerator.tsx';
import DesignBicycleGenerator from './components/DesignBicycleGenerator.tsx';
import DesignOfficeAsmr from './components/DesignOfficeAsmr.tsx';
import CarRepairAsmr from './components/CarRepairAsmr.tsx';
import DesignRoomXGenerator from './components/DesignRoomXGenerator.tsx';
import DesignHomeXAsmr from './components/DesignHomeXAsmr.tsx';
import RoomCleaningPro from './components/RoomCleaningPro.tsx';
import SleepingRoomPro from './components/SleepingRoomPro.tsx';
import CloneContentsIdea from './components/CloneContentsIdea.tsx';
import CompanyProductGenerator from './components/CompanyProductGenerator.tsx';
import AnimalRescueGenerator from './components/AnimalRescueGenerator.tsx';
import StudioProClone from './components/StudioProClone.tsx';
import BuildingForestHouseGenerator from './components/BuildingForestHouseGenerator.tsx';
import SurvivalColdGenerator from './components/SurvivalColdGenerator.tsx';
import FarmingProGenerator from './components/FarmingProGenerator.tsx';
import KhmerThreeDGenerator from './components/KhmerThreeDGenerator.tsx';
import HyperRealisticGenerator from './components/HyperRealisticGenerator.tsx';
import BuildingPaperHouse from './components/BuildingPaperHouse.tsx';
import BuildingSmallHouse from './components/BuildingSmallHouse.tsx';
import LightningGenerator from './components/LightningGenerator.tsx';
import ViralContentsGenerator from './components/ViralContentsGenerator.tsx';
import ViralAnimeGenerator from './components/ViralAnimeGenerator.tsx';
import CatMoveGenerator from './components/CatMoveGenerator.tsx';
import AncientLifeGenerator from './components/AncientLifeGenerator.tsx';
import ApacheRestorationGenerator from './components/ApacheRestorationGenerator.tsx';
import ProductionLineGenerator from './components/ProductionLineGenerator.tsx';
import ForestHouseASMRGenerator from './components/ForestHouseASMRGenerator.tsx';
import RoomRenovationPro from './components/RoomRenovationPro.tsx';
import ProductionProcessGenerator from './components/ProductionProcessGenerator.tsx';
import AncientSurvivalGenerator from './components/AncientSurvivalGenerator.tsx';
import DiyTractorGenerator from './components/DiyTractorGenerator.tsx';
import AsmrSilentRevivalGenerator from './components/AsmrSilentRevivalGenerator.tsx';
import ConstructionBuildingGenerator from './components/ConstructionBuildingGenerator.tsx';
import LoginScreen from './components/LoginScreen.tsx';

// Define types
type MainCategory = 'controls' | 'vip';

interface ToolConfig {
  labelKey: string;
  icon: string;
  component: React.FC<any>;
  color: string;
}

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('controls');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('writing');
  // Restored default activeTool to project-vault
  const [activeTool, setActiveTool] = useState<string>('project-vault');
  const { t, language, setLanguage } = useLanguage();
  const { isGoogleBypassed } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // 30 DAY AUTO-CLEAR LOGIC
  useEffect(() => {
    const cleanupOldProjects = () => {
        const historyRaw = localStorage.getItem('global_project_history');
        if (!historyRaw) return;

        try {
            const history = JSON.parse(historyRaw);
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            
            const filtered = history.filter((project: any) => {
                if (!project.timestamp) return true;
                return (now - project.timestamp) < thirtyDaysInMs;
            });
            
            if (filtered.length !== history.length) {
                localStorage.setItem('global_project_history', JSON.stringify(filtered));
                window.dispatchEvent(new Event('HISTORY_UPDATED'));
            }
        } catch (e) {
            console.error("Cleanup failed", e);
        }
    };
    cleanupOldProjects();
  }, []);

  // Tool Registry Memo - VIP tools organized by subcategory
  const toolRegistry: Record<string, Record<string, ToolConfig>> = useMemo(() => ({
    // General Categories
    writing: {
      'project-vault': { labelKey: 'tool_project_vault', icon: '📦', component: ProjectVault, color: 'from-[#1e293b] to-[#0f172a]' },
      'clone-contents-idea': { labelKey: 'tool_clone_contents_idea', icon: '👯‍♂️', component: CloneContentsIdea, color: 'from-[#1e293b] to-[#0f172a]' },
      'story-gen-kh': { labelKey: 'tool_story_gen_kh', icon: '📜', component: StoryGeneratorKh, color: 'from-[#1e293b] to-[#0f172a]' },
      'story-writer': { labelKey: 'tool_story_writer', icon: '🖋️', component: StoryWriter, color: 'from-[#1e293b] to-[#0f172a]' },
      'webtoon-generator': { labelKey: 'tool_webtoon', icon: '📱', component: WebtoonGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'kids-story-generator': { labelKey: 'tool_kids_story', icon: '🎬', component: KidsStoryGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'khmer-story-generator': { labelKey: 'tool_khmer_story', icon: '🇰🇭', component: KhmerStoryGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'trivia-generator': { labelKey: 'tool_trivia_generator', icon: '❓', component: TriviaGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'story-generator': { labelKey: 'tool_story_gen', icon: '📖', component: StoryGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'movie-trailer': { labelKey: 'tool_movie_trailer', icon: '🎟️', component: MovieTrailerGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
    },
    image: {
      'love-wildlife': { labelKey: 'Love Wildlife', icon: '🦁', component: LoveWildlifeGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'love-sea-fish': { labelKey: 'Love Sea Fish', icon: '🐠', component: LoveSeaFishGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'love-flying-birds': { labelKey: 'Love Flying Birds', icon: '🦅', component: LoveFlyingBirdsGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'image-xx': { labelKey: 'image-xx', icon: '🖼️', component: ImageXXGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'image-idea': { labelKey: 'image-idea', icon: '💡', component: ImageIdeaGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'generate': { labelKey: 'tool_gen_image', icon: '🎨', component: ImageGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'thumbnail-generator': { labelKey: 'tool_thumbnail_generator', icon: '🖼️', component: ThumbnailGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'edit': { labelKey: 'tool_edit_image', icon: '🔧', component: ImageEditor, color: 'from-[#1e293b] to-[#0f172a]' },
      'image-mixer': { labelKey: 'tool_mix_image', icon: '➕', component: ImageMixer, color: 'from-[#1e293b] to-[#0f172a]' },
      'image-to-prompt': { labelKey: 'tool_img_prompt', icon: '📝', component: ImageToPrompt, color: 'from-[#1e293b] to-[#0f172a]' },
      'video-to-prompt': { labelKey: 'tool_video_prompt', icon: '🎥📝', component: VideoToPrompt, color: 'from-[#1e293b] to-[#0f172a]' },
      'face-swapper': { labelKey: 'tool_face_swap', icon: '😎', component: FaceSwapper, color: 'from-[#1e293b] to-[#0f172a]' },
      'image-to-video-prompt': { labelKey: 'tool_img_video_prompt', icon: '🖼️➡️🎬', component: ImageToVideoPrompt, color: 'from-[#1e293b] to-[#0f172a]' },
    },
    video: {
      'video-transcriber': { labelKey: 'tool_video_transcriber', icon: '🎬', component: VideoTranscriber, color: 'from-[#1e293b] to-[#0f172a]' },
      'video-translated-script': { labelKey: 'tool_samray_rueung', icon: '🎞️', component: VideoTranslatedScript, color: 'from-[#1e293b] to-[#0f172a]' },
    },
    podcast: {
      'podcast': { labelKey: 'cat_podcast', icon: '🎙️', component: PodcastGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
    },
    audio: {
      'text-to-voice-v2': { labelKey: 'tool_text_to_voice_v2', icon: '🗣️', component: TextToVoiceV2, color: 'from-[#1e293b] to-[#0f172a]' },
      'text-voiceover-models': { labelKey: 'tool_text_voiceover_models', icon: '🎭', component: TextVoiceoverModels, color: 'from-[#1e293b] to-[#0f172a]' },
      'color-song': { labelKey: 'tool_cover_song', icon: '🎶', component: CoverSongGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
      'text-to-voice-v1': { labelKey: 'tool_relaxing_music', icon: '🎹', component: RelaxingMusicGenerator, color: 'from-[#1e293b] to-[#0f172a]' },
    },

    // VIP Subcategories
    vip_plan: {
      'vip-plan': { labelKey: 'tool_vip_plan', icon: '👑', component: VipPlan, color: 'from-yellow-400 to-amber-600' },
    },
    vip_architecture: {
      'construction-building': { labelKey: 'Construction & Building', icon: '🏗️', component: ConstructionBuildingGenerator, color: 'from-blue-600 to-indigo-700' },
      'building-dit': { labelKey: 'tool_building_dit', icon: '🏗️', component: BuildingDitGenerator, color: 'from-slate-500 to-amber-600' },
      'building-room': { labelKey: 'tool_building_room', icon: '🔨', component: BuildingRoomGenerator, color: 'from-amber-500 to-orange-600' },
      'build-diy-pro': { labelKey: 'tool_build_diy_pro', icon: '🏗️', component: BuildDiyProGenerator, color: 'from-cyan-500 to-blue-600' },
      'building-forest-house': { labelKey: 'tool_forest_house', icon: '🌲🏠', component: BuildingForestHouseGenerator, color: 'from-emerald-600 to-green-800' },
      'forest-house-asmr': { labelKey: 'tool_forest_house_asmr', icon: '🏠🌲', component: ForestHouseASMRGenerator, color: 'from-green-600 to-emerald-800' },
      'building-paper-house': { labelKey: 'tool_paper_house', icon: '📦🏠', component: BuildingPaperHouse, color: 'from-amber-500 to-orange-700' },
      'building-small-house': { labelKey: 'tool_building_small_house', icon: '🏠🤏', component: BuildingSmallHouse, color: 'from-cyan-500 to-blue-700' },
      'room-renovation-pro': { labelKey: 'Room Renovation (PRO)', icon: '🧼✨', component: RoomRenovationPro, color: 'from-cyan-400 to-blue-600' },
      'design-house': { labelKey: 'tool_design_house', icon: '🏠', component: DesignHouseGenerator, color: 'from-emerald-500 to-teal-600' },
      'design-room-asmr': { labelKey: 'tool_design_room_asmr', icon: '🛋️', component: DesignRoomAsmr, color: 'from-fuchsia-500 to-pink-600' },
      'design-room-x-asmr': { labelKey: 'tool_design_room_x_asmr', icon: '🧼', component: DesignRoomXGenerator, color: 'from-cyan-500 to-blue-600' },
      'design-office-asmr': { labelKey: 'tool_design_office_asmr', icon: '🏢', component: DesignOfficeAsmr, color: 'from-[#1e293b] to-[#0f172a]' },
      'design-home-x-asmr': { labelKey: 'tool_home_design_x', icon: '🏡', component: DesignHomeXAsmr, color: 'from-emerald-500 to-teal-700' },
      'room-cleaning-pro': { labelKey: 'tool_room_cleaning', icon: '🧹', component: RoomCleaningPro, color: 'from-cyan-400 to-blue-600' },
      'sleeping-room-pro': { labelKey: 'tool_sleeping_room', icon: '🛏️', component: SleepingRoomPro, color: 'from-purple-500 to-indigo-700' },
    },
    vip_auto_tech: {
      'design-car': { labelKey: 'tool_design_car', icon: '🚗', component: DesignCarGenerator, color: 'from-orange-500 to-red-600' },
      'design-moto': { labelKey: 'tool_design_moto', icon: '🏍️', component: DesignMotoGenerator, color: 'from-violet-600 to-indigo-700' },
      'design-bicycle': { labelKey: 'tool_design_bicycle', icon: '🚲', component: DesignBicycleGenerator, color: 'from-indigo-400 to-cyan-500' },
      'design-phone': { labelKey: 'tool_design_phone', icon: '📱', component: DesignPhoneGenerator, color: 'from-blue-500 to-indigo-600' },
      'diy-tractor': { labelKey: 'tool_diy_tractor', icon: '🚜', component: DiyTractorGenerator, color: 'from-orange-500 to-amber-600' },
      'apache-restoration': { labelKey: 'tool_apache_restoration', icon: '⚙️🚁', component: ApacheRestorationGenerator, color: 'from-emerald-600 to-slate-800' },
      'asmr-silent-revival': { labelKey: 'tool_asmr_silent_revival', icon: '🔧', component: AsmrSilentRevivalGenerator, color: 'from-blue-600 to-indigo-700' },
      'mega-rc-truck': { labelKey: 'MEGA RC Truck', icon: '🚛', component: MegaRcTruckGenerator, color: 'from-orange-500 to-amber-600' },
    },
    vip_creative: {
      'three-d-studio-pro': { labelKey: '3D - Studio (Pro)', icon: '🧊', component: ThreeDStudioPro, color: 'from-purple-600 to-pink-500' },
      'story-gen-mv': { labelKey: 'Story Generator MV', icon: '🎬📜', component: StoryGeneratorMv, color: 'from-purple-600 to-blue-500' },
      'hollywood-mv': { labelKey: 'tool_hollywood_mv', icon: '🎬🎵', component: HollywoodMvGenerator, color: 'from-red-600 to-yellow-500' },
      'song-mv': { labelKey: 'tool_song_mv', icon: '📹🎵', component: SongMvGenerator, color: 'from-purple-500 to-pink-500' },
      'image-story-x': { labelKey: 'tool_image_story_x', icon: '💬', component: ImageStoryXGenerator, color: 'from-teal-500 to-cyan-500' },
      'image-story-v1': { labelKey: 'tool_image_story_v1', icon: '📖', component: ImageStoryV1Generator, color: 'from-blue-500 to-purple-600' },
      'comic-strip-x': { labelKey: 'tool_comic_strip_x', icon: '🗯️', component: ComicStripGenerator, color: 'from-yellow-500 to-red-500' },
      'clone-image-x': { labelKey: 'tool_clone_image_x', icon: '🧬', component: CloneImageXGenerator, color: 'from-teal-500 to-emerald-500' },
      'short-film': { labelKey: 'tool_short_film', icon: '🎥', component: ShortFilmGenerator, color: 'from-yellow-500 to-amber-500' },
      'lets-dance': { labelKey: 'tool_lets_dance', icon: '💃', component: LetsDanceGenerator, color: 'from-pink-500 to-yellow-400' },
      'samray_rueung': { labelKey: 'tool_samray_rueung', icon: '🎞️', component: SamrayRueungGenerator, color: 'from-blue-500 to-cyan-500' },
      'kamong-khnhom': { labelKey: 'tool_kamong_khnhom', icon: '🧞‍♂️', component: KaMongKhnhomGenerator, color: 'from-pink-500 to-orange-500' },
      'avalab': { labelKey: 'tool_avalab', icon: '✨', component: AvaLabGenerator, color: 'from-indigo-500 to-purple-600' },
      'ref-canvas': { labelKey: 'tool_ref_canvas', icon: '🎨', component: ReferenceCanvasGenerator, color: 'from-yellow-500 to-orange-600' },
      'kids-music': { labelKey: 'tool_kids_music', icon: '👶🎶', component: KidsMusicGenerator, color: 'from-purple-500 to-pink-500' },
      'animal-rescue': { labelKey: 'tool_animal_rescue', icon: '🐾', component: AnimalRescueGenerator, color: 'from-green-600 to-teal-700' },
      'cat-move': { labelKey: 'tool_cat_move', icon: '🐈', component: CatMoveGenerator, color: 'from-orange-400 to-yellow-500' },
      'ancient-life': { labelKey: 'tool_ancient_life', icon: '🦕', component: AncientLifeGenerator, color: 'from-red-600 to-amber-700' },
      'the-lightning': { labelKey: 'The Lightning', icon: '⚡', component: LightningGenerator, color: 'from-red-600 to-orange-500' },
      'love-forest-river': { labelKey: 'Love Forest & River', icon: '🏞️', component: LoveForestRiverGenerator, color: 'from-emerald-500 to-cyan-500' },
      'survival-cold': { labelKey: 'tool_survival_cold', icon: '❄️🏔️', component: SurvivalColdGenerator, color: 'from-blue-600 to-slate-400' },
      'relaxing-contents': { labelKey: 'Relaxing Contents', icon: '🧘', component: RelaxingContentsGenerator, color: 'from-emerald-400 to-teal-500' },
      'animals-4d': { labelKey: 'Animals 4D', icon: '🦁', component: Animals4DGenerator, color: 'from-green-500 to-teal-500' },
      'kidde-4d': { labelKey: 'Kidde 4D', icon: '👶', component: Kidde4DGenerator, color: 'from-cyan-400 to-pink-400' },
      'ancient-survival': { labelKey: 'tool_ancient_survival', icon: '🏹', component: AncientSurvivalGenerator, color: 'from-amber-600 to-orange-800' },
      'khmer-three-d': { labelKey: 'tool_story_gen_kh', icon: '🇰🇭', component: KhmerThreeDGenerator, color: 'from-indigo-500 to-purple-700' },
      'hyper-realistic': { labelKey: 'tool_avalab', icon: '🌟', component: HyperRealisticGenerator, color: 'from-yellow-400 to-orange-500' },
    },
    vip_industrial: {
      'production-process': { labelKey: 'tool_production_process', icon: '⚙️', component: ProductionProcessGenerator, color: 'from-blue-600 to-cyan-500' },
      'production-line': { labelKey: 'tool_production_line', icon: '🏭', component: ProductionLineGenerator, color: 'from-blue-600 to-slate-900' },
      'company-product': { labelKey: 'tool_company_product', icon: '🏭', component: CompanyProductGenerator, color: 'from-slate-600 to-blue-800' },
      'farming-pro': { labelKey: 'tool_farming_pro', icon: '🌾🚜', component: FarmingProGenerator, color: 'from-emerald-600 to-green-800' },
      'viral-architect': { labelKey: 'cat_viral', icon: '🚀', component: ViralContentsGenerator, color: 'from-cyan-400 to-blue-600' },
      'viral-anime': { labelKey: 'tool_viral_anime', icon: '🎨', component: ViralAnimeGenerator, color: 'from-purple-400 to-indigo-600' },
    }
  }), []);

  const handleRequestSave = () => {
    window.dispatchEvent(new CustomEvent('REQUEST_PROJECT_SAVE', { detail: { tool: activeTool } }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReloadHistory = () => {
    setIsReloading(true);
    window.dispatchEvent(new Event('HISTORY_UPDATED'));
    setTimeout(() => setIsReloading(false), 800);
  };

  const ActiveComponent = useMemo(() => {
    const config = toolRegistry[activeSubCategory]?.[activeTool];
    return config ? config.component : () => <div className="text-center p-10 text-gray-500">Select a subcategory and tool to begin.</div>;
  }, [activeSubCategory, activeTool, toolRegistry]);

  const handleMainCategoryChange = (cat: MainCategory) => {
    setActiveCategory(cat);
    if (cat === 'controls') {
      setActiveSubCategory('writing');
      // Set default back to project-vault
      setActiveTool('project-vault');
    } else {
      setActiveSubCategory('vip_plan');
      setActiveTool('vip-plan');
    }
  };

  const handleSubCategoryChange = (sub: string) => {
    setActiveSubCategory(sub);
    const firstTool = Object.keys(toolRegistry[sub] || {})[0];
    if (firstTool) setActiveTool(firstTool);
  };

  if (!isGoogleBypassed) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div 
                className="cursor-pointer group flex items-center gap-2"
                onClick={() => handleMainCategoryChange('controls')}
             >
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-all">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="hidden sm:block">
                  <AnimatedTitle title="SP Tool - Media Studio" />
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* RESTORED LANGUAGE BUTTON */}
             <button 
                onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
                className="px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-[10px] font-black transition-all flex items-center gap-2 shadow-sm"
             >
                {language === 'km' ? '🇰🇭 KH' : '🇺🇸 EN'}
             </button>
             <WorkTimer />
             <SettingsMenu isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
             <UserProfile />
          </div>
        </div>
      </header>

      {/* MAIN NAV */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 flex flex-col md:flex-row items-center gap-4 overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 p-3 shrink-0">
             <button 
                onClick={() => handleMainCategoryChange('controls')}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeCategory === 'controls' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
             >
                General Tools
             </button>
             <button 
                onClick={() => handleMainCategoryChange('vip')}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeCategory === 'vip' ? 'bg-gradient-to-r from-yellow-400 to-amber-600 text-black shadow-lg' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
             >
                👑 VIP STUDIO
             </button>
          </div>

          {/* SUBCATEGORY NAV */}
          <div className="flex gap-1 p-3 border-l border-gray-700 pl-4 overflow-x-auto no-scrollbar">
              {activeCategory === 'controls' ? (
                  (['writing', 'image', 'video', 'podcast', 'audio'] as const).map(sub => (
                      <button
                        key={sub}
                        onClick={() => handleSubCategoryChange(sub)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubCategory === sub ? 'bg-gray-700 text-cyan-400 border border-cyan-400/30' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {t(`cat_${sub}`)}
                      </button>
                  ))
              ) : (
                  (['vip_plan', 'vip_architecture', 'vip_auto_tech', 'vip_creative', 'vip_industrial'] as const).map(sub => (
                      <button
                        key={sub}
                        onClick={() => handleSubCategoryChange(sub)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeSubCategory === sub ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {sub === 'vip_plan' ? 'Membership' : sub.replace('vip_', '').replace('_', ' ')}
                      </button>
                  ))
              )}
          </div>
      </div>

      {/* CONTENT AREA */}
      <main className="flex-grow flex flex-col lg:flex-row">
          <aside className="w-full lg:w-72 bg-gray-800/30 border-r border-gray-800 flex flex-col max-h-[40vh] lg:max-h-none overflow-y-auto custom-scrollbar">
             <div className="p-4 space-y-4">
                 {/* GLOBAL ACTIONS */}
                 <div className="flex flex-col gap-2">
                    <button
                        onClick={handleRequestSave}
                        className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all border-2 border-emerald-500/50 font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 ${isSaved ? 'bg-emerald-600 text-white border-white scale-105' : 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40'}`}
                    >
                        <span className="text-xl">{isSaved ? '✅' : '💾'}</span>
                        <span>{isSaved ? 'PROJECT SAVED!' : 'Save Project'}</span>
                    </button>
                    
                    <button
                        onClick={handleReloadHistory}
                        disabled={isReloading}
                        className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl transition-all border-2 border-indigo-500/30 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40 disabled:opacity-50`}
                    >
                        <span className={`text-lg ${isReloading ? 'animate-spin' : ''}`}>🔄</span>
                        <span>{isReloading ? 'RELOADING...' : 'Reload History'}</span>
                    </button>
                 </div>

                 <div className="h-px bg-gray-700 my-2"></div>

                 <div className="space-y-1">
                    {Object.entries(toolRegistry[activeSubCategory] || {}).map(([id, config]) => (
                        <button
                            key={id}
                            onClick={() => setActiveTool(id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${activeTool === id ? 'bg-[#1e293b] border-cyan-500 text-white shadow-lg' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'}`}
                        >
                            <span className="text-lg">{config.icon}</span>
                            <span className="text-[11px] font-bold uppercase tracking-tight text-left leading-tight">{t(config.labelKey)}</span>
                        </button>
                    ))}
                 </div>
             </div>
          </aside>

          <section className="flex-grow p-6 bg-[#0f172a] relative overflow-y-auto custom-scrollbar h-[calc(100vh-210px)] lg:h-auto">
             <div className="max-w-7xl mx-auto h-full">
                <ActiveComponent />
             </div>
          </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;