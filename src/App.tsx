import { useState, useEffect, useRef } from "react";

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

// Permanent Yahoo team IDs — never change even when names do
const SIDEPOT1_IDS = new Set(["4", "5", "9", "2", "1", "6", "7", "11"]);
const SIDEPOT2_IDS = new Set(["1", "6", "7", "11"]);

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
  { week: 17, start: "Jul 13", end: "Jul 26" },
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

type H2HTeam = { name: string; teamId: string; w: number; l: number; t: number; winPct: number; gb: number; rank: number };

type Team = {
  name: string; teamId: string; r: number; hr: number; rbi: number; sb: number;
  avg: number; ops: number; w: number; k: number; era: number;
  whip: number; qs: number; svh: number; hab: string;
};
type ScoredTeam = Team & { pts: Record<string, number>; total: number };
type WeekWinner = { week: number; teams: string[]; points: number; finalized?: boolean };

const TEAMS_KEY = "roto_live_teams";
const TIMESTAMP_KEY = "roto_last_updated";
const WEEK_PREFIX = "roto_week_";
const SNAPSHOT_PREFIX = "roto_week_";
const H2H_KEY = "roto_h2h_standings";

function parseHab(habStr: string): { h: number; ab: number; avg: number } {
  if (!habStr || typeof habStr !== "string") return { h: 0, ab: 0, avg: 0 };
  const parts = habStr.split("/");
  if (parts.length !== 2) return { h: 0, ab: 0, avg: 0 };
  const h = parseInt(parts[0]) || 0;
  const ab = parseInt(parts[1]) || 0;
  return { h, ab, avg: ab > 0 ? h / ab : 0 };
}

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

function scoreAvgCategory(teams: Team[]): Record<string, number> {
  const n = teams.length;
  const teamsWithRaw = teams.map(t => ({ ...t, rawAvg: parseHab(t.hab).avg }));
  const sorted = [...teamsWithRaw].sort((a, b) => b.rawAvg - a.rawAvg);
  const scores: Record<string, number> = {};
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j].rawAvg === sorted[i].rawAvg) j++;
    const ranks = Array.from({ length: j - i }, (_, k) => n - (i + k));
    const avg = ranks.reduce((s, r) => s + r, 0) / ranks.length;
    for (let k = i; k < j; k++) scores[sorted[k].name] = avg;
    i = j;
  }
  return scores;
}

function computeRoto(teams: Team[]): ScoredTeam[] {
  const catScores: Record<string, Record<string, number>> = {};
  CATS.forEach(cat => {
    if (cat.key === "avg") {
      catScores[cat.key] = scoreAvgCategory(teams);
    } else {
      catScores[cat.key] = scoreCategory(teams, cat);
    }
  });
  return teams.map(t => {
    const pts: Record<string, number> = {};
    let total = 0;
    CATS.forEach(cat => { pts[cat.key] = catScores[cat.key][t.name]; total += pts[cat.key]; });
    return { ...t, pts, total };
  }).sort((a, b) => b.total - a.total);
}

function fmtPts(v: number) { return Number.isInteger(v) ? v : v.toFixed(1); }
function fmtMoney(v: number) { return v > 0 ? `$${v}` : "—"; }
function fmtPct(v: number) { return v.toFixed(3).replace("0.", "."); }
function fmtGb(v: number) { return v === 0 ? "—" : Number.isInteger(v) ? String(v) : v.toFixed(1); }

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
  @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--bg-alt:#2a2a2a;--border:#444;--border-light:#333;--text:#f0f0f0;--text-muted:#bbb;--text-faint:#777;--btn-bg:#2a2a2a;--btn-active:#383838;}}
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

function InfoSection({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 48, borderTop: `1px solid ${C.borderLight}`, paddingTop: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textFaint, marginBottom: 16 }}>How Scoring Works</div>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function InfoRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <span style={{ color: C.textFaint, flexShrink: 0, marginTop: 2 }}>·</span>
      <span>{children}</span>
    </div>
  );
}

