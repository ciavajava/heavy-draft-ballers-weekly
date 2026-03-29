interface Env {
  ROTO_KV: KVNamespace;
}

async function getValidToken(env: Env): Promise<string> {
  const expiry = await env.ROTO_KV.get("yahoo_token_expiry");
  const now = Date.now();

  if (expiry && parseInt(expiry) - now > 60000) {
    return (await env.ROTO_KV.get("yahoo_access_token")) ?? "";
  }

  // Token expired — refresh it
  const clientId = await env.ROTO_KV.get("yahoo_client_id");
  const clientSecret = await env.ROTO_KV.get("yahoo_client_secret");
  const refreshToken = await env.ROTO_KV.get("yahoo_refresh_token");

  if (!clientId || !clientSecret || !refreshToken) throw new Error("Missing credentials");

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) throw new Error("Token refresh failed: " + await res.text());

  const tokens = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  await env.ROTO_KV.put("yahoo_access_token", tokens.access_token);
  await env.ROTO_KV.put("yahoo_refresh_token", tokens.refresh_token);
  await env.ROTO_KV.put("yahoo_token_expiry", String(Date.now() + tokens.expires_in * 1000));

  return tokens.access_token;
}

async function yahooGet(url: string, token: string) {
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo API error ${res.status}: ${await res.text()}`);
  return res.json();
}

function parseStats(stats: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of stats) {
    map[s.stat.stat_id] = parseFloat(s.stat.value) || 0;
  }
  return map;
}

// Yahoo stat IDs for baseball
// 7=R, 12=HR, 13=RBI, 16=SB, 3=AVG, 55=OPS, 28=W, 42=K, 26=ERA, 27=WHIP, 48=QS, 32=SVH (SV+H)
const STAT_MAP: Record<string, string> = {
  "7": "r", "12": "hr", "13": "rbi", "16": "sb",
  "3": "avg", "55": "ops", "28": "w", "42": "k",
  "26": "era", "27": "whip", "48": "qs", "32": "svh",
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return runSync(env);
};

// Cron trigger entry point
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (_, env) => {
  await runSync(env);
};

async function runSync(env: Env) {
  try {
    const token = await getValidToken(env);
    const leagueId = await env.ROTO_KV.get("yahoo_league_id");
    if (!leagueId) throw new Error("Missing league ID");

    const data = await yahooGet(
      `https://fantasysports.yahooapis.com/fantasy/v2/league/mlb.l.${leagueId}/teams/stats;type=week;week=current`,
      token
    ) as any;

    const teamsRaw = data.fantasy_content?.league?.[1]?.teams;
    if (!teamsRaw) throw new Error("Unexpected Yahoo API response shape");

    const teams: any[] = [];
    const count = teamsRaw.count;

    for (let i = 0; i < count; i++) {
      const teamData = teamsRaw[i]?.team;
      if (!teamData) continue;

      const info = teamData[0];
      const nameObj = info.find((x: any) => x?.name);
      const name = nameObj?.name ?? `Team ${i + 1}`;

      const statsArr = teamData[1]?.team_stats?.stats ?? [];
      const raw = parseStats(statsArr);

      const team: Record<string, any> = { name };
      for (const [id, key] of Object.entries(STAT_MAP)) {
        team[key] = raw[id] ?? 0;
      }
      teams.push(team);
    }

    if (teams.length === 0) throw new Error("No teams parsed from Yahoo response");

    const ts = new Date().toISOString();
    await env.ROTO_KV.put("roto_live_teams", JSON.stringify(teams));
    await env.ROTO_KV.put("roto_last_updated", ts);

    return new Response(JSON.stringify({ ok: true, teams: teams.length, updatedAt: ts }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
