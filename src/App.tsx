import { useState, useEffect, useRef } from "react";

const DEFAULT_DATA = [
  { name: "RL's Some Stars", r: 14, hr: 6, rbi: 20, sb: 3, avg: .248, ops: .708, w: 3, k: 36, era: 0.57, whip: 0.76, qs: 4, svh: 3 },
  { name: "Big League Chew-pacabras", r: 15, hr: 8, rbi: 18, sb: 2, avg: .302, ops: .978, w: 2, k: 22, era: 2.12, whip: 0.88, qs: 1, svh: 1 },
  { name: "Cleveland Streamers", r: 10, hr: 2, rbi: 12, sb: 2, avg: .280, ops: .743, w: 2, k: 30, era: 2.28, whip: 1.01, qs: 2, svh: 2 },
  { name: "Clever Name Here", r: 16, hr: 3, rbi: 9, sb: 1, avg: .289, ops: .924, w: 2, k: 17, era: 2.55, whip: 0.74, qs: 1, svh: 4 },
  { name: "Jim Leyland's Lungs", r: 12, hr: 1, rbi: 12, sb: 2, avg: .288, ops: .749, w: 0, k: 41, era: 5.60, whip: 1.68, qs: 0, svh: 2 },
  { name: "Albert's Pujol", r: 8, hr: 5, rbi: 15, sb: 1, avg: .279, ops: .836, w: 1, k: 42, era: 5.35, whip: 1.32, qs: 1, svh: 1 },
  { name: "Acuña Matata", r: 19, hr: 6, rbi: 14, sb: 3, avg: .301, ops: .962, w: 0, k: 28, era: 6.17, whip: 1.37, qs: 1, svh: 0 },
  { name: "Buudy Mac's Dry Run", r: 7, hr: 1, rbi: 4, sb: 2, avg: .212, ops: .574, w: 1, k: 40, era: 3.62, whip: 1.32, qs: 0, svh: 2 },
  { name: "Contreras to popular belief", r: 7, hr: 1, rbi: 6, sb: 2, avg: .180, ops: .495, w: 1, k: 26, era: 0.00, whip: 0.96, qs: 1, svh: 1 },
  { name: "Uptown Finest", r: 11, hr: 0, rbi: 3, sb: 2, avg: .141, ops: .386, w: 1, k: 19, era: 4.15, whip: 1.02, qs: 2, svh: 2 },
  { name: "Squeaky Green Beans", r: 13, hr: 5, rbi: 9, sb: 3, avg: .221, ops: .727, w: 1, k: 21, era: 2.81, whip: 1.36, qs: 2, svh: 0 },
  { name: "Maximum IL", r: 14, hr: 5, rbi: 7, sb: 2, avg: .209, ops: .831, w: 2, k: 32, era: 5.22, whip: 1.47, qs: 1, svh: 1 },
];

const CATS = [
  { key: "r",    label: "R",    dir: 1,  fmt: (v: number) => v },
  { key: "hr",   label: "HR",   dir: 1,  fmt: (v: number) => v },
  { key: "rbi",  label: "RBI",  dir: 1,  fmt: (v: number) => v },
  { key: "sb",   label: "SB",   dir: 1,  fmt: (v: number) => v },
  { key: "avg",  label: "AVG",  dir: 1,  fmt: (v: number) => v.toFixed(3).replace("0.", ".") },
  { key: "ops",  label: "OPS",  dir: 1,  fmt: (v: number) => v.toFixed(3).replace("0.", ".") },
  { key: "w",    label: "W",    dir: 1,  fmt: (v: number) => v },
  { key: "k",    label: "K",    dir: 1,  fmt: (v: number) => v },
  { key: "era",  label: "ERA",  dir: -1, fmt: (v: number) => v.toFixed(2) },
  { key: "whip", label: "WHIP", dir: -1, fmt: (v: number) => v.toFixed(2) },
  { key: "qs",   label: "QS",   dir: 1,  fmt: (v: number) => v },
  { key: "svh",  label: "SVH",  dir: 1,  fmt: (v: number) => v },
];

const TOTAL_WEEKS = 25;
const COMM_PASSWORD = "maxmuncy";

