-- supabase/migrations/001_initial_schema.sql

CREATE TABLE players (
    puuid uuid PRIMARY KEY,
    riot_id text NOT NULL,
    region text,
    account_level integer,
    card_id text,
    last_fetched_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE matches (
    match_id uuid PRIMARY KEY,
    map text,
    mode text,
    started_at timestamptz,
    season_id text,
    raw_json jsonb,
    fetched_at timestamptz DEFAULT now()
);

CREATE TABLE player_match_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    puuid uuid REFERENCES players(puuid) ON DELETE CASCADE,
    match_id uuid REFERENCES matches(match_id) ON DELETE CASCADE,
    agent text,
    result text,
    kills integer,
    deaths integer,
    assists integer,
    acs integer,
    kd numeric(5, 2),
    hs_pct numeric(5, 2),
    score integer,
    rr_change integer,
    rounds_played integer,
    side_attack_rounds integer,
    side_defense_rounds integer,
    side_attack_wins integer,
    side_defense_wins integer,
    kast_pct numeric(5, 2),
    first_bloods integer,
    first_deaths integer,
    damage_total integer,
    damage_per_round numeric(6, 2),
    match_date timestamptz,
    UNIQUE(puuid, match_id)
);

CREATE TABLE mmr_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    puuid uuid REFERENCES players(puuid) ON DELETE CASCADE,
    tier integer,
    tier_name text,
    ranking_in_tier integer,
    peak_tier integer,
    peak_tier_name text,
    snapshotted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE mmr_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public Read Access Players" ON players FOR SELECT USING (true);
CREATE POLICY "Public Read Access Matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public Read Access Player Stats" ON player_match_stats FOR SELECT USING (true);
CREATE POLICY "Public Read Access MMR Snapshots" ON mmr_snapshots FOR SELECT USING (true);

-- Service role full access policies are implicitly allowed because Service Role bypasses RLS.
