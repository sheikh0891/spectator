-- Auto-broadcast notifications on event changes (results, status, schedule)
CREATE OR REPLACE FUNCTION public.notify_event_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body text;
  v_urgent boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'live' THEN
        v_title := '🔴 EN DIRECT : ' || NEW.teams;
        v_body := NEW.sport || ' — ' || NEW.venue || ' commence maintenant.';
        v_urgent := true;
      ELSIF NEW.status = 'finished' THEN
        v_title := '🏁 Résultat final : ' || NEW.teams;
        v_body := COALESCE('Score : ' || NEW.score, 'Match terminé.');
      END IF;
    -- Score change while live
    ELSIF NEW.score IS DISTINCT FROM OLD.score AND NEW.status = 'live' THEN
      v_title := '⚽ Mise à jour : ' || NEW.teams;
      v_body := 'Nouveau score : ' || COALESCE(NEW.score, '–');
      v_urgent := true;
    -- Schedule change (last-minute)
    ELSIF NEW.starts_at IS DISTINCT FROM OLD.starts_at THEN
      v_title := '⏰ Changement d''horaire : ' || NEW.teams;
      v_body := 'Nouvel horaire : ' || to_char(NEW.starts_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI') || ' UTC';
      v_urgent := true;
    -- Venue change
    ELSIF NEW.venue IS DISTINCT FROM OLD.venue THEN
      v_title := '📍 Changement de lieu : ' || NEW.teams;
      v_body := 'Nouveau lieu : ' || NEW.venue;
      v_urgent := true;
    END IF;
  END IF;

  IF v_title IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, urgent)
    SELECT id, v_title, v_body, v_urgent FROM public.profiles;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_event_change ON public.events;
CREATE TRIGGER trg_notify_event_change
AFTER UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_event_change();