import type { Exercise } from "@/lib/store";

export type ImportedExercise = Omit<Exercise, "id" | "order">;

/**
 * Parses a workout CSV into Exercise objects.
 *
 * Supported column names (case-insensitive, Italian or English):
 *   esercizio / name / exercise       → exercise name (required)
 *   giorno / day                      → day number (default: 1)
 *   serie / sets                      → set count (default: 3)
 *   ripetizioni / reps / repetitions  → rep target e.g. "8-10" or "10" (default: "10")
 *   recupero / rest                   → rest in seconds e.g. "90" or "90'" (default: none)
 *   gruppo / muscleGroup / muscle     → muscle group (default: none)
 *   superset                          → superset group letter e.g. "A" (default: none)
 *
 * The first row is always treated as a header row.
 * Empty rows and rows where the name cell is blank are skipped.
 *
 * Example:
 *   Esercizio,Giorno,Serie,Ripetizioni,Recupero,Gruppo
 *   Panca Piana,1,4,8-10,120,Petto
 *   Squat,1,4,10,90,Gambe
 *   Curl Bilanciere,2,3,12,60,Bicipiti
 */
export function parseWorkoutCSV(csvText: string): ImportedExercise[] {
  // Robust CSV row parser — handles quoted commas and CRLF
  function parseRow(row: string): string[] {
    const cells: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  }

  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");

  if (lines.length < 2) return []; // need at least header + 1 data row

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().trim());

  // Column index resolution
  function col(...aliases: string[]): number {
    for (const a of aliases) {
      const idx = headers.indexOf(a);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const nameIdx    = col("esercizio", "name", "exercise", "nome");
  const dayIdx     = col("giorno", "day", "giorno/day");
  const setsIdx    = col("serie", "sets", "series");
  const repsIdx    = col("ripetizioni", "reps", "repetitions", "rep");
  const restIdx    = col("recupero", "rest", "riposo", "recupero (s)", "rest (s)");
  const groupIdx   = col("gruppo", "musclegroup", "muscle", "gruppo muscolare", "gruppo_muscolare");
  const superIdx   = col("superset", "superserie", "superset group");

  // Require at least an exercise name column
  if (nameIdx === -1) return [];

  const results: ImportedExercise[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    const name = nameIdx !== -1 ? (cells[nameIdx] ?? "").trim() : "";
    if (!name) continue;

    const day       = dayIdx   !== -1 ? (parseInt(cells[dayIdx]  ?? "1") || 1) : 1;
    const sets      = setsIdx  !== -1 ? (parseInt(cells[setsIdx] ?? "3") || 3) : 3;
    const reps      = repsIdx  !== -1 ? (cells[repsIdx] ?? "").trim() || "10" : "10";
    const restRaw   = restIdx  !== -1 ? (cells[restIdx] ?? "").trim() : "";
    const rest      = restRaw.replace(/[^0-9]/g, "") || undefined; // strip "'" or " s"
    const group     = groupIdx !== -1 ? (cells[groupIdx] ?? "").trim() || undefined : undefined;
    const superset  = superIdx !== -1 ? (cells[superIdx] ?? "").trim().toUpperCase().slice(0, 2) || undefined : undefined;

    results.push({
      name,
      day,
      sets,
      targetReps: reps,
      muscleGroup: group,
      restSeconds: rest,
      supersetGroup: superset,
      perSetReps: undefined,
    });
  }

  return results;
}

/** Returns a UTF-8 BOM CSV string demonstrating the expected format */
export function generateCSVTemplate(daysPerWeek: number): string {
  const header = "Esercizio,Giorno,Serie,Ripetizioni,Recupero,Gruppo";
  const examples: string[] = [];
  const sampleExercises: Array<[string, string, string]> = [
    ["Panca Piana", "4", "Petto"],
    ["Squat", "4", "Gambe"],
    ["Curl Bilanciere", "3", "Bicipiti"],
    ["Lat Machine", "4", "Schiena"],
    ["Military Press", "3", "Spalle"],
    ["Leg Press", "4", "Gambe"],
  ];
  for (let d = 1; d <= daysPerWeek; d++) {
    const ex = sampleExercises.slice((d - 1) * 2, (d - 1) * 2 + 2);
    for (const [name, sets, group] of ex) {
      examples.push(`${name},${d},${sets},8-10,90,${group}`);
    }
  }
  return [header, ...examples].join("\n");
}
