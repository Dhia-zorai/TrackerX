// Opt-out API route - handles player opt-out requests
import { getServiceSupabase } from '@/lib/supabase';

const rateLimitMap = new Map();

// Rate limiter: max 3 requests per IP per hour
function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const record = rateLimitMap.get(key);
  if (!record) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= 3) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
}

export async function POST(request) {
  const clientIp = getClientIp(request);
  
  if (!checkRateLimit(clientIp)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  try {
    const body = await request.json();
    const { puuid, riotId } = body;
    
    // Validate required fields
    if (!puuid || typeof puuid !== 'string' || puuid.trim() === '') {
      return Response.json({ error: 'puuid is required' }, { status: 400 });
    }
    if (!riotId || typeof riotId !== 'string' || riotId.trim() === '') {
      return Response.json({ error: 'riotId is required' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Check if already opted out
    const { data: existing } = await supabase
      .from('opt_outs')
      .select('puuid')
      .eq('puuid', puuid)
      .maybeSingle();
    
    if (existing) {
      return Response.json({ alreadyOptedOut: true });
    }
    
    // Insert into opt_outs
    const { error: insertError } = await supabase
      .from('opt_outs')
      .upsert({
        puuid: puuid.trim(),
        riot_id: riotId.trim().toLowerCase(),
        opted_out_at: new Date().toISOString()
      }, { onConflict: 'puuid' });
    
    if (insertError) {
      console.error('INSERT ERROR:', insertError);
      return Response.json({ error: insertError.message }, { status: 500 });
    }
    
    // Delete player_match_stats for this puuid
    await supabase
      .from('player_match_stats')
      .delete()
      .eq('puuid', puuid);
    
    // Delete player record
    await supabase
      .from('players')
      .delete()
      .eq('puuid', puuid);
    
    return Response.json({ success: true });
  } catch (err) {
    console.error('OPTOUT ERROR:', err.message, err.details, err.hint);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
