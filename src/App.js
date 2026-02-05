import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import "./App.css";
import { LS_KEY, safeParse, shuffle } from "./utils";
import Header from "./components/Header";
import Controls from "./components/Controls";
import SettingsPanel from "./components/SettingsPanel";
import QuestionCard from "./components/QuestionCard";
import ActionButtons from "./components/ActionButtons";

export default function App() {
  const [all, setAll] = useState([]);
  const [allMcq, setAllMcq] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("All");
  const [order, setOrder] = useState("SHUFFLE");
  const [mode, setMode] = useState(() => "mcq");
  const [lang, setLang] = useState(() => "es");
  const [showSettings, setShowSettings] = useState(false);

  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mcqSelection, setMcqSelection] = useState(null);
  const [pendingNext, setPendingNext] = useState(false);
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

  const [results, setResults] = useState(() => {
    if (typeof window === "undefined") return {};
    const saved = safeParse(localStorage.getItem(LS_KEY), null);
    return saved?.results ?? {};
  });

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

  const categoryTally = useMemo(() => {
    const source = mode === "mcq" ? allMcq : all;
    const inCategory =
      category === "All" ? source : source.filter((q) => q.category === category);
    let correctAnswered = 0;

    for (const q of inCategory) {
      const row = results[String(q.qid)];
      if ((row?.right ?? 0) > 0) {
        correctAnswered += 1;
      }
    }

    const totalQuestions = inCategory.length;
    const percent = totalQuestions > 0 ? Math.round((correctAnswered / totalQuestions) * 100) : 0;
    return { correctAnswered, totalQuestions, percent };
  }, [all, allMcq, category, mode, results]);

  const categoryTallies = useMemo(() => {
    const source = mode === "mcq" ? allMcq : all;
    const tallies = {};

    for (const q of source) {
      const cat = q.category ?? "General";
      if (!tallies[cat]) {
        tallies[cat] = { correct: 0, total: 0 };
      }
      tallies[cat].total += 1;
      if ((results[String(q.qid)]?.right ?? 0) > 0) {
        tallies[cat].correct += 1;
      }
    }

    const totalAll = source.length;
    const correctAll = source.reduce(
      (acc, q) => acc + ((results[String(q.qid)]?.right ?? 0) > 0 ? 1 : 0),
      0
    );
    tallies.All = { correct: correctAll, total: totalAll };

    return tallies;
  }, [all, allMcq, mode, results]);

  const completedByCategory = useMemo(() => {
    const completed = {};
    for (const [cat, tally] of Object.entries(categoryTallies)) {
      completed[cat] = (tally?.total ?? 0) > 0 && tally.correct === tally.total;
    }
    return completed;
  }, [categoryTallies]);

  // Load saved state
  useEffect(() => {
    const saved = safeParse(localStorage.getItem(LS_KEY), null);
    if (saved?.results) setResults(saved.results);
    if (saved?.prefs) {
      setCategory(saved.prefs.category ?? "All");
      setOrder(saved.prefs.order ?? "SHUFFLE");
      setMode(saved.prefs.mode ?? "mcq");
      setLang(saved.prefs.lang ?? "es");
      setDark(saved.prefs.dark ?? ((typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ?? false));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (mcqTimerRef.current) {
        clearTimeout(mcqTimerRef.current);
        mcqTimerRef.current = null;
      }
    };
  }, []);

  const hasBeenAnsweredCorrectly = useCallback(
    (question) => {
      const row = results[String(question.qid)];
      return (row?.right ?? 0) > 0;
    },
    [results]
  );

  // Build deck whenever prefs change
  useEffect(() => {
    const source = mode === "mcq" ? allMcq : all;
    const filteredByCategory =
      category === "All" ? source : source.filter((q) => q.category === category);
    const filtered = filteredByCategory.filter(
      (q) => (results[String(q.qid)]?.right ?? 0) === 0
    );
    const built = order === "SHUFFLE" ? shuffle(filtered) : filtered;

    setDeck(built);
    setIdx(0);
    setShowAnswer(false);
    setPendingNext(false);
    setMcqSelection(null);
    mcqSelectionRef.current = null;
  }, [all, allMcq, category, order, mode]);

  // Persist results + prefs
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        results,
        prefs: { category, order, mode, lang, dark },
      })
    );
  }, [results, category, order, mode, lang, dark]);

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
    if (mcqSelectionRef.current) return;

    const opt = current.options?.[index];
    const isRight = !!opt?.is_correct || current.answer_index === index;
    const qid = String(current.qid);

    setMcqSelection({ index, isRight, qid });
    mcqSelectionRef.current = { index, isRight, qid };

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

    setPendingNext(true);
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

    setShowAnswer(false);
    setPendingNext(true);
  }

  function nextCard() {
    if (!deck.length) return;
    const currentId = current?.qid;
    const filteredDeck = deck.filter((q) => !hasBeenAnsweredCorrectly(q));
    if (!filteredDeck.length) {
      setDeck([]);
      setIdx(0);
      setShowAnswer(false);
      setPendingNext(false);
      setMcqSelection(null);
      mcqSelectionRef.current = null;
      return;
    }

    const currentIndexInFiltered = currentId
      ? filteredDeck.findIndex((q) => q.qid === currentId)
      : -1;
    const nextIndex =
      currentIndexInFiltered === -1
        ? Math.min(idx, filteredDeck.length - 1)
        : Math.min(currentIndexInFiltered + 1, filteredDeck.length - 1);

    setDeck(filteredDeck);
    setIdx(nextIndex);
    setShowAnswer(false);
    setMcqSelection(null);
    mcqSelectionRef.current = null;
    setPendingNext(false);
  }

  function resetProgress() {
    const ok = window.confirm("Reset all right/wrong history?");
    if (!ok) return;
    setResults({});
  }

  function reshuffle() {
    const source = mode === "mcq" ? allMcq : all;
    const filteredByCategory =
      category === "All" ? source : source.filter((q) => q.category === category);
    const filtered = filteredByCategory.filter((q) => !hasBeenAnsweredCorrectly(q));
    setDeck(shuffle(filtered));
    setIdx(0);
    setShowAnswer(false);
    setPendingNext(false);
    setMcqSelection(null);
    mcqSelectionRef.current = null;
  }

  const curStats = current ? results[String(current.qid)] : null;

  const theme = dark
    ? {
        pageBg: "#071028",
        cardBg: "#071226",
        text: "#e6eef8",
        muted: "rgba(230,238,248,0.75)",
        border: "#1f2937",
        hr: "#0f1724",
        dark: true,
      }
    : {
        pageBg: "#ffffff",
        cardBg: "#ffffff",
        text: "#111827",
        muted: "rgba(17,24,39,0.6)",
        border: "#e5e7eb",
        hr: "#e5e7eb",
        dark: false,
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
      <Header
        isDesktop={isDesktop}
        theme={theme}
        onOpenSettings={() => setShowSettings(true)}
      />

      <Controls
        category={category}
        categories={categories}
        mode={mode}
        all={all}
        allMcq={allMcq}
        counts={counts}
        completedByCategory={completedByCategory}
        categoryTallies={categoryTallies}
        categoryTally={categoryTally}
        isDesktop={isDesktop}
        theme={theme}
        onCategoryChange={setCategory}
      />

      <SettingsPanel
        show={showSettings}
        dark={dark}
        theme={theme}
        deck={deck}
        totals={totals}
        order={order}
        mode={mode}
        lang={lang}
        onClose={() => setShowSettings(false)}
        onToggleDark={() => setDark((d) => !d)}
        onOrderChange={setOrder}
        onModeChange={setMode}
        onLangChange={setLang}
        onReshuffle={reshuffle}
        onResetProgress={resetProgress}
      />

      <QuestionCard
        current={current}
        displayId={displayId}
        idx={idx}
        deck={deck}
        lang={lang}
        showAnswer={showAnswer}
        mcqSelection={mcqSelection}
        curStats={curStats}
        isDesktop={isDesktop}
        theme={theme}
        onToggleAnswer={() => setShowAnswer((s) => !s)}
        onMcqSelect={handleMcqSelect}
        onNext={nextCard}
      />

      <ActionButtons
        mode={mode}
        current={current}
        isDesktop={isDesktop}
        theme={theme}
        onMarkWrong={() => mark(false)}
        onMarkRight={() => mark(true)}
        showNext={mode !== "mcq" && pendingNext}
        onNext={nextCard}
      />
    </div>
  );
}
