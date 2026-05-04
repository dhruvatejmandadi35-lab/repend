
-- Ensure RLS is enabled on realtime.messages
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to receive only messages on whitelisted public topics
DROP POLICY IF EXISTS "Authenticated can read public realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated can read public realtime topics"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() IN (
    'community_posts',
    'post_comments',
    'post_likes',
    'challenges',
    'challenge_comments'
  )
);
