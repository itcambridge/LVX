-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  creator_id UUID REFERENCES users(id),
  featured BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- Ensure one vote per user per poll
);

-- Add RLS policies
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can read polls and options
CREATE POLICY "Anyone can read polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Anyone can read poll options" ON poll_options FOR SELECT USING (true);

-- Only authenticated users can vote
CREATE POLICY "Authenticated users can vote" ON poll_votes 
FOR INSERT TO authenticated USING (true);

-- Users can only see their own votes
CREATE POLICY "Users can see their own votes" ON poll_votes 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Only admins can create polls and options
CREATE POLICY "Only admins can create polls" ON polls 
FOR INSERT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND verified = true
  )
);

CREATE POLICY "Only admins can create poll options" ON poll_options 
FOR INSERT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM polls p
    JOIN users u ON p.creator_id = u.id
    WHERE p.id = poll_id AND u.verified = true
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
  SELECT COUNT(*) INTO total_votes FROM poll_votes WHERE poll_votes.poll_id = $1;
  
  -- Return results with percentages
  RETURN QUERY
  SELECT 
    po.id AS option_id,
    po.text AS option_text,
    COUNT(pv.id) AS votes,
    CASE 
      WHEN total_votes = 0 THEN 0
      ELSE ROUND((COUNT(pv.id)::NUMERIC / total_votes) * 100, 1)
    END AS percentage
  FROM poll_options po
  LEFT JOIN poll_votes pv ON po.id = pv.option_id
  WHERE po.poll_id = $1
  GROUP BY po.id, po.text
  ORDER BY votes DESC;
END;
$$ LANGUAGE plpgsql;
