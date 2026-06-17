/* ============================================================
   Zone14 — World Cup data proxy (Vercel serverless function)
   Calls football-data.org server-side with a secret key, so the key
   never reaches the browser and CORS is handled. Returns matches
   (split into live / finished / all) + group standings in one shot.

   Setup: in Vercel → Project → Settings → Environment Variables, add
   FOOTBALL_DATA_KEY = <your free key from football-data.org>.
   Without the key this returns success:false and the site falls back
   to the free SportSRC feed automatically.
   ============================================================ */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Cache at Vercel's edge so we hit football-data.org at most ~once/30s
  // regardless of how many visitors are polling (respects their rate limit).
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  const key = process.env.FOOTBALL_DATA_KEY;
  const empty = { live: [], finished: [], all: [], standings: [] };
  if (!key) {
    res.status(200).json({ success: false, error: 'FOOTBALL_DATA_KEY not set', data: empty });
    return;
  }

  const headers = { 'X-Auth-Token': key };
  const BASE = 'https://api.football-data.org/v4/competitions/WC';
  try {
    const [mRes, sRes] = await Promise.all([
      fetch(`${BASE}/matches`,   { headers }),
      fetch(`${BASE}/standings`, { headers }),
    ]);
    const m = await mRes.json().catch(() => ({}));
    const s = await sRes.json().catch(() => ({}));

    const all = Array.isArray(m.matches) ? m.matches : [];
    const live     = all.filter(x => x.status === 'IN_PLAY' || x.status === 'PAUSED');
    const finished = all.filter(x => x.status === 'FINISHED');

    res.status(200).json({
      success: true,
      data: {
        live, finished, all,
        standings: Array.isArray(s.standings) ? s.standings : [],
        last_updated: new Date().toISOString(),
      },
    });
  } catch (e) {
    res.status(200).json({ success: false, error: String(e && e.message || e), data: empty });
  }
}
