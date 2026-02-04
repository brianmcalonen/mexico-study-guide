import React, { useEffect, useMemo, useState, useRef } from "react";
import "./App.css";

const LS_KEY = "mx_naturalizacion_trainer_v1";

function safeParse(json, fallback) {
try {
return JSON.parse(json) ?? fallback;
} catch {
return fallback;
}
}

function shuffle(arr) {
const a = [...arr];
for (let i = a.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[a[i], a[j]] = [a[j], a[i]];
}
return a;
}

export default function App() {
const [all, setAll] = useState([]);
const [allMcq, setAllMcq] = useState([]);
const [loading, setLoading] = useState(true);

const [category, setCategory] = useState("All");
// Always show both Spanish and English together (no single-language toggle)
const [order, setOrder] = useState("SHUFFLE"); // SHUFFLE | IN_ORDER
const [mode, setMode] = useState(() => "mcq"); // short | mcq
const [lang, setLang] = useState(() => "es"); // both | en | es
const [showSettings, setShowSettings] = useState(false);

const [deck, setDeck] = useState([]);
const [idx, setIdx] = useState(0);
const [showAnswer, setShowAnswer] = useState(false);
const [mcqSelection, setMcqSelection] = useState(null); // {index,isRight,qid}
const mcqTimerRef = useRef(null);
const mcqSelectionRef = useRef(null);
const [dark, setDark] = useState(() =>
(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ?? false
);
const [isDesktop, setIsDesktop] = useState(() =>
typeof window !== "undefined" ? window.innerWidth >= 900 : true
);

useEffect(() => {
function onResize() {
setIsDesktop(window.innerWidth >= 900);
}
window.addEventListener("resize", onResize);
return () => window.removeEventListener("resize", onResize);
}, []);

// results[qid] = { right: number, wrong: number, last: "right"|"wrong" }
const [results, setResults] = useState({});

// Load JSON from /public
useEffect(() => {
async function load() {
try {
  setLoading(true);
  const base = process.env.PUBLIC_URL || "";
  // load short-answer QA
  const res = await fetch(`${base}/naturalizacion_qa_en.json`);
  const json = await res.json();

  const normalized = (Array.isArray(json) ? json : [])
    .filter((x) => x && (x.question_en || x.question))
    .map((x) => ({
      qid: `qa-${x.qid ?? Math.random()}`,
      raw_qid: x.qid,
      source: "qa",
      category: x.category ?? "General",
      question: x.question ?? "",
      answer: x.answer ?? "",
      question_en: x.question_en ?? x.question ?? "",
      answer_en: x.answer_en ?? x.answer ?? "",
    }));

  setAll(normalized);

  // load MCQ file (optional)
  try {
    const res2 = await fetch(`${base}/naturalizacion_mcq.json`);
    const json2 = await res2.json();
    const normalizedMcq = (Array.isArray(json2) ? json2 : []).map((m, idx) => ({
      qid: `mcq-${m.mcq_id ?? idx}`,
      raw_mcq_id: m.mcq_id ?? idx,
      source: "mcq",
      category: m.category ?? "General",
      stem: m.stem_es ?? m.stem_en ?? "",
      stem_en: m.stem_en ?? m.stem_es ?? "",
      stem_es: m.stem_es ?? m.stem_en ?? "",
      options: Array.isArray(m.options) ? m.options.map((o) => ({
        es: o.es ?? "",
        en: o.en ?? "",
        is_correct: !!o.is_correct,
      })) : [],
      answer_index: typeof m.answer_index === 'number' ? m.answer_index : null,
    }));
    setAllMcq(normalizedMcq);
  } catch (e) {
    // MCQ file optional
    setAllMcq([]);
  }
} catch (e) {
  console.error("Failed to load JSON:", e);
  setAll([]);
} finally {
  setLoading(false);
}
}
load();
}, []);

const categories = useMemo(() => {
const set = new Set([
...all.map((q) => q.category || "General"),
...allMcq.map((q) => q.category || "General"),
]);
return ["All", ...Array.from(set).sort()];
}, [all, allMcq]);

const counts = useMemo(() => {
const mAll = {};
for (const q of all) {
const k = q.category ?? "General";
mAll[k] = (mAll[k] || 0) + 1;
}

const mMcq = {};
for (const q of allMcq) {
const k = q.category ?? "General";
mMcq[k] = (mMcq[k] || 0) + 1;
}

return { all: mAll, mcq: mMcq };
}, [all, allMcq]);

// Load saved state
useEffect(() => {
const saved = safeParse(localStorage.getItem(LS_KEY), null);
if (saved?.results) setResults(saved.results);
if (saved?.prefs) {
setCategory(saved.prefs.category ?? "All");
setOrder(saved.prefs.order ?? "SHUFFLE");
setMode(saved.prefs.mode ?? "mcq");
setLang(saved.prefs.lang ?? "es");
}
}, []);

// clear MCQ timer on unmount or when current changes
useEffect(() => {
return () => {
if (mcqTimerRef.current) {
  clearTimeout(mcqTimerRef.current);
  mcqTimerRef.current = null;
}
};
}, []);

// Build deck whenever prefs change
useEffect(() => {
const source = mode === "mcq" ? allMcq : all;
const filtered = category === "All" ? source : source.filter((q) => q.category === category);
const built = order === "SHUFFLE" ? shuffle(filtered) : filtered;

setDeck(built);
setIdx(0);
setShowAnswer(false);
}, [all, allMcq, category, order, mode]);

// Persist results + prefs
useEffect(() => {
localStorage.setItem(
LS_KEY,
JSON.stringify({
  results,
  prefs: { category, order, mode, lang },
})
);
}, [results, category, order, mode, lang]);

const current = deck[idx];
const displayId = current
? current.source === "mcq"
? String(current.raw_mcq_id ?? String(current.qid).replace(/^mcq-/, ""))
: String(current.raw_qid ?? String(current.qid).replace(/^qa-/, ""))
: null;

const totals = useMemo(() => {
let right = 0,
wrong = 0,
seen = 0;

for (const k of Object.keys(results)) {
const r = results[k];
right += r?.right ?? 0;
wrong += r?.wrong ?? 0;
if ((r?.right ?? 0) + (r?.wrong ?? 0) > 0) seen++;
}

const total = mode === "mcq" ? allMcq.length : all.length;
return { right, wrong, seen, total };
}, [results, all.length, allMcq.length, mode]);

function handleMcqSelect(index) {
if (!current || current.source !== "mcq") return;
if (mcqSelectionRef.current) return; // already selected

const opt = current.options?.[index];
const isRight = !!opt?.is_correct || current.answer_index === index;
const qid = String(current.qid);

// set visual selection
setMcqSelection({ index, isRight, qid });
mcqSelectionRef.current = { index, isRight, qid };

// after brief feedback, record result and advance
mcqTimerRef.current = setTimeout(() => {
setResults((prev) => {
  const prevRow = prev[qid] ?? { right: 0, wrong: 0, last: null };
  return {
    ...prev,
    [qid]: {
      right: prevRow.right + (isRight ? 1 : 0),
      wrong: prevRow.wrong + (!isRight ? 1 : 0),
      last: isRight ? "right" : "wrong",
    },
  };
});

setIdx((i) => (i + 1 < deck.length ? i + 1 : i));
setShowAnswer(false);
setMcqSelection(null);
mcqSelectionRef.current = null;
}, 800);
}

function mark(isRight) {
if (!current) return;

const id = String(current.qid);

setResults((prev) => {
const prevRow = prev[id] ?? { right: 0, wrong: 0, last: null };
return {
  ...prev,
  [id]: {
    right: prevRow.right + (isRight ? 1 : 0),
    wrong: prevRow.wrong + (!isRight ? 1 : 0),
    last: isRight ? "right" : "wrong",
  },
};
});

// advance
setShowAnswer(false);
setIdx((i) => (i + 1 < deck.length ? i + 1 : i));
}

function prevCard() {
setShowAnswer(false);
setIdx((i) => Math.max(0, i - 1));
}

function nextCard() {
setShowAnswer(false);
setIdx((i) => Math.min(deck.length - 1, i + 1));
}

function resetProgress() {
const ok = window.confirm("Reset all right/wrong history?");
if (!ok) return;
setResults({});
}

function reshuffle() {
const source = mode === "mcq" ? allMcq : all;
const filtered = category === "All" ? source : source.filter((q) => q.category === category);
setDeck(shuffle(filtered));
setIdx(0);
setShowAnswer(false);
}

// Card text will render both Spanish and English versions directly.

const curStats = current ? results[String(current.qid)] : null;

const theme = dark
? {
  pageBg: "#071028",
  cardBg: "#071226",
  text: "#e6eef8",
  muted: "rgba(230,238,248,0.75)",
  border: "#1f2937",
  hr: "#0f1724",
}
: {
  pageBg: "#ffffff",
  cardBg: "#ffffff",
  text: "#111827",
  muted: "rgba(17,24,39,0.6)",
  border: "#e5e7eb",
  hr: "#e5e7eb",
};

const styles = {
page: {
fontFamily:
  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
padding: isDesktop ? 28 : 14,
maxWidth: isDesktop ? 1100 : 900,
margin: "0 auto",
lineHeight: 1.35,
background: theme.pageBg,
color: theme.text,
minHeight: "100vh",
},
header: {
display: "flex",
gap: isDesktop ? 20 : 12,
justifyContent: "space-between",
alignItems: "flex-start",
flexWrap: "wrap",
marginBottom: isDesktop ? 16 : 12,
},
title: { fontSize: isDesktop ? 24 : 20, fontWeight: 800 },
title: { fontSize: isDesktop ? 26 : 22, fontWeight: 800 },
subtitle: { opacity: 0.75, marginTop: 4 },
stats: {
border: `1px solid ${theme.border}`,
borderRadius: 12,
padding: isDesktop ? "10px 24px" : "8px 16px",
minWidth: isDesktop ? 260 : 180,
fontSize: 13,
width: !isDesktop ? "100%" : "auto",
},
controls: {
display: "flex",
gap: 8,
flexWrap: "wrap",
alignItems: "center",
marginBottom: 12,
},
control: { fontSize: 15, display: "flex", alignItems: "center" },
select: {
padding: "8px 10px",
borderRadius: 10,
border: `1px solid ${theme.border}`,
background: theme.cardBg,
color: theme.text,
fontSize: 16,
},
button: {
padding: "10px 12px",
fontSize: 15,
borderRadius: 12,
border: `1px solid ${theme.border}`,
background: theme.cardBg,
color: theme.text,
cursor: "pointer",
},
buttonDanger: {
padding: "14px 18px",      // was 8px 10px
fontSize: 15,              // match other big buttons
borderRadius: 14,
border: `1px solid #fecaca`,
background: theme.cardBg,
cursor: "pointer",
color: theme.text,
width: '100%',             // important
},
cardWrap: { marginTop: 8 },
card: {
border: `1px solid ${theme.border}`,
borderRadius: 16,
padding: isDesktop ? 18 : 12,
cursor: "pointer",
userSelect: "none",
boxShadow: dark ? "0 6px 24px rgba(0,0,0,0.45)" : "0 1px 12px rgba(0,0,0,0.04)",
background: theme.cardBg,
},
cardTop: {
display: "flex",
justifyContent: "space-between",
fontSize: 15,
opacity: 0.9,
marginBottom: 8,
},
cardTopRight: { fontVariantNumeric: "tabular-nums" },
cardBody: { padding: "4px 2px 10px 2px" },
qLabel: { fontSize: 14, opacity: 0.6, marginBottom: 6 },
qText: { fontSize: isDesktop ? 20 : 18, fontWeight: 650 },
aLabel: { fontSize: 14, opacity: 0.6, marginBottom: 6 },
aText: { fontSize: 18 },
revealHint: { opacity: 0.7, fontStyle: "italic" },
hr: { height: 1, background: theme.hr, margin: "12px 0" },
cardFooter: {
display: "flex",
justifyContent: "space-between",
gap: 10,
flexWrap: "wrap",
borderTop: `1px dashed ${theme.border}`,
paddingTop: 10,
marginTop: 10,
},
small: { fontSize: 14, opacity: 0.85 },
smallMuted: { fontSize: 14, color: theme.muted },
actions: {
display: isDesktop ? "flex" : "grid",
gridTemplateColumns: isDesktop ? undefined : "1fr 1fr",
gap: 8,
justifyContent: "center",
marginTop: 12,
flexWrap: "wrap",
},
buttonSecondary: {
padding: "14px 18px",
fontSize: 15,
borderRadius: 14,
border: `1px solid ${theme.border}`,
background: theme.cardBg,
color: theme.text,
cursor: "pointer",
minWidth: 80,
flex: !isDesktop ? 1 : "unset",
maxWidth: isDesktop ? "unset" : 200,
},
buttonGood: {
padding: "14px 18px",
fontSize: 15,
borderRadius: 14,
border: `1px solid #bbf7d0`,
background: theme.cardBg,
cursor: "pointer",
minWidth: isDesktop ? 110 : "unset",
color: theme.text,
flex: !isDesktop ? 1 : "unset",
maxWidth: isDesktop ? "unset" : 200,
},
buttonBad: {
padding: "14px 18px",
fontSize: 15,
borderRadius: 14,
border: `1px solid #fecaca`,
background: theme.cardBg,
cursor: "pointer",
minWidth: isDesktop ? 110 : "unset",
color: theme.text,
flex: !isDesktop ? 1 : "unset",
maxWidth: isDesktop ? "unset" : 200,
},
};

if (loading) {
return (
<div style={styles.page}>
  <h2 style={{ margin: 0 }}>Naturalización Trainer</h2>
  <p style={{ opacity: 0.7 }}>Loading questions…</p>
</div>
);
}

return (
<div style={styles.page}>
<div style={styles.header}>
  <div>
    <div style={styles.title}>Naturalización Trainer</div>
  </div>

  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <button
      onClick={() => setShowSettings(true)}
      style={{ ...styles.button, padding: '12px 16px', fontSize: 18 }}
      aria-label="Open settings"
    >
      <span style={{ fontSize: 26, lineHeight: 1, marginRight: 8 }}>⚙︎</span>
      <span style={{ fontSize: 16 }}>Settings</span>
    </button>
  </div>
</div>

<div style={styles.controls}>
  <label style={styles.control}>
    Category&nbsp;
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      style={styles.select}
    >
      {categories.map((c) => (
        <option key={c} value={c}>
          {`${c} (${c === "All" ? (mode === 'mcq' ? allMcq.length : all.length) : (mode === 'mcq' ? counts.mcq[c] || 0 : counts.all[c] || 0)})`}
        </option>
      ))}
    </select>
  </label>

  
  
</div>

{/* Settings side panel */}
{showSettings && (
  <div>
    <div
      onClick={() => setShowSettings(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 50 }}
    />

    <aside
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100%',
        width: 340,
        background: theme.cardBg,
        borderLeft: `1px solid ${theme.border}`,
        padding: 18,
        zIndex: 60,
        boxShadow: dark ? '0 6px 24px rgba(0,0,0,0.6)' : '0 6px 24px rgba(0,0,0,0.08)'
      }}
      role="dialog"
      aria-label="Settings"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Settings</strong>
        <button onClick={() => setShowSettings(false)} style={styles.button}>Close</button>
      </div>

      <div
style={{
marginTop: 18,
display: 'flex',
flexDirection: 'column',
gap: 28,
}}
>
        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Deck</div>
          <div style={{ fontWeight: 700 }}>{deck.length} cards</div>
        </div>

        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Seen</div>
          <div style={{ fontWeight: 700 }}>{totals.seen}/{totals.total}</div>
        </div>

        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Order</div>
          <select value={order} onChange={(e) => setOrder(e.target.value)} style={styles.select}>
            <option value="SHUFFLE">Shuffle</option>
            <option value="IN_ORDER">In order</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Mode</div>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={styles.select}>
            <option value="short">Short answer</option>
            <option value="mcq">Multiple choice</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Language</div>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={styles.select}>
            <option value="es">Spanish</option>
            <option value="en">English</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div
style={{
  display: 'grid',
  gap: 18,
  paddingTop: 10,
  paddingBottom: 6,
}}
>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setDark((d) => !d)}
                aria-pressed={dark}
                aria-label="Toggle dark mode"
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 20,
                  padding: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.border}`,
                  background: dark ? '#10b981' : theme.cardBg,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 16,
                    background: dark ? '#064e3b' : '#fff',
                    transform: dark ? 'translateX(22px)' : 'translateX(0px)',
                    transition: 'transform 180ms ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                />
              </button>
              <span style={{ fontSize: 15 }}>{dark ? 'Dark mode' : 'Light mode'}</span>
            </div>
          </div>

          <div>
            <button
onClick={reshuffle}
style={{ ...styles.button, width: '100%', padding: "14px 18px", borderRadius: 14 }}
>
              Reshuffle deck
            </button>
          </div>

          <div>
            <button onClick={resetProgress} style={styles.buttonDanger}>
              Clear all history
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>
)}

<div style={styles.cardWrap}>
  {!current ? (
    <div style={styles.card}>
      <div style={styles.cardTop}>No cards found.</div>
      <div style={styles.cardBody}>
        Try choosing “All” categories.
      </div>
    </div>
  ) : (
    <div
      style={styles.card}
      onClick={() => setShowAnswer((s) => !s)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setShowAnswer((s) => !s);
      }}
    >
      <div style={styles.cardTop}>
        <div>
          <strong>#{displayId}</strong> · {current.category}
        </div>
        <div style={styles.cardTopRight}>
          {idx + 1}/{deck.length}
        </div>
      </div>

      <div style={styles.cardBody}>
        {current.source === "mcq" ? (
          <>
            {(lang === "both" || lang === "es") && (
              <>
                <div style={styles.qText}>{current.stem_es || current.stem}</div>
                <div style={{ height: 8 }} />
              </>
            )}

            {(lang === "both" || lang === "en") && (
              <>
                <div style={styles.qText}>{current.stem_en || current.stem}</div>
                <div style={styles.hr} />
              </>
            )}

            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              {(current.options || []).map((opt, i) => {
                const sel = mcqSelection;
                let extra = {};
                const disabled = !!sel;
                if (sel) {
                  const correctIndex = current.answer_index;
                  if (sel.index === i) {
                    // selected option
                    extra = sel.isRight
                      ? { background: "#dcfce7", border: `1px solid #10b981`, color: "#065f46" }
                      : { background: "#fee2e2", border: `1px solid #ef4444`, color: "#7f1d1d" };
                  } else if (!sel.isRight && i === correctIndex) {
                    // show correct option when user picked wrong
                    extra = { background: "#dcfce7", border: `1px solid #10b981`, color: "#065f46" };
                  } else {
                    extra = { opacity: 0.85 };
                  }
                }

                return (
                  <button
                    key={String(i)}
                    onClick={() => handleMcqSelect(i)}
                    disabled={disabled}
                    style={{
                      ...styles.buttonSecondary,
                      textAlign: "left",
                      padding: "10px 12px",
                      cursor: disabled ? "default" : "pointer",
                      ...extra,
                    }}
                  >
                    {lang === "en" ? (
                      <div style={{ fontSize: 20 }}>{opt.en}</div>
                    ) : lang === "es" ? (
                      <div style={{ fontSize: 20 }}>{opt.es}</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 18, opacity: sel ? 1 : 0.85 }}>{opt.es}</div>
                        <div style={{ fontSize: 16, color: sel ? 'inherit' : theme.muted }}>{opt.en}</div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {(lang === "both" || lang === "es") && (
              <>
                <div style={styles.qText}>{current.question}</div>
                <div style={{ height: 8 }} />
              </>
            )}

            {(lang === "both" || lang === "en") && (
              <>
                <div style={styles.qText}>{current.question_en}</div>
              </>
            )}

            <div style={styles.hr} />

            {!showAnswer ? (
              <div style={styles.revealHint}>Click to reveal answers / Haz clic para ver las respuestas</div>
            ) : (
              <>
                {(lang === "both" || lang === "es") && (
                  <>
                    <div style={styles.aLabel}>Respuesta (ES)</div>
                    <div style={styles.aText}>{current.answer}</div>
                  </>
                )}

                {(lang === "both" || lang === "en") && (
                  <>
                    <div style={styles.hr} />
                    <div style={styles.aLabel}>Answer (EN)</div>
                    <div style={styles.aText}>{current.answer_en}</div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div style={styles.cardFooter}>
        <div style={styles.small}>
          {curStats ? (
            <>
              This card: ✅ {curStats.right} · ❌ {curStats.wrong} · last:{" "}
              {curStats.last}
            </>
          ) : (
            "This card: not graded yet"
          )}
        </div>
        <div style={styles.smallMuted}>Tip: space/enter toggles</div>
      </div>
    </div>
  )}
</div>

<div style={styles.actions}>
  {mode !== "mcq" && (
    <>
      <button
        onClick={() => mark(false)}
        style={styles.buttonBad}
        disabled={!current}
      >
        ❌ Wrong
      </button>

      <button
        onClick={() => mark(true)}
        style={styles.buttonGood}
        disabled={!current}
      >
        ✅ Right
      </button>
    </>
  )}

  <button onClick={prevCard} style={styles.buttonSecondary}>
    ← Prev
  </button>

  <button onClick={nextCard} style={styles.buttonSecondary}>
    Next →
  </button>
</div>
</div>
);
}

// (styles moved into component to support theme/dark mode)
