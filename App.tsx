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

// Define types
type MainCategory = 'controls' | 'vip';
type SubCategory = 'writing' | 'image' | 'podcast' | 'audio' | 'video';

interface ToolConfig {
  labelKey: string;
  icon: string;
  component: React.FC<any>;
  color: string;
}

interface VipGroupConfig {
  label: string;
  icon: string;
  color: string;
  tools: string[];
}

const descriptionGradients = [
    'from-blue-900/40 to-purple-900/40 border-blue-500/30',
    'from-emerald-900/40 to-teal-900/40 border-emerald-500/30',
    'from-orange-900/40 to-red-900/40 border-orange-500/30', 
    'from-pink-900/40 to-rose-900/40 border-pink-500/30',
    'from-indigo-900/40 to-cyan-900/40 border-indigo-500/30'
];

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('controls');
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory>('writing');
  const [activeTool, setActiveTool] = useState<string>('project-vault');
  const [activeVipGroup, setActiveVipGroup] = useState<string>('demo-vip');

  const { t } = useLanguage();
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [descColorIndex, setDescColorIndex] = useState(0);
  const [saveAnimation, setSaveAnimation] = useState(false);
  const [reloadAnimation, setReloadAnimation] = useState(false);

  // 5 DAY AUTO-CLEAR LOGIC
  useEffect(() => {
    const cleanupOldProjects = () => {
        const historyRaw = localStorage.getItem('global_project_history');
        if (!historyRaw) return;

        try {
            const history = JSON.parse(historyRaw);
            const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            
            const filtered = history.filter((project: any) => {
                if (!project.timestamp) return true;
                return (now - project.timestamp) < fiveDaysInMs;
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

  useEffect(() => {
    const interval = setInterval(() => {
        setDescColorIndex((prev) => (prev + 1) % descriptionGradients.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Tool Registry Memo
  const toolRegistry: Record<string, Record<string, ToolConfig>> = useMemo(() => ({
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
    vip: {
      'vip-plan': { labelKey: 'tool_vip_plan', icon: '👑', component: VipPlan, color: 'from-yellow-400 to-amber-600' },
      'construction-building': { labelKey: 'Construction & Building', icon: '🏗️', component: ConstructionBuildingGenerator, color: 'from-blue-600 to-indigo-700' },
      'asmr-silent-revival': { labelKey: 'tool_asmr_silent_revival', icon: '🔧', component: AsmrSilentRevivalGenerator, color: 'from-blue-600 to-indigo-700' },
      'diy-tractor': { labelKey: 'tool_diy_tractor', icon: '🚜', component: DiyTractorGenerator, color: 'from-orange-500 to-amber-600' },
      'ancient-survival': { labelKey: 'tool_ancient_survival', icon: '🏹', component: AncientSurvivalGenerator, color: 'from-amber-600 to-orange-800' },
      'production-process': { labelKey: 'tool_production_process', icon: '⚙️', component: ProductionProcessGenerator, color: 'from-blue-600 to-cyan-500' },
      'room-renovation-pro': { labelKey: 'Room Renovation (PRO)', icon: '🧼✨', component: RoomRenovationPro, color: 'from-cyan-400 to-blue-600' },
      'viral-architect': { labelKey: 'cat_viral', icon: '🚀', component: ViralContentsGenerator, color: 'from-cyan-400 to-blue-600' },
      'forest-house-asmr': { labelKey: 'tool_forest_house_asmr', icon: '🏠🌲', component: ForestHouseASMRGenerator, color: 'from-green-600 to-emerald-800' },
      'production-line': { labelKey: 'tool_production_line', icon: '🏭', component: ProductionLineGenerator, color: 'from-blue-600 to-slate-900' },
      'apache-restoration': { labelKey: 'tool_apache_restoration', icon: '⚙️🚁', component: ApacheRestorationGenerator, color: 'from-emerald-600 to-slate-800' },
      'cat-move': { labelKey: 'tool_cat_move', icon: '🐈', component: CatMoveGenerator, color: 'from-orange-400 to-yellow-500' },
      'ancient-life': { labelKey: 'tool_ancient_life', icon: 'Ancient Life', component: AncientLifeGenerator, color: 'from-red-600 to-amber-700' },
      'viral-anime': { labelKey: 'tool_viral_anime', icon: '🎨', component: ViralAnimeGenerator, color: 'from-purple-400 to-indigo-600' },
      'the-lightning': { labelKey: 'The Lightning', icon: '⚡', component: LightningGenerator, color: 'from-red-600 to-orange-500' },
      'studio-pro-clone': { labelKey: 'Studio Pro Clone', icon: '✨', component: StudioProClone, color: 'from-cyan-500 to-indigo-600' },
      'farming-pro': { labelKey: 'tool_farming_pro', icon: '🌾🚜', component: FarmingProGenerator, color: 'from-emerald-600 to-green-800' },
      'building-forest-house': { labelKey: 'tool_forest_house', icon: '🌲🏠', component: BuildingForestHouseGenerator, color: 'from-emerald-600 to-green-800' },
      'company-product': { labelKey: 'tool_company_product', icon: '🏭', component: CompanyProductGenerator, color: 'from-slate-600 to-blue-800' },
      'animal-rescue': { labelKey: 'tool_animal_rescue', icon: '🐾', component: AnimalRescueGenerator, color: 'from-green-600 to-teal-700' },
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
      'love-forest-river': { labelKey: 'Love Forest & River', icon: '🏞️', component: LoveForestRiverGenerator, color: 'from-emerald-500 to-cyan-500' },
      'survival-cold': { labelKey: 'tool_survival_cold', icon: '❄️🏔️', component: SurvivalColdGenerator, color: 'from-blue-600 to-slate-400' },
      'building-dit': { labelKey: 'tool_building_dit', icon: '🏗️', component: BuildingDitGenerator, color: 'from-slate-500 to-amber-600' },
      'building-room': { labelKey: 'tool_building_room', icon: '🔨', component: BuildingRoomGenerator, color: 'from-amber-500 to-orange-600' },
      'mega-rc-truck': { labelKey: 'MEGA RC Truck', icon: '🚛', component: MegaRcTruckGenerator, color: 'from-orange-500 to-amber-600' },
      'animals-4d': { labelKey: 'Animals 4D', icon: '🦁', component: Animals4DGenerator, color: 'from-green-500 to-teal-500' },
      'kidde-4d': { labelKey: 'Kidde 4D', icon: '👶', component: Kidde4DGenerator, color: 'from-cyan-400 to-pink-400' },
      'build-diy-pro': { labelKey: 'tool_build_diy_pro', icon: '🏗️', component: BuildDiyProGenerator, color: 'from-cyan-500 to-blue-600' },
      'relaxing-contents': { labelKey: 'Relaxing Contents', icon: '🧘', component: RelaxingContentsGenerator, color: 'from-emerald-400 to-teal-500' },
      'design-bicycle': { labelKey: 'tool_design_bicycle', icon: '🚲', component: DesignBicycleGenerator, color: 'from-indigo-400 to-cyan-500' },
      'design-car': { labelKey: 'tool_design_car', icon: '🚗', component: DesignCarGenerator, color: 'from-orange-500 to-red-600' },
      'design-phone': { labelKey: 'tool_design_phone', icon: '📱', component: DesignPhoneGenerator, color: 'from-blue-500 to-indigo-600' },
      'design-house': { labelKey: 'tool_design_house', icon: '🏠', component: DesignHouseGenerator, color: 'from-emerald-500 to-teal-600' },
      'design-room-asmr': { labelKey: 'tool_design_room_asmr', icon: '🛋️', component: DesignRoomAsmr, color: 'from-fuchsia-500 to-pink-600' },
      'design-room-x-asmr': { labelKey: 'tool_design_room_x_asmr', icon: '🧼', component: DesignRoomXGenerator, color: 'from-cyan-500 to-blue-600' },
      'design-moto': { labelKey: 'tool_design_moto', icon: '🏍️', component: DesignMotoGenerator, color: 'from-violet-600 to-indigo-700' },
      'design-office-asmr': { labelKey: 'tool_design_office_asmr', icon: '🏢', component: DesignOfficeAsmr, color: 'from-blue-500 to-indigo-600' },
      'car-repair-asmr': { labelKey: 'tool_car_repair_asmr', icon: '🛠️🚗', component: CarRepairAsmr, color: 'from-orange-600 to-red-700' },
      'design-home-x-asmr': { labelKey: 'tool_design_home_x_asmr', icon: '🏡', component: DesignHomeXAsmr, color: 'from-emerald-600 to-teal-600' },
      'room-cleaning-asmr': { labelKey: 'tool_room_cleaning', icon: '🧼🧹', component: RoomCleaningPro, color: 'from-cyan-600 to-emerald-600' },
      'sleeping-room-asmr': { labelKey: 'tool_sleeping_room', icon: '🛏️🧹', component: SleepingRoomPro, color: 'from-purple-600 to-indigo-600' },
      'building-paper-house': { labelKey: 'tool_paper_house', icon: '📦🏠', component: BuildingPaperHouse, color: 'from-amber-400 to-orange-600' },
      'building-small-house': { labelKey: 'tool_building_small_house', icon: '🏠🤏', component: BuildingSmallHouse, color: 'from-amber-400 to-orange-600' },
    }
  }), []);
  
  const vipGroups: Record<string, VipGroupConfig> = useMemo(() => ({
      'demo-vip': { label: 'PROJECTS', icon: '🎓', color: 'from-purple-600 to-indigo-600', tools: ['vip-plan'] },
      'viral-architect': { label: 'Viral Architect', icon: '🚀', color: 'from-cyan-400 to-blue-600', tools: ['viral-architect', 'forest-house-asmr', 'cat-move', 'ancient-life', 'viral-anime', 'the-lightning'] },
      'movie-studio': { label: 'Movie Studio', icon: '🎬', color: 'from-red-600 to-orange-600', tools: ['company-product', 'three-d-studio-pro', 'story-gen-mv', 'hollywood-mv', 'song-mv', 'short-film', 'ref-canvas'] },
      'nature-studio': { label: 'Nature Studio', icon: '🌿', color: 'from-green-500 to-emerald-600', tools: ['room-renovation-pro', 'farming-pro', 'animal-rescue', 'relaxing-contents', 'love-sea-fish', 'love-flying-birds', 'love-wildlife', 'love-forest-river', 'survival-cold'] },
      'viral-production': { label: 'Viral Production', icon: '⚡', color: 'from-cyan-400 to-blue-600', tools: ['construction-building', 'asmr-silent-revival', 'diy-tractor', 'ancient-survival', 'production-process', 'production-line', 'apache-restoration', 'studio-pro-clone', 'clone-contents-idea'] },
      'asmr-studio': { label: 'Design ASMR Pro', icon: '✨', color: 'from-emerald-500 to-teal-600', tools: ['design-bicycle', 'design-car', 'design-phone', 'design-house', 'design-room-asmr', 'design-room-x-asmr', 'design-moto', 'design-office-asmr', 'car-repair-asmr', 'design-home-x-asmr', 'room-cleaning-asmr', 'sleeping-room-asmr'] },
      'fun-studio': { label: 'Fun & Kids', icon: '🧸', color: 'from-teal-500 to-cyan-500', tools: ['kidde-4d', 'animals-4d', 'mega-rc-truck', 'lets-dance', 'kids-music', 'kamong-khnhom'] },
      'story-studio': { label: 'Story Studio', icon: '📚', color: 'from-blue-600 to-cyan-600', tools: ['image-story-x', 'image-story-v1', 'comic-strip-x', 'samray_rueung'] },
      'group-x': { label: 'Group X', icon: '🏗️', color: 'from-blue-600 to-indigo-600', tools: ['building-forest-house', 'build-diy-pro', 'building-dit', 'building-room', 'clone-image-x', 'avalab', 'building-paper-house', 'building-small-house'] },
  }), []);

  // Listen for navigation requests from the Project Vault
  useEffect(() => {
      const handleLoadProject = (e: any) => {
          const project = e.detail;
          if (project.category === 'vip') {
              setActiveCategory('vip');
              const groupEntry = Object.entries(vipGroups).find(([_, g]) => g.tools.includes(project.tool));
              if (groupEntry) setActiveVipGroup(groupEntry[0]);
          } else if (project.category) {
              setActiveCategory('controls');
              setActiveSubCategory(project.category as SubCategory);
          }
          setActiveTool(project.tool);
      };
      window.addEventListener('LOAD_PROJECT', handleLoadProject);
      return () => {
          window.removeEventListener('LOAD_PROJECT', handleLoadProject);
      };
  }, [vipGroups]);

  const handleCategoryChange = (category: MainCategory) => {
    setActiveCategory(category);
    if (category === 'vip') {
        const defaultGroup = 'demo-vip';
        setActiveVipGroup(defaultGroup);
        if (vipGroups[defaultGroup]?.tools.length > 0) setActiveTool(vipGroups[defaultGroup].tools[0]);
    } else {
        setActiveSubCategory('writing');
        setActiveTool('project-vault');
    }
  };

  const handleGlobalSave = () => {
    if (activeTool === 'project-vault') return;
    setSaveAnimation(true);
    const event = new CustomEvent('REQUEST_PROJECT_SAVE', { 
        detail: { 
            tool: activeTool, 
            category: activeCategory
        } 
    });
    window.dispatchEvent(event);
    
    setTimeout(() => {
        setSaveAnimation(false);
        window.dispatchEvent(new Event('HISTORY_UPDATED'));
    }, 1500);
  };

  const handleGlobalReload = () => {
    setReloadAnimation(true);
    window.dispatchEvent(new Event('HISTORY_UPDATED'));
    setTimeout(() => {
        setReloadAnimation(false);
    }, 1000);
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`p-4 w-full flex flex-col items-center border-b backdrop-blur-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200 shadow-sm'}`}>
        <div className="text-center w-full max-w-2xl px-4 mb-4">
            <AnimatedTitle title="កាម៉ងខ្ញុំ Studio Pro" />
            <p className={`text-xs mt-2 p-2 rounded-lg border border-white/10 transition-all duration-1000 bg-gradient-to-r ${descriptionGradients[descColorIndex]} shadow-lg backdrop-blur-sm opacity-80`}>
                CEO by អេតមីន - សាល , "គោលបំណងដែលខ្ញុំបង្កើត App this ឡើង គឺដើម្បីជួយ សម្រួលការលំបាក របស់បងប្អូនទាំងអស់គ្នា..."
            </p>
        </div>
         <div className="flex items-center gap-4 flex-wrap justify-center">
            {activeTool !== 'project-vault' && activeTool !== 'vip-plan' && (
                <div className="flex gap-2">
                    <button 
                      onClick={handleGlobalSave}
                      className={`flex items-center gap-4 px-6 py-2 rounded-2xl transition-all duration-300 border-2 shadow-2xl group ${saveAnimation ? 'bg-green-600 border-green-400 scale-105' : 'bg-[#1e293b] border-gray-700 hover:border-cyan-500'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${saveAnimation ? 'bg-white/20' : 'bg-cyan-500/10 text-cyan-400 group-hover:text-cyan-300'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${saveAnimation ? 'animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className={`font-black text-[12px] uppercase tracking-tighter transition-colors ${saveAnimation ? 'text-white' : 'text-cyan-400 group-hover:text-white'}`}>
                                {saveAnimation ? 'PROJECT SAVED!' : 'SAVE PROJECT'}
                            </span>
                            {!saveAnimation && <span className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-widest">រក្សាទុក</span>}
                        </div>
                    </button>
                    <button 
                      onClick={handleGlobalReload}
                      className={`flex items-center gap-4 px-6 py-2 rounded-2xl transition-all duration-300 border-2 shadow-2xl group ${reloadAnimation ? 'bg-indigo-600 border-indigo-400 scale-105' : 'bg-[#1e293b] border-gray-700 hover:border-indigo-500'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${reloadAnimation ? 'bg-white/20 animate-spin' : 'bg-indigo-500/10 text-indigo-400 group-hover:text-indigo-300'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className={`font-black text-[12px] uppercase tracking-tighter transition-colors ${reloadAnimation ? 'text-white' : 'text-indigo-400 group-hover:text-white'}`}>
                                {reloadAnimation ? 'RELOADING...' : 'RELOAD HISTORY'}
                            </span>
                            {!reloadAnimation && <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest">ប្រវត្តផលិត</span>}
                        </div>
                    </button>
                </div>
            )}
            <SettingsMenu isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
            <WorkTimer />
            <UserProfile />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4 w-full">
        <div className="mt-2 mb-8 flex justify-center gap-4 md:gap-6 p-1.5 bg-[#1e293b]/40 rounded-3xl border border-gray-700/50 backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
            <button 
                onClick={() => handleCategoryChange('controls')} 
                className={`flex items-center gap-3 px-6 md:px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 transform active:scale-95 shadow-lg ${activeCategory === 'controls' ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 text-white ring-2 ring-white/20 border border-white/40' : 'bg-transparent text-gray-400 hover:text-gray-200 border border-transparent'}`}
            >
                <span className="text-xl">🛠️</span> {t('cat_controls')}
            </button>
            <button 
                onClick={() => handleCategoryChange('vip')} 
                className={`flex items-center gap-3 px-6 md:px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 transform active:scale-95 shadow-lg ${activeCategory === 'vip' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black ring-2 ring-yellow-400/20 border border-yellow-400/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-transparent text-gray-400 hover:text-gray-200 border border-transparent'}`}
            >
                <span className="text-xl">👑</span> {t('cat_vip')}
            </button>
        </div>

        <div className={`w-full flex-grow flex flex-col items-center`}>
            {activeCategory === 'controls' && (
                <>
                    <div className={`mb-6 w-full max-w-6xl flex flex-wrap justify-center gap-2.5 p-2.5 rounded-2xl border ${isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-100 border-gray-200'} shadow-inner`}>
                        {[
                            { key: 'writing', label: t('cat_writing'), icon: '✍️', color: 'from-blue-600 to-cyan-500' }, 
                            { key: 'image', label: t('cat_image'), icon: '🎨', color: 'from-purple-600 to-pink-500' }, 
                            { key: 'video', label: t('cat_video'), icon: '🎬', color: 'from-cyan-600 to-blue-500' },
                            { key: 'podcast', label: t('cat_podcast'), icon: '🎙️', color: 'from-orange-500 to-red-500' }, 
                            { key: 'audio', label: t('cat_audio'), icon: '🔊', color: 'from-blue-500 to-indigo-500' }
                        ].map(({ key, label, icon, color }) => (
                            <button key={key} onClick={() => { setActiveSubCategory(key as SubCategory); setActiveTool(Object.keys(toolRegistry[key])[0]); }} className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 ${activeSubCategory === key ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105 border border-white/20` : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 border border-gray-600/50'}`}>
                                <span className="text-xl">{icon}</span><span className="text-xs uppercase tracking-tighter">{label}</span>
                            </button>
                        ))}
                    </div>
                    <div className={`mb-8 w-full max-w-5xl flex flex-wrap justify-center gap-3 p-4 rounded-3xl border shadow-inner ${isDarkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
                        {Object.entries(toolRegistry[activeSubCategory] || {}).map(([toolKey, toolDetails]) => (
                            <button 
                                key={toolKey} 
                                onClick={() => setActiveTool(toolKey)} 
                                className={`flex items-center justify-center font-black px-6 py-3 rounded-xl cursor-pointer transition-all duration-300 transform active:scale-[0.95] text-[11px] border uppercase tracking-widest ${activeTool === toolKey ? `bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-white/40 ring-4 ring-blue-500/20` : `${isDarkMode ? 'bg-gray-800/40 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}`}
                            >
                                <span className="text-lg mr-2.5">{toolDetails.icon}</span>{t(toolDetails.labelKey)}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {activeCategory === 'vip' && (
                <>
                    <div className="w-full max-w-7xl mx-auto flex flex-wrap justify-center gap-4 mb-8">
                        {Object.entries(vipGroups).map(([key, group]) => (
                            <button key={key} onClick={() => { setActiveVipGroup(key); setActiveTool(group.tools[0]); }} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 w-28 md:w-32 cursor-pointer ${activeVipGroup === key ? `bg-gradient-to-br ${group.color} border-white/20 text-white shadow-lg scale-105` : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                                <div className="text-3xl mb-1">{group.icon}</div>
                                <span className="font-bold text-[10px] text-center leading-tight uppercase tracking-tighter">{group.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mb-8 w-full max-w-5xl mx-auto flex flex-wrap justify-center gap-x-3 gap-y-4 p-6 rounded-[2.5rem] border border-gray-700/50 bg-[#0f172a]/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        {(vipGroups[activeVipGroup]?.tools || []).map((toolKey: string) => {
                            const toolDetails = toolRegistry['vip']?.[toolKey];
                            if (!toolDetails) return null;
                            const isActive = activeTool === toolKey;
                            
                            return (
                                <button 
                                    key={toolKey} 
                                    onClick={() => setActiveTool(toolKey)} 
                                    className={`flex items-center justify-center font-black px-8 py-4 rounded-2xl cursor-pointer transition-all duration-500 transform active:scale-[0.96] text-[11px] border-2 uppercase tracking-wider relative overflow-hidden group ${isActive ? `bg-gradient-to-r from-[#06b6d4] via-[#7c3aed] to-[#ec4899] text-white border-transparent shadow-[0_0_35px_rgba(6,182,212,0.5)] scale-105 z-10 ring-4 ring-cyan-500/20` : `${isDarkMode ? 'bg-[#1e293b]/40 text-gray-500 border-gray-800 hover:bg-[#1e293b] hover:text-white hover:border-gray-600' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100 shadow-sm'}`}`}
                                >
                                    {isActive && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
                                    <span className={`text-xl mr-3 transition-transform duration-500 ${isActive ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>{toolDetails.icon}</span>
                                    <span className="drop-shadow-md">{t(toolDetails.labelKey)}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
            
            <div className="w-full flex-grow">
                {Object.entries(toolRegistry).map(([, categoryTools]) => (
                Object.entries(categoryTools).map(([toolKey, toolDetails]) => {
                    const Component = toolDetails.component;
                    const isVisible = (activeTool === toolKey);
                    return (
                    <div 
                        key={`${toolKey}`} 
                        className={`h-full animate-fade-in ${isVisible ? 'block' : 'hidden'}`}
                    >
                        <Component />
                    </div>
                    );
                })
                ))}
            </div>
        </div>
      </main>
      <footer className={`w-full p-4 border-t text-center text-[10px] transition-colors duration-300 uppercase tracking-[0.3em] ${isDarkMode ? 'bg-gray-800/50 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
        Copyright © 2026   អេតមីន - សាល | Admin: SAI (@SEYPISAL)
      </footer>
    </div>
  );
};

export default App;