import React from "react";

export default function ActionButtons({
  mode,
  current,
  isDesktop,
  theme,
  onMarkWrong,
  onMarkRight,
  showNext,
  onNext,
}) {
  const styles = {
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

  return (
    <div style={styles.actions}>
      {mode !== "mcq" && (
        <>
          <button
            onClick={onMarkWrong}
            style={styles.buttonBad}
            disabled={!current}
          >
            ❌ Wrong
          </button>

          <button
            onClick={onMarkRight}
            style={styles.buttonGood}
            disabled={!current}
          >
            ✅ Right
          </button>
        </>
      )}
      {showNext && (
        <button onClick={onNext} style={styles.buttonSecondary}>
          Next →
        </button>
      )}

    </div>
  );
}
