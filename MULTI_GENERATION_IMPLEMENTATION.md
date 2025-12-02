# Multi-Generation Content Persistence Implementation

## Overview
This implementation enables storing multiple generated cards (content/pictures/videos) per user with full persistence, drag-and-drop reordering, and a comprehensive management UI.

## Components Created

### 1. Database Layer (Phase 1) ✅

**File**: `supabase/migrations/20250206_multi_generation_support.sql`

**Key Features**:
- Removes restrictive unique constraint to allow multiple active cards per type
- Adds fields: `generation_id`, `aspect_ratio`, `thumbnail_url`, `generation_batch_id`, `is_deleted`
- New stored procedures:
  - `persist_card_snapshots` - Save cards with metadata
  - `delete_card_generation` - Soft delete
  - `update_card_position` - Update drag positions
  - `toggle_card_pin` - Toggle pin state
- View: `user_active_generations` for easy querying

### 2. Core Services (Phase 2) ✅

**File**: `src/lib/cardPersistence.ts`

**Functions**:
- `loadUserGenerations()` - Load all cards from DB
- `saveGeneration()` - Save new generation
- `updateCardPosition()` - Debounced position updates (300ms)
- `deleteGeneration()` - Soft delete card
- `toggleCardPin()` - Toggle pin state
- `batchUpdatePositions()` - Bulk position updates
- `generateThumbnailUrl()` - Generate preview URL
- `calculateAspectRatio()` - Calculate card aspect ratio

**File**: `src/store/useGeneratedCardsStore.ts`

**State Management**:
- Zustand store for all generated cards
- Optimistic UI updates
- Auto-sync with Supabase
- Rollback on errors
- Selectors for filtering (by type, batch, pinned)

### 3. UI Components (Phase 3) ✅

**File**: `src/components/GeneratedCardsGrid.tsx`

**Features**:
- 3-column responsive grid layout
- Drag-and-drop with @dnd-kit
- Smooth animations with framer-motion
- Card controls (pin, delete, drag handle)
- Aspect ratio preservation
- DragOverlay for smooth dragging
- Empty state handling

**File**: `src/components/SettingsDrawer/SavedGenerationsPanel.tsx`

**Features**:
- Comprehensive saved generations manager
- Search functionality
- Filter by type (all/content/pictures/video)
- Sort options (date, type, pinned)
- Statistics display
- Compact card previews with metadata
- Delete and pin controls
- Relative timestamps ("2h ago")

## Architecture Decisions

### 1. Multi-Generation Support
- Changed from single "active" card per type to unlimited active cards
- Each generation gets unique `generation_id`
- Batch tracking via `generation_batch_id` links cards generated together
- Soft delete with `is_deleted` flag for data retention

### 2. Performance Optimizations
- Debounced position updates (300ms) to reduce DB writes
- Optimistic UI updates for instant feedback
- Batch position updates for reordering
- Layout animations use GPU-accelerated transforms
- Virtual scrolling ready for >50 cards

### 3. Data Structure
```typescript
{
  id: string;                    // DB row ID
  generationId: string;          // Unique card ID
  generationBatchId: string;     // Links cards from same generation
  cardType: 'content' | 'pictures' | 'video';
  snapshot: {
    data: unknown;               // Card-specific data
    settings: Record<string, unknown>; // Generation settings
    timestamp: number;
  };
  dragOffsetX: number;           // Free-form drag position
  dragOffsetY: number;
  isPinned: boolean;             // Pin to top
  displayOrder: number;          // Grid order
  aspectRatio: number;           // For layout calculations
  thumbnailUrl?: string;         // Preview image
  createdAt: string;
  updatedAt: string;
}
```

### 4. Grid Layout
- CSS Grid with `grid-template-columns: repeat(3, 1fr)`
- Auto-flow dense for optimal packing
- 24px gap (matches SNAP_GRID_SIZE)
- Responsive breakpoints (1 col mobile, 2 col tablet, 3 col desktop)
- Preserves aspect ratios using CSS `aspect-ratio` property

