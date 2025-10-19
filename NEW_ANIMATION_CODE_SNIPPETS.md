# New Animation - Code Snippets

## Quick Reference for Adding Your New Loading Animation

---

## 🎯 Option 1: Create a Reusable Component (Recommended)

### Step 1: Create the component

Create a new file: `src/components/NewLoadingAnimation.tsx`

```tsx
import { motion } from 'framer-motion';

interface NewLoadingAnimationProps {
  status?: 'queued' | 'thinking' | 'rendering' | 'ready' | 'error';
}

export function NewLoadingAnimation({ status }: NewLoadingAnimationProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* 
        Add your animation JSX here 
        You can use the `status` prop to show different states
      */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Your animation */}
      </motion.div>
    </div>
  );
}
```

### Step 2: Import in all three panel files

Then import and use it in each panel:

---

## 📝 Content Panel

**File**: `src/cards/ContentVariantCard.tsx`

### What to change:

**Line 48-50** - Replace the placeholder:

```tsx
{loading ? (
  <div className="px-4 pt-5 pb-5 space-y-4">
    {/* Loading animation will go here */}
  </div>
) : status === "error" ? (
```

### Replace with:

```tsx
{loading ? (
  <div className="px-4 pt-5 pb-5 space-y-4">
    <YourNewAnimationComponent status={status} />
  </div>
) : status === "error" ? (
```

### OR use as overlay (recommended):

Add after line 125 (before closing `</motion.article>`):

```tsx
      </div>
      
      {/* New loading animation overlay */}
      {loading && <YourNewAnimationComponent status={status} />}
    </motion.article>
```

**Complete example with import:**

```tsx
import React from "react";
import { motion } from "framer-motion";
import PlatformIcon from "@/ui/PlatformIcon";
import CopyBtn from "@/ui/CopyBtn";
import { NewLoadingAnimation } from "@/components/NewLoadingAnimation"; // ADD THIS

type Status = "queued" | "thinking" | "rendering" | "ready" | "error";

export type ContentVariant = {
  platform: string;
  headline?: string;
  caption?: string;
  hashtags?: string;
};

export default function ContentVariantCard({
  status,
  variant,
  progress,
  onRegenerate,
  onSave
}: {
  status: Status;
  variant: ContentVariant | null;
  progress?: number;
  onRegenerate?: () => void;
  onSave?: () => void;
}) {
  const busyStages: Status[] = ["queued", "thinking", "rendering"];
  const stageIndex = busyStages.indexOf(status);
  const loading = stageIndex >= 0;
  const clampedProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : undefined

  return (
    <motion.article
      className="relative isolate overflow-hidden rounded-[24px] bg-white/5 backdrop-blur-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(0,0,0,0.40)]"
      data-loading={loading ? "true" : "false"}
      aria-busy={loading}
      layout
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {/* CONTENT */}
      <div className="relative z-10">
        {loading ? (
          <div className="px-4 pt-5 pb-5 space-y-4">
            <NewLoadingAnimation status={status} /> {/* ADD THIS */}
          </div>
        ) : status === "error" ? (
          // ... error state
        ) : (
          // ... ready state
        )}
      </div>
    </motion.article>
  );
}
```

---

## 🖼️ Pictures Panel

**File**: `src/components/Cards/PicturesCard.tsx`

### Add import at top:

```tsx
import { NewLoadingAnimation } from '@/components/NewLoadingAnimation';
```

### Add animation - Option A (as overlay):

**After line 357** (inside CardShell, after the main content div):

```tsx
      </div>
      
      {/* New loading animation */}
      {isBusy && <NewLoadingAnimation status={status} />}
    </CardShell>
```

**Complete context:**

```tsx
    <CardShell sheen={false} className="relative isolate overflow-hidden p-0">
      <div className="relative z-10">
        {/* Image Display with Overlays */}
        {versionPictures?.mode === 'image' && selectedAsset ? (
          // ... image display
        ) : (
          <div className="flex h-[500px] items-center justify-center bg-black/10">
            <div className="text-center">
              <p className="text-sm text-white/50">
                {isBusy ? 'Generating images...' : 'No images generated yet'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* ADD YOUR ANIMATION HERE */}
      {isBusy && <NewLoadingAnimation status={status} />}
    </CardShell>
```

