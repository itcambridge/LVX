-- Create polls table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  creator_id UUID REFERENCES public.users(id),
  featured BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll options table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll votes table if it doesn't exist
-- Note: If the votes table already exists with the right structure, you can skip this
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- Ensure one vote per user per poll
);

-- Add RLS policies
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Everyone can read polls and options
CREATE POLICY "Anyone can read polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Anyone can read poll options" ON public.poll_options FOR SELECT USING (true);

-- Only authenticated users can vote
CREATE POLICY "Authenticated users can vote" ON public.votes 
FOR INSERT TO authenticated USING (true);

-- Users can only see their own votes
CREATE POLICY "Users can see their own votes" ON public.votes 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Only authenticated users can create polls
CREATE POLICY "Authenticated users can create polls" ON public.polls 
FOR INSERT TO authenticated USING (auth.uid() = creator_id);

-- Only poll creators can create poll options
CREATE POLICY "Poll creators can create poll options" ON public.poll_options 
FOR INSERT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND p.creator_id = auth.uid()
  )
);

-- Create function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(poll_id UUID)
RETURNS TABLE (
  option_id UUID,
  option_text TEXT,
  votes BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_votes BIGINT;
BEGIN
  -- Get total votes for the poll
  SELECT COUNT(*) INTO total_votes FROM public.votes WHERE votes.poll_id = $1;
  
  -- Return results with percentages
  RETURN QUERY
  SELECT 
    po.id AS option_id,
    po.text AS option_text,
    COUNT(v.id) AS votes,
    CASE 
      WHEN total_votes = 0 THEN 0
      ELSE ROUND((COUNT(v.id)::NUMERIC / total_votes) * 100, 1)
    END AS percentage
  FROM public.poll_options po
  LEFT JOIN public.votes v ON po.id = v.option_id
  WHERE po.poll_id = $1
  GROUP BY po.id, po.text
  ORDER BY votes DESC;
END;
$$ LANGUAGE plpgsql;
