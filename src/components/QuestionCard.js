import React from "react";

export default function QuestionCard({
  current,
  displayId,
  idx,
  deck,
  lang,
  showAnswer,
  mcqSelection,
  curStats,
  isDesktop,
  theme,
  onToggleAnswer,
  onMcqSelect,
  onNext,
}) {
  const styles = {
    cardWrap: { marginTop: 8 },
    card: {
      border: `1px solid ${theme.border}`,
      borderRadius: 16,
      padding: isDesktop ? 18 : 12,
      cursor: "pointer",
      userSelect: "none",
      boxShadow: theme.dark
        ? "0 6px 24px rgba(0,0,0,0.45)"
        : "0 1px 12px rgba(0,0,0,0.04)",
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
    nextInline: {
      padding: "12px 14px",
      fontSize: 15,
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
      cursor: "pointer",
      marginTop: 10,
      width: "100%",
    },
  };

  if (!current) {
    return (
      <div style={styles.cardWrap}>
        <div style={styles.card}>
          <div style={styles.cardTop}>No cards found.</div>
          <div style={styles.cardBody}>Try choosing "All" categories.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.cardWrap}>
      <div
        style={styles.card}
        onClick={onToggleAnswer}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggleAnswer();
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
                      extra = sel.isRight
                        ? {
                            background: "#dcfce7",
                            border: `1px solid #10b981`,
                            color: "#065f46",
                          }
                        : {
                            background: "#fee2e2",
                            border: `1px solid #ef4444`,
                            color: "#7f1d1d",
                          };
                    } else if (!sel.isRight && i === correctIndex) {
                      extra = {
                        background: "#dcfce7",
                        border: `1px solid #10b981`,
                        color: "#065f46",
                      };
                    } else {
                      extra = { opacity: 0.85 };
                    }
                  }

                  return (
                    <button
                      key={String(i)}
                      onClick={() => onMcqSelect(i)}
                      disabled={disabled}
                      style={{
                        ...styles.buttonSecondary,
                        textAlign: "left",
                        padding: "10px 12px",
                        cursor: disabled ? "default" : "pointer",
                        ...extra,
                      }}
                    >
                      <div style={{ fontSize: 20 }}>{opt.es || opt.en}</div>
                    </button>
                  );
                })}
              </div>

              {mcqSelection && (
                <button style={styles.nextInline} onClick={onNext}>
                  Next →
                </button>
              )}
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
                  <div style={styles.revealHint}>
                    Click to reveal answers / Haz clic para ver las respuestas
                  </div>
                ) : (
                  <>
                    <div style={styles.aLabel}>Respuesta (ES)</div>
                    <div style={styles.aText}>{current.answer}</div>
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
            ) : null}
          </div>
          <div style={styles.smallMuted} />
        </div>
      </div>
    </div>
  );
}