function BreakdownTable({ teams, sortKey, sortAsc, onSort, flashMap = {} }: {
  teams: ScoredTeam[]; sortKey: string; sortAsc: boolean;
  onSort: (k: string) => void; flashMap?: Record<string, string>;
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
          <tr style={{ borderBottom: `2px solid ${C.border}` }}>
            <th style={{ textAlign: "left", padding: "6px 6px", fontWeight: 600, width: 24, color: C.text }}>#</th>
            <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, minWidth: 160, color: C.text }}>Team</th>
            {CATS.map(c => <SortTh key={c.key} k={c.key} label={c.label} style={{ minWidth: 52 }} />)}
            <SortTh k="total" label="Total" style={{ minWidth: 52, padding: "6px 8px" }} />
          </tr>
        </thead>
        <tbody>
          {displayRows.map((t, i) => (
            <tr key={t.teamId} style={{ borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgAlt)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "10px 6px", fontSize: 12, color: C.textFaint, verticalAlign: "middle" }}>{i + 1}</td>
              <td style={{ padding: "10px 8px", fontSize: 13, whiteSpace: "nowrap", verticalAlign: "middle", color: C.text }}>{t.name}</td>
              {CATS.map(c => (
                <td key={c.key} style={{ padding: "10px 4px", textAlign: "right", verticalAlign: "middle" }}>
                  <span
                    className={flashMap[`${t.name}__stat__${c.key}`] || ""}
                    title={c.key === "avg" && t.hab ? `${t.hab} · ${parseHab(t.hab).avg.toFixed(6)}` : undefined}
                    style={{ display: "block", fontSize: 13, fontWeight: "bold", color: C.text, cursor: c.key === "avg" && t.hab ? "help" : "default" }}
                  >
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
  );
}

function SeasonGrid({ liveScored, snapshots, idToName, currentWeekNum }: {
  liveScored: ScoredTeam[];
  snapshots: Record<number, Record<string, number>>;
  idToName: Record<string, string>;
  currentWeekNum: number;
}) {
  const completedWeekNums = Array.from({ length: currentWeekNum - 1 }, (_, i) => i + 1);
  const allWeekNums = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);

  // Live scores keyed by teamId
  const liveScores: Record<string, number> = {};
  liveScored.forEach(t => { liveScores[t.teamId] = t.total; });

  // All team IDs from live teams
  const allTeamIds = liveScored.map(t => t.teamId);

  // Season totals keyed by teamId
  const seasonTotals: Record<string, number> = {};
  allTeamIds.forEach(id => {
    let total = 0;
    completedWeekNums.forEach(w => {
      const snap = snapshots[w];
      if (snap && snap[id] != null) total += snap[id];
    });
    if (liveScores[id] != null) total += liveScores[id];
    seasonTotals[id] = total;
  });

  const sortedIds = [...allTeamIds].sort((a, b) => (seasonTotals[b] ?? 0) - (seasonTotals[a] ?? 0));

  const weekHighScores: Record<number, number> = {};
  completedWeekNums.forEach(w => {
    const snap = snapshots[w]; if (!snap) return;
    weekHighScores[w] = Math.max(...Object.values(snap));
  });
  const currentWeekHighScore = liveScored.length > 0 ? liveScored[0].total : 0;

  let kingScore = 0, kingId = "", kingWeek = 0;
  completedWeekNums.forEach(w => {
    const snap = snapshots[w]; if (!snap) return;
    Object.entries(snap).forEach(([id, pts]) => {
      if (pts > kingScore) { kingScore = pts; kingId = id; kingWeek = w; }
    });
  });

  const seasonLeaderId = sortedIds[0];
  const seasonLeaderTotal = seasonTotals[seasonLeaderId] ?? 0;
  const visibleWeeks = allWeekNums.filter(w => w <= currentWeekNum + 2);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {kingId && (
          <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, background: "var(--bg-alt,#f9f9f9)", border: "1px solid #f59e0b" }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#b45309" }}>One-Week Score to Beat</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                {idToName[kingId] ?? kingId} — <span style={{ color: "#b45309" }}>{fmtPts(kingScore)} pts</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: C.textMuted, marginLeft: 8 }}>Week {kingWeek}</span>
              </div>
            </div>
          </div>
        )}
        {seasonLeaderId && (
          <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, background: "var(--bg-alt,#f9f9f9)", border: "1px solid #86efac" }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#15803d" }}>Season Total Leader</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                {idToName[seasonLeaderId] ?? seasonLeaderId} — <span style={{ color: "#15803d" }}>{fmtPts(seasonLeaderTotal)} pts</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600, minWidth: 160, color: C.text, position: "sticky", left: 0, background: C.bg, zIndex: 1, verticalAlign: "top" }}>Team</th>
              <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 700, minWidth: 72, color: C.text, whiteSpace: "nowrap", background: "var(--bg-alt,#f9f9f9)", verticalAlign: "top" }}>Season Total</th>
              {visibleWeeks.map(w => {
                const isCurrentWeek = w === currentWeekNum;
                const isFuture = w > currentWeekNum;
                const sched = WEEK_SCHEDULE[w - 1];
                return (
                  <th key={w} style={{ textAlign: "right", padding: "4px 8px", fontWeight: isCurrentWeek ? 600 : 400, minWidth: 64, color: isFuture ? C.textFaint : isCurrentWeek ? C.text : C.textMuted, whiteSpace: "nowrap", verticalAlign: "top" }}>
                    {isCurrentWeek ? <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Current</div> : <div style={{ fontSize: 9, marginBottom: 2, visibility: "hidden" }}>·</div>}
                    <div>Wk {w}</div>
                    {sched && <div style={{ fontSize: 9, fontWeight: 400, color: C.textFaint }}>{sched.start}</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedIds.map((id, idx) => (
              <tr key={id} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                onMouseEnter={e => (e.currentTarget.style.background = C.bgAlt)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "9px 10px", whiteSpace: "nowrap", position: "sticky", left: 0, background: C.bg, zIndex: 1, color: C.text, textAlign: "left" }}>
                  <span style={{ fontSize: 11, color: C.textFaint, marginRight: 6 }}>{idx + 1}</span>
                  <span>{idToName[id] ?? id}</span>
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: C.text, background: "var(--bg-alt,#f9f9f9)" }}>{fmtPts(seasonTotals[id] ?? 0)}</td>
                {visibleWeeks.map(w => {
                  const isCurrentWeek = w === currentWeekNum;
                  const isFuture = w > currentWeekNum;
                  const snap = snapshots[w];
                  const score = isCurrentWeek ? liveScores[id] : snap?.[id];
                  const isWeekHigh = !isCurrentWeek && !isFuture && score != null && score === weekHighScores[w];
                  const isCurrentLeader = isCurrentWeek && score != null && score === currentWeekHighScore;
                  let cellBg = "transparent", cellColor = C.text;
                  let cellWeight: React.CSSProperties["fontWeight"] = 400;
                  if (isWeekHigh) { cellBg = "rgba(34,197,94,0.12)"; cellColor = "#15803d"; cellWeight = 700; }
                  else if (isCurrentLeader) { cellBg = "rgba(59,130,246,0.1)"; cellColor = "#2563eb"; cellWeight = 700; }
                  return (
                    <td key={w} style={{ padding: "9px 8px", textAlign: "right", background: cellBg, color: isFuture ? C.textFaint : cellColor, fontWeight: cellWeight }}>
                      {isFuture ? <span style={{ color: C.textFaint }}>—</span> : score != null ? <>{isWeekHigh ? "💰 " : ""}{fmtPts(score)}</> : <span style={{ color: C.textFaint }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InfoSection>
        <InfoRow>Highest scorer each week wins $25.</InfoRow>
        <InfoRow>Weekly prizes are for regular season only and do not apply to fantasy playoffs.</InfoRow>
        <InfoRow>Season Total Leader — highest cumulative roto score across all regular season weeks. One $25 prize awarded at end of season.</InfoRow>
        <InfoRow>Score to Beat — highest single-week roto score by any team all season. One $25 prize awarded at end of season.</InfoRow>
        <InfoRow>Current week is live and updates every 5 minutes. Completed weeks are locked snapshots.</InfoRow>
      </InfoSection>
    </div>
  );
}

function StandingsTable({ rows, prizes, accentColor, accentBg, accentBorder, showPlayoff }: {
  rows: H2HTeam[];
  prizes: Record<number, number>; accentColor: string; accentBg: string; accentBorder: string; showPlayoff: boolean;
}) {
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${C.border}` }}>
          <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, width: 28, color: C.text }}>#</th>
          <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, minWidth: 160, color: C.text }}>Team</th>
          <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, color: C.text }}>W-L-T</th>
          <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, color: C.text }}>W-L%</th>
          <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, color: C.text }}>GB</th>
          {showPlayoff && <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, color: C.text }}>Playoffs</th>}
          <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700, color: accentColor, minWidth: 110 }}>Proj. Winnings</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(team => {
          const prize = prizes[team.rank] ?? 0;
          const inPlayoffs = showPlayoff && team.rank <= 6;
          const hasBye = showPlayoff && team.rank <= 2;
          return (
            <tr key={team.teamId} style={{ borderBottom: `1px solid ${C.borderLight}` }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgAlt)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "12px 10px", color: C.textFaint, fontSize: 12 }}>{team.rank}</td>
              <td style={{ padding: "12px 10px", fontWeight: prize > 0 ? 600 : 400, color: C.text, whiteSpace: "nowrap" }}>{team.name}</td>
              <td style={{ padding: "12px 10px", textAlign: "center", color: C.text, fontWeight: 500 }}>{team.w}-{team.l}-{team.t}</td>
              <td style={{ padding: "12px 10px", textAlign: "center", color: C.textMuted }}>{fmtPct(team.winPct)}</td>
              <td style={{ padding: "12px 10px", textAlign: "center", color: C.textFaint }}>{fmtGb(team.gb)}</td>
              {showPlayoff && (
                <td style={{ padding: "12px 10px", textAlign: "center" }}>
                  {hasBye
                    ? <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", background: "rgba(34,197,94,0.2)", padding: "3px 10px", borderRadius: 12 }}>✓ Bye</span>
                    : inPlayoffs
                      ? <span style={{ fontSize: 12, fontWeight: 600, color: "#0369a1", background: "rgba(59,130,246,0.15)", padding: "3px 10px", borderRadius: 12 }}>✓ In</span>
                      : <span style={{ fontSize: 12, color: C.textFaint }}>—</span>}
                </td>
              )}
              <td style={{ padding: "12px 12px", textAlign: "right" }}>
                {prize > 0
                  ? <span style={{ fontWeight: 700, fontSize: 14, color: accentColor, background: accentBg, border: `1px solid ${accentBorder}`, padding: "3px 10px", borderRadius: 8, display: "inline-block" }}>{fmtMoney(prize)}</span>
                  : <span style={{ color: C.textFaint, fontSize: 13 }}>—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PotSection({ title, subtitle, emoji, borderColor, accentColor, payoutDesc, children }: {
  title: string; subtitle: string; emoji: string; borderColor: string;
  accentColor: string; payoutDesc: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 36, border: `1px solid ${borderColor}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: "var(--bg-alt,#f9f9f9)", borderBottom: `1px solid ${borderColor}`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: accentColor }}>{emoji} {title}</div>
          <div style={{ fontSize: 12, color: C.text, marginTop: 3, opacity: 0.8 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{payoutDesc}</div>
      </div>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}

function StandingsTab({ h2h, h2hUpdatedAt }: { h2h: H2HTeam[]; h2hUpdatedAt: string | null }) {
  const allRows = h2h.map((t, i) => ({ ...t, rank: i + 1 }));
  const sp1Rows = h2h.filter(t => SIDEPOT1_IDS.has(t.teamId)).map((t, i) => ({ ...t, rank: i + 1 }));
  const sp2Rows = h2h.filter(t => SIDEPOT2_IDS.has(t.teamId)).map((t, i) => ({ ...t, rank: i + 1 }));
  return (
    <div>
      {h2hUpdatedAt && (
        <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 16 }}>
          H2H standings last synced {toEastern(h2hUpdatedAt)}
        </div>
      )}
      <PotSection title="Regular Season & Playoffs" subtitle="All 12 teams · Top 6 make playoffs · Top 2 get first-round byes"
        emoji="🏆" borderColor="#86efac" accentColor="#15803d"
        payoutDesc={<span>1st <strong>$475</strong> · 2nd <strong>$275</strong> · 3rd <strong>$150</strong> · 4th–6th <strong>$25</strong> each</span>}>
        <StandingsTable rows={allRows} prizes={{ 1: 475, 2: 275, 3: 150, 4: 25, 5: 25, 6: 25 }} accentColor="#15803d" accentBg="rgba(34,197,94,0.1)" accentBorder="#86efac" showPlayoff={true} />
      </PotSection>
      <PotSection title="Side Pot #1" subtitle={`${SIDEPOT1_IDS.size} participants · Ranked by H2H finish among SP1 members only`}
        emoji="💛" borderColor="#fde047" accentColor="#854d0e"
        payoutDesc={<span>1st <strong>$330</strong> · 2nd <strong>$170</strong> · 3rd <strong>$100</strong></span>}>
        <StandingsTable rows={sp1Rows} prizes={{ 1: 330, 2: 170, 3: 100 }} accentColor="#854d0e" accentBg="rgba(251,191,36,0.1)" accentBorder="#fde047" showPlayoff={false} />
      </PotSection>
      <PotSection title="Side Pot #2" subtitle={`${SIDEPOT2_IDS.size} participants · Ranked by H2H finish among SP2 members only`}
        emoji="💙" borderColor="#93c5fd" accentColor="#1d4ed8"
        payoutDesc={<span>1st <strong>$250</strong> · 2nd <strong>$150</strong></span>}>
        <StandingsTable rows={sp2Rows} prizes={{ 1: 250, 2: 150 }} accentColor="#1d4ed8" accentBg="rgba(59,130,246,0.1)" accentBorder="#93c5fd" showPlayoff={false} />
      </PotSection>
      <InfoSection>
        <InfoRow>Yahoo StatTracker is the source of truth for live scoring — it's a great place to see live matchup results.</InfoRow>
        <InfoRow>Commissioner will routinely update to keep scoring in sync with Yahoo, particularly for previous weeks.</InfoRow>
        <InfoRow>Ratio ties (ERA, WHIP, OPS) will show as ties until the commissioner updates to match Yahoo.</InfoRow>
        <InfoRow>Side pot rankings are based on H2H finish within that pot's members only.</InfoRow>
      </InfoSection>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<"weekly" | "grid" | "standings">("weekly");
  const [sortKey, setSortKey] = useState("total");
  const [sortAsc, setSortAsc] = useState(false);
  const [liveTeams, setLiveTeams] = useState<Team[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [weekWinners, setWeekWinners] = useState<Record<number, WeekWinner>>({});
  const [snapshots, setSnapshots] = useState<Record<number, Record<string, number>>>({});
  const [idToName, setIdToName] = useState<Record<string, string>>({});
  const [h2h, setH2h] = useState<H2HTeam[]>([]);
  const [h2hUpdatedAt, setH2hUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashMap, setFlashMap] = useState<Record<string, string>>({});
  const prevScoredRef = useRef<ScoredTeam[]>([]);
  const prevTeamsRef = useRef<Record<string, Team>>({});

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [prevWeekTeams, setPrevWeekTeams] = useState<ScoredTeam[] | null>(null);
  const [prevWeekLoading, setPrevWeekLoading] = useState(false);
  const [prevWeekError, setPrevWeekError] = useState<string | null>(null);

  const [commUnlocked, setCommUnlocked] = useState(false);
  const [commPassword, setCommPassword] = useState("");
  const [commError, setCommError] = useState(false);
  const [commSection, setCommSection] = useState<"history" | "sync" | "manual">("history");
  const [weekDrafts, setWeekDrafts] = useState<Record<number, { teams: string[]; points: string }>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [manualData, setManualData] = useState("");
  const [manualResult, setManualResult] = useState<string | null>(null);

  const currentWeekNum = getCurrentWeekNum();
  const currentWeekSched = WEEK_SCHEDULE[currentWeekNum - 1];
  const completedWeeks = getCompletedWeeks();

  function getCurrentWeekNum() {
    const now = new Date();
    const adjusted = new Date(now.getTime() - 7 * 60 * 60 * 1000 - 45 * 60 * 1000);
    return WEEK_STARTS.reduce((acc, d, i) => new Date(d) <= adjusted ? i + 1 : acc, 1);
  }

  function getCompletedWeeks() {
    const current = getCurrentWeekNum();
    return WEEK_SCHEDULE.filter(w => w.week < current);
  }

  const triggerFlash = (newTeams: Team[]) => {
    const oldTeams = prevTeamsRef.current;
    const oldScored = prevScoredRef.current;
    if (!Object.keys(oldTeams).length) return;
    const newScored = computeRoto(newTeams);
    const flashes: Record<string, string> = {};
    newTeams.forEach(t => {
      const old = oldTeams[t.name]; if (!old) return;
      CATS.forEach(c => {
        const newVal = (t as any)[c.key], oldVal = (old as any)[c.key];
        if (newVal !== oldVal) {
          const improved = c.dir === 1 ? newVal > oldVal : newVal < oldVal;
          flashes[`${t.name}__stat__${c.key}`] = improved ? "flash-txt-up" : "flash-txt-down";
        }
      });
    });
    newScored.forEach(t => {
      const oldT = oldScored.find(o => o.name === t.name); if (!oldT) return;
      CATS.forEach(c => {
        if (t.pts[c.key] !== oldT.pts[c.key])
          flashes[`${t.name}__pts__${c.key}`] = t.pts[c.key] > oldT.pts[c.key] ? "flash-bg-up" : "flash-bg-down";
      });
    });
    if (Object.keys(flashes).length > 0) { setFlashMap(flashes); setTimeout(() => setFlashMap({}), 3100); }
  };

  const triggerFlashRef = useRef(triggerFlash);
  useEffect(() => { triggerFlashRef.current = triggerFlash; });

  useEffect(() => {
    const load = async (initial = false) => {
      const [teamsVal, tsVal, h2hVal] = await Promise.all([
        kvGet(TEAMS_KEY), kvGet(TIMESTAMP_KEY), kvGet(H2H_KEY),
      ]);
      if (teamsVal) {
        const newTeams: Team[] = JSON.parse(teamsVal);
        if (!initial) triggerFlashRef.current(newTeams);
        const newMap: Record<string, Team> = {};
        newTeams.forEach(t => { newMap[t.name] = t; });
        prevTeamsRef.current = newMap;
        prevScoredRef.current = computeRoto(newTeams);

        // Build id->name map
        const newIdToName: Record<string, string> = {};
        newTeams.forEach(t => { newIdToName[t.teamId] = t.name; });
        setIdToName(newIdToName);
        setLiveTeams(newTeams);

        if (initial) {
          const ww: Record<number, WeekWinner> = {};
          const snaps: Record<number, Record<string, number>> = {};
          await Promise.all(Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(async w => {
            const [val, snapVal] = await Promise.all([kvGet(WEEK_PREFIX + w), kvGet(`${SNAPSHOT_PREFIX}${w}_snapshot`)]);
            if (val) ww[w] = JSON.parse(val);
            if (snapVal) {
              const parsed = JSON.parse(snapVal);
              // Support both ID-keyed and name-keyed snapshots during transition
              const scores = parsed.scores ?? parsed;
              // Check if keys are numeric IDs or names
              const keys = Object.keys(scores);
              const isIdKeyed = keys.length > 0 && !isNaN(Number(keys[0]));
              if (isIdKeyed) {
                snaps[w] = scores;
              } else {
                // Legacy name-keyed — convert to ID-keyed using current name->id map
                const nameToId: Record<string, string> = {};
                newTeams.forEach(t => { nameToId[t.name] = t.teamId; });
                const converted: Record<string, number> = {};
                Object.entries(scores).forEach(([name, pts]) => {
                  const id = nameToId[name];
                  if (id) converted[id] = pts as number;
                });
                snaps[w] = converted;
              }
            }
          }));
          setWeekWinners(ww);
          setSnapshots(snaps);
          setLoading(false);
        }
      } else if (initial) {
        setLoading(false);
      }
      if (tsVal) setLastUpdated(tsVal);
      if (h2hVal) {
        const parsed = JSON.parse(h2hVal);
        if (parsed.standings?.length) {
          const standings = parsed.standings.map((t: any, i: number) => ({ ...t, rank: i + 1, teamId: t.teamId ?? "" }));
          setH2h(standings);
          setH2hUpdatedAt(parsed.updatedAt ?? null);
        }
      }
    };
    load(true);
    const interval = setInterval(() => load(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleWeekSelect = async (weekNum: number | null) => {
    setSelectedWeek(weekNum);
    if (weekNum === null) { setPrevWeekTeams(null); setPrevWeekError(null); return; }
    setPrevWeekTeams(null); setPrevWeekError(null); setPrevWeekLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}?week=${weekNum}`);
      const data = await res.json() as any;
      if (data.ok) { setPrevWeekTeams(computeRoto(data.teams)); }
      else { setPrevWeekError(data.error || "Failed to load week data"); }
    } catch (e: any) { setPrevWeekError(e.message); }
    setPrevWeekLoading(false);
  };

  const scored = computeRoto(liveTeams);
  const teamNames = scored.map(t => t.name);
  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a); else { setSortKey(key); setSortAsc(false); }
  };
  const displayTeams = selectedWeek === null ? scored : prevWeekTeams;
  const displayWinner = selectedWeek !== null ? weekWinners[selectedWeek] : weekWinners[currentWeekNum];

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
        if (!isNaN(parseFloat(val)) || val.startsWith(".")) { nums.push(parseFloat(val)); i++; } else break;
      }
      if (nums.length === 14 && name && !/^\d+$/.test(name))
        teams.push({ name, teamId: "", r: nums[1], hr: nums[2], rbi: nums[3], sb: nums[4], avg: nums[5], ops: nums[6], w: nums[8], k: nums[9], era: nums[10], whip: nums[11], qs: nums[12], svh: nums[13], hab: "" });
    }
    return teams;
  };

  const handleManualSave = async () => {
    const parsed = parseYahooPaste(manualData);
    if (parsed.length > 0) {
      const ts = new Date().toISOString();
      setLiveTeams(parsed); setLastUpdated(ts);
      await kvSet(TEAMS_KEY, JSON.stringify(parsed));
      await kvSet(TIMESTAMP_KEY, ts);
      setManualData("");
      setManualResult(`✓ Updated with ${parsed.length} teams at ${toEastern(ts)}`);
    } else {
      setManualResult("✗ Couldn't parse — paste from Yahoo > Stat Tracker > League Stats > Week Totals.");
    }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await fetch(WORKER_URL);
      const data = await res.json() as any;
      if (data.ok) {
        const [teamsVal, tsVal, h2hVal] = await Promise.all([kvGet(TEAMS_KEY), kvGet(TIMESTAMP_KEY), kvGet(H2H_KEY)]);
        if (teamsVal) setLiveTeams(JSON.parse(teamsVal));
        if (tsVal) setLastUpdated(tsVal);
        if (h2hVal) {
          const p = JSON.parse(h2hVal);
          if (p.standings?.length) {
            const standings = p.standings.map((t: any, i: number) => ({ ...t, rank: i + 1, teamId: t.teamId ?? "" }));
            setH2h(standings);
            setH2hUpdatedAt(p.updatedAt ?? null);
          }
        }
        setSyncResult(`✓ Synced ${data.teams} teams at ${toEastern(data.updatedAt)}`);
      } else { setSyncResult(`✗ Sync failed: ${data.error}`); }
    } catch (e: any) { setSyncResult(`✗ Error: ${e.message}`); }
    setSyncing(false);
  };

  const handleCommUnlock = () => {
    if (commPassword === COMM_PASSWORD) { setCommUnlocked(true); setCommError(false); } else setCommError(true);
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

  if (loading) return (<><style>{globalStyle}</style><div style={{ padding: 32, fontFamily: "system-ui,sans-serif", color: C.textMuted }}>Loading...</div></>);

  const weeklyInfoSection = (
    <InfoSection>
      <InfoRow>Roto scoring: all 12 teams ranked 1–12 in each of the 12 categories.</InfoRow>
      <InfoRow>R, HR, RBI, SB, W, K, QS, SVH (counting stats) split ties evenly.</InfoRow>
      <InfoRow>AVG uses precise H/AB ratio so ties at the display level are broken correctly.</InfoRow>
      <InfoRow>ERA, WHIP, and OPS use Yahoo's rounded values — weekly prize scores do not split ties for these categories.</InfoRow>
      <InfoRow>Weekly scores will be finalized after any Yahoo stat corrections have been made. Weekly scores will show as "Pending" until then.</InfoRow>
    </InfoSection>
  );

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui,sans-serif", color: C.text, background: C.bg, minHeight: "100vh" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>Heavy Draft Ballers Prize Tracker</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              {lastUpdated ? `Last updated ${toEastern(lastUpdated)}` : "No data loaded yet"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([["weekly", "Weekly Detail"], ["grid", "Weekly Payouts"], ["standings", "Playoffs & Side Pots"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={btn(view === v)}>{label}</button>
            ))}
          </div>
        </div>

        {view === "weekly" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <select value={selectedWeek === null ? "current" : String(selectedWeek)}
                onChange={e => handleWeekSelect(e.target.value === "current" ? null : parseInt(e.target.value))}
                style={{ fontSize: 13, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, minWidth: 200 }}>
                <option value="current">Week {currentWeekNum} · {currentWeekSched?.start} – {currentWeekSched?.end} (Current)</option>
                {completedWeeks.slice().reverse().map(w => (
                  <option key={w.week} value={w.week}>Week {w.week} · {w.start} – {w.end}</option>
                ))}
              </select>
              {displayWinner && (
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  Winner: <strong style={{ color: C.text }}>{displayWinner.teams.join(" & ")}</strong>
                  {displayWinner.finalized
                    ? <span style={{ marginLeft: 8, fontSize: 11, color: "green" }}>✓ Final</span>
                    : <span style={{ marginLeft: 8, fontSize: 11, color: "#ba7517" }}>· Pending</span>}
                </span>
              )}
            </div>
            {selectedWeek === null ? (
              <BreakdownTable teams={scored} sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} flashMap={flashMap} />
            ) : prevWeekLoading ? (
              <div style={{ fontSize: 13, color: C.textMuted, padding: "24px 0" }}>Loading week data from Yahoo...</div>
            ) : prevWeekError ? (
              <div style={{ fontSize: 13, color: "#c00", padding: "12px 0" }}>Error: {prevWeekError}</div>
            ) : displayTeams ? (
              <BreakdownTable teams={displayTeams} sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
            ) : null}
            {weeklyInfoSection}
          </div>
        )}

        {view === "grid" && <SeasonGrid liveScored={scored} snapshots={snapshots} idToName={idToName} currentWeekNum={currentWeekNum} />}
        {view === "standings" && <StandingsTab h2h={h2h} h2hUpdatedAt={h2hUpdatedAt} />}

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
                  style={{ ...btn(), marginLeft: "auto", color: C.textFaint, fontSize: 11 }}>Lock</button>
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
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>The app auto-syncs from Yahoo every 5 minutes. Use this to force an immediate update.</div>
                  <button onClick={handleSync} disabled={syncing}
                    style={{ fontSize: 13, padding: "8px 20px", borderRadius: 6, border: "none", cursor: syncing ? "not-allowed" : "pointer", background: "#111", color: "#fff", fontWeight: 500, opacity: syncing ? 0.6 : 1 }}>
                    {syncing ? "Syncing..." : "Sync now"}
                  </button>
                  {syncResult && <div style={{ marginTop: 12, fontSize: 12, color: syncResult.startsWith("✓") ? "green" : "#c00" }}>{syncResult}</div>}
                </div>
              )}

              {commSection === "manual" && (
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>Manual data override</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>The app auto-syncs from Yahoo every 5 minutes and locks each week automatically on Monday at 2:45am ET. Use this only as a fallback if the auto-sync is unavailable.</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>To get the data: Yahoo Fantasy → Stat Tracker → League Stats → set to <strong>Week Totals</strong> → select all → copy → paste below.</div>
                  <textarea value={manualData} onChange={e => setManualData(e.target.value)} placeholder="Paste Yahoo table here..."
                    style={{ width: "100%", height: 180, fontSize: 11, fontFamily: "monospace", borderRadius: 6, border: `1px solid ${C.border}`, padding: 10, resize: "vertical", background: C.btnBg, color: C.text }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={handleManualSave} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: "#111", color: "#fff", fontWeight: 500 }}>Save & recalculate</button>
                    <button onClick={() => { setManualData(""); setManualResult(null); }} style={btn()}>Clear</button>
                  </div>
                  {manualResult && <div style={{ marginTop: 10, fontSize: 12, color: manualResult.startsWith("✓") ? "green" : "#c00" }}>{manualResult}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