### 5. Drag-and-Drop
- @dnd-kit for smooth, accessible dragging
- Pointer sensor with 8px activation threshold
- Closest center collision detection
- DragOverlay for visual feedback
- Respects pinned cards (always at top)

## Integration Points

### Phase 4 (Next): App.tsx Integration

**Required Changes**:
1. Import and initialize `useGeneratedCardsStore`
2. Load cards on mount with `useLoadGeneratedCards()`
3. Modify generation logic to **append** instead of replace:
   - After content generation, call `addGeneration('content', contentResult)`
   - After pictures generation, call `addGeneration('pictures', picturesResult)`
   - After video generation, call `addGeneration('video', videoResult)`
4. Display `<GeneratedCardsGrid />` in main stage area
5. Add `<SavedGenerationsPanel />` to settings UI (new tab or section)
6. Generate unique `batchId` for each generation session

**Example Integration**:
```typescript
import { useGeneratedCardsStore, useLoadGeneratedCards } from './store/useGeneratedCardsStore';
import GeneratedCardsGrid from './components/GeneratedCardsGrid';

function App() {
  const { addGeneration, setCurrentBatchId } = useGeneratedCardsStore();
  useLoadGeneratedCards(); // Load on mount

  const handleGenerate = async () => {
    const batchId = `batch_${Date.now()}`;
    setCurrentBatchId(batchId);
    
    // After content generation completes:
    await addGeneration('content', contentResult, settings);
    
    // After pictures generation completes:
    await addGeneration('pictures', picturesResult, settings);
    
    // After video generation completes:
    await addGeneration('video', videoResult, settings);
  };

  return (
    <>
      {/* Existing UI */}
      <GeneratedCardsGrid className="p-6" />
    </>
  );
}
```

## Phase 5: Testing

### Puppeteer Test Suite

**File**: `tests/generation-persistence.spec.ts`

**Test Cases**:
1. Authentication flow
2. Single generation (3 cards)
3. Multiple generations (6+ cards)
4. Drag-and-drop reordering
5. Pin functionality
6. Delete functionality
7. Search and filtering
8. Cross-session persistence
9. Grid layout at different sizes
10. Performance with 20+ cards

## Benefits

1. **Never Lose Work**: All generations are automatically saved
2. **Multi-Session**: Cards persist across page refreshes and sessions
3. **Organized**: Pin important cards, search, filter, and sort
4. **Flexible Layout**: Drag cards to any position with smooth animations
5. **Fast**: Optimistic updates, debounced saves, efficient rendering
6. **Scalable**: Handles hundreds of cards with virtual scrolling ready
7. **Accessible**: Keyboard navigation, screen reader support via @dnd-kit
8. **Beautiful UX**: Smooth animations, glassmorphism design, modern UI

## Next Steps

1. **Phase 4**: Integrate into App.tsx (modify generation logic)
2. **Phase 5**: Write comprehensive Puppeteer tests
3. **Optional Enhancements**:
   - Real-time sync across devices (Supabase Realtime)
   - Export collections
   - Share generations
   - Version history
   - Batch operations (delete multiple, export, etc.)
   - Analytics (track most-used cards, generation patterns)

## Migration Instructions

1. Apply the database migration:
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or via Supabase Dashboard
   # Copy contents of 20250206_multi_generation_support.sql
   # Run in SQL Editor
   ```

2. The migration is backwards compatible - existing cards will continue to work
3. New fields will be populated on next save
4. No data loss during migration

## Performance Considerations

- **Database**: Indexed queries on `user_id`, `generation_batch_id`, `created_at`
- **Frontend**: React.memo for card components, debounced saves
- **Network**: Batch updates when possible, optimistic UI
- **Rendering**: GPU-accelerated animations, virtual scrolling for 50+ cards
- **Storage**: Soft delete preserves data, can add cleanup job for old cards

## Security

- Row Level Security (RLS) enforced on all tables
- All functions use `SECURITY DEFINER` with auth checks
- User can only access their own cards
- Soft delete prevents accidental permanent loss
