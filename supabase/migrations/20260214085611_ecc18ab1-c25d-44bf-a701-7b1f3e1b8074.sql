
-- Create survey responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loket TEXT NOT NULL,
  nama TEXT NOT NULL,
  no_mr TEXT NOT NULL,
  no_hp TEXT NOT NULL,
  informasi_keuangan TEXT NOT NULL,
  kecepatan_pelayanan TEXT NOT NULL,
  metode_pembayaran TEXT NOT NULL,
  keramahan_petugas TEXT NOT NULL,
  komunikasi_petugas TEXT NOT NULL,
  kritik_saran TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public survey)
CREATE POLICY "Anyone can submit survey"
ON public.survey_responses
FOR INSERT
WITH CHECK (true);

-- Only authenticated users (admin) can view
CREATE POLICY "Authenticated users can view surveys"
ON public.survey_responses
FOR SELECT
TO authenticated
USING (true);
