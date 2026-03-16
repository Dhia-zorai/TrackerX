export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  
  // ONLY for debugging - shows env var status
  const debug = {
    node_env: process.env.NODE_ENV,
    riot_key_set: !!process.env.RIOT_API_KEY,
    riot_key_length: process.env.RIOT_API_KEY?.length || 0,
    riot_key_preview: process.env.RIOT_API_KEY ? process.env.RIOT_API_KEY.substring(0, 10) + "..." : "NOT SET",
    henrik_key_set: !!process.env.HENRIK_API_KEY,
    henrik_key_length: process.env.HENRIK_API_KEY?.length || 0,
    henrik_key_preview: process.env.HENRIK_API_KEY ? process.env.HENRIK_API_KEY.substring(0, 10) + "..." : "NOT SET",
    timestamp: new Date().toISOString(),
  };
  
  return res.status(200).json(debug);
}
