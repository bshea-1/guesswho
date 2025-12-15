-- Create the games table if it doesn't exist
-- This schema supports all game types (Guess Who, Connect 4, Monopoly) because
-- the entire game state is stored in the 'state' JSONB column.

CREATE TABLE IF NOT EXISTS games (
    room_id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    visibility TEXT DEFAULT 'public',
    status TEXT DEFAULT 'lobby',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) is recommended for production
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public access (adjust as needed for your auth model)
-- For this app's current design (public shared rooms), we generally allow read/write via API
-- But if accessing directly from client (not via nextjs API routes), you need policies.
-- Since we use Supabase client in API routes (server-side), RLS policies don't block the Service/Admin role if you use the secret key.
-- IF you use the anon key in client, you need policies.
-- The current implementation uses 'src/lib/storage.ts' which imports 'supabase' from './supabase'.
-- If './supabase.ts' uses the ANON key, checks are subject to RLS.
-- If it uses SERVICE_ROLE key, RLS is bypassed.

-- Standard lenient public policy for game rooms:
CREATE POLICY "Allow public access to games" ON games
    FOR ALL
    USING (true)
    WITH CHECK (true);
