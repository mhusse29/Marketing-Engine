-- =====================================================
-- Add Drag Position and Pin State to Card Snapshots
-- =====================================================
-- This migration extends user_card_snapshots to support:
-- 1. Persistent drag positions (x, y offsets)
-- 2. Pin state for cross-device sync
-- 3. Display order for custom card arrangement

-- Add position and pin columns
ALTER TABLE public.user_card_snapshots
ADD COLUMN IF NOT EXISTS drag_offset_x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS drag_offset_y INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for pinned cards query
CREATE INDEX IF NOT EXISTS idx_user_card_snapshots_pinned
  ON public.user_card_snapshots (user_id, is_pinned, display_order)
  WHERE scope = 'active';

-- Add comment for documentation
COMMENT ON COLUMN public.user_card_snapshots.drag_offset_x IS 'Horizontal drag offset in pixels for free-form layout';
COMMENT ON COLUMN public.user_card_snapshots.drag_offset_y IS 'Vertical drag offset in pixels for free-form layout';
COMMENT ON COLUMN public.user_card_snapshots.is_pinned IS 'Whether card is pinned to top of layout';
COMMENT ON COLUMN public.user_card_snapshots.display_order IS 'Custom display order for card arrangement (0-2 for content/pictures/video)';

-- Update the persist_card_snapshots function to handle new fields
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
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Remove existing history entries; active snapshots will be upserted per card
  DELETE FROM public.user_card_snapshots
  WHERE user_id = _user_id
    AND scope = 'history';

  FOR card_entry IN SELECT * FROM jsonb_array_elements(_payload) LOOP
    _card_type := card_entry->>'card_type';

    IF card_entry ? 'active' THEN
      -- Extract position/pin metadata if present
      _drag_x := COALESCE((card_entry->'metadata'->>'drag_offset_x')::INTEGER, 0);
      _drag_y := COALESCE((card_entry->'metadata'->>'drag_offset_y')::INTEGER, 0);
      _is_pinned := COALESCE((card_entry->'metadata'->>'is_pinned')::BOOLEAN, false);
      _display_order := COALESCE((card_entry->'metadata'->>'display_order')::INTEGER, 0);

      INSERT INTO public.user_card_snapshots (
        user_id, card_type, scope, position, snapshot, 
        drag_offset_x, drag_offset_y, is_pinned, display_order,
        created_at, updated_at
      )
      VALUES (
        _user_id, _card_type, 'active', 0, card_entry->'active',
        _drag_x, _drag_y, _is_pinned, _display_order,
        now(), now()
      )
      ON CONFLICT (user_id, card_type, scope, position)
      DO UPDATE SET 
        snapshot = EXCLUDED.snapshot,
        drag_offset_x = EXCLUDED.drag_offset_x,
        drag_offset_y = EXCLUDED.drag_offset_y,
        is_pinned = EXCLUDED.is_pinned,
        display_order = EXCLUDED.display_order,
        updated_at = now();
    END IF;

    IF card_entry ? 'history' THEN
      _position := 0;
      FOR history_entry IN SELECT * FROM jsonb_array_elements(card_entry->'history') LOOP
        EXIT WHEN _position >= 10;
        INSERT INTO public.user_card_snapshots (
          user_id, card_type, scope, position, snapshot, created_at, updated_at
        )
        VALUES (_user_id, _card_type, 'history', _position, history_entry, now(), now());
        _position := _position + 1;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- Ensure grants are still in place
GRANT EXECUTE ON FUNCTION public.persist_card_snapshots(JSONB) TO authenticated;
