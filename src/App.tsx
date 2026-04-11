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
const WORKER_URL = "https://roto-sync-worker.eciavardini.workers.dev";

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

const SEEDED_SNAPSHOTS_BY_RANK: Record<number, { pts: number }[]> = {
  1: [
    { pts: 109.5 }, { pts: 106.5 }, { pts: 102.5 }, { pts: 84 }, { pts: 82.5 },
    { pts: 77.5 }, { pts: 71.5 }, { pts: 65 }, { pts: 64 }, { pts: 58 },
    { pts: 57.5 }, { pts: 57.5 },
  ],
  2: [
    { pts: 120 }, { pts: 100.5 }, { pts: 92 }, { pts: 85 }, { pts: 79.5 },
    { pts: 77.5 }, { pts: 72 }, { pts: 71 }, { pts: 65 }, { pts: 61.5 },
    { pts: 57.5 }, { pts: 54.5 },
  ],
};

const SEEDED_SNAPSHOT_NAMES: Record<number, string[]> = {
  1: [
    "RL's Some Stars", "Big League Chew-pacabras", "Clever Name Here",
    "Squeaky Green Beans", "Acuña Matata", "Cleveland Streamers",
    "Albert's Pujol", "Buudy Mac's Dry Run", "Uptown Finest",
    "Maximum IL", "Contreras to popular belief", "Jim Leyland's Lungs",
  ],
  2: [
    "Squeaky Green Beans", "Clever Name Here", "Contreras to popular belief",
    "RL's Some Stars", "Maximum IL", "Jim Leyland's Lungs",
    "Uptown Finest", "Albert's Pujol", "Buudy Mac's Dry Run",
    "Acuña Matata", "Big League Chew-pacabras", "Cleveland Streamers",
  ],
};

function buildSeededSnapshots(liveNames: string[]): Record<number, Record<string, number>> {
  const result: Record<number, Record<string, number>> = {};
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const normalizedLive = liveNames.map(n => ({ real: n, norm: normalize(n) }));
  for (const [weekStr, names] of Object.entries(SEEDED_SNAPSHOT_NAMES)) {
    const week = parseInt(weekStr);
    const pts = SEEDED_SNAPSHOTS_BY_RANK[week];
    result[week] = {};
    names.forEach((seedName, i) => {
      const normSeed = normalize(seedName);
      const match = normalizedLive.find(l => l.norm === normSeed);
      if (match) result[week][match.real] = pts[i].pts;
    });
  }
  return result;
}

function getCurrentWeekNum() {
  const now = new Date();
  const adjusted = new Date(now.getTime() - 7 * 60 * 60 * 1000 - 45 * 60 * 1000);
  return WEEK_STARTS.reduce((acc, d, i) => new Date(d) <= adjusted ? i + 1 : acc, 1);
}

function getCurrentWeek() {
  return WEEK_SCHEDULE[getCurrentWeekNum() - 1];
}

function getCompletedWeeks() {
  const current = getCurrentWeekNum();
  return WEEK_SCHEDULE.filter(w => w.week < current);
}

type Team = { name: string; r: number; hr: number; rbi: number; sb: number; avg: number; ops: number; w: number; k: number; era: number; whip: number; qs: number; svh: number };
type ScoredTeam = Team & { pts: Record<string, number>; total: number };
type WeekWinner = { week: number; teams: string[]; points: number; finalized?: boolean };

const TEAMS_KEY = "roto_live_teams";
const TIMESTAMP_KEY = "roto_last_updated";
const WEEK_PREFIX = "roto_week_";
const SNAPSHOT_PREFIX = "roto_week_";

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
  bg: "var(--bg,#fff)", bgAlt: "var(--bg-alt,#f9f9f9)",
  border: "var(--border,#e5e5e5)", borderLight: "var(--border-light,#f0f0f0)",
  text: "var(--text,#111)", textMuted: "var(--text-muted,#666)",
  textFaint: "var(--text-faint,#aaa)", btnBg: "var(--btn-bg,#fff)",
  btnActive: "var(--btn-active,#f0f0f0)",
};

const globalStyle = `
  :root{--bg:#fff;--bg-alt:#f9f9f9;--border:#e5e5e5;--border-light:#f0f0f0;--text:#111;--text-muted:#666;--text-faint:#aaa;--btn-bg:#fff;--btn-active:#f0f0f0;}
  @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--bg-alt:#242424;--border:#333;--border-light:#2a2a2a;--text:#f0f0f0;--text-muted:#aaa;--text-faint:#666;--btn-bg:#2a2a2a;--btn-active:#333;}}
  *{box-sizing:border-box;} body{background:var(--bg);color:var(--text);margin:0;}
  input,select,textarea{background:var(--btn-bg)!important;color:var(--text)!important;border-color:var(--border)!important;}
  input::placeholder,textarea::placeholder{color:var(--text-faint)!important;}
  @keyframes flashBgGreen{0%{background:#d4f7d4;}100%{background:transparent;}}
  @keyframes flashBgRed{0%{background:#fdd;}100%{background:transparent;}}
  @keyframes flashTxtGreen{0%{color:#1a7a1a;}100%{color:inherit;}}
  @keyframes flashTxtRed{0%{color:#c00;}100%{color:inherit;}}
  .flash-bg-up{animation:flashBgGreen 3s ease-out forwards;}
  .flash-bg-down{animation:flashBgRed 3s ease-out forwards;}
  .flash-txt-up{animation:flashTxtGreen 3s ease-out forwards;}
  .flash-txt-down{animation:flashTxtRed 3s ease-out forwards;}
`;

function BreakdownTable({ teams, sortKey, sortAsc, onSort, flashMap = {} }: {
  teams: ScoredTeam[];
  sortKey: string;
  sortAsc: boolean;
  onSort: (k: string) => void;
  flashMap?: Record<string, string>;
}) {
  const SortTh = ({ k, label, style = {} }: { k: string; label: string; style?: React.CSSProperties }) => {
    const active = sortKey === k;
    return (
      <th onClick={() => onSort(k)} style={{ textAlign: "right", padding: "6px 4px", fontWeight: active ? 600 : 400, minWidth: 34, fontSize: 11, color: active ? C.text : C.textMuted, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style }}>
        {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
      </th>
    );
  };

  const displayRows = [...teams].sort((a, b) => {
    const aVal = sortKey === "total" ? a.total : a.pts[sortKey];
    const bVal = sortKey === "total" ? b.total : b.pts[sortKey];
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `
