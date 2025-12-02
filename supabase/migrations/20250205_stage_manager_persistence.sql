-- =====================================================
-- Stage Manager Persistence & Generation Progress
-- =====================================================

-- Table storing active card snapshots and history entries
CREATE TABLE IF NOT EXISTS public.user_card_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('content', 'pictures', 'video')),
  scope TEXT NOT NULL CHECK (scope IN ('active', 'history')),
  position INTEGER NOT NULL DEFAULT 0,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_type, scope, position)
);

CREATE INDEX idx_user_card_snapshots_user_scope
  ON public.user_card_snapshots (user_id, card_type, scope, position);

ALTER TABLE public.user_card_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their card snapshots"
  ON public.user_card_snapshots
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Table storing latest generation progress per card
CREATE TABLE IF NOT EXISTS public.user_card_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('content', 'pictures', 'video')),
  run_id TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('idle', 'queued', 'thinking', 'rendering', 'ready', 'error')),
  message TEXT,
  meta JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, card_type)
);

ALTER TABLE public.user_card_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their card progress"
  ON public.user_card_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Stored procedure to persist active snapshots and history stacks atomically
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
      INSERT INTO public.user_card_snapshots (user_id, card_type, scope, position, snapshot, created_at, updated_at)
      VALUES (_user_id, _card_type, 'active', 0, card_entry->'active', now(), now())
      ON CONFLICT (user_id, card_type, scope, position)
      DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = now();
    END IF;

    IF card_entry ? 'history' THEN
      _position := 0;
      FOR history_entry IN SELECT * FROM jsonb_array_elements(card_entry->'history') LOOP
        EXIT WHEN _position >= 10;
        INSERT INTO public.user_card_snapshots (user_id, card_type, scope, position, snapshot, created_at, updated_at)
        VALUES (_user_id, _card_type, 'history', _position, history_entry, now(), now());
        _position := _position + 1;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.persist_card_snapshots(JSONB) TO authenticated;

