import type { Exercise } from "@/lib/store";

export type ImportedExercise = Omit<Exercise, "id" | "order">;

/**
 * Parses a CSV export from Google Sheets with the TrainerPro logbook layout.
 *
 * Expected sheet structure per day group (3 columns):
 *   Col A: rest time (top of block) + "serie N" labels
 *   Col B: exercise name (top) + "ripetizioni" header + rep values
 *   Col C: blank + "carico" header + weight cells (ignored)
 *
 * Date header (XX/XX/YYYY or DD/MM/YYYY) appears in Col B of each day group.
 * Multiple day groups are laid out side by side.
 */
export function parseGoogleSheetCSV(csvText: string): ImportedExercise[] {
  // Robust CSV row parser (handles quoted commas)
  const rows: string[][] = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((row) => {
      const cells: string[] = [];
      let cur = "";
      let inQuote = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === "," && !inQuote) { cells.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      cells.push(cur.trim());
      return cells;
    })
    .filter((r) => r.some((c) => c !== ""));

  if (rows.length < 3) return [];

  const exercises: ImportedExercise[] = [];

  // Find day groups by locating date headers like "XX/XX/2026" or "15/04/2026"
  // Date appears in the "name column" (Col B of each 3-col group)
  const dateColIndices: number[] = [];
  const DATE_RE = /(?:XX|\d{2})\/(?:XX|\d{2})\/\d{4}/;

  for (let rowIdx = 0; rowIdx < Math.min(4, rows.length); rowIdx++) {
    for (let c = 0; c < rows[rowIdx].length; c++) {
      if (DATE_RE.test(rows[rowIdx][c]) && !dateColIndices.includes(c)) {
        dateColIndices.push(c);
      }
    }
  }

  // Fallback: no date headers found — assume single group starting at col 1
  if (dateColIndices.length === 0 && rows.length > 1) {
    dateColIndices.push(1);
  }

  for (let dayIdx = 0; dayIdx < dateColIndices.length; dayIdx++) {
    const nameCol = dateColIndices[dayIdx]; // exercise name + reps
    const restCol = Math.max(0, nameCol - 1); // rest time + "serie N" labels
    const day = dayIdx + 1;

    let r = 1; // skip the date header row

    while (r < rows.length) {
      const nameCell = (rows[r]?.[nameCol] ?? "").trim();
      const restCell = (rows[r]?.[restCol] ?? "").trim();

      // Skip blanks, date cells, "ripetizioni/carico" headers, serie labels
      if (!nameCell) { r++; continue; }
      if (DATE_RE.test(nameCell)) { r++; continue; }
      if (/^(ripetizioni|carico)/i.test(nameCell)) { r++; continue; }
      if (/^(serie|set)\s*\d/i.test(nameCell)) { r++; continue; }

      // This cell is an exercise name
      const exerciseName = nameCell;

      // Rest time in restCol at this row: "120'" → "120", "90' - 120'" → "90"
      const restMatch = restCell.match(/(\d+)/);
      const restSeconds = restMatch ? restMatch[1] : undefined;

      // Advance past "ripetizioni | carico" header if present
      r++;
      if (/^ripetizioni/i.test((rows[r]?.[nameCol] ?? "").trim())) r++;

      // Collect series: rows whose restCol starts with "serie" or "set"
      const perSetReps: string[] = [];
      while (r < rows.length) {
        const serieLabel = (rows[r]?.[restCol] ?? "").trim();
        const repsVal = (rows[r]?.[nameCol] ?? "").trim();
        if (!/^(serie|set)\s*\d/i.test(serieLabel)) break;
        if (repsVal) perSetReps.push(repsVal);
        r++;
      }

      if (exerciseName && perSetReps.length > 0) {
        exercises.push({
          name: exerciseName,
          sets: perSetReps.length,
          targetReps: perSetReps[0] ?? "",
          perSetReps,
          restSeconds,
          day,
          muscleGroup: undefined,
          supersetGroup: undefined,
        });
      }

      r++; // skip blank separator row between blocks
    }
  }

  return exercises;
}
