-- ==============================================================================
-- PantryPal AI – Database Migration: Automated Expiry Reminders & Duplicate Prevention
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Add notification_email column to notification_preferences if not already present
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS notification_email text;

COMMENT ON COLUMN public.notification_preferences.notification_email IS 'Dedicated email address for receiving automated expiry alerts without altering login email';

-- 2. Add last_reminder_sent_at column to pantry_items
ALTER TABLE public.pantry_items
ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamp with time zone;

COMMENT ON COLUMN public.pantry_items.last_reminder_sent_at IS 'Timestamp of the most recent email notification sent for this item';

-- 3. Create reminder_logs table for audit trail and strict duplicate prevention
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES public.pantry_items ON DELETE CASCADE NOT NULL,
  notification_email text NOT NULL,
  reminder_date date NOT NULL DEFAULT CURRENT_DATE,
  days_before_expiry integer NOT NULL,
  resend_message_id text,
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_item_reminder_date UNIQUE (item_id, reminder_date)
);

-- Performance indexes for reminder lookups
CREATE INDEX IF NOT EXISTS idx_reminder_logs_item_date ON public.reminder_logs(item_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user ON public.reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON public.reminder_logs(sent_at);

-- Row Level Security (RLS)
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminder logs" ON public.reminder_logs;
CREATE POLICY "Users can view own reminder logs"
  ON public.reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reminder logs" ON public.reminder_logs;
CREATE POLICY "Users can insert own reminder logs"
  ON public.reminder_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Helper Function: Get expiring items eligible for notification
-- Marked SECURITY DEFINER so background cron jobs can query across active users safely
CREATE OR REPLACE FUNCTION public.get_expiring_items_for_reminder_job()
RETURNS TABLE (
  user_id uuid,
  notification_email text,
  full_name text,
  expiry_reminder_days integer,
  item_id uuid,
  item_name text,
  item_quantity numeric,
  item_unit text,
  item_category item_category,
  item_storage_location storage_location,
  item_expiry_date date,
  days_until_expiry integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    COALESCE(
      NULLIF(TRIM(p.notification_email), ''),
      u.email
    ) AS notification_email,
    COALESCE(prof.full_name, split_part(u.email, '@', 1)) AS full_name,
    p.expiry_reminder_days,
    i.id AS item_id,
    i.name AS item_name,
    i.quantity AS item_quantity,
    i.unit AS item_unit,
    i.category AS item_category,
    i.storage_location AS item_storage_location,
    i.expiry_date AS item_expiry_date,
    (i.expiry_date - CURRENT_DATE)::integer AS days_until_expiry
  FROM public.pantry_items i
  JOIN public.notification_preferences p ON p.user_id = i.user_id
  JOIN auth.users u ON u.id = i.user_id
  LEFT JOIN public.profiles prof ON prof.id = i.user_id
  LEFT JOIN public.reminder_logs rl ON rl.item_id = i.id AND rl.reminder_date = CURRENT_DATE
  WHERE
    i.status = 'active'
    AND p.email_notifications_enabled = true
    AND (i.expiry_date - CURRENT_DATE) <= p.expiry_reminder_days
    AND (i.expiry_date - CURRENT_DATE) >= -1
    AND rl.id IS NULL
  ORDER BY p.user_id, i.expiry_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_expiring_items_for_reminder_job() TO anon, authenticated, service_role;

-- 5. Helper Function: Log sent reminder and update last_reminder_sent_at
CREATE OR REPLACE FUNCTION public.log_sent_reminder(
  p_user_id uuid,
  p_item_id uuid,
  p_notification_email text,
  p_days_before_expiry integer,
  p_resend_message_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.reminder_logs (
    user_id,
    item_id,
    notification_email,
    reminder_date,
    days_before_expiry,
    resend_message_id,
    sent_at
  )
  VALUES (
    p_user_id,
    p_item_id,
    p_notification_email,
    CURRENT_DATE,
    p_days_before_expiry,
    p_resend_message_id,
    NOW()
  )
  ON CONFLICT (item_id, reminder_date) DO NOTHING
  RETURNING id INTO v_id;

  UPDATE public.pantry_items
  SET last_reminder_sent_at = NOW()
  WHERE id = p_item_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sent_reminder(uuid, uuid, text, integer, text) TO anon, authenticated, service_role;
