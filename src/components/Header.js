import React from "react";

export default function Header({ isDesktop, theme, onOpenSettings }) {
  const styles = {
    header: {
      display: "flex",
      gap: isDesktop ? 20 : 12,
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: isDesktop ? 16 : 12,
    },
    title: { fontSize: isDesktop ? 26 : 22, fontWeight: 800 },
    button: {
      padding: "12px 16px",
      fontSize: 18,
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.header}>
      <div>
        <div style={styles.title}>Naturalización Trainer</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={onOpenSettings}
          style={styles.button}
          aria-label="Open settings"
        >
          <span style={{ fontSize: 26, lineHeight: 1, marginRight: isDesktop ? 8 : 0 }}>⚙︎</span>
          {isDesktop && <span style={{ fontSize: 16 }}>Settings</span>}
        </button>
      </div>
    </div>
  );
}
