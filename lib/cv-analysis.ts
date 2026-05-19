"use client";
/**
 * cv-analysis.ts — Client-side pose detection using TF.js MoveNet
 *
 * Zero Claude API cost. Runs entirely in the browser using WebGL.
 * Model: MoveNet SinglePose Lightning (~3 MB download, <50ms inference).
 *
 * Extracted features stored in fitness_scans.body_features (JSONB).
 * Used for:
 *  - Instant single-scan metric display (no API needed)
 *  - Cost-free month-to-month comparison (delta from stored features)
 *  - Claude only called if trainer explicitly requests deep narrative
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PoseKeypoint {
  name:  string;
  x:     number;  // 0–1, normalised to image width
  y:     number;  // 0–1, normalised to image height
  score: number;  // 0–1 detection confidence
}

export interface BodyMetrics {
  /** shoulder_width / hip_width  — key V-taper / body shape indicator */
  shoulder_hip_ratio:   number | null;
  /** estimated waist width / hip_width — WHO health indicator */
  waist_hip_ratio:      number | null;
  /** torso height / total body height — proportionality */
  torso_length_ratio:   number | null;
  /** 0–1: how symmetric left/right keypoints are — detects imbalances */
  bilateral_symmetry:   number | null;
  /** area ratio: body bounding box / total image  — framing consistency */
  body_prominence:      number | null;
  /** average detection confidence across keypoints */
  pose_confidence:      number;
}

export interface BodyFeatures {
  keypoints:   PoseKeypoint[];
  metrics:     BodyMetrics;
  image_width:  number;
  image_height: number;
  analyzed_at:  string;
  model:        "movenet_singlepose_lightning";
}

export interface FeatureComparison {
  shr_delta:       number | null;  // positive = V-taper improving
  whr_delta:       number | null;  // negative = waist reducing
  symmetry_delta:  number | null;  // positive = better balance
  torso_delta:     number | null;
  trend_summary:   "improving" | "stable" | "declining";
  delta_score:     number;         // weighted composite -100 to +100
}

// ── Module-level detector cache ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _detector: any = null;
let _loading = false;

