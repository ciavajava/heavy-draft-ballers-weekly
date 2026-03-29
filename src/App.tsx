import { useState, useEffect } from "react";

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

const TOTAL_WEEKS = 22;
const COMMISSIONER_PASSWORD = "maxmuncy";

const CATS = [
  { key: "r",    label: "R",    dir: 1,  fmt: (v: number) => String(v) },
  { key: "hr",   label: "HR",   dir: 1,  fmt: (v: number) => String(v) },
  { key: "rbi",  label: "RBI",  dir: 1,  fmt: (v: number) => String(v) },
  { key: "sb",   label: "SB",   dir: 1,  fmt: (v: number) => String(v) },
  { key: "avg",  label: "AVG",  dir: 1,  fmt: (v: number) => v.toFixed(3).replace("0.", ".") },
  { key: "ops",  label: "OPS",  dir: 1,  fmt: (v: number) => v.toFixed(3).replace("0.", ".") },
  { key: "w",    label: "W",    dir: 1,  fmt: (v: number) => String(v) },
  { key: "k",    label: "K",    dir: 1,  fmt: (v: number) => String(v) },
  { key: "era",  label: "ERA",  dir: -1, fmt: (v: number) => v.toFixed(2) },
  { key: "whip", label: "WHIP", dir: -1, fmt: (v: number) => v.toFixed(2) },
  { key: "qs",   label: "QS",   dir: 1,  fmt: (v: number) => String(v) },
  { key: "svh",  label: "SVH",  dir: 1,  fmt: (v: number) => String(v) },
];

type Team = { name: string; r: number; hr: number; rbi: number; sb: number; avg: number; ops: number; w: number; k: number; era: number; whip: number; qs: number; svh: number; };
type ScoredTeam = Team & { pts: Record<string, number>; total: number; };
type WeekResult = { week: number; teams: string[]; points: number; lockedAt: string; };

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

function fmtPts(v: number) { return Number.isInteger(v) ? String(v) : v.toFixed(1); }

const TEAMS_KEY = "roto_live_teams";

