/* ============================================================
   Zone14 — World Cup data proxy (Vercel serverless function)
   Source: API-Football (api-football.com / api-sports.io). Called server-side
   with a secret key so the key never reaches the browser and CORS is handled.
   We transform API-Football's shape into the football-data.org shape the front
   end already speaks ({live, finished, all, standings}), so NOTHING on the
   client changes — `all` now carries the FULL real schedule (every group +
   knockouts, future dates included), which is what fixes "future matches don't
   show / don't update".

   SETUP (one-time, Sir):
     1. Grab a free key from https://dashboard.api-football.com  (free = 100
        requests/day; our 30s edge cache keeps us far under that).
     2. Vercel → Project → Settings → Environment Variables (Production):
          APIFOOTBALL_KEY = <your key>
        Optional overrides (defaults are correct for WC 2026):
          APIFOOTBALL_LEAGUE = 1      (1 = FIFA World Cup)
          APIFOOTBALL_SEASON = 2026
          APIFOOTBALL_HOST   = v3.football.api-sports.io   (use the RapidAPI
                               host instead if your key is a RapidAPI key)
     3. Redeploy.
   Without the key (or on any error) this returns success:false and the site
   falls back to the free SportSRC feed automatically — so it never breaks.
   ============================================================ */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Edge-cache so we hit API-Football at most ~once/30s no matter how many
  // visitors poll — keeps us inside the free 100 req/day budget.
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  const key = process.env.APIFOOTBALL_KEY;
  const empty = { live: [], finished: [], all: [], standings: [] };
  if (!key) {
    res.status(200).json({ success: false, error: 'APIFOOTBALL_KEY not set', data: empty });
    return;
  }

  const host   = process.env.APIFOOTBALL_HOST   || 'v3.football.api-sports.io';
  const league = process.env.APIFOOTBALL_LEAGUE || '1';     // 1 = FIFA World Cup
  const season = process.env.APIFOOTBALL_SEASON || '2026';
  // Direct api-sports key uses x-apisports-key; a RapidAPI key uses x-rapidapi-*.
  const headers = host.includes('rapidapi')
    ? { 'x-rapidapi-key': key, 'x-rapidapi-host': host }
    : { 'x-apisports-key': key };
  const BASE = `https://${host}/`;

  // API-Football gives no 3-letter codes; supply them for the teams we care
  // about so our-team standings highlighting + dedup stay rock-solid. Everyone
  // else falls back to name-matching on the client (which already handles it).
  const TLA = {
    Brazil: 'BRA', Morocco: 'MAR', Scotland: 'SCO', Haiti: 'HAI',
    Spain: 'ESP', 'Cape Verde': 'CPV', 'Saudi Arabia': 'KSA', Uruguay: 'URU',
    France: 'FRA', Senegal: 'SEN', Iraq: 'IRQ', Norway: 'NOR',
    Argentina: 'ARG', Austria: 'AUT', Jordan: 'JOR', Algeria: 'ALG',
  };
  const tlaOf = n => TLA[n] || undefined;

  // API-Football status short codes → football-data.org status the client reads
  const statusMap = (s) => {
    if (['1H', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(s)) return 'IN_PLAY';
    if (s === 'HT' || s === 'SUSP') return 'PAUSED';
    if (['FT', 'AET', 'PEN'].includes(s)) return 'FINISHED';
    return 'TIMED';   // NS, TBD, PST, CANC, ...
  };

  try {
    const q = `league=${league}&season=${season}`;
    const [fRes, sRes] = await Promise.all([
      fetch(`${BASE}fixtures?${q}`,  { headers }),
      fetch(`${BASE}standings?${q}`, { headers }),
    ]);
    const fJson = await fRes.json().catch(() => ({}));
    const sJson = await sRes.json().catch(() => ({}));

    // ---- Standings: response[0].league.standings = [ [rows]/group, ... ] ----
    const rawGroups = (((sJson.response || [])[0] || {}).league || {}).standings || [];
    const teamGroup = {};   // teamId -> "Group C"
    const standings = rawGroups.map(rows => {
      const groupName = (rows[0] && rows[0].group) || '';
      return {
        group: groupName,
        table: rows.map(r => {
          teamGroup[r.team.id] = groupName;
          const g = r.all || {};
          const goals = g.goals || {};
          return {
            team: { name: r.team.name, tla: tlaOf(r.team.name), crest: r.team.logo },
            playedGames: g.played || 0, won: g.win || 0, draw: g.draw || 0, lost: g.lose || 0,
            points: r.points || 0,
            goalsFor: goals.for || 0, goalsAgainst: goals.against || 0,
            goalDifference: r.goalsDiff || 0,
          };
        }),
      };
    });

    // ---- Fixtures → football-data match shape (skip TBD knockout placeholders) ----
    const all = (fJson.response || [])
      .filter(fx => fx && fx.teams && fx.teams.home && fx.teams.away &&
                    fx.teams.home.name && fx.teams.away.name)
      .map(fx => {
        const goals = fx.goals || {};
        return {
          utcDate: fx.fixture.date,
          status: statusMap(fx.fixture.status && fx.fixture.status.short),
          group: teamGroup[fx.teams.home.id] || teamGroup[fx.teams.away.id] || '',
          homeTeam: { name: fx.teams.home.name, tla: tlaOf(fx.teams.home.name), crest: fx.teams.home.logo },
          awayTeam: { name: fx.teams.away.name, tla: tlaOf(fx.teams.away.name), crest: fx.teams.away.logo },
          score: { fullTime: { home: goals.home, away: goals.away } },
        };
      });

    const live     = all.filter(x => x.status === 'IN_PLAY' || x.status === 'PAUSED');
    const finished = all.filter(x => x.status === 'FINISHED');

    if (!all.length && !standings.length) {
      // Key valid but no data (wrong league/season, or plan doesn't cover WC) —
      // signal failure so the client falls back to SportSRC instead of blanking.
      res.status(200).json({
        success: false,
        error: 'API-Football returned no WC data (check league/season/plan)',
        data: empty,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { live, finished, all, standings, last_updated: new Date().toISOString() },
    });
  } catch (e) {
    res.status(200).json({ success: false, error: String(e && e.message || e), data: empty });
  }
}
