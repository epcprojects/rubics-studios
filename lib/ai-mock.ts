import { rescale } from "./scoring";
import { sampleRubrics } from "./seed";
import type { Rubric, RubricRow } from "./types";

/**
 * Stand-in for the Claude API calls in the original prototype. It returns a believable rubric
 * after a short delay so the flow can be demoed with no API key. In production, `generateRubric`
 * becomes a server route that calls Claude, and `importRubricFile` sends the upload for extraction.
 */

const LEVEL_SETS: Record<number, string[]> = {
  2: ["Meets", "Not Yet"],
  3: ["Exceeds", "Meets", "Not Yet"],
  4: ["Expert", "Proficient", "Developing", "Still Approaching"],
  5: ["Outstanding", "Strong", "Satisfactory", "Limited", "Missing"],
};

const TOPICS: Array<{ match: RegExp; name: string; criteria: string[] }> = [
  { match: /essay|writing|paragraph|narrative|persuasive|report/, name: "Writing", criteria: ["Thesis & Focus", "Evidence & Support", "Organization", "Style & Voice", "Conventions"] },
  { match: /histor|timeline|revolution|civics|government|social studies/, name: "History", criteria: ["Historical Accuracy", "Cause & Effect", "Use of Sources", "Analysis", "Presentation"] },
  { match: /lab|science|experiment|biology|chemistry|physics/, name: "Science Lab", criteria: ["Hypothesis", "Procedure", "Data & Observations", "Analysis", "Conclusion"] },
  { match: /math|algebra|geometry|problem/, name: "Math", criteria: ["Understanding", "Strategy", "Accuracy", "Communication", "Justification"] },
  { match: /art|draw|paint|portrait|sculpt|design/, name: "Art", criteria: ["Concept", "Composition", "Technique", "Craftsmanship", "Effort"] },
  { match: /present|speech|speaking|debate|oral/, name: "Presentation", criteria: ["Content", "Delivery", "Visual Aids", "Engagement", "Timing"] },
];

const DESC: Record<number, string[]> = {
  0: ["Consistently strong; shows depth and independence.", "Clear and accurate with minor gaps.", "Partly developed; needs more precision.", "Limited or unclear; significant gaps.", "Not evident."],
};

function titleFromPrompt(prompt: string) {
  const lead = prompt.split(/[,;:—–]|\s-\s/)[0] ?? prompt;
  const cleaned = lead
    .replace(/\b\d+\s*(columns?|levels?|rows?|criteria)\b/gi, "")
    .replace(/\brubric\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const t = cleaned.slice(0, 48).replace(/[.,;:]+$/, "");
  return (t ? t[0]!.toUpperCase() + t.slice(1) : "Generated") + " Rubric";
}

export function generateRubric(prompt: string): Promise<{ name: string; rows: RubricRow[] }> {
  const p = prompt.toLowerCase();
  const colMatch = p.match(/(\d)\s*(columns?|levels?)/);
  const cols = Math.min(5, Math.max(2, colMatch ? Number(colMatch[1]) : /exceeds|meets|not yet/.test(p) ? 3 : 4));
  const topic = TOPICS.find((t) => t.match.test(p)) ?? { name: "General", criteria: ["Understanding", "Quality of Work", "Organization", "Effort", "Completeness"] };
  const labels = LEVEL_SETS[cols]!;
  const rowCount = /(\d)\s*(rows?|criteria)/.test(p) ? Math.min(8, Math.max(2, Number(p.match(/(\d)\s*(rows?|criteria)/)![1]))) : 4;
  const rows: RubricRow[] = topic.criteria.slice(0, rowCount).map((criteria, i) => ({
    id: `ai_${i}_${criteria.toLowerCase().replace(/[^a-z]+/g, "_")}`,
    criteria,
    max: 0,
    ratings: labels.map((label, li) => ({
      label,
      pts: 0,
      desc: `${DESC[0]![Math.round((li / Math.max(1, cols - 1)) * 4)]} (${criteria.toLowerCase()})`,
    })),
  }));
  return new Promise((resolve) => setTimeout(() => resolve({ name: titleFromPrompt(prompt), rows }), 1400));
}

/** Pretends to read an uploaded photo or PDF and returns the sample essay rubric. */
export function importRubricFile(fileName: string): Promise<{ name: string; rows: RubricRow[] }> {
  const sample = sampleRubrics()[1]!;
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return new Promise((resolve) => setTimeout(() => resolve({ name: base || sample.name, rows: sample.rows }), 1800));
}

export function blankRubric(name: string, rowCount = 3, levels = 3): Rubric {
  const labels = LEVEL_SETS[Math.min(5, Math.max(2, levels))]!;
  return rescale({
    id: "",
    name,
    category: "Summative Assessment",
    type: "points",
    floor: 0,
    ceiling: 10,
    halfPoints: false,
    createdAt: "",
    updatedAt: "",
    rows: Array.from({ length: rowCount }, (_, i) => ({
      id: `row_${i}_${Math.random().toString(36).slice(2, 6)}`,
      criteria: `Criteria ${i + 1}`,
      max: 0,
      ratings: labels.map((label) => ({ label, pts: 0, desc: "Add a description." })),
    })),
  });
}
