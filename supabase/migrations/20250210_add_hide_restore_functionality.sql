-- =====================================================
-- Add Hide/Restore Functionality for Cards
-- =====================================================
-- This migration adds the ability to hide cards from the main screen
-- while keeping them in generation history for restoration.

-- Add is_hidden field to track hidden cards (different from deleted)
ALTER TABLE public.user_card_snapshots
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add index for filtering hidden cards
CREATE INDEX IF NOT EXISTS idx_user_cards_active_visible
  ON public.user_card_snapshots (user_id, card_type, created_at DESC)
  WHERE scope = 'active' AND is_deleted = false AND is_hidden = false;

-- Add comment
COMMENT ON COLUMN public.user_card_snapshots.is_hidden IS 'Hidden from main screen but accessible in history';

-- Function to hide a card (keeps in history, removes from main screen)
CREATE OR REPLACE FUNCTION public.hide_card_generation(_generation_id TEXT)
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
  SET is_hidden = true, updated_at = now()
  WHERE user_id = _user_id 
    AND generation_id = _generation_id
    AND scope = 'active'
    AND is_deleted = false;
END;
$$;

-- Function to restore a hidden card (show on main screen again)
CREATE OR REPLACE FUNCTION public.restore_card_generation(_generation_id TEXT)
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
  SET is_hidden = false, updated_at = now()
  WHERE user_id = _user_id 
    AND generation_id = _generation_id
    AND scope = 'active'
    AND is_deleted = false;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.hide_card_generation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_card_generation(TEXT) TO authenticated;

-- Update the view to only show visible cards (not hidden, not deleted)
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
  is_hidden,
  display_order,
  aspect_ratio,
  thumbnail_url,
  created_at,
  updated_at
FROM public.user_card_snapshots
WHERE scope = 'active' 
  AND is_deleted = false
  AND is_hidden = false
ORDER BY is_pinned DESC, display_order ASC, created_at DESC;

-- Create view for ALL generations (including hidden, for history panel)
CREATE OR REPLACE VIEW public.user_all_generations AS
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
  is_hidden,
  is_deleted,
  display_order,
  aspect_ratio,
  thumbnail_url,
  created_at,
  updated_at
FROM public.user_card_snapshots
WHERE scope = 'active' 
  AND is_deleted = false
ORDER BY is_pinned DESC, created_at DESC;

-- Grant view access
GRANT SELECT ON public.user_all_generations TO authenticated;
