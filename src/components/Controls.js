import React from "react";

export default function Controls({
  category,
  categories,
  mode,
  all,
  allMcq,
  counts,
  completedByCategory,
  categoryTallies,
  categoryTally,
  isDesktop,
  theme,
  onCategoryChange,
}) {
  const styles = {
    controls: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: 12,
    },
    control: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
    },
    label: {
      fontSize: 14,
      fontWeight: 600,
      opacity: 0.9,
    },
    selectContainer: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
    },
    tally: {
      fontSize: 16,
      fontWeight: 600,
      opacity: 0.9,
      marginLeft: 12,
    },
    tallyMobile: {
      fontSize: 16,
      fontWeight: 600,
      opacity: 0.9,
      marginLeft: 0,
      width: "100%",
      marginTop: 6,
    },
    select: {
      padding: "8px 10px",
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
      fontSize: 16,
      marginLeft: 8,
      ...(isDesktop ? {} : { width: "100%" }),
    },
  };

  return (
    <div style={styles.controls}>
      <div style={styles.control}>
        <label style={styles.label}>Category</label>
        <div style={styles.selectContainer}>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={styles.select}
          >
          {categories.map((c) => {
            const isComplete = !!completedByCategory?.[c];
            const isCurrent = category === c;
            const tally = categoryTallies?.[c];
            const total =
              tally?.total ??
              (c === "All"
                ? mode === "mcq"
                  ? allMcq.length
                  : all.length
                : mode === "mcq"
                ? counts.mcq[c] || 0
                : counts.all[c] || 0);
            const correct = tally?.correct ?? 0;
            const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

            const marker = isComplete ? "☑ " : "☐ ";
            const optionStyle = {
              ...(isComplete ? { textDecoration: "line-through" } : {}),
              ...(isCurrent ? { backgroundColor: theme.border, fontWeight: 700 } : {}),
            };

            return (
              <option key={c} value={c} style={optionStyle}>
                {`${marker}${c} (${correct}/${total}) - ${percent}%`}
              </option>
            );
          })}
          </select>
        </div>
      </div>
    </div>
  );
}