async function getDetector() {
  if (_detector) return _detector;
  if (_loading) {
    // Wait until the concurrent load finishes
    while (_loading) await new Promise(r => setTimeout(r, 100));
    return _detector;
  }
  _loading = true;
  try {
    // Dynamic imports — avoids SSR bundle issues in Next.js
    const tf   = await import("@tensorflow/tfjs");
    const pose = await import("@tensorflow-models/pose-detection");

    await tf.ready();
    // Use WebGL for hardware acceleration; fall back to CPU
    try { await tf.setBackend("webgl"); } catch { await tf.setBackend("cpu"); }

    _detector = await pose.createDetector(
      pose.SupportedModels.MoveNet,
      { modelType: "SinglePose.Lightning" }   // fastest; ~3 MB
    );
    return _detector;
  } finally {
    _loading = false;
  }
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function dist(a: PoseKeypoint, b: PoseKeypoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: PoseKeypoint, b: PoseKeypoint): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function kp(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  return keypoints.find(k => k.name === name && k.score > 0.25);
}

// ── Metric extraction ─────────────────────────────────────────────────────────

function computeMetrics(keypoints: PoseKeypoint[]): BodyMetrics {
  const ls = kp(keypoints, "left_shoulder");
  const rs = kp(keypoints, "right_shoulder");
  const lh = kp(keypoints, "left_hip");
  const rh = kp(keypoints, "right_hip");
  const lk = kp(keypoints, "left_knee");
  const rk = kp(keypoints, "right_knee");
  const la = kp(keypoints, "left_ankle");
  const ra = kp(keypoints, "right_ankle");
  const le = kp(keypoints, "left_elbow");
  const re = kp(keypoints, "right_elbow");
  const nose = kp(keypoints, "nose");

  // Shoulder–hip ratio (SHR)
  const shoulder_hip_ratio = (ls && rs && lh && rh)
    ? dist(ls, rs) / Math.max(dist(lh, rh), 0.001)
    : null;

  // Waist–hip ratio (WHR) — approximate waist as midpoint between shoulders and hips
  let waist_hip_ratio: number | null = null;
  if (ls && rs && lh && rh) {
    const sCenter = midpoint(ls, rs);
    const hCenter = midpoint(lh, rh);
    // Waist at 40% down from shoulders to hips (anatomically ~navel level)
    const waistX = sCenter.x + (hCenter.x - sCenter.x) * 0.4;
    const hipWidth = dist(lh, rh);
    // Use elbow spread as proxy for waist width if available
    const waistEst = (le && re)
      ? Math.min(dist(le, re) * 0.65, hipWidth)
      : hipWidth * 0.80;
    waist_hip_ratio = waistEst / Math.max(hipWidth, 0.001);
    void waistX; // calculated for reference
  }

  // Torso length ratio
  let torso_length_ratio: number | null = null;
  if (ls && rs && lh && rh && (la || lk) && (ra || rk)) {
    const shoulderY = (ls.y + rs.y) / 2;
    const hipY      = (lh.y + rh.y) / 2;
    const footY     = Math.max(la?.y ?? 0, ra?.y ?? 0, lk?.y ?? 0, rk?.y ?? 0);
    const headY     = nose ? Math.min(nose.y, shoulderY) : shoulderY - 0.08;
    const totalH    = Math.max(footY - headY, 0.001);
    torso_length_ratio = (hipY - shoulderY) / totalH;
  }

  // Bilateral symmetry — average normalised distance difference between L/R pairs
  const pairs: [string, string][] = [
    ["left_shoulder", "right_shoulder"],
    ["left_hip",      "right_hip"],
    ["left_knee",     "right_knee"],
    ["left_ankle",    "right_ankle"],
    ["left_elbow",    "right_elbow"],
    ["left_wrist",    "right_wrist"],
  ];
  const symDeltas: number[] = [];
  for (const [ln, rn] of pairs) {
    const l = kp(keypoints, ln), r = kp(keypoints, rn);
    if (l && r) {
      // Compare vertical symmetry (y should be similar for standing pose)
      symDeltas.push(Math.abs(l.y - r.y));
    }
  }
  const bilateral_symmetry = symDeltas.length
    ? Math.max(0, 1 - (symDeltas.reduce((s, v) => s + v, 0) / symDeltas.length) * 8)
    : null;

  // Body prominence (bounding box area relative to image)
  const xs = keypoints.filter(k => k.score > 0.3).map(k => k.x);
  const ys = keypoints.filter(k => k.score > 0.3).map(k => k.y);
  const body_prominence = (xs.length > 4 && ys.length > 4)
    ? (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
    : null;

  // Average confidence
  const pose_confidence = keypoints.length
    ? keypoints.reduce((s, k) => s + k.score, 0) / keypoints.length
    : 0;

  return {
    shoulder_hip_ratio,
    waist_hip_ratio,
    torso_length_ratio,
    bilateral_symmetry,
    body_prominence,
    pose_confidence,
  };
}

// ── Main export: analyse image ────────────────────────────────────────────────

/**
 * Run TF.js MoveNet pose detection on an image element or blob.
 * Returns null if detection confidence is too low (bad photo).
 */
export async function analyseImage(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap | Blob
): Promise<BodyFeatures | null> {
  let img: HTMLImageElement | HTMLCanvasElement | ImageBitmap;

  // Convert Blob → ImageBitmap
  if (source instanceof Blob) {
    img = await createImageBitmap(source);
  } else {
    img = source;
  }

  const detector = await getDetector();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poses: any[] = await detector.estimatePoses(img, {
    maxPoses:      1,
    flipHorizontal: false,
    scoreThreshold: 0.25,
  });

  if (!poses.length || !poses[0].keypoints?.length) return null;

  // Normalise keypoints to 0–1 range
  const w = (img as HTMLImageElement).naturalWidth  || (img as HTMLCanvasElement).width  || (img as ImageBitmap).width  || 1;
  const h = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height || (img as ImageBitmap).height || 1;

  const keypoints: PoseKeypoint[] = poses[0].keypoints.map((k: { name: string; x: number; y: number; score: number }) => ({
    name:  k.name,
    x:     k.x / w,
    y:     k.y / h,
    score: k.score ?? 0,
  }));

  const avgConf = keypoints.reduce((s, k) => s + k.score, 0) / keypoints.length;
  if (avgConf < 0.15) return null; // Too noisy to be useful

  return {
    keypoints,
    metrics:      computeMetrics(keypoints),
    image_width:  w,
    image_height: h,
    analyzed_at:  new Date().toISOString(),
    model:        "movenet_singlepose_lightning",
  };
}

// ── Month-to-month comparison (zero API cost) ─────────────────────────────────

export function compareFeatures(
  before: BodyFeatures,
  after:  BodyFeatures
): FeatureComparison {
  const mb = before.metrics;
  const ma = after.metrics;

  const shr_delta = (ma.shoulder_hip_ratio != null && mb.shoulder_hip_ratio != null)
    ? ma.shoulder_hip_ratio - mb.shoulder_hip_ratio : null;
  const whr_delta = (ma.waist_hip_ratio != null && mb.waist_hip_ratio != null)
    ? ma.waist_hip_ratio - mb.waist_hip_ratio : null;
  const symmetry_delta = (ma.bilateral_symmetry != null && mb.bilateral_symmetry != null)
    ? ma.bilateral_symmetry - mb.bilateral_symmetry : null;
  const torso_delta = (ma.torso_length_ratio != null && mb.torso_length_ratio != null)
    ? ma.torso_length_ratio - mb.torso_length_ratio : null;

  // Weighted delta score: higher = better
  // SHR increase = positive (more V-taper)    weight 0.4
  // WHR decrease = positive (slimmer waist)   weight 0.4
  // Symmetry increase = positive               weight 0.2
  let score = 0;
  let weights = 0;
  if (shr_delta != null)      { score += shr_delta      *  40; weights += 40; }
  if (whr_delta != null)      { score += whr_delta       * -40; weights += 40; } // negative = good
  if (symmetry_delta != null) { score += symmetry_delta *  20; weights += 20; }
  const delta_score = weights > 0 ? Math.round((score / weights) * 100) : 0;

  const trend_summary: FeatureComparison["trend_summary"] =
    delta_score > 5  ? "improving" :
    delta_score < -5 ? "declining" : "stable";

  return { shr_delta, whr_delta, symmetry_delta, torso_delta, trend_summary, delta_score };
}

// ── Human-readable metric labels ─────────────────────────────────────────────

export function formatMetric(key: keyof BodyMetrics, value: number | null): string {
  if (value == null) return "—";
  switch (key) {
    case "shoulder_hip_ratio":  return value.toFixed(2);
    case "waist_hip_ratio":     return value.toFixed(2);
    case "torso_length_ratio":  return `${Math.round(value * 100)}%`;
    case "bilateral_symmetry":  return `${Math.round(value * 100)}%`;
    case "body_prominence":     return `${Math.round(value * 100)}%`;
    case "pose_confidence":     return `${Math.round(value * 100)}%`;
    default:                    return value.toFixed(2);
  }
}

export const METRIC_LABELS: Record<keyof BodyMetrics, string> = {
  shoulder_hip_ratio:  "Rapporto Spalle/Fianchi",
  waist_hip_ratio:     "Rapporto Vita/Fianchi",
  torso_length_ratio:  "Proporzione Torso",
  bilateral_symmetry:  "Simmetria Bilaterale",
  body_prominence:     "Area Corpo",
  pose_confidence:     "Confidenza Rilevamento",
};

export const METRIC_IDEAL: Partial<Record<keyof BodyMetrics, { label: string; good: (v: number) => boolean }>> = {
  shoulder_hip_ratio: { label: "ideale uomo >1.3", good: v => v >= 1.15 },
  waist_hip_ratio:    { label: "ideale <0.9",       good: v => v <= 0.90 },
  bilateral_symmetry: { label: "ideale >80%",       good: v => v >= 0.80 },
};
