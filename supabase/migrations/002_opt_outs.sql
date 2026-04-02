-- Creates opt_outs table for player data privacy
-- Run this in Supabase SQL editor after 001_initial_schema.sql

create table opt_outs (
  puuid text primary key,
  riot_id text not null,
  opted_out_at timestamptz default now()
);

alter table opt_outs enable row level security;

-- Anyone can read to check if a player is opted out
create policy "public read opt_outs" on opt_outs for select using (true);

-- Only service role can insert/update (handled server-side via API route)
create policy "service write opt_outs" on opt_outs for insert with check (false);
