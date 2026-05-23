
-- Create admin_users table
CREATE TABLE public.admin_users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can see the admin_users table
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  )
$$;

CREATE POLICY "Admins can view admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Replace the overly permissive SELECT policy on survey_responses
DROP POLICY "Authenticated users can view surveys" ON public.survey_responses;

CREATE POLICY "Only admins can view surveys"
ON public.survey_responses FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
