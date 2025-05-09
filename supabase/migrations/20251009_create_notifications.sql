
-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')),
  related_to UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add RPC function to get users (for admin panel)
CREATE OR REPLACE FUNCTION public.get_users()
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can get auth.users data which is normally restricted
  RETURN QUERY SELECT au.id, au.email FROM auth.users au;
END;
$$;

-- Set up realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
