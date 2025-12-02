-- =====================================================
-- Multi-Generation Support & Enhanced Card Persistence
-- =====================================================
-- This migration enables storing multiple generations per user
-- instead of replacing cards on each new generation.

-- Drop the restrictive unique constraint
ALTER TABLE public.user_card_snapshots
DROP CONSTRAINT IF EXISTS user_card_snapshots_user_id_card_type_scope_position_key;

-- Add new fields for enhanced tracking
ALTER TABLE public.user_card_snapshots
ADD COLUMN IF NOT EXISTS generation_id TEXT,
ADD COLUMN IF NOT EXISTS aspect_ratio DECIMAL(10,4) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS generation_batch_id TEXT,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create new unique constraint that allows multiple active cards per type
-- Using id as primary key means we can have multiple active cards
-- Just need to ensure position is unique within user+type+scope+batch
ALTER TABLE public.user_card_snapshots
ADD CONSTRAINT unique_user_card_position 
UNIQUE (user_id, card_type, scope, position, generation_batch_id);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_cards_generation_batch
  ON public.user_card_snapshots (user_id, generation_batch_id)
  WHERE scope = 'active' AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_user_cards_recent
  ON public.user_card_snapshots (user_id, card_type, created_at DESC)
  WHERE scope = 'active' AND is_deleted = false;

-- Add comments
COMMENT ON COLUMN public.user_card_snapshots.generation_id IS 'Unique ID for this specific generation (card instance)';
COMMENT ON COLUMN public.user_card_snapshots.generation_batch_id IS 'Batch ID linking cards generated together';
COMMENT ON COLUMN public.user_card_snapshots.aspect_ratio IS 'Aspect ratio for layout calculations (width/height)';
COMMENT ON COLUMN public.user_card_snapshots.thumbnail_url IS 'Preview/thumbnail URL for quick display';
COMMENT ON COLUMN public.user_card_snapshots.is_deleted IS 'Soft delete flag';

-- Update persist function to handle multiple active cards
CREATE OR REPLACE FUNCTION public.persist_card_snapshots(_payload JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID := auth.uid();
  card_entry JSONB;
  history_entry JSONB;
  _card_type TEXT;
  _position INTEGER;
  _drag_x INTEGER;
  _drag_y INTEGER;
  _is_pinned BOOLEAN;
  _display_order INTEGER;
  _generation_id TEXT;
  _generation_batch_id TEXT;
  _aspect_ratio DECIMAL(10,4);
  _thumbnail_url TEXT;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Remove old history entries only
  DELETE FROM public.user_card_snapshots
  WHERE user_id = _user_id
    AND scope = 'history';

  FOR card_entry IN SELECT * FROM jsonb_array_elements(_payload) LOOP
    _card_type := card_entry->>'card_type';
    _generation_batch_id := card_entry->>'generation_batch_id';

    IF card_entry ? 'active' THEN
      -- Extract metadata
      _drag_x := COALESCE((card_entry->'metadata'->>'drag_offset_x')::INTEGER, 0);
      _drag_y := COALESCE((card_entry->'metadata'->>'drag_offset_y')::INTEGER, 0);
      _is_pinned := COALESCE((card_entry->'metadata'->>'is_pinned')::BOOLEAN, false);
      _display_order := COALESCE((card_entry->'metadata'->>'display_order')::INTEGER, 0);
      _generation_id := COALESCE(card_entry->'metadata'->>'generation_id', gen_random_uuid()::TEXT);
      _aspect_ratio := COALESCE((card_entry->'metadata'->>'aspect_ratio')::DECIMAL, 1.0);
      _thumbnail_url := card_entry->'metadata'->>'thumbnail_url';
      _position := COALESCE((card_entry->'metadata'->>'position')::INTEGER, 0);

      -- Insert or update - now allows multiple active cards
      INSERT INTO public.user_card_snapshots (
        user_id, card_type, scope, position, snapshot, 
        drag_offset_x, drag_offset_y, is_pinned, display_order,
        generation_id, generation_batch_id, aspect_ratio, thumbnail_url,
        created_at, updated_at
      )
      VALUES (
        _user_id, _card_type, 'active', _position, card_entry->'active',
        _drag_x, _drag_y, _is_pinned, _display_order,
        _generation_id, _generation_batch_id, _aspect_ratio, _thumbnail_url,
        now(), now()
      )
      ON CONFLICT (user_id, card_type, scope, position, generation_batch_id)
      DO UPDATE SET 
        snapshot = EXCLUDED.snapshot,
        drag_offset_x = EXCLUDED.drag_offset_x,
        drag_offset_y = EXCLUDED.drag_offset_y,
        is_pinned = EXCLUDED.is_pinned,
        display_order = EXCLUDED.display_order,
        aspect_ratio = EXCLUDED.aspect_ratio,
        thumbnail_url = EXCLUDED.thumbnail_url,
        updated_at = now();
    END IF;

    IF card_entry ? 'history' THEN
      _position := 0;
      FOR history_entry IN SELECT * FROM jsonb_array_elements(card_entry->'history') LOOP
        EXIT WHEN _position >= 10;
        INSERT INTO public.user_card_snapshots (
          user_id, card_type, scope, position, snapshot, 
          generation_batch_id, created_at, updated_at
        )
        VALUES (
          _user_id, _card_type, 'history', _position, history_entry,
          _generation_batch_id, now(), now()
        );
        _position := _position + 1;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- Function to soft delete a generation
CREATE OR REPLACE FUNCTION public.delete_card_generation(_generation_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.user_card_snapshots
  SET is_deleted = true, updated_at = now()
  WHERE user_id = _user_id 
    AND generation_id = _generation_id
    AND scope = 'active';
END;
$$;

-- Function to update card position (for drag-and-drop)
CREATE OR REPLACE FUNCTION public.update_card_position(
  _generation_id TEXT,
  _drag_x INTEGER,
  _drag_y INTEGER,
  _display_order INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.user_card_snapshots
  SET 
    drag_offset_x = _drag_x,
    drag_offset_y = _drag_y,
    display_order = _display_order,
    updated_at = now()
  WHERE user_id = _user_id 
    AND generation_id = _generation_id
    AND scope = 'active';
END;
$$;

-- Function to toggle pin state
CREATE OR REPLACE FUNCTION public.toggle_card_pin(_generation_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _new_state BOOLEAN;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.user_card_snapshots
  SET 
    is_pinned = NOT is_pinned,
    updated_at = now()
  WHERE user_id = _user_id 
    AND generation_id = _generation_id
    AND scope = 'active'
  RETURNING is_pinned INTO _new_state;

  RETURN _new_state;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.delete_card_generation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_card_position(TEXT, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_card_pin(TEXT) TO authenticated;

-- Add helpful view for active generations
CREATE OR REPLACE VIEW public.user_active_generations AS
SELECT 
  id,
  user_id,
  card_type,
  generation_id,
  generation_batch_id,
  snapshot,
  drag_offset_x,
  drag_offset_y,
  is_pinned,
  display_order,
  aspect_ratio,
  thumbnail_url,
  created_at,
  updated_at
FROM public.user_card_snapshots
WHERE scope = 'active' 
  AND is_deleted = false
ORDER BY is_pinned DESC, display_order ASC, created_at DESC;

-- Grant view access
GRANT SELECT ON public.user_active_generations TO authenticated;