const WEEK_SCHEDULE = [
  { week: 1,  start: "Mar 25", end: "Mar 29" },
  { week: 2,  start: "Mar 30", end: "Apr 5" },
  { week: 3,  start: "Apr 6",  end: "Apr 12" },
  { week: 4,  start: "Apr 13", end: "Apr 19" },
  { week: 5,  start: "Apr 20", end: "Apr 26" },
  { week: 6,  start: "Apr 27", end: "May 3" },
  { week: 7,  start: "May 4",  end: "May 10" },
  { week: 8,  start: "May 11", end: "May 17" },
  { week: 9,  start: "May 18", end: "May 24" },
  { week: 10, start: "May 25", end: "May 31" },
  { week: 11, start: "Jun 1",  end: "Jun 7" },
  { week: 12, start: "Jun 8",  end: "Jun 14" },
  { week: 13, start: "Jun 15", end: "Jun 21" },
  { week: 14, start: "Jun 22", end: "Jun 28" },
  { week: 15, start: "Jun 29", end: "Jul 5" },
  { week: 16, start: "Jul 6",  end: "Jul 12" },
  { week: 17, start: "Jul 13", end: "Jul 26", note: "All-Star break" },
  { week: 18, start: "Jul 27", end: "Aug 2" },
  { week: 19, start: "Aug 3",  end: "Aug 9" },
  { week: 20, start: "Aug 10", end: "Aug 16" },
  { week: 21, start: "Aug 17", end: "Aug 23" },
  { week: 22, start: "Aug 24", end: "Aug 30" },
  { week: 23, start: "Aug 31", end: "Sep 6" },
  { week: 24, start: "Sep 7",  end: "Sep 13" },
  { week: 25, start: "Sep 14", end: "Sep 20" },
];

const WEEK_STARTS = [
  "2026-03-25","2026-03-30","2026-04-06","2026-04-13","2026-04-20",
  "2026-04-27","2026-05-04","2026-05-11","2026-05-18","2026-05-25",
  "2026-06-01","2026-06-08","2026-06-15","2026-06-22","2026-06-29",
  "2026-07-06","2026-07-13","2026-07-27","2026-08-03","2026-08-10",
  "2026-08-17","2026-08-24","2026-08-31","2026-09-07","2026-09-14",
];

function getCurrentWeek() {
  const now = new Date();
  const idx = WEEK_STARTS.reduce((acc, d, i) => new Date(d) <= now ? i : acc, 0);
  return WEEK_SCHEDULE[idx];
}

type Team = { name: string; r: number; hr: number; rbi: number; sb: number; avg: number; ops: number; w: number; k: number; era: number; whip: number; qs: number; svh: number };
type ScoredTeam = Team & { pts: Record<string, number>; total: number };
type WeekWinner = { week: number; teams: string[]; points: number };

const TEAMS_KEY = "roto_live_teams";
const TIMESTAMP_KEY = "roto_last_updated";
const WEEK_PREFIX = "roto_week_";

function scoreCategory(teams: Team[], cat: typeof CATS[0]) {
  const n = teams.length;
  const sorted = [...teams].sort((a, b) => cat.dir * ((b as any)[cat.key] - (a as any)[cat.key]));
  const scores: Record<string, number> = {};
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && (sorted[j] as any)[cat.key] === (sorted[i] as any)[cat.key]) j++;
    const ranks = Array.from({ length: j - i }, (_, k) => n - (i + k));
    const avg = ranks.reduce((s, r) => s + r, 0) / ranks.length;
    for (let k = i; k < j; k++) scores[sorted[k].name] = avg;
    i = j;
  }
  return scores;
}

function computeRoto(teams: Team[]): ScoredTeam[] {
  const catScores: Record<string, Record<string, number>> = {};
  CATS.forEach(cat => { catScores[cat.key] = scoreCategory(teams, cat); });
  return teams.map(t => {
    const pts: Record<string, number> = {};
    let total = 0;
    CATS.forEach(cat => { pts[cat.key] = catScores[cat.key][t.name]; total += pts[cat.key]; });
    return { ...t, pts, total };
  }).sort((a, b) => b.total - a.total);
}

function fmtPts(v: number) { return Number.isInteger(v) ? v : v.toFixed(1); }

function toEastern(iso: string) {
  return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) + " ET";
}