export default function App() {
  const [view, setView] = useState("standings");
  const [sortKey, setSortKey] = useState("total");
  const [sortAsc, setSortAsc] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState("");
  const [liveTeams, setLiveTeams] = useState<Team[]>(DEFAULT_DATA);
  const [weekResults, setWeekResults] = useState<(WeekResult | null)[]>(Array(TOTAL_WEEKS).fill(null));
  const [loading, setLoading] = useState(true);

  // Commissioner state
  const [commPassword, setCommPassword] = useState("");
  const [commUnlocked, setCommUnlocked] = useState(false);
  const [commError, setCommError] = useState(false);
  const [draftWeeks, setDraftWeeks] = useState<{ teams: string[]; points: string }[]>(
    Array.from({ length: TOTAL_WEEKS }, () => ({ teams: [""], points: "" }))
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [teamsRes, ...weekRes] = await Promise.all([
          fetch("/api/storage?key=" + TEAMS_KEY),
          ...Array.from({ length: TOTAL_WEEKS }, (_, i) => fetch(`/api/storage?key=week:${i + 1}`)),
        ]);
        if (teamsRes.ok) { const t = await teamsRes.json(); if (t.value) setLiveTeams(JSON.parse(t.value)); }
        const results: (WeekResult | null)[] = Array(TOTAL_WEEKS).fill(null);
        const drafts = Array.from({ length: TOTAL_WEEKS }, () => ({ teams: [""], points: "" }));
        for (let i = 0; i < TOTAL_WEEKS; i++) {
          if (weekRes[i].ok) {
            const w = await weekRes[i].json();
            if (w.value) {
              const parsed: WeekResult = JSON.parse(w.value);
              results[i] = parsed;
              drafts[i] = { teams: parsed.teams, points: String(parsed.points) };
            }
          }
        }
        setWeekResults(results);
        setDraftWeeks(drafts);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const saveToKV = async (key: string, value: string) => {
    await fetch("/api/storage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
  };

  const parseYahooPaste = (raw: string): Team[] => {
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const headerIdx = lines.findIndex(l => l.startsWith("BattingPitching") || l.startsWith("Rank") || l.match(/^GP\*/));
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

  const handleEditSave = async () => {
    const parsed = parseYahooPaste(editData);
    if (parsed.length > 0) {
      setLiveTeams(parsed);
      await saveToKV(TEAMS_KEY, JSON.stringify(parsed));
      setEditMode(false);
    } else {
      alert("Couldn't parse — paste directly from Yahoo stat tracker.");
    }
  };

  const handleCommLogin = () => {
    if (commPassword === COMMISSIONER_PASSWORD) { setCommUnlocked(true); setCommError(false); }
    else { setCommError(true); }
  };

  const handleSaveWeek = async (weekIdx: number) => {
    const draft = draftWeeks[weekIdx];
    const validTeams = draft.teams.filter(t => t.trim() !== "");
    const pts = parseFloat(draft.points);
    if (validTeams.length === 0 || isNaN(pts)) { alert("Select at least one team and enter points."); return; }
    const result: WeekResult = { week: weekIdx + 1, teams: validTeams, points: pts, lockedAt: new Date().toISOString() };
    const newResults = [...weekResults];
    newResults[weekIdx] = result;
    setWeekResults(newResults);
    await saveToKV(`week:${weekIdx + 1}`, JSON.stringify(result));
  };

  const handleClearWeek = async (weekIdx: number) => {
    const newResults = [...weekResults];
    newResults[weekIdx] = null;
    setWeekResults(newResults);
    const newDrafts = [...draftWeeks];
    newDrafts[weekIdx] = { teams: [""], points: "" };
    setDraftWeeks(newDrafts);
    await saveToKV(`week:${weekIdx + 1}`, "");
  };

  const updateDraftTeam = (weekIdx: number, teamIdx: number, val: string) => {
    const newDrafts = [...draftWeeks];
    newDrafts[weekIdx] = { ...newDrafts[weekIdx], teams: newDrafts[weekIdx].teams.map((t, i) => i === teamIdx ? val : t) };
    setDraftWeeks(newDrafts);
  };

  const addDraftTeam = (weekIdx: number) => {
    const newDrafts = [...draftWeeks];
    newDrafts[weekIdx] = { ...newDrafts[weekIdx], teams: [...newDrafts[weekIdx].teams, ""] };
    setDraftWeeks(newDrafts);
  };

  const removeDraftTeam = (weekIdx: number, teamIdx: number) => {
    const newDrafts = [...draftWeeks];
    const teams = newDrafts[weekIdx].teams.filter((_, i) => i !== teamIdx);
    newDrafts[weekIdx] = { ...newDrafts[weekIdx], teams: teams.length > 0 ? teams : [""] };
    setDraftWeeks(newDrafts);
  };

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

  const SortTh = ({ k, label, style = {} }: { k: string; label: string; style?: React.CSSProperties }) => {
    const active = sortKey === k;
    return (
      <th onClick={() => handleSort(k)} style={{ textAlign: "right", padding: "6px 4px", fontWeight: active ? 600 : 400, minWidth: 34, fontSize: 11, color: active ? "#111" : "#888", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style }}>
        {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
      </th>
    );
  };

  const lockedCount = weekResults.filter(Boolean).length;

  if (loading) return <div style={{ padding: 32, fontFamily: "sans-serif", color: "#888" }}>Loading...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: "#111" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Heavy Draft Ballers Weekly</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>12-cat roto · Week totals · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["standings", "breakdown", "history"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #ddd", background: view === v ? "#f0f0f0" : "white", color: "#111", cursor: "pointer", fontWeight: view === v ? 600 : 400 }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button onClick={() => { setEditMode(!editMode); setEditData(""); }}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #ddd", background: "white", color: "#888", cursor: "pointer" }}>
            {editMode ? "Cancel" : "Update data"}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editMode && (
        <div style={{ marginBottom: 20, padding: 16, background: "#f9f9f9", borderRadius: 8, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Paste directly from Yahoo stat tracker</div>
          <textarea value={editData} onChange={e => setEditData(e.target.value)} placeholder="Paste Yahoo table here..."
            style={{ width: "100%", height: 180, fontSize: 11, fontFamily: "monospace", borderRadius: 6, border: "1px solid #ddd", padding: 8, boxSizing: "border-box", resize: "vertical" }} />
          <button onClick={handleEditSave} style={{ marginTop: 8, fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: "#111", color: "white", fontWeight: 600 }}>
            Save & recalculate
          </button>
        </div>
      )}

      {/* Standings */}
      {view === "standings" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
                <th style={{ textAlign: "left", padding: "6px 6px", fontWeight: 600, width: 24 }}>#</th>
                <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, minWidth: 160 }}>Team</th>
                {CATS.map(c => <SortTh key={c.key} k={c.key} label={c.label} />)}
                <SortTh k="total" label="Total" style={{ minWidth: 46, padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {displayRows.map((t, i) => (
                <tr key={t.name} style={{ borderBottom: "1px solid #f0f0f0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                  <td style={{ padding: "8px 6px", color: "#aaa" }}>{i + 1}</td>
                  <td style={{ padding: "8px 8px", fontWeight: i < 3 ? 600 : 400, whiteSpace: "nowrap" }}>{t.name}</td>
                  {CATS.map(c => (
                    <td key={c.key} style={{ padding: "8px 4px", textAlign: "right", fontWeight: sortKey === c.key ? 600 : 400 }}>
                      {fmtPts(t.pts[c.key])}
                    </td>
                  ))}
                  <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 600 }}>{fmtPts(t.total)}</td>
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
              <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
                <th style={{ textAlign: "left", padding: "6px 6px", fontWeight: 600, fontSize: 12, width: 24 }}>#</th>
                <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, fontSize: 12, minWidth: 160 }}>Team</th>
                {CATS.map(c => <SortTh key={c.key} k={c.key} label={c.label} style={{ minWidth: 52 }} />)}
                <SortTh k="total" label="Total" style={{ minWidth: 52, padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {displayRows.map((t, i) => (
                <tr key={t.name} style={{ borderBottom: "1px solid #e5e5e5" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                  <td style={{ padding: "10px 6px", fontSize: 12, color: "#aaa", verticalAlign: "middle" }}>{i + 1}</td>
                  <td style={{ padding: "10px 8px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", verticalAlign: "middle" }}>{t.name}</td>
                  {CATS.map(c => (
                    <td key={c.key} style={{ padding: "10px 4px", textAlign: "right", verticalAlign: "middle", background: sortKey === c.key ? "#fafafa" : "transparent" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: "bold" }}>{c.fmt(t[c.key as keyof Team] as number)}</span>
                      <span style={{ display: "block", fontSize: 10, color: "#999", marginTop: 2 }}>{fmtPts(t.pts[c.key])} pts</span>
                    </td>
                  ))}
                  <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, verticalAlign: "middle" }}>{fmtPts(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History */}
      {view === "history" && (
        <div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            {lockedCount} of {TOTAL_WEEKS} weeks locked
          </div>
          {lockedCount === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", padding: "32px 0", textAlign: "center" }}>No weeks locked yet — check back after Week 1.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {weekResults.map((result, i) => result ? (
                <div key={i} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fafafa", minWidth: 140 }}>
                  <div style={{ fontSize: 10, color: "#aaa", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Week {i + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
                    {result.teams.length === 1
                      ? result.teams[0]
                      : result.teams.map((t, ti) => <div key={ti}>{t}</div>)
                    }
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{fmtPts(result.points)} pts{result.teams.length > 1 ? " (tie)" : ""}</div>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      )}

      {/* Commissioner Tool */}
      <div style={{ marginTop: 60, borderTop: "1px solid #e5e5e5", paddingTop: 24 }}>
        <div style={{ fontSize: 11, color: "#ccc", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Commissioner</div>

        {!commUnlocked ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="password" placeholder="Password" value={commPassword}
              onChange={e => setCommPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCommLogin()}
              style={{ fontSize: 13, padding: "5px 10px", borderRadius: 6, border: `1px solid ${commError ? "#c00" : "#ddd"}`, width: 160 }} />
            <button onClick={handleCommLogin}
              style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", background: "white" }}>
              Unlock
            </button>
            {commError && <span style={{ fontSize: 12, color: "#c00" }}>Incorrect password</span>}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Weekly Winners</div>
              <button onClick={() => setCommUnlocked(false)}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", color: "#888", background: "white" }}>
                Lock
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, width: 60 }}>Week</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600 }}>Winner(s)</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, width: 100 }}>Points</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                  const draft = draftWeeks[i];
                  const locked = weekResults[i];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "8px 8px", color: "#888", fontWeight: 600 }}>Wk {i + 1}</td>
                      <td style={{ padding: "8px 8px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {draft.teams.map((team, ti) => (
                            <div key={ti} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <select value={team} onChange={e => updateDraftTeam(i, ti, e.target.value)}
                                style={{ fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid #ddd", flex: 1 }}>
                                <option value="">— Select team —</option>
                                {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                              {draft.teams.length > 1 && (
                                <button onClick={() => removeDraftTeam(i, ti)}
                                  style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid #ddd", cursor: "pointer", color: "#c00", background: "white" }}>✕</button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => addDraftTeam(i)}
                            style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #ddd", cursor: "pointer", color: "#555", background: "white", alignSelf: "flex-start", marginTop: 2 }}>
                            + Add team (tie)
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "8px 8px", verticalAlign: "top" }}>
                        <input type="number" value={draft.points} onChange={e => {
                          const newDrafts = [...draftWeeks];
                          newDrafts[i] = { ...newDrafts[i], points: e.target.value };
                          setDraftWeeks(newDrafts);
                        }}
                          placeholder="pts" style={{ fontSize: 12, padding: "4px 6px", borderRadius: 4, border: "1px solid #ddd", width: 70 }} />
                      </td>
                      <td style={{ padding: "8px 8px", textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button onClick={() => handleSaveWeek(i)}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, border: "none", cursor: "pointer", background: "#111", color: "white", fontWeight: 600 }}>
                            {locked ? "Update" : "Save"}
                          </button>
                          {locked && (
                            <button onClick={() => handleClearWeek(i)}
                              style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", cursor: "pointer", color: "#c00", background: "white" }}>
                              Clear
                            </button>
                          )}
                        </div>
                        {locked && <div style={{ fontSize: 10, color: "#aaa", marginTop: 4, textAlign: "right" }}>Saved</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: "#ccc" }}>
        12-team roto · R HR RBI SB AVG OPS W K ERA WHIP QS SVH · Ties split points
      </div>
    </div>
  );
}
