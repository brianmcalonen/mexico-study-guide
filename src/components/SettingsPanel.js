import React from "react";

export default function SettingsPanel({
  show,
  dark,
  theme,
  deck,
  totals,
  order,
  mode,
  lang,
  onClose,
  onToggleDark,
  onOrderChange,
  onModeChange,
  onLangChange,
  onReshuffle,
  onResetProgress,
}) {
  if (!show) return null;

  const styles = {
    button: {
      padding: "10px 12px",
      fontSize: 15,
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
      cursor: "pointer",
    },
    select: {
      padding: "8px 10px",
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
      fontSize: 16,
    },
    buttonDanger: {
      padding: "14px 18px",
      fontSize: 15,
      borderRadius: 14,
      border: `1px solid #fecaca`,
      background: theme.cardBg,
      cursor: "pointer",
      color: theme.text,
      width: "100%",
    },
  };

  return (
    <div>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 50,
        }}
      />

      <aside
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100%",
          width: 340,
          background: theme.cardBg,
          borderLeft: `1px solid ${theme.border}`,
          padding: 18,
          zIndex: 60,
          boxShadow: dark
            ? "0 6px 24px rgba(0,0,0,0.6)"
            : "0 6px 24px rgba(0,0,0,0.08)",
        }}
        role="dialog"
        aria-label="Settings"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>Settings</strong>
          <button onClick={onClose} style={styles.button}>
            Close
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Deck</div>
            <div style={{ fontWeight: 700 }}>{deck.length} cards</div>
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Seen</div>
            <div style={{ fontWeight: 700 }}>
              {totals.seen}/{totals.total}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Order</div>
            <select
              value={order}
              onChange={(e) => onOrderChange(e.target.value)}
              style={styles.select}
            >
              <option value="SHUFFLE">Shuffle</option>
              <option value="IN_ORDER">In order</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Mode</div>
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value)}
              style={styles.select}
            >
              <option value="short">Short answer</option>
              <option value="mcq">Multiple choice</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Language</div>
            <select
              value={lang}
              onChange={(e) => onLangChange(e.target.value)}
              style={styles.select}
            >
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gap: 18,
              paddingTop: 10,
              paddingBottom: 6,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={onToggleDark}
                  aria-pressed={dark}
                  aria-label="Toggle dark mode"
                  style={{
                    width: 52,
                    height: 30,
                    borderRadius: 20,
                    padding: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    border: `1px solid ${theme.border}`,
                    background: dark ? "#10b981" : theme.cardBg,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 16,
                      background: dark ? "#064e3b" : "#fff",
                      transform: dark ? "translateX(22px)" : "translateX(0px)",
                      transition: "transform 180ms ease",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
                <span style={{ fontSize: 15 }}>
                  {dark ? "Dark mode" : "Light mode"}
                </span>
              </div>
            </div>

            <div>
              <button
                onClick={onReshuffle}
                style={{
                  ...styles.button,
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: 14,
                }}
              >
                Reshuffle deck
              </button>
            </div>

            <div>
              <button onClick={onResetProgress} style={styles.buttonDanger}>
                Clear all history
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