async function kvGet(key: string) {
  try {
    const r = await fetch("/api/storage?key=" + encodeURIComponent(key));
    if (!r.ok) return null;
    const d = await r.json();
    return d.value ?? null;
  } catch { return null; }
}

async function kvSet(key: string, value: string) {
  await fetch("/api/storage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
}

const C = {
  bg: "var(--bg, #ffffff)", bgAlt: "var(--bg-alt, #f9f9f9)",
  border: "var(--border, #e5e5e5)", borderLight: "var(--border-light, #f0f0f0)",
  text: "var(--text, #111111)", textMuted: "var(--text-muted, #666666)",
  textFaint: "var(--text-faint, #aaaaaa)", btnBg: "var(--btn-bg, #ffffff)",
  btnActive: "var(--btn-active, #f0f0f0)",
};

const globalStyle = `
  :root{--bg:#ffffff;--bg-alt:#f9f9f9;--border:#e5e5e5;--border-light:#f0f0f0;--text:#111111;--text-muted:#666666;--text-faint:#aaaaaa;--btn-bg:#ffffff;--btn-active:#f0f0f0;}
  @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--bg-alt:#242424;--border:#333333;--border-light:#2a2a2a;--text:#f0f0f0;--text-muted:#aaaaaa;--text-faint:#666666;--btn-bg:#2a2a2a;--btn-active:#333333;}}
  *{box-sizing:border-box;} body{background:var(--bg);color:var(--text);margin:0;}
  input,select,textarea{background:var(--btn-bg)!important;color:var(--text)!important;border-color:var(--border)!important;}
  input::placeholder,textarea::placeholder{color:var(--text-faint)!important;}
  @keyframes flashBgGreen{0%{background:#d4f7d4;}100%{background:transparent;}}
  @keyframes flashBgRed{0%{background:#fdd;}100%{background:transparent;}}
  @keyframes flashTxtGreen{0%{color:#1a7a1a;}100%{color:inherit;}}
  @keyframes flashTxtRed{0%{color:#c00;}100%{color:inherit;}}
  .flash-bg-up{animation:flashBgGreen 1.5s ease-out forwards;}
  .flash-bg-down{animation:flashBgRed 1.5s ease-out forwards;}
  .flash-txt-up{animation:flashTxtGreen 1.5s ease-out forwards;}
  .flash-txt-down{animation:flashTxtRed 1.5s ease-out forwards;}
`;

export default function App() {
  const [view, setView] = useState("standings");
  const [sortKey, setSortKey] = useState("total");
  const [sortAsc, setSortAsc] = useState(false);
  const [liveTeams, setLiveTeams] = useState<Team[]>(DEFAULT_DATA);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [weekWinners, setWeekWinners] = useState<Record<number, WeekWinner>>({});
  const [loading, setLoading] = useState(true);
  const [flashMap, setFlashMap] = useState<Record<string, string>>({});
  const prevScoredRef = useRef<ScoredTeam[]>([]);
  const prevTeamsRef = useRef<Record<string, Team>>({});

  const [commUnlocked, setCommUnlocked] = useState(false);
  const [commPassword, setCommPassword] = useState("");
  const [commError, setCommError] = useState(false);
  const [commSection, setCommSection] = useState<"history" | "sync" | "manual">("history");
  const [weekDrafts, setWeekDrafts] = useState<Record<number, { teams: string[]; points: string }>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [manualData, setManualData] = useState("");
  const [manualResult, setManualResult] = useState<string | null>(null);

  const triggerFlash = (newTeams: Team[]) => {
    const oldTeams = prevTeamsRef.current;
    const oldScored = prevScoredRef.current;
    if (!Object.keys(oldTeams).length) return;

    const newScored = computeRoto(newTeams);
    const flashes: Record<string, string> = {};

    newTeams.forEach(t => {
      const old = oldTeams[t.name];
      if (!old) return;
      CATS.forEach(c => {
        const newVal = (t as any)[c.key];
        const oldVal = (old as any)[c.key];
        if (newVal !== oldVal) {
          const improved = c.dir === 1 ? newVal > oldVal : newVal < oldVal;
          flashes[`${t.name}__stat__${c.key}`] = improved ? "flash-txt-up" : "flash-txt-down";
        }
      });
    });

    newScored.forEach(t => {
      const oldT = oldScored.find(o => o.name === t.name);
      if (!oldT) return;
      CATS.forEach(c => {
        if (t.pts[c.key] !== oldT.pts[c.key]) {
          flashes[`${t.name}__pts__${c.key}`] = t.pts[c.key] > oldT.pts[c.key] ? "flash-bg-up" : "flash-bg-down";
        }
      });
    });

    if (Object.keys(flashes).length > 0) {
      setFlashMap(flashes);
      setTimeout(() => setFlashMap({}), 1600);
    }
  };

  useEffect(() => {
    const load = async (initial = false) => {
      const [teamsVal, tsVal] = await Promise.all([kvGet(TEAMS_KEY), kvGet(TIMESTAMP_KEY)]);
      if (teamsVal) {
        const newTeams: Team[] = JSON.parse(teamsVal);
        if (!initial) triggerFlash(newTeams);
        const newMap: Record<string, Team> = {};
        newTeams.forEach(t => { newMap[t.name] = t; });
        prevTeamsRef.current = newMap;
        prevScoredRef.current = computeRoto(newTeams);
        setLiveTeams(newTeams);
      }
      if (tsVal) setLastUpdated(tsVal);
      if (initial) {
        const ww: Record<number, WeekWinner> = {};
        await Promise.all(Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(async w => {
          const val = await kvGet(WEEK_PREFIX + w);
          if (val) ww[w] = JSON.parse(val);
        }));
        setWeekWinners(ww);
        setLoading(false);
      }
    };
    load(true);
    const interval = setInterval(() => load(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const scored = computeRoto(liveTeams);
  const teamNames = scored.map(t => t.name);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const displayRows = [...scored].sort((a, b) => {
    const aVal = sortKey === "total" ? a.total : a.pts[sortKey];
    const bVal = sortKey === "total" ? b.total : b.pts[sortKey];
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const parseYahooPaste = (raw: string): Team[] => {
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const headerIdx = lines.findIndex(l => l.startsWith("BattingPitching") || l.match(/^GP\*/));
    const dataLines = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines;
    const teams: Team[] = [];
    let i = 0;
    while (i < dataLines.length) {
      if (/^\d+$/.test(dataLines[i])) i++;
      if (i >= dataLines.length) break;
      const name = dataLines[i++];
      const nums: number[] = [];
      while (nums.length < 14 && i < dataLines.length) {
        const val = dataLines[i].replace(",", ".");
        if (!isNaN(parseFloat(val)) || val.startsWith(".")) { nums.push(parseFloat(val)); i++; }
        else break;
      }
      if (nums.length === 14 && name && !/^\d+$/.test(name)) {
        teams.push({ name, r: nums[1], hr: nums[2], rbi: nums[3], sb: nums[4], avg: nums[5], ops: nums[6], w: nums[8], k: nums[9], era: nums[10], whip: nums[11], qs: nums[12], svh: nums[13] });
      }
    }
    return teams;
  };

  const handleManualSave = async () => {
    const parsed = parseYahooPaste(manualData);
    if (parsed.length > 0) {
      const ts = new Date().toISOString();
      setLiveTeams(parsed);
      setLastUpdated(ts);
      await kvSet(TEAMS_KEY, JSON.stringify(parsed));
      await kvSet(TIMESTAMP_KEY, ts);
      setManualData("");
      setManualResult(`✓ Updated with ${parsed.length} teams at ${toEastern(ts)}`);
    } else {
      setManualResult("✗ Couldn't parse — paste from Yahoo > Stat Tracker > League Stats > Week Totals.");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("https://roto-sync-worker.eciavardini.workers.dev");
      const data = await res.json() as any;
      if (data.ok) {
        const [teamsVal, tsVal] = await Promise.all([kvGet(TEAMS_KEY), kvGet(TIMESTAMP_KEY)]);
        if (teamsVal) setLiveTeams(JSON.parse(teamsVal));
        if (tsVal) setLastUpdated(tsVal);
        setSyncResult(`✓ Synced ${data.teams} teams at ${toEastern(data.updatedAt)}`);
      } else {
        setSyncResult(`✗ Sync failed: ${data.error}`);
      }
    } catch (e: any) {
      setSyncResult(`✗ Error: ${e.message}`);
    }
    setSyncing(false);
  };

  const handleCommUnlock = () => {
    if (commPassword === COMM_PASSWORD) { setCommUnlocked(true); setCommError(false); }
    else setCommError(true);
  };

  const initWeekDraft = (w: number) => {
    if (weekDrafts[w]) return;
    const existing = weekWinners[w];
    setWeekDrafts(d => ({ ...d, [w]: existing ? { teams: [...existing.teams], points: String(existing.points) } : { teams: [""], points: "" } }));
  };

  const updateDraftTeam = (w: number, idx: number, val: string) =>
    setWeekDrafts(d => { const t = [...d[w].teams]; t[idx] = val; return { ...d, [w]: { ...d[w], teams: t } }; });

  const addDraftTeam = (w: number) =>
    setWeekDrafts(d => ({ ...d, [w]: { ...d[w], teams: [...d[w].teams, ""] } }));

  const removeDraftTeam = (w: number, idx: number) =>
    setWeekDrafts(d => { const t = d[w].teams.filter((_, i) => i !== idx); return { ...d, [w]: { ...d[w], teams: t.length ? t : [""] } }; });

  const saveWeek = async (w: number) => {
    const draft = weekDrafts[w];
    const teams = draft.teams.filter(t => t.trim());
    const points = parseFloat(draft.points);
    if (!teams.length || isNaN(points)) { alert("Fill in at least one team and a points total."); return; }
    const entry: WeekWinner = { week: w, teams, points };
    setWeekWinners(ww => ({ ...ww, [w]: entry }));
    await kvSet(WEEK_PREFIX + w, JSON.stringify(entry));
    setWeekDrafts(d => { const nd = { ...d }; delete nd[w]; return nd; });
  };

  const btn = (active = false, danger = false): React.CSSProperties => ({
    fontSize: 12, padding: "5px 12px", borderRadius: 6,
    border: `1px solid ${danger ? "#c00" : C.border}`,
    background: active ? C.btnActive : C.btnBg,
    color: danger ? "#c00" : C.text,
    cursor: "pointer", fontWeight: active ? 600 : 400,
  });

  const SortTh = ({ k, label, style = {} }: { k: string; label: string; style?: React.CSSProperties }) => {
    const active = sortKey === k;
    return (
      <th onClick={() => handleSort(k)} style={{ textAlign: "right", padding: "6px 4px", fontWeight: active ? 600 : 400, minWidth: 34, fontSize: 11, color: active ? C.text : C.textMuted, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style }}>
        {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
      </th>
    );
  };

  const cw = getCurrentWeek();

  if (loading) {
    return (
      <>
        <style>{globalStyle}</style>
        <div style={{ padding: 32, fontFamily: "system-ui,sans-serif", color: C.textMuted }}>Loading...</div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui,sans-serif", color: C.text, background: C.bg, minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>Heavy Draft Ballers Weekly Prize Tracker</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              {lastUpdated ? `Last updated ${toEastern(lastUpdated)}` : "No data loaded yet"}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Week {cw.week} · {cw.start} – {cw.end}{cw.note ? ` (${cw.note})` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["standings", "breakdown", "history"].map(v => (
              <button key={v} onClick={() => setView(v)} style={btn(view === v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Standings */}
        {view === "standings" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: "left", padding: "6px 6px", fontWeight: 600, width: 24, color: C.text }}>#</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, minWidth: 160, color: C.text }}>Team</th>
                  {CATS.map(c => <SortTh key={c.key} k={c.key} label={c.label} />)}
                  <SortTh k="total" label="Total" style={{ minWidth: 46, padding: "6px 8px" }} />
                </tr>
              </thead>
              <tbody>
                {displayRows.map((t, i) => (
                  <tr key={t.name} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgAlt)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "8px 6px", color: C.textFaint }}>{i + 1}</td>
                    <td style={{ padding: "8px 8px", whiteSpace: "nowrap", color: C.text }}>{t.name}</td>
                    {CATS.map(c => (
                      <td key={c.key} style={{ padding: "8px 4px", textAlign: "right", fontWeight: sortKey === c.key ? 600 : 400, color: C.text }}>
                        {fmtPts(t.pts[c.key])}
                      </td>
                    ))}
                    <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 600, color: C.text }}>{fmtPts(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Breakdown */}
        {view === "breakdown" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: "left", padding: "6px 6px", fontWeight: 600, width: 24, color: C.text }}>#</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, minWidth: 160, color: C.text }}>Team</th>
                  {CATS.map(c => <SortTh key={c.key} k={c.key} label={c.label} style={{ minWidth: 52 }} />)}
                  <SortTh k="total" label="Total" style={{ minWidth: 52, padding: "6px 8px" }} />
                </tr>
              </thead>
              <tbody>
                {displayRows.map((t, i) => (
                  <tr key={t.name} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgAlt)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "10px 6px", fontSize: 12, color: C.textFaint, verticalAlign: "middle" }}>{i + 1}</td>
                    <td style={{ padding: "10px 8px", fontSize: 13, whiteSpace: "nowrap", verticalAlign: "middle", color: C.text }}>{t.name}</td>
                    {CATS.map(c => (
                      <td key={c.key} style={{ padding: "10px 4px", textAlign: "right", verticalAlign: "middle" }}>
                        <span className={flashMap[`${t.name}__stat__${c.key}`] || ""} style={{ display: "block", fontSize: 13, fontWeight: "bold", color: C.text }}>
                          {c.fmt(t[c.key as keyof Team] as number)}
                        </span>
                        <span className={flashMap[`${t.name}__pts__${c.key}`] || ""} style={{ display: "block", fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                          {fmtPts(t.pts[c.key])} pts
                        </span>
                      </td>
                    ))}
                    <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, verticalAlign: "middle", color: C.text }}>{fmtPts(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* History */}
        {view === "history" && (
          <div>
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).some(w => weekWinners[w]) ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ textAlign: "left", padding: "8px 8px", fontWeight: 600, width: 80, color: C.text }}>Week</th>
                    <th style={{ textAlign: "left", padding: "8px 8px", fontWeight: 600, color: C.text }}>Winner</th>
                    <th style={{ textAlign: "right", padding: "8px 8px", fontWeight: 600, width: 100, color: C.text }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => {
                    const entry = weekWinners[w];
                    if (!entry) return null;
                    return (
                      <tr key={w} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.bgAlt)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 8px", color: C.textMuted, fontWeight: 500 }}>Week {w}</td>
                        <td style={{ padding: "10px 8px", fontWeight: 500, color: C.text }}>{entry.teams.join(" & ")}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: C.text }}>{fmtPts(entry.points)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 13, color: C.textMuted, padding: "24px 0", textAlign: "center" }}>No weekly winners locked in yet.</div>
            )}
          </div>
        )}

        {/* Commissioner Panel */}
        <div style={{ marginTop: 64, borderTop: `1px solid ${C.borderLight}`, paddingTop: 24 }}>
          <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Commissioner</div>

          {!commUnlocked ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="password" placeholder="Password" value={commPassword}
                onChange={e => setCommPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCommUnlock(); }}
                style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: `1px solid ${commError ? "#c00" : C.border}`, width: 160 }} />
              <button onClick={handleCommUnlock} style={btn()}>Unlock</button>
              {commError && <span style={{ fontSize: 11, color: "#c00" }}>Incorrect password</span>}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {(["history", "sync", "manual"] as const).map(s => (
                  <button key={s} onClick={() => setCommSection(s)} style={btn(commSection === s)}>
                    {s === "history" ? "Weekly History" : s === "sync" ? "Sync Now" : "Manual Override"}
                  </button>
                ))}
                <button onClick={() => { setCommUnlocked(false); setCommPassword(""); }}
                  style={{ ...btn(), marginLeft: "auto", color: C.textFaint, fontSize: 11 }}>
                  Lock
                </button>
              </div>

              {commSection === "history" && (
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Set weekly winners. Use "+ Team" for ties. All weeks are editable.</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, width: 80, color: C.text }}>Week</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: C.text }}>Winner(s)</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, width: 110, color: C.text }}>Points</th>
                        <th style={{ width: 90 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => {
                        const locked = weekWinners[w];
                        const draft = weekDrafts[w];
                        const isEditing = !!draft;
                        return (
                          <tr key={w} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                            <td style={{ padding: "10px 8px", color: C.textMuted, fontWeight: 500 }}>Week {w}</td>
                            <td style={{ padding: "10px 8px" }}>
                              {isEditing ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  {draft.teams.map((t, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                      <select value={t} onChange={e => updateDraftTeam(w, idx, e.target.value)}
                                        style={{ fontSize: 12, padding: "4px 6px", borderRadius: 4, border: `1px solid ${C.border}`, flex: 1 }}>
                                        <option value="">— Select team —</option>
                                        {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                                      </select>
                                      {draft.teams.length > 1 && (
                                        <button onClick={() => removeDraftTeam(w, idx)} style={{ ...btn(false, true), padding: "3px 6px" }}>✕</button>
                                      )}
                                    </div>
                                  ))}
                                  <button onClick={() => addDraftTeam(w)}
                                    style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.border}`, cursor: "pointer", background: C.btnBg, color: C.textMuted, alignSelf: "flex-start", marginTop: 2 }}>
                                    + Team
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: locked ? C.text : C.textFaint }}>{locked ? locked.teams.join(" & ") : "—"}</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              {isEditing ? (
                                <input type="number" value={draft.points} onChange={e => setWeekDrafts(d => ({ ...d, [w]: { ...d[w], points: e.target.value } }))}
                                  placeholder="pts" style={{ fontSize: 12, padding: "4px 6px", borderRadius: 4, border: `1px solid ${C.border}`, width: 80 }} />
                              ) : (
                                <span style={{ color: locked ? C.text : C.textFaint }}>{locked ? fmtPts(locked.points) : "—"}</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "right" }}>
                              {isEditing ? (
                                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                                  <button onClick={() => saveWeek(w)}
                                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, border: "none", cursor: "pointer", background: "#111", color: "#fff", fontWeight: 500 }}>Save</button>
                                  <button onClick={() => setWeekDrafts(d => { const nd = { ...d }; delete nd[w]; return nd; })}
                                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border}`, cursor: "pointer", background: C.btnBg, color: C.text }}>✕</button>
                                </div>
                              ) : (
                                <button onClick={() => initWeekDraft(w)} style={{ ...btn(), fontSize: 11, padding: "4px 10px" }}>
                                  {locked ? "Edit" : "Set"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {commSection === "sync" && (
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>Manual Yahoo sync</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
                    The app auto-syncs from Yahoo every 5 minutes. Use this to force an immediate update.
                  </div>
                  <button onClick={handleSync} disabled={syncing}
                    style={{ fontSize: 13, padding: "8px 20px", borderRadius: 6, border: "none", cursor: syncing ? "not-allowed" : "pointer", background: "#111", color: "#fff", fontWeight: 500, opacity: syncing ? 0.6 : 1 }}>
                    {syncing ? "Syncing..." : "Sync now"}
                  </button>
                  {syncResult && (
                    <div style={{ marginTop: 12, fontSize: 12, color: syncResult.startsWith("✓") ? "green" : "#c00" }}>{syncResult}</div>
                  )}
                </div>
              )}

              {commSection === "manual" && (
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>Manual data override</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
                    The app auto-syncs from Yahoo every 5 minutes and locks each week automatically on Monday at 2:45am ET. Use this only as a fallback if the auto-sync is unavailable.
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                    To get the data: Yahoo Fantasy → Stat Tracker → League Stats → set to <strong>Week Totals</strong> → select all → copy → paste below.
                  </div>
                  <textarea value={manualData} onChange={e => setManualData(e.target.value)} placeholder="Paste Yahoo table here..."
                    style={{ width: "100%", height: 180, fontSize: 11, fontFamily: "monospace", borderRadius: 6, border: `1px solid ${C.border}`, padding: 10, resize: "vertical", background: C.btnBg, color: C.text }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={handleManualSave}
                      style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: "#111", color: "#fff", fontWeight: 500 }}>
                      Save & recalculate
                    </button>
                    <button onClick={() => { setManualData(""); setManualResult(null); }} style={btn()}>Clear</button>
                  </div>
                  {manualResult && (
                    <div style={{ marginTop: 10, fontSize: 12, color: manualResult.startsWith("✓") ? "green" : "#c00" }}>{manualResult}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
