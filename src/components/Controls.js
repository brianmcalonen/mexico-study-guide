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
    control: { fontSize: 15, display: "flex", alignItems: "center" },
    tally: { fontSize: 13, opacity: 0.8, marginLeft: 10 },
    select: {
      padding: "8px 10px",
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      background: theme.cardBg,
      color: theme.text,
      fontSize: 16,
      marginLeft: 8,
    },
  };

  return (
    <div style={styles.controls}>
      <div style={styles.control}>
        Category
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

            const marker = isComplete ? "☑ " : "☐ ";
            const optionStyle = {
              ...(isComplete ? { textDecoration: "line-through" } : {}),
              ...(isCurrent ? { backgroundColor: theme.border, fontWeight: 700 } : {}),
            };

            return (
              <option key={c} value={c} style={optionStyle}>
                {`${marker}${c} (${correct}/${total})`}
              </option>
            );
          })}
        </select>
        {categoryTally && (
          <span style={styles.tally}>
            {categoryTally.correctAnswered}/{categoryTally.totalQuestions} correct · {categoryTally.percent}%
          </span>
        )}
      </div>

    </div>
  );
}
