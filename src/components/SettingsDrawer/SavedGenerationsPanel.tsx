/**
 * Saved Generations Panel
 * Interactive gallery showing all user's saved generations with full previews
 */

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trash2, Calendar, Search, X, Maximize2, EyeOff, ChevronLeft, ChevronRight, ImageIcon as ImageIconLucide, Download } from 'lucide-react';
import { useGeneratedCardsStore } from '../../store/useGeneratedCardsStore';
import type { CardKey } from '../../types';
import type { GeneratedCard } from '../../lib/cardPersistence';
import PlatformIcon from '../../ui/PlatformIcon';
import { YouTubeVideoPlayer } from '../Cards/YouTubeVideoPlayer';

function generateSmartVideoTitle(prompt?: string): string {
  if (!prompt || prompt.trim().length === 0) return 'Generated Video';
  const lower = prompt.toLowerCase();
  const cameraMovements = ['dolly', 'orbit', 'pan', 'tilt', 'zoom', 'tracking', 'crane', 'push in', 'pull out'];
  const visualStyles = ['cinematic', 'dramatic', 'surreal', '3d', '4k', 'abstract', 'colorful', 'vibrant'];
  const subjects = ['cloud', 'formation', 'landscape', 'cityscape', 'portrait', 'scene', 'shot'];
  const foundMovement = cameraMovements.find(m => lower.includes(m));
  const foundStyle = visualStyles.find(s => lower.includes(s));
  const foundSubject = subjects.find(s => lower.includes(s));
  const parts: string[] = [];
  if (foundStyle) parts.push(foundStyle.charAt(0).toUpperCase() + foundStyle.slice(1));
  if (foundSubject) parts.push(foundSubject.charAt(0).toUpperCase() + foundSubject.slice(1));
  if (foundMovement) parts.push(foundMovement.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  if (parts.length > 0) return parts.join(' ');
  const firstPhrase = prompt.split(/[,.]/)[0]?.trim() || prompt.trim();
  if (firstPhrase.length > 50) return firstPhrase.slice(0, 47) + '...';
  return firstPhrase;
}

function getVideoModelBadge(provider?: string, model?: string): string {
  if (!provider) return 'VIDEO';
  
  const providerUpper = provider.toUpperCase();
  
  // Runway models
  if (provider === 'runway') {
    switch (model) {
      case 'gen3a_turbo':
        return 'RUNWAY-GEN3A-TURBO';
      case 'gen4_turbo':
        return 'RUNWAY-GEN4-TURBO';
      case 'gen4_aleph':
        return 'RUNWAY-GEN4-ALEPH';
      case 'veo3':
        return 'RUNWAY-VEO-3';
      default:
        return `RUNWAY-${model?.toUpperCase() || 'VIDEO'}`;
    }
  }
  
  // Luma models
  if (provider === 'luma') {
    if (model === 'ray-2') {
      return 'LUMA-RAY-2';
    }
    return `LUMA-${model?.toUpperCase() || 'RAY-2'}`;
  }

  return `${providerUpper}-${model?.toUpperCase() || 'VIDEO'}`;
}

type SortOption = 'date-desc' | 'date-asc' | 'type' | 'hidden';
type FilterOption = 'all' | 'content' | 'pictures' | 'video';

export default function SavedGenerationsPanel() {
  const { cards, removeCard, restoreCard, isLoading, loadAllCards } = useGeneratedCardsStore();
  
  // Load all cards (including hidden) when component mounts
  useEffect(() => {
    loadAllCards();
  }, [loadAllCards]);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<GeneratedCard | null>(null);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Apply type filter
    if (filterBy !== 'all') {
      result = result.filter(card => card.cardType === filterBy);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(card => {
        const snapshot = card.snapshot;
        const dataStr = JSON.stringify(snapshot.data).toLowerCase();
        return dataStr.includes(query) || card.cardType.includes(query);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'type':
          return a.cardType.localeCompare(b.cardType);
        case 'hidden':
          if (a.isHidden !== b.isHidden) return a.isHidden ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [cards, filterBy, sortBy, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: cards.length,
      content: cards.filter(c => c.cardType === 'content').length,
      pictures: cards.filter(c => c.cardType === 'pictures').length,
      video: cards.filter(c => c.cardType === 'video').length,
      'media-plan': cards.filter(c => c.cardType === 'media-plan').length,
      hidden: cards.filter(c => c.isHidden).length,
      visible: cards.filter(c => !c.isHidden).length,
    };
  }, [cards]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/60 text-sm">Loading generations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Saved Generations</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-lg bg-white/10 text-white/60">
            {stats.total} Total
          </span>
          {stats.content > 0 && (
            <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-200">
              {stats.content} Content
            </span>
          )}
          {stats.pictures > 0 && (
            <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-200">
              {stats.pictures} Pictures
            </span>
          )}
          {stats.video > 0 && (
            <span className="px-2 py-1 rounded-lg bg-pink-500/20 text-pink-200">
              {stats.video} Videos
            </span>
          )}
          {stats['media-plan'] > 0 && (
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200">
              {stats['media-plan']} Media Plans
            </span>
          )}
          {stats.hidden > 0 && (
            <span className="px-2 py-1 rounded-lg bg-gray-500/20 text-gray-300">
              {stats.hidden} Hidden
            </span>
          )}
          {stats.visible > 0 && (
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200">
              {stats.visible} Visible
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search generations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-white/20"
          >
            <option value="all">All Types</option>
            <option value="content">Content</option>
            <option value="pictures">Pictures</option>
            <option value="video">Video</option>
            <option value="media-plan">Media Plans</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-white/20"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="type">By Type</option>
            <option value="hidden">Hidden First</option>
          </select>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-white/40 text-sm mb-2">No generations found</div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-400 text-xs hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card) => (
              <GenerationCard
                key={card.generationId}
                card={card}
                onDelete={removeCard}
                onRestore={restoreCard}
                onView={setSelectedCard}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Full View Modal - Rendered at body level to prevent cropping */}
      {createPortal(
        <AnimatePresence>
          {selectedCard && (
            <FullViewModal
              card={selectedCard}
              onClose={() => setSelectedCard(null)}
              onDelete={(id: string) => {
                removeCard(id);
                setSelectedCard(null);
              }}
              onRestore={restoreCard}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

interface GenerationCardProps {
  card: GeneratedCard;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onView: (card: GeneratedCard) => void;
}

function GenerationCard({ card, onDelete, onRestore, onView }: GenerationCardProps) {
  const cardTypeColors: Record<CardKey, string> = {
    content: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    pictures: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    video: 'bg-pink-500/20 text-pink-200 border-pink-500/30',
    'media-plan': 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPreviewText = (card: GeneratedCard): string => {
    const { cardType, snapshot } = card;
    
    if (cardType === 'content') {
      const data = snapshot.data as { variants?: Array<{ headline?: string; primary_text?: string }> };
      return data.variants?.[0]?.headline || data.variants?.[0]?.primary_text || 'Content generation';
    }
    
    if (cardType === 'pictures') {
      const data = snapshot.data as {
        versions?: Array<{
          assets?: Array<{ prompt?: string }>;
          meta?: { prompt?: string };
        }>;
      };
      
      // Extract prompt from first version
      const prompt = data.versions?.[0]?.meta?.prompt || data.versions?.[0]?.assets?.[0]?.prompt;
      
      if (prompt) {
        // Create short title from first 5 words
        const words = prompt.trim().split(/\s+/);
        const shortTitle = words.slice(0, 5).join(' ');
        return shortTitle + (words.length > 5 ? '...' : '');
      }
      
      return 'Generated image';
    }
    
    if (cardType === 'video') {
      const data = snapshot.data as {
        versions?: Array<{
          prompt?: string;
          meta?: { prompt?: string };
        }>;
      };
      const prompt = data.versions?.[0]?.prompt || data.versions?.[0]?.meta?.prompt;
      return generateSmartVideoTitle(prompt);
    }
    
    if (cardType === 'media-plan') {
      const data = snapshot.data as {
        budget?: number;
        goal?: string;
        market?: string;
      };
      const budgetFormatted = data.budget ? `$${(data.budget / 1000).toFixed(0)}K` : 'N/A';
      const goal = data.goal || 'Unknown';
      const market = data.market || 'Unknown';
      return `${goal} - ${budgetFormatted} - ${market}`;
    }
    
    return 'Generation';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => onView(card)}
      className="group relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 relative">
          {card.thumbnailUrl ? (
            card.cardType === 'video' ? (
              <video
                src={card.thumbnailUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={card.thumbnailUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl opacity-30">
                {card.cardType === 'content' ? '📝' : card.cardType === 'pictures' ? '🖼️' : card.cardType === 'video' ? '🎬' : '📊'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${cardTypeColors[card.cardType]}`}>
                {card.cardType}
              </span>
              {card.isHidden && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-gray-500/20 text-gray-300 border border-gray-500/30">
                  <EyeOff size={10} />
                  Hidden
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {card.isHidden && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(card.generationId);
                  }}
                  className="p-1.5 rounded-lg bg-white/0 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                  title="Restore to main screen"
                >
                  <RotateCcw size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this generation permanently?')) {
                    onDelete(card.generationId);
                  }
                }}
                className="p-1.5 rounded-lg bg-white/0 text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all"
                title="Delete permanently"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          
          <div className="text-white/80 text-sm font-medium line-clamp-2 mb-1">
            {getPreviewText(card)}
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Calendar size={10} />
            <span>{formatDate(card.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Full View Modal Component
interface FullViewModalProps {
  card: GeneratedCard;
  onClose: () => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

function FullViewModal({ card, onClose, onDelete, onRestore }: FullViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedRefImage, setExpandedRefImage] = useState<string | null>(null);
  
  const renderContent = () => {
    const { cardType, snapshot } = card;

    if (cardType === 'content') {
      const data = snapshot.data as { variants?: Array<{ platform?: string; headline?: string; primary_text?: string; body?: string }> };
      const variants = data.variants || [];
      
      return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {variants.map((variant, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              {/* Platform Header */}
              {variant.platform && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10">
                    <PlatformIcon name={variant.platform} size={14} />
                  </div>
                  <span className="text-white/60 text-xs font-medium uppercase tracking-wide">
                    {variant.platform}
                  </span>
                </div>
              )}
              
              {variant.headline && (
                <h3 className="text-white font-semibold text-lg mb-2">{variant.headline}</h3>
              )}
              {variant.primary_text && (
                <p className="text-white/80 mb-2">{variant.primary_text}</p>
              )}
              {variant.body && (
                <p className="text-white/60 text-sm">{variant.body}</p>
              )}
            </motion.div>
          ))}
        </div>
      );
    }

    if (cardType === 'pictures') {
      const data = snapshot.data as {
        versions?: Array<{
          provider?: string;
          model?: string;
          assets?: Array<{ 
            url?: string; 
            src?: string; 
            uri?: string; 
            prompt?: string;
            width?: number;
            height?: number;
            mimeType?: string;
          }>;
          meta?: { prompt?: string; [key: string]: any };
        }>;
      };
      
      // Extract all images from all versions' assets
      const images: Array<{ 
        url: string; 
        prompt?: string;
        width?: number;
        height?: number;
        provider?: string;
        model?: string;
        meta?: any;
      }> = [];
      
      if (data.versions) {
        data.versions.forEach(version => {
          if (version.assets) {
            version.assets.forEach(asset => {
              const url = asset.url || asset.src || asset.uri;
              if (url) {
                images.push({
                  url,
                  prompt: asset.prompt || version.meta?.prompt,
                  width: asset.width,
                  height: asset.height,
                  provider: version.provider,
                  model: version.model,
                  meta: version.meta
                });
              }
            });
          }
        });
      }
      
      if (images.length === 0) {
        return <div className="text-center py-12 text-white/40">No images available</div>;
      }
      
      const currentImage = images[currentImageIndex];
      const settings = snapshot.settings as Record<string, any> | undefined;
      
      return (
        <div className="flex gap-6 max-h-[70vh]">
          {/* Left: Image Display */}
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              <img
                src={currentImage.url}
                alt={currentImage.prompt || 'Generated image'}
                className="max-w-full max-h-full object-contain"
                onError={() => {
                  console.error('Failed to load image:', currentImage.url);
                }}
              />
            </div>
            
            {/* Navigation */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  disabled={currentImageIndex === 0}
                  className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-white/60 text-sm">
                  {currentImageIndex + 1} / {images.length}
                </span>
                
                <button
                  onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                  disabled={currentImageIndex === images.length - 1}
                  className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Right: Metadata Panel */}
          <div className="w-80 flex-shrink-0">
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {/* Prompt */}
              {currentImage.prompt && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">Prompt</h4>
                  <p className="text-white/90 text-sm leading-relaxed">{currentImage.prompt}</p>
                </div>
              )}
              
              {/* Provider Info */}
              {currentImage.provider && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">Provider</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs">Provider</span>
                      <span className="text-white/90 text-sm font-medium">{currentImage.provider}</span>
                    </div>
                    {currentImage.model && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs">Model</span>
                        <span className="text-white/90 text-sm font-medium">{currentImage.model}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Image Details */}
              {(currentImage.width || currentImage.height) && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">Image Details</h4>
                  <div className="space-y-2">
                    {currentImage.width && currentImage.height && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs">Dimensions</span>
                        <span className="text-white/90 text-sm">{currentImage.width} × {currentImage.height}</span>
                      </div>
                    )}
                    {currentImage.width && currentImage.height && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs">Aspect Ratio</span>
                        <span className="text-white/90 text-sm">
                          {(currentImage.width / currentImage.height).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Generation Settings */}
              {settings && Object.keys(settings).length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">Settings</h4>
                  <div className="space-y-2">
                    {Object.entries(settings).map(([key, value]) => {
                      // Skip complex objects and null values
                      if (value === null || value === undefined || typeof value === 'object') return null;
                      
                      return (
                        <div key={key} className="flex justify-between items-center gap-2">
                          <span className="text-white/60 text-xs truncate">{key}</span>
                          <span className="text-white/90 text-sm truncate">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Reference Images */}
              {currentImage.meta?.referenceImages && Array.isArray(currentImage.meta.referenceImages) && currentImage.meta.referenceImages.length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ImageIconLucide className="w-3 h-3" />
                    Reference Images ({currentImage.meta.referenceImages.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentImage.meta.referenceImages.map((img: string, idx: number) => (
                      <div 
                        key={idx}
                        className="group relative w-16 h-16 overflow-hidden rounded-lg border border-white/20 bg-black/40 cursor-pointer hover:border-blue-400/50 transition-all"
                        onClick={() => setExpandedRefImage(img)}
                      >
                        <div className="h-full w-full flex items-center justify-center">
                          <img 
                            src={img}
                            alt={`Reference ${idx + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white font-medium pointer-events-none">
                          {idx + 1}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                          <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional Metadata */}
              {currentImage.meta && Object.keys(currentImage.meta).length > 1 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">Metadata</h4>
                  <div className="space-y-2">
                    {Object.entries(currentImage.meta).map(([key, value]) => {
                      // Skip prompt, referenceImages (already shown) and complex objects
                      if (key === 'prompt' || key === 'referenceImages' || key === 'referenceImageCount' || value === null || value === undefined || typeof value === 'object') return null;
                      
                      return (
                        <div key={key} className="flex justify-between items-center gap-2">
                          <span className="text-white/60 text-xs truncate">{key}</span>
                          <span className="text-white/90 text-sm truncate">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (cardType === 'video') {
      const data = snapshot.data as {
        versions?: Array<{
          url?: string;
          taskId?: string;
          model?: string;
          provider?: string;
          duration?: number;
          aspect?: string;
          prompt?: string;
          createdAt?: string;
          meta?: {
            prompt?: string;
            provider?: string;
            model?: string;
            aspect?: string;
            duration?: number;
            referenceImages?: string[];
            referenceImageCount?: number;
            [key: string]: unknown;
          };
        }>;
      };
      
      // Get first video (versions[0])
      const currentVideo = data.versions && data.versions.length > 0 ? data.versions[0] : null;
      
      if (!currentVideo) {
        return <div className="text-center py-12 text-white/40">No videos available</div>;
      }

      return (
        <div className="flex gap-6 h-full min-h-0">
          {/* Left: YouTube Video Player ONLY - 50% */}
          <div className="flex-1 min-w-0">
            <YouTubeVideoPlayer
              src={currentVideo.url || ''}
              aspectRatio={currentVideo.aspect || '16:9'}
              autoPlay={false}
              loop={true}
              className="h-full rounded-xl"
              modelBadge={getVideoModelBadge(currentVideo.provider, currentVideo.model)}
              videoMetadata={{
                provider: currentVideo.provider,
                model: currentVideo.model,
                duration: currentVideo.duration,
                aspect: currentVideo.aspect,
                prompt: currentVideo.prompt || currentVideo.meta?.prompt,
              }}
            />
          </div>          {/* Right: ALL Metadata (Prompt + Details) - 50% */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar min-w-0">
            {/* Prompt Section */}
            {(currentVideo.prompt || currentVideo.meta?.prompt) && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">Prompt</h4>
                <p className="text-white/90 text-sm leading-relaxed">{currentVideo.prompt || currentVideo.meta?.prompt}</p>
              </div>
            )}

            {/* Provider & Details */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">Video Details</h4>
              <div className="space-y-2">
                {currentVideo.provider && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Provider</span>
                    <span className="text-white/90 text-sm capitalize">{currentVideo.provider}</span>
                  </div>
                )}
                {currentVideo.model && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Model</span>
                    <span className="text-white/90 text-sm">{currentVideo.model}</span>
                  </div>
                )}
                {currentVideo.aspect && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Aspect</span>
                    <span className="text-white/90 text-sm">{currentVideo.aspect}</span>
                  </div>
                )}
                {currentVideo.duration && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Duration</span>
                    <span className="text-white/90 text-sm">{currentVideo.duration}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Images */}
            {currentVideo.meta?.referenceImages && Array.isArray(currentVideo.meta.referenceImages) && currentVideo.meta.referenceImages.length > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ImageIconLucide className="w-3 h-3" />
                  Reference Images ({currentVideo.meta.referenceImages.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentVideo.meta.referenceImages.map((img: string, idx: number) => (
                    <div 
                      key={idx}
                      className="group relative w-16 h-16 overflow-hidden rounded-lg border border-white/20 bg-black/40 cursor-pointer hover:border-blue-400/50 transition-all"
                      onClick={() => setExpandedRefImage(img)}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <img 
                          src={img}
                          alt={`Reference ${idx + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white font-medium pointer-events-none">
                        {idx + 1}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                        <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Metadata */}
            {currentVideo.meta && Object.keys(currentVideo.meta).length > 1 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">Metadata</h4>
                <div className="space-y-2">
                  {Object.entries(currentVideo.meta).map(([key, value]) => {
                    // Skip already shown fields and complex objects
                    if (key === 'prompt' || key === 'provider' || key === 'model' || key === 'aspect' || key === 'duration' || key === 'referenceImages' || key === 'referenceImageCount' || value === null || value === undefined || typeof value === 'object') return null;
                    
                    return (
                      <div key={key} className="flex justify-between items-center gap-2">
                        <span className="text-white/60 text-xs truncate">{key}</span>
                        <span className="text-white/90 text-sm truncate">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (cardType === 'media-plan') {
      const data = snapshot.data as {
        budget?: number;
        market?: string;
        goal?: string;
        currency?: string;
        niche?: string;
        leadToSalePct?: number;
        revenuePerSale?: number;
        manageFx?: boolean;
        campaignDuration?: string;
        campaignStartDate?: string;
        campaignEndDate?: string;
        targetAudienceSize?: number;
        channels?: string[];
        summary?: {
          totalImpressions?: number;
          totalClicks?: number;
          totalLeads?: number;
          estimatedCPL?: number;
          estimatedCPC?: number;
          estimatedCPM?: number;
        };
        allocations?: Array<{
          channel: string;
          percentage: number;
          budget: number;
          impressions: number;
          clicks: number;
          leads: number;
        }>;
      };

      const budgetFormatted = data.budget ? `${data.currency || 'USD'} ${data.budget.toLocaleString()}` : 'N/A';

      return (
        <div className="flex gap-6 h-full min-h-0">
          {/* Left: Media Plan Summary - 50% */}
          <div className="flex-1 min-w-0 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* Main Info */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide mb-3">Plan Overview</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-white/60 text-xs">Goal</span>
                  <span className="text-white/90 text-sm font-medium">{data.goal || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-white/60 text-xs">Market</span>
                  <span className="text-white/90 text-sm">{data.market || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-white/60 text-xs">Budget</span>
                  <span className="text-white/90 text-sm font-medium">{budgetFormatted}</span>
                </div>
                {data.niche && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Niche</span>
                    <span className="text-white/90 text-sm">{data.niche}</span>
                  </div>
                )}
                {data.leadToSalePct != null && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Lead → Sale %</span>
                    <span className="text-white/90 text-sm">{data.leadToSalePct}%</span>
                  </div>
                )}
                {data.revenuePerSale != null && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Revenue per Sale</span>
                    <span className="text-white/90 text-sm">{data.currency || 'USD'} {data.revenuePerSale.toLocaleString()}</span>
                  </div>
                )}
                {data.manageFx !== undefined && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Manage FX</span>
                    <span className="text-white/90 text-sm">{data.manageFx ? 'Enabled' : 'Disabled'}</span>
                  </div>
                )}
                {data.campaignDuration && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Campaign Duration</span>
                    <span className="text-white/90 text-sm">{data.campaignDuration}</span>
                  </div>
                )}
                {data.campaignStartDate && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Start Date</span>
                    <span className="text-white/90 text-sm">{new Date(data.campaignStartDate).toLocaleDateString()}</span>
                  </div>
                )}
                {data.campaignEndDate && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">End Date</span>
                    <span className="text-white/90 text-sm">{new Date(data.campaignEndDate).toLocaleDateString()}</span>
                  </div>
                )}
                {data.targetAudienceSize != null && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-white/60 text-xs">Target Audience Size</span>
                    <span className="text-white/90 text-sm">{data.targetAudienceSize.toLocaleString()}</span>
                  </div>
                )}
                {data.channels && data.channels.length > 0 && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-white/60 text-xs">Channels</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {data.channels.map((channel, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 text-xs">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right: Smart Schedule - 50% */}
          <div className="flex-1 min-w-0 overflow-y-auto pr-2 custom-scrollbar">
            {(() => {
              // Use saved allocations data if available (contains actual metrics)
              let scheduleRows: Array<{
                platform: string;
                budget: number;
                impressions: number;
                reach: number;
                clicks: number;
                leads: number;
                cpl: number | null;
                views: number;
                engagement: number;
                ctr: number;
                cpc: number | null;
                cpm: number | null;
              }> = [];
              
              // Check if we should use allocations or regenerate from channels
              const hasValidAllocations = data.allocations && 
                data.allocations.length > 0 && 
                data.allocations.some(a => (a.budget ?? 0) > 0);
              
              const useChannelsFallback = !hasValidAllocations && data.channels && data.channels.length > 0;
              
              // Also check if allocations count matches channels count
              const allChannelsIncluded = data.allocations && data.channels && 
                data.allocations.length === data.channels.length;
              
              if (hasValidAllocations && allChannelsIncluded) {
                // Use saved allocation data (new format with all metrics)
                scheduleRows = data.allocations!.map(a => ({
                  platform: a.channel || (a as any).platform || 'Unknown',
                  budget: a.budget ?? 0,
                  impressions: (a as any).impressions ?? 0,
                  reach: (a as any).reach ?? 0,
                  clicks: (a as any).clicks ?? 0,
                  leads: (a as any).leads ?? 0,
                  cpl: (a as any).cpl ?? null,
                  views: (a as any).views ?? 0,
                  engagement: (a as any).engagement ?? 0,
                  ctr: (a as any).ctr ?? 0,
                  cpc: (a as any).cpc ?? null,
                  cpm: (a as any).cpm ?? null,
                }));
              } else if ((useChannelsFallback || !allChannelsIncluded) && data.channels) {
                // Fallback for old saved plans without allocations or incomplete allocations
                const channels = data.channels;
                const totalBudget = data.budget || 0;
                const totalImpressions = data.summary?.totalImpressions ?? Math.max(1, Math.round(totalBudget * 12));
                const totalClicks = data.summary?.totalClicks ?? Math.round(totalImpressions * 0.03);
                const totalLeads = data.summary?.totalLeads ?? Math.max(1, Math.round(totalClicks * 0.15));
                
                scheduleRows = channels.map(channel => {
                  const share = 1 / channels.length;
                  const budget = Math.round(totalBudget * share);
                  const impressions = Math.round(totalImpressions * share);
                  const reach = Math.round(impressions * 0.7);
                  const clicks = Math.round(totalClicks * share);
                  const leads = Math.round(totalLeads * share);
                  const views = Math.round(impressions * 0.65);
                  const engagement = Math.round(clicks * 1.8);
                  const cpl = leads > 0 ? budget / leads : null;
                  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                  const cpc = clicks > 0 ? budget / clicks : null;
                  const cpm = impressions > 0 ? (budget / impressions) * 1000 : null;
                  
                  return {
                    platform: channel,
                    budget,
                    impressions,
                    reach,
                    clicks,
                    leads,
                    cpl,
                    views,
                    engagement,
                    ctr,
                    cpc,
                    cpm,
                  };
                });
              }
              
              if (scheduleRows.length === 0) {
                return (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/40 text-sm text-center">No schedule available</p>
                  </div>
                );
              }
              
              return (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white/60 text-xs font-medium uppercase tracking-wide">Smart Schedule</h4>
                  <button
                    onClick={() => {
                      // Download full schedule matrix as CSV
                      const headers = ['Platform', 'Budget', 'Impr.', 'Reach', 'Clicks', 'Leads', 'CPL', 'Views', 'Eng.', 'CTR', 'CPC', 'CPM'];
                      const rows = scheduleRows.map(r => [
                        r.platform,
                        r.budget,
                        r.impressions,
                        r.reach,
                        r.clicks,
                        r.leads,
                        r.cpl?.toFixed(2) || '—',
                        r.views,
                        r.engagement,
                        r.ctr.toFixed(2) + '%',
                        r.cpc?.toFixed(2) || '—',
                        r.cpm?.toFixed(2) || '—',
                      ]);
                      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `media-plan-schedule-${new Date().toISOString().split('T')[0]}.csv`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title="Download schedule matrix"
                  >
                    <Download className="w-3 h-3 text-white/60 hover:text-white/90" />
                  </button>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 overflow-x-auto">
                  <table className="w-full text-xs min-w-[900px]">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-white/50 font-medium">Platform</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">Budget</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">Impr.</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">Reach</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">Clicks</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">Leads</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">CPL</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">Views</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">Eng.</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">CTR</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">CPC</th>
                        <th className="px-2 py-2 text-right text-white/50 font-medium">CPM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {scheduleRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-2 py-2 text-white/90 font-medium">{row.platform}</td>
                          <td className="px-2 py-2 text-right text-white/80">{(data.currency || 'USD')} {row.budget.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.impressions.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.reach.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.clicks.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.leads.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.cpl ? `${(data.currency || 'USD')} ${row.cpl.toFixed(2)}` : '—'}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.views.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.engagement.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.ctr.toFixed(2)}%</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.cpc ? `${(data.currency || 'USD')} ${row.cpc.toFixed(2)}` : '—'}</td>
                          <td className="px-2 py-2 text-right text-white/70">{row.cpm ? `${(data.currency || 'USD')} ${row.cpm.toFixed(2)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      );
    }

    return <div className="text-white/40 text-center py-8">No content available</div>;
  };

  const cardTypeLabels: Record<CardKey, string> = {
    content: 'Content Variants',
    pictures: 'Generated Images',
    video: 'Generated Videos',
    'media-plan': 'Media Plan Details',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-7xl h-[85vh] flex flex-col rounded-2xl bg-black border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">{cardTypeLabels[card.cardType]}</h2>
            <p className="text-white/50 text-sm">
              Created {new Date(card.createdAt).toLocaleDateString()} at {new Date(card.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {card.isHidden && (
              <button
                onClick={() => {
                  onRestore(card.generationId);
                  onClose();
                }}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                title="Restore to main screen"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Delete this generation permanently?')) {
                  onDelete(card.generationId);
                }
              }}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all"
              title="Delete permanently"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 min-h-0 overflow-hidden">
          {renderContent()}
        </div>
      </motion.div>

      {/* Reference Image Expansion Modal */}
      <AnimatePresence>
        {expandedRefImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setExpandedRefImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedRefImage(null)}
                className="absolute -top-12 right-0 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center rounded-xl overflow-hidden bg-white/5 border border-white/20">
                <img
                  src={expandedRefImage}
                  alt="Reference Image"
                  className="max-w-full max-h-[90vh] object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
