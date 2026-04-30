-- Atomic increment helpers used by the resend-webhook edge function.

CREATE OR REPLACE FUNCTION public.marketing_sends_record_open(p_send_id uuid, p_at timestamptz)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.marketing_sends
  SET open_count = open_count + 1,
      last_opened_at = p_at,
      opened_at = COALESCE(opened_at, p_at)
  WHERE id = p_send_id;
$$;

CREATE OR REPLACE FUNCTION public.marketing_sends_record_click(p_send_id uuid, p_at timestamptz)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.marketing_sends
  SET click_count = click_count + 1,
      last_clicked_at = p_at,
      clicked_at = COALESCE(clicked_at, p_at)
  WHERE id = p_send_id;
$$;

REVOKE ALL ON FUNCTION public.marketing_sends_record_open(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.marketing_sends_record_click(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_sends_record_open(uuid, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.marketing_sends_record_click(uuid, timestamptz) TO service_role;

NOTIFY pgrst, 'reload schema';
