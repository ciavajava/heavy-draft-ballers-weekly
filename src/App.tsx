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

type Team = { name: string; r: number; hr: number; rbi: number; sb: number; avg: number; ops: number; w: number; k: number; era: number; whip: number; qs: number; svh: number; };
type ScoredTeam = Team & { pts: Record<string, number>; total: number; };
type WeekEntry = { week: number; lockedAt: string; snapshot: { rank: number; name: string; total: number; pts: Record<string, number> }[]; winner: string; winnerPts: number; };

const STORAGE_KEY = "roto_weekly_history";
const TEAMS_KEY = "roto_live_teams";

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

export default function App() {
  const [view, setView] = useState("standings");
  const [sortKey, setSortKey] = useState("total");
  const [sortAsc, setSortAsc] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState("");
  const [liveTeams, setLiveTeams] = useState<Team[]>(DEFAULT_DATA);
  const [weeklyHistory, setWeeklyHistory] = useState<WeekEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [lockWeekNum, setLockWeekNum] = useState("");
  const [lockConfirm, setLockConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [histRes, teamsRes] = await Promise.all([
          fetch("/api/storage?key=" + STORAGE_KEY),
          fetch("/api/storage?key=" + TEAMS_KEY),
        ]);
        if (histRes.ok) {
          const h = await histRes.json();
          if (h.value) { const parsed = JSON.parse(h.value); setWeeklyHistory(parsed); if (parsed.length) setSelectedWeek(parsed[parsed.length - 1].week); }
        }
        if (teamsRes.ok) {
          const t = await teamsRes.json();
          if (t.value) setLiveTeams(JSON.parse(t.value));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadData();
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
      alert("Couldn't parse that — make sure you're pasting directly from the Yahoo stat tracker table.");
    }
  };

  const scored = computeRoto(liveTeams);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const displayRows = [...scored].sort((a, b) => {
    const aVal = sortKey === "total" ? a.total : a.pts[sortKey];
    const bVal = sortKey === "total" ? b.total : b.pts[sortKey];
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleLockWeek = async () => {
    const wn = parseInt(lockWeekNum);
    if (!wn || wn < 1) { alert("Enter a valid week number."); return; }
    if (weeklyHistory.find(w => w.week === wn)) { alert(`Week ${wn} is already locked.`); return; }
    const snapshot = scored.map((t, i) => ({ rank: i + 1, name: t.name, total: t.total, pts: { ...t.pts } }));
    const entry: WeekEntry = { week: wn, lockedAt: new Date().toISOString(), snapshot, winner: snapshot[0].name, winnerPts: snapshot[0].total };
    const newHistory = [...weeklyHistory, entry].sort((a, b) => a.week - b.week);
    setWeeklyHistory(newHistory);
    setSelectedWeek(wn);
    await saveToKV(STORAGE_KEY, JSON.stringify(newHistory));
    setLockWeekNum("");
    setLockConfirm(false);
  };

  const handleDeleteWeek = async (wn: number) => {
    const newHistory = weeklyHistory.filter(w => w.week !== wn);
    setWeeklyHistory(newHistory);
    setSelectedWeek(newHistory.length ? newHistory[newHistory.length - 1].week : null);
    await saveToKV(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const selectedEntry = weeklyHistory.find(w => w.week === selectedWeek);

  const SortTh = ({ k, label, style = {} }: { k: string; label: string; style?: React.CSSProperties }) => {
    const active = sortKey === k;
    return (
      <th onClick={() => handleSort(k)} style={{ textAlign: "right", padding: "6px 4px", fontWeight: active ? 500 : 400, minWidth: 34, fontSize: 11, color: active ? "#111" : "#888", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style }}>
        {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
      </th>
    );
  };

  if (loading) return <div style={{ padding: 32, fontFamily: "sans-serif", color: "#888" }}>Loading...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: "#111" }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>Heavy Draft Ballers Weekly</div>
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

      {editMode && (
        <div style={{ marginBottom: 20, padding: 16, background: "#f9f9f9", borderRadius: 8, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Paste directly from Yahoo stat tracker</div>
          <textarea value={editData} onChange={e => setEditData(e.target.value)} placeholder="Paste Yahoo table here..."
            style={{ width: "100%", height: 180, fontSize: 11, fontFamily: "monospace", borderRadius: 6, border: "1px solid #ddd", padding: 8, boxSizing: "border-box", resize: "vertical" }} />
          <button onClick={handleEditSave} style={{ marginTop: 8, fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", background: "#111", color: "white", fontWeight: 500 }}>
            Save & recalculate
          </button>
        </div>
      )}

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

      {view === "breakdown" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
                <th style={{ textAlign: "left", padding: "6px 6px", fontWeight: 600, width: 24 }}>#</th>
                <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, minWidth: 160 }}>Team</th>
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

      {view === "history" && (
        <div>
          <div style={{ marginBottom: 20, padding: 16, background: "#f9f9f9", borderRadius: 8, border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Lock current standings as a week snapshot</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input type="number" min="1" placeholder="Week #" value={lockWeekNum} onChange={e => { setLockWeekNum(e.target.value); setLockConfirm(false); }}
                style={{ width: 90, fontSize: 13, padding: "5px 8px", borderRadius: 6, border: "1px solid #ddd" }} />
              {!lockConfirm ? (
                <button onClick={() => { if (lockWeekNum) setLockConfirm(true); }}
                  style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", background: "white" }}>
                  Lock week
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Lock Week {lockWeekNum}?</span>
                  <button onClick={handleLockWeek} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", background: "#111", color: "white", fontWeight: 500 }}>Confirm</button>
                  <button onClick={() => setLockConfirm(false)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer" }}>Cancel</button>
                </div>
              )}
            </div>
          </div>

          {weeklyHistory.length === 0 ? (
            <div style={{ fontSize: 13, color: "#888", padding: "24px 0", textAlign: "center" }}>No weeks locked yet.</div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Weekly winners</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {weeklyHistory.map(w => (
                  <div key={w.week} onClick={() => setSelectedWeek(w.week)}
                    style={{ padding: "10px 14px", borderRadius: 8, border: selectedWeek === w.week ? "2px solid #111" : "1px solid #e5e5e5", background: "#fafafa", cursor: "pointer", minWidth: 130 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>WEEK {w.week}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.winner}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{fmtPts(w.winnerPts)} pts</div>
                  </div>
                ))}
              </div>

              {selectedEntry && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Week {selectedEntry.week} — Final Standings</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#888" }}>Locked {new Date(selectedEntry.lockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <button onClick={() => handleDeleteWeek(selectedEntry.week)}
                        style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", color: "#c00", background: "white" }}>Delete</button>
                    </div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
                        <th style={{ textAlign: "left", padding: "6px 6px", fontWeight: 600, width: 24 }}>#</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, minWidth: 160 }}>Team</th>
                        {CATS.map(c => <th key={c.key} style={{ textAlign: "right", padding: "6px 4px", fontWeight: 400, fontSize: 11, color: "#888", minWidth: 34 }}>{c.label}</th>)}
                        <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, minWidth: 46 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntry.snapshot.map((t, i) => (
                        <tr key={t.name} style={{ borderBottom: "1px solid #f0f0f0" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                          onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                          <td style={{ padding: "7px 6px", color: "#aaa" }}>{t.rank}</td>
                          <td style={{ padding: "7px 8px", fontWeight: i < 3 ? 600 : 400, whiteSpace: "nowrap" }}>{t.name}</td>
                          {CATS.map(c => <td key={c.key} style={{ padding: "7px 4px", textAlign: "right" }}>{fmtPts(t.pts[c.key])}</td>)}
                          <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600 }}>{fmtPts(t.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 11, color: "#aaa" }}>
        12-team roto · R HR RBI SB AVG OPS W K ERA WHIP QS SVH · Ties split points
      </div>
    </div>
  );
}
