-- Create monthly_reports table
CREATE TABLE IF NOT EXISTS public.monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_month DATE NOT NULL, -- e.g., '2026-04-01'
    dashboard_data JSONB DEFAULT '{}'::jsonb,
    streams_data JSONB DEFAULT '{}'::jsonb,
    expenses_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, report_month)
);

-- Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own monthly reports"
    ON public.monthly_reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly reports"
    ON public.monthly_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly reports"
    ON public.monthly_reports FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Create an index for faster lookups by user and month
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_month ON public.monthly_reports(user_id, report_month);