---

## 🎥 Video Panel

**File**: `src/components/Cards/VideoCard.tsx`

### Add import at top:

```tsx
import { NewLoadingAnimation } from '@/components/NewLoadingAnimation';
```

### Add animation - Option A (as overlay):

**After line 207** (inside CardShell, after the main content div):

```tsx
        </div>
        
        {/* New loading animation */}
        {isBusy && <NewLoadingAnimation status={status} />}
      </CardShell>
```

**Complete context:**

```tsx
    <CardShell sheen={false} className="relative isolate overflow-hidden">
      <div className="relative z-10 flex h-full flex-col">
        {!video ? (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-white/6 bg-white/[0.03] px-6 text-sm text-white/60">
            Video will appear here after generation runs.
          </div>
        ) : (
          // ... video display
        )}
      </div>
      
      {/* ADD YOUR ANIMATION HERE */}
      {isBusy && <NewLoadingAnimation status={status} />}
    </CardShell>
```

---

## 🎨 Option 2: Inline Animation (No Separate Component)

If you prefer to add the animation directly without creating a separate component:

### Content Panel Example:

```tsx
{loading ? (
  <div className="px-4 pt-5 pb-5 space-y-4">
    <div className="flex items-center justify-center">
      {/* Your inline animation here */}
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  </div>
) : status === "error" ? (
```

### Pictures Panel Example:

```tsx
    </div>
    
    {isBusy && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        {/* Your inline animation here */}
        <div className="animate-pulse text-white">Generating...</div>
      </div>
    )}
  </CardShell>
```

---

## 🔑 Available Variables

### Content Panel (`ContentVariantCard.tsx`)
- `loading`: boolean - `true` when generating
- `status`: 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'
- `progress`: number | undefined - 0 to 1 (optional progress value)
- `clampedProgress`: number | undefined - clamped version of progress

### Pictures Panel (`PicturesCard.tsx`)
- `isBusy`: boolean - `true` when generating
- `status`: GridStepState - 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'
- `versionPictures`: GeneratedPictures | undefined - current picture data

### Video Panel (`VideoCard.tsx`)
- `isBusy`: boolean - `true` when generating
- `status`: GridStepState - 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'
- `video`: GeneratedVideo | undefined - current video data

---

## 💡 Tips for Your Animation

1. **Use absolute positioning** if you want it as an overlay:
   ```tsx
   <div className="absolute inset-0 flex items-center justify-center bg-black/50">
     {/* animation */}
   </div>
   ```

2. **Check the `status` prop** to show different messages:
   ```tsx
   {status === 'queued' && <p>Waiting in queue...</p>}
   {status === 'thinking' && <p>Thinking...</p>}
   {status === 'rendering' && <p>Rendering...</p>}
   ```

3. **Use framer-motion** for smooth animations:
   ```tsx
   <motion.div
     initial={{ opacity: 0, scale: 0.9 }}
     animate={{ opacity: 1, scale: 1 }}
     exit={{ opacity: 0 }}
   >
     {/* animation */}
   </motion.div>
   ```

4. **Z-index management**: 
   - Content is at `z-10`
   - Your overlay should be higher, e.g., `z-20`

5. **Match the card styling**: Use the existing color scheme:
   - Background: `bg-white/5`
   - Text: `text-white/90`, `text-white/70`, `text-white/50`
   - Accents: `#00b3ff` (cyan), `#3E8BFF` (blue)

---

## 📋 Checklist

- [ ] Create new animation component (or prepare inline code)
- [ ] Add to Content panel (`ContentVariantCard.tsx`)
- [ ] Add to Pictures panel (`PicturesCard.tsx`)
- [ ] Add to Video panel (`VideoCard.tsx`)
- [ ] Test by clicking Generate button
- [ ] Verify animation appears in all three panels
- [ ] Verify animation disappears when complete

---

**Ready to receive your new animation code!** 🚀


