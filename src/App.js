import React, { useEffect, useMemo, useState } from "react";
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
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("All");
  // Always show both Spanish and English together (no single-language toggle)
  const [order, setOrder] = useState("SHUFFLE"); // SHUFFLE | IN_ORDER

  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
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
        const res = await fetch(`${base}/naturalizacion_qa_en.json`);
        const json = await res.json();

        const normalized = (Array.isArray(json) ? json : [])
          .filter((x) => x && (x.question_en || x.question))
          .map((x) => ({
            qid: x.qid ?? `${Math.random()}`,
            category: x.category ?? "General",
            question: x.question ?? "",
            answer: x.answer ?? "",
            question_en: x.question_en ?? x.question ?? "",
            answer_en: x.answer_en ?? x.answer ?? "",
          }));

        setAll(normalized);
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
    const set = new Set(all.map((q) => q.category || "General"));
    return ["All", ...Array.from(set).sort()];
  }, [all]);

  const counts = useMemo(() => {
    const m = {};
    for (const q of all) {
      const k = q.category ?? "General";
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [all]);

  // Load saved state
  useEffect(() => {
    const saved = safeParse(localStorage.getItem(LS_KEY), null);
    if (saved?.results) setResults(saved.results);
    if (saved?.prefs) {
      setCategory(saved.prefs.category ?? "All");
      setOrder(saved.prefs.order ?? "SHUFFLE");
    }
  }, []);

  // Build deck whenever prefs change
  useEffect(() => {
    const filtered =
      category === "All" ? all : all.filter((q) => q.category === category);
    const built = order === "SHUFFLE" ? shuffle(filtered) : filtered;

    setDeck(built);
    setIdx(0);
    setShowAnswer(false);
  }, [all, category, order]);

  // Persist results + prefs
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        results,
        prefs: { category, order },
      })
    );
  }, [results, category, order]);

  const current = deck[idx];

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

    return { right, wrong, seen, total: all.length };
  }, [results, all.length]);

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
    const filtered =
      category === "All" ? all : all.filter((q) => q.category === category);
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
    control: { fontSize: 13, display: "flex", alignItems: "center" },
    select: {
      padding: "6px 8px",
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
    },
    button: {
      padding: "8px 10px",
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
      cursor: "pointer",
    },
    buttonDanger: {
      padding: "8px 10px",
      borderRadius: 12,
      border: `1px solid #fecaca`,
      background: theme.cardBg,
      cursor: "pointer",
      color: theme.text,
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
      fontSize: 13,
      opacity: 0.85,
      marginBottom: 8,
    },
    cardTopRight: { fontVariantNumeric: "tabular-nums" },
    cardBody: { padding: "4px 2px 10px 2px" },
    qLabel: { fontSize: 12, opacity: 0.6, marginBottom: 6 },
    qText: { fontSize: isDesktop ? 20 : 18, fontWeight: 650 },
    aLabel: { fontSize: 12, opacity: 0.6, marginBottom: 6 },
    aText: { fontSize: 17 },
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
    small: { fontSize: 12, opacity: 0.85 },
    smallMuted: { fontSize: 12, color: theme.muted },
    actions: {
      display: isDesktop ? "flex" : "grid",
      gridTemplateColumns: isDesktop ? undefined : "1fr 1fr",
      gap: 8,
      justifyContent: "center",
      marginTop: 12,
      flexWrap: "wrap",
    },
    buttonSecondary: {
      padding: "12px 16px",
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
      padding: "12px 16px",
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
      padding: "12px 16px",
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
          <div style={styles.subtitle}>
            Click the card to reveal the answer. Mark Right/Wrong.
          </div>
        </div>

        <div style={{ ...styles.stats, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div>
              <strong>Deck:</strong> {deck.length} cards
            </div>
            <div>
              <strong>Seen:</strong> {totals.seen}/{totals.total}
            </div>
          </div>
          <div>
            <div>
              <strong>Right:</strong> {totals.right}
            </div>
            <div>
              <strong>Wrong:</strong> {totals.wrong}
            </div>
          </div>
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
                {`${c} (${c === "All" ? all.length : counts[c] || 0})`}
              </option>
            ))}
          </select>
        </label>

        {/* Language selector removed — always show both Spanish and English */}

        <label style={styles.control}>
          Order&nbsp;
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            style={styles.select}
          >
            <option value="SHUFFLE">Shuffle</option>
            <option value="IN_ORDER">In order</option>
          </select>
        </label>

        <button onClick={() => setDark((d) => !d)} style={styles.button} aria-pressed={dark}>
          {dark ? "Light Mode" : "Dark Mode"}
        </button>

        <button onClick={reshuffle} style={styles.button}>
          Reshuffle
        </button>
        <button onClick={resetProgress} style={styles.buttonDanger}>
          Reset progress
        </button>
      </div>

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
                <strong>#{current.qid}</strong> · {current.category}
              </div>
              <div style={styles.cardTopRight}>
                {idx + 1}/{deck.length}
              </div>
            </div>

            <div style={styles.cardBody}>
              <div style={styles.qLabel}>Pregunta (ES)</div>
              <div style={styles.qText}>{current.question}</div>

              <div style={{ height: 8 }} />

              <div style={styles.qLabel}>Question (EN)</div>
              <div style={styles.qText}>{current.question_en}</div>

              <div style={styles.hr} />

              {!showAnswer ? (
                <div style={styles.revealHint}>Click to reveal answers / Haz clic para ver las respuestas</div>
              ) : (
                <>
                  <div style={styles.aLabel}>Respuesta (ES)</div>
                  <div style={styles.aText}>{current.answer}</div>

                  <div style={styles.hr} />

                  <div style={styles.aLabel}>Answer (EN)</div>
                  <div style={styles.aText}>{current.answer_en}</div>
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
