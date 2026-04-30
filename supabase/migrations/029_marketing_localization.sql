-- Phase 2/E: per-campaign EN+AR variants.
-- profiles.locale already exists (migration 025). marketing_subscribers.locale already exists.
-- This migration adds AR variant columns to marketing_campaigns and re-creates
-- marketing_schedule_campaign with the two new optional args.

ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS subject_ar text,
  ADD COLUMN IF NOT EXISTS html_ar text;

-- Drop the old signature first — CREATE OR REPLACE can't change parameter lists.
DROP FUNCTION IF EXISTS public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text);

CREATE OR REPLACE FUNCTION public.marketing_schedule_campaign(
  p_subject text,
  p_html text,
  p_audience text,
  p_scheduled_for timestamptz,
  p_segment_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_test_recipient text DEFAULT NULL,
  p_subject_ar text DEFAULT NULL,
  p_html_ar text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_id uuid;
  v_params jsonb;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_subject IS NULL OR p_html IS NULL OR p_audience IS NULL THEN
    RAISE EXCEPTION 'subject, html, audience are required';
  END IF;
  IF p_scheduled_for IS NULL OR p_scheduled_for <= now() THEN
    RAISE EXCEPTION 'scheduled_for must be in the future';
  END IF;
  IF p_audience NOT IN ('subscribers','opted_in_users','all_users','segment') THEN
    RAISE EXCEPTION 'invalid audience for scheduling: %', p_audience;
  END IF;
  IF p_audience = 'segment' AND p_segment_id IS NULL THEN
    RAISE EXCEPTION 'segment_id required when audience=segment';
  END IF;
  -- AR variant: both fields together or neither.
  IF (p_subject_ar IS NULL) <> (p_html_ar IS NULL) THEN
    RAISE EXCEPTION 'subject_ar and html_ar must both be set or both be null';
  END IF;

  v_params := jsonb_build_object(
    'subject', p_subject,
    'html', p_html,
    'audience', p_audience,
    'segmentId', p_segment_id,
    'category', p_category,
    'testRecipient', p_test_recipient,
    'subject_ar', p_subject_ar,
    'html_ar', p_html_ar
  );

  INSERT INTO public.marketing_campaigns (
    subject, html, subject_ar, html_ar, audience, category, test_recipient,
    sent_by, total_recipients, status, scheduled_for, scheduled_params
  ) VALUES (
    p_subject, p_html, p_subject_ar, p_html_ar, p_audience, p_category, p_test_recipient,
    auth.uid(), 0, 'scheduled', p_scheduled_for, v_params
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
