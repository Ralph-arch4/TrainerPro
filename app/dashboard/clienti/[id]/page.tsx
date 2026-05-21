"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import type { DietPlan, BodyMeasurement } from "@/lib/store";
import { dbPhases, dbWorkoutPlans, dbDietPlans, dbNotes, dbMeasurements } from "@/lib/db";
import { showToast } from "@/components/Toast";
import DietPlanEditor from "@/components/DietPlanEditor";
import Link from "next/link";
import {
  ArrowLeft, Activity, UtensilsCrossed, StickyNote,
  Dumbbell, Plus, X, Loader2, Pencil, Trash2, CheckCircle2, Circle,
  Mail, Phone, Calendar, Target, BarChart2, ExternalLink, Copy, Check, Timer,
  ChevronDown, ChevronUp, Flame, Beef, Wheat, Droplets, TrendingUp,
  Camera, Lock, Upload, Eye, EyeOff,
} from "lucide-react";
import { dbProgressPhotos, type ProgressPhoto, dbFitnessScans, type FitnessScan, type FitnessScanAnalysis, dbFitnessScanComparisons, type FitnessScanComparison, type ComparisonAnalysis } from "@/lib/db";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { Scan, Sparkles, ShieldCheck, Brain, GitCompare, TrendingDown, Minus, KeyRound, Activity as ActivityIcon, Utensils, Zap, Award, ChevronRight } from "lucide-react";
import type { BodyFeatures } from "@/lib/cv-analysis";
import { computeTier, TIERS, TIER_ORDER, tierDelta, type Tier } from "@/lib/tier-system";

type Tab = "overview" | "fasi" | "schede" | "dieta" | "misurazioni" | "note" | "foto" | "scan";

// PIN is no longer hardcoded — verified server-side via /api/photo/pin
// Session token stored in sessionStorage (tab-scoped, not persisted)

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      const r = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * r);
      canvas.height = Math.round(img.height * r);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("blob")), "image/jpeg", 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function PhotoCard({ photo, secureUrl, onDelete }: { photo: ProgressPhoto; secureUrl?: string; onDelete: () => void }) {
  // secureUrl is a single-use view-token URL passed from parent (not fetched here)
  const [url, setUrl] = useState<string | null>(secureUrl ?? null);
  const [showDelete, setShowDelete] = useState(false);
  useEffect(() => {
    // If no secureUrl provided, fall back to the old signed URL (for backwards compat)
    if (!secureUrl) {
      dbProgressPhotos.getSignedUrl(photo.storage_path).then(setUrl);
    } else {
      setUrl(secureUrl);
    }
  }, [photo.storage_path, secureUrl]);
  return (
    <div className="relative rounded-2xl overflow-hidden group"
      style={{ aspectRatio: "3/4", background: "var(--surface-sm)", border: "1px solid var(--border)" }}>
      {url ? (
        <img src={url} alt={photo.taken_at} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: "rgba(229,50,50,0.5)" }} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
        <p className="text-xs font-bold text-white">{new Date(photo.taken_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}</p>
        {photo.notes && <p className="text-xs text-white/70 mt-0.5 truncate">{photo.notes}</p>}
        <button onClick={() => setShowDelete(true)}
          className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg w-fit"
          style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
          <Trash2 size={10} /> Elimina
        </button>
      </div>
      {showDelete && (
        <div className="absolute inset-0 flex items-center justify-center p-4"
          style={{ background: "var(--surface-modal)" }}>
          <div className="text-center">
            <p className="text-sm font-bold text-white mb-1">Eliminare la foto?</p>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Azione irreversibile</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-1.5 rounded-lg text-xs" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}>Annulla</button>
              <button onClick={onDelete} className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.3)", color: "#f87171" }}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const goalLabel: Record<string, string> = { dimagrimento: "Dimagrimento", massa: "Massa", tonificazione: "Tonificazione", performance: "Performance" };
const levelLabel: Record<string, string> = { principiante: "Principiante", intermedio: "Intermedio", avanzato: "Avanzato" };
const phaseTypeLabel: Record<string, string> = { bulk: "Bulk", cut: "Cut", maintenance: "Mantenimento", custom: "Personalizzata" };
const phaseTypeColor: Record<string, string> = { bulk: "#a78bfa", cut: "#38bdf8", maintenance: "#34d399", custom: "#fb923c" };
const statusColor: Record<string, string> = { attivo: "#22c55e", in_pausa: "#f59e0b", inattivo: "#6b7280" };
const statusLabel: Record<string, string> = { attivo: "Attivo", in_pausa: "In pausa", inattivo: "Inattivo" };

function formatDate(d: string) { return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }); }

function formatRestTime(sec: number): string {
  if (sec < 60) return `${sec}″`;
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m}′${s}″` : `${m}′`;
}

function formatCalories(calories: number, caloriesMax?: number): string {
  if (caloriesMax && caloriesMax > calories) return `${calories}–${caloriesMax} kcal`;
  return `${calories} kcal`;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useAppStore((s) => s.clients.find((c) => c.id === id));
  const addPhase = useAppStore((s) => s.addPhase);
  const updatePhase = useAppStore((s) => s.updatePhase);
  const removePhase = useAppStore((s) => s.removePhase);
  const addWorkoutPlan = useAppStore((s) => s.addWorkoutPlan);
  const updateWorkoutPlan = useAppStore((s) => s.updateWorkoutPlan);
  const removeWorkoutPlan = useAppStore((s) => s.removeWorkoutPlan);
  const addDietPlan = useAppStore((s) => s.addDietPlan);
  const updateDietPlan = useAppStore((s) => s.updateDietPlan);
  const removeDietPlan = useAppStore((s) => s.removeDietPlan);
  const addNote = useAppStore((s) => s.addNote);
  const removeNote = useAppStore((s) => s.removeNote);
  const addMeasurement = useAppStore((s) => s.addMeasurement);
  const removeMeasurement = useAppStore((s) => s.removeMeasurement);

  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview");
  const [saving, setSaving] = useState(false);

  // Measurements form
  const emptyMeasForm = () => ({
    date: new Date().toISOString().split("T")[0],
    weight: "", bodyFat: "", chest: "", waist: "", hips: "", arms: "", legs: "",
  });
  const [measForm, setMeasForm] = useState(emptyMeasForm);
  const [measSaving, setMeasSaving] = useState(false);

  async function saveMeasurement() {
    if (!measForm.date || !measForm.weight) return;
    setMeasSaving(true);
    try {
      const payload: BodyMeasurement = {
        id: crypto.randomUUID(),
        clientId: client!.id,
        date: measForm.date,
        weight: parseFloat(measForm.weight),
        bodyFat: measForm.bodyFat ? parseFloat(measForm.bodyFat) : undefined,
        chest: measForm.chest ? parseFloat(measForm.chest) : undefined,
        waist: measForm.waist ? parseFloat(measForm.waist) : undefined,
        hips: measForm.hips ? parseFloat(measForm.hips) : undefined,
        arms: measForm.arms ? parseFloat(measForm.arms) : undefined,
        legs: measForm.legs ? parseFloat(measForm.legs) : undefined,
      };
      addMeasurement(client!.id, payload);
      await dbMeasurements.create(payload);
      setMeasForm(emptyMeasForm());
      showToast("Misurazione salvata");
    } catch { showToast("Errore nel salvataggio"); }
    finally { setMeasSaving(false); }
  }
  const [saveError, setSaveError] = useState("");

  // Phase modal (create)
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: "", type: "bulk", startDate: "", endDate: "", targetCalories: "", targetWeight: "", notes: "" });

  // Phase modal (edit)
  const emptyPhaseEdit = () => ({ id: "", name: "", type: "bulk", startDate: "", endDate: "", targetCalories: "", targetWeight: "", notes: "" });
  const [editingPhase, setEditingPhase] = useState<{ id: string; name: string; type: string; startDate: string; endDate: string; targetCalories: string; targetWeight: string; notes: string } | null>(null);

  // Workout plan modal
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ name: "", description: "", daysPerWeek: "3", totalWeeks: "", restSeconds: "", phaseId: "" });

  // Workout plan edit modal
  const [editingPlan, setEditingPlan] = useState<{ id: string; name: string; description: string; daysPerWeek: string; totalWeeks: string; restSeconds: string; phaseId: string } | null>(null);

  // Diet plan modal (create = null plan, edit = existing plan)
  const [dietEditorOpen, setDietEditorOpen] = useState(false);
  const [editingDietPlan, setEditingDietPlan] = useState<DietPlan | null>(null);
  // expanded meal preview per diet card
  const [expandedDietId, setExpandedDietId] = useState<string | null>(null);

  // Note
  const [noteText, setNoteText] = useState("");

  // Fitness scan state
  const [scans, setScans] = useState<FitnessScan[]>([]);
  const [scansLoaded, setScansLoaded] = useState(false);
  const [scanUploading, setScanUploading] = useState(false);
  const [scanAnalyzing, setScanAnalyzing] = useState<string | null>(null); // scanId being analyzed
  const [scanUploadDate, setScanUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [scanUploadNotes, setScanUploadNotes] = useState("");
  const [scanUrls, setScanUrls] = useState<Record<string, string>>({});

  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedMonthA, setSelectedMonthA] = useState<string | null>(null); // "YYYY-MM"
  const [selectedMonthB, setSelectedMonthB] = useState<string | null>(null);
  const [comparingScanIds, setComparingScanIds] = useState<{ before: string; after: string } | null>(null);
  const [comparingResult, setComparingResult] = useState<FitnessScanComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [activeTimelineMonth, setActiveTimelineMonth] = useState<string | null>(null); // for non-compare view

  async function loadScans() {
    if (scansLoaded) return;
    const list = await dbFitnessScans.list(client!.id);
    setScans(list);
    setScansLoaded(true);
    // Load signed URLs (5-min TTL)
    const urls: Record<string, string> = {};
    await Promise.all(list.map(async (s) => {
      const url = await dbFitnessScans.getSignedUrl(s.storage_path);
      if (url) urls[s.id] = url;
    }));
    setScanUrls(urls);
  }

  async function handleScanUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setScanUploading(true);
    try {
      const resized = await resizeImage(file);

      // ── CV analysis (TF.js MoveNet — zero Claude token cost) ───────────────
      let bodyFeatures: BodyFeatures | null = null;
      try {
        const { analyseImage } = await import("@/lib/cv-analysis");
        bodyFeatures = await analyseImage(resized);
      } catch (cvErr) {
        console.warn("[CV] Pose detection failed (non-blocking):", cvErr);
      }

      const path   = await dbFitnessScans.upload(client!.id, resized, scanUploadDate);
      const record = await dbFitnessScans.create({
        clientId:     client!.id,
        storagePath:  path,
        takenAt:      scanUploadDate,
        notes:        scanUploadNotes || undefined,
        bodyFeatures: bodyFeatures ?? undefined,
      });
      const url = await dbFitnessScans.getSignedUrl(path);
      setScans(prev => [record, ...prev]);
      if (url) setScanUrls(prev => ({ ...prev, [record.id]: url }));
      setScanUploadNotes("");
      showToast(bodyFeatures ? "Foto caricata · analisi CV completata" : "Foto caricata");
    } catch { showToast("Errore nel caricamento", "error"); }
    finally { setScanUploading(false); }
  }

  async function handleScanDelete(scan: FitnessScan) {
    setScans(prev => prev.filter(s => s.id !== scan.id));
    setScanUrls(prev => { const n = { ...prev }; delete n[scan.id]; return n; });
    try { await dbFitnessScans.remove(scan.id, scan.storage_path); }
    catch { showToast("Errore nell'eliminazione", "error"); }
  }

  async function handleScanAnalyze(scan: FitnessScan) {
    setScanAnalyzing(scan.id);
    try {
      const { data: { session } } = await createSupabaseClient().auth.getSession();
      if (!session) throw new Error("not authenticated");
      const resp = await fetch("/api/fitness-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ scanId: scan.id, storagePath: scan.storage_path }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Analisi fallita");
      const analysis: FitnessScanAnalysis = json.analysis;
      setScans(prev => prev.map(s => s.id === scan.id ? { ...s, ai_analysis: analysis } : s));
      showToast("Analisi completata");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Errore nell'analisi", "error");
    } finally {
      setScanAnalyzing(null);
    }
  }

  async function handleCompare(beforeId: string, afterId: string) {
    setComparing(true);
    setComparingResult(null);
    try {
      const { data: { session } } = await createSupabaseClient().auth.getSession();
      if (!session) throw new Error("not authenticated");
      const resp = await fetch("/api/fitness-scan/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ scanBeforeId: beforeId, scanAfterId: afterId, clientId: client!.id }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Confronto fallito");
      setComparingResult(json.comparison as FitnessScanComparison);
      showToast("Confronto completato");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Errore nel confronto", "error");
    } finally {
      setComparing(false);
    }
  }

  // Progress photos — DB-backed PIN (no longer hardcoded)
  const [photoUnlocked, setPhotoUnlocked] = useState(false);
  const [photoPin, setPhotoPin] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pinVerifying, setPinVerifying] = useState(false);
  const [hasPinSet, setHasPinSet] = useState<boolean | null>(null);
  const [settingNewPin, setSettingNewPin] = useState(false);
  const [newPinVal, setNewPinVal] = useState("");
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  // Check if PIN is set on mount (when foto tab is opened)
  async function checkPinStatus() {
    try {
      const r = await fetch("/api/photo/pin");
      const j = await r.json();
      setHasPinSet(j.has_pin ?? false);
    } catch { setHasPinSet(false); }
  }

  // Save a new PIN
  async function saveNewPin() {
    if (!/^\d{4,8}$/.test(newPinVal)) {
      setPwError("Il PIN deve essere di 4-8 cifre numeriche");
      return;
    }
    setPinVerifying(true);
    try {
      const r = await fetch("/api/photo/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPinVal }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setHasPinSet(true);
      setSettingNewPin(false);
      setNewPinVal("");
      showToast("PIN impostato con successo");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Errore");
    } finally { setPinVerifying(false); }
  }

  // Verify PIN via API — server-side hash comparison, rate-limited
  async function unlockPhotos() {
    if (!photoPin) { setPwError("Inserisci il PIN"); return; }
    setPinVerifying(true);
    setPwError("");
    try {
      const r = await fetch("/api/photo/pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: photoPin }),
      });
      const j = await r.json();
      if (!r.ok) {
        setPwError(j.error ?? "PIN errato");
        setPhotoPin("");
        return;
      }
      // Store session token in sessionStorage (tab-scoped, cleared on close)
      sessionStorage.setItem("photo_session", j.token);
      sessionStorage.setItem("photo_session_exp", j.expires_at);
      setPhotoUnlocked(true);
      setPwError("");
      if (!photosLoaded) {
        const list = await dbProgressPhotos.list(client!.id);
        setPhotos(list);
        setPhotosLoaded(true);
        // Load view-token-secured URLs for each photo
        await refreshPhotoUrls(list);
      }
    } catch { setPwError("Errore di rete. Riprova."); }
    finally { setPinVerifying(false); }
  }

  // Get a single-use secure URL for each photo
  async function refreshPhotoUrls(list: ProgressPhoto[]) {
    const urls: Record<string, string> = {};
    await Promise.all(list.map(async (p) => {
      try {
        const r = await fetch(`/api/photo/view-token?path=${encodeURIComponent(p.storage_path)}&bucket=progress`);
        if (r.ok) {
          const j = await r.json();
          urls[p.id] = j.signed_url;
          // Mark token used after a short delay (image should have loaded)
          setTimeout(() => {
            fetch("/api/photo/view-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: j.view_token }),
            }).catch(() => {});
          }, 10000); // 10s — enough for image to fully load
        }
      } catch {}
    }));
    setPhotoUrls(urls);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setUploading(true);
    try {
      const { data: { user } } = await createSupabaseClient().auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const resized = await resizeImage(file);
      const path = await dbProgressPhotos.upload(client!.id, resized, uploadDate);
      const record = await dbProgressPhotos.create({ clientId: client!.id, storagePath: path, takenAt: uploadDate, notes: uploadNotes || undefined });
      setPhotos(prev => [record, ...prev]);
      setUploadNotes("");
      showToast("Foto caricata");
    } catch { showToast("Errore nel caricamento", "error"); }
    finally { setUploading(false); }
  }

  async function handlePhotoDelete(photo: ProgressPhoto) {
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    try { await dbProgressPhotos.remove(photo.id, photo.storage_path); }
    catch { showToast("Errore nell'eliminazione", "error"); }
  }

  // Portal link copy
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);

  function copyPortalLink(shareToken: string, planId: string) {
    const url = `${window.location.origin}/cliente/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPlanId(planId);
      setTimeout(() => setCopiedPlanId(null), 2000);
    });
  }


  if (!client) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: "var(--text-muted)" }}>Cliente non trovato.</p>
        <button onClick={() => router.push("/dashboard/clienti")} className="mt-4 text-sm hover:underline" style={{ color: "var(--accent-light)" }}>
          Torna alla lista
        </button>
      </div>
    );
  }

  async function savePhase() {
    if (!phaseForm.name || !phaseForm.startDate) return;
    setSaving(true); setSaveError("");
    const p = addPhase(client!.id, {
      name: phaseForm.name, type: phaseForm.type as "bulk" | "cut" | "maintenance" | "custom",
      startDate: phaseForm.startDate, endDate: phaseForm.endDate || undefined,
      targetCalories: phaseForm.targetCalories ? parseInt(phaseForm.targetCalories) : undefined,
      targetWeight: phaseForm.targetWeight ? parseFloat(phaseForm.targetWeight) : undefined,
      notes: phaseForm.notes || undefined, completed: false,
    });
    try {
      await dbPhases.create(p);
      setShowPhaseModal(false);
      setPhaseForm({ name: "", type: "bulk", startDate: "", endDate: "", targetCalories: "", targetWeight: "", notes: "" });
      showToast("Fase salvata");
    } catch (err) {
      removePhase(client!.id, p.id);
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function saveEditPhase() {
    if (!editingPhase || !editingPhase.name || !editingPhase.startDate) return;
    setSaving(true); setSaveError("");
    const patch = {
      name: editingPhase.name.trim(),
      type: editingPhase.type as "bulk" | "cut" | "maintenance" | "custom",
      startDate: editingPhase.startDate,
      endDate: editingPhase.endDate || undefined,
      targetCalories: editingPhase.targetCalories ? parseInt(editingPhase.targetCalories) : undefined,
      targetWeight: editingPhase.targetWeight ? parseFloat(editingPhase.targetWeight) : undefined,
      notes: editingPhase.notes || undefined,
    };
    updatePhase(client!.id, editingPhase.id, patch);
    try {
      await dbPhases.update(editingPhase.id, patch);
      setEditingPhase(null);
      showToast("Fase aggiornata");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function saveWorkout() {
    if (!workoutForm.name) return;
    setSaving(true); setSaveError("");
    const rest = parseInt(workoutForm.restSeconds) || undefined;
    const w = addWorkoutPlan(client!.id, {
      name: workoutForm.name, description: workoutForm.description,
      daysPerWeek: parseInt(workoutForm.daysPerWeek),
      totalWeeks: parseInt(workoutForm.totalWeeks) || 12,
      restSeconds: rest,
      phaseId: workoutForm.phaseId || undefined,
      active: true,
    });
    try {
      await dbWorkoutPlans.create(w);
      setShowWorkoutModal(false);
      setWorkoutForm({ name: "", description: "", daysPerWeek: "3", totalWeeks: "", restSeconds: "", phaseId: "" });
      showToast("Scheda creata");
    } catch (err) {
      removeWorkoutPlan(client!.id, w.id);
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function saveEditPlan() {
    if (!editingPlan || !editingPlan.name.trim()) return;
    setSaving(true); setSaveError("");
    const patch = {
      name: editingPlan.name.trim(),
      description: editingPlan.description.trim() || undefined,
      daysPerWeek: parseInt(editingPlan.daysPerWeek),
      totalWeeks: parseInt(editingPlan.totalWeeks) || 12,
      restSeconds: parseInt(editingPlan.restSeconds) || undefined,
      phaseId: editingPlan.phaseId || undefined,
    };
    updateWorkoutPlan(client!.id, editingPlan.id, patch);
    try {
      await dbWorkoutPlans.update(editingPlan.id, patch);
      setEditingPlan(null);
      showToast("Scheda aggiornata");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function duplicatePlan(wp: ReturnType<typeof useAppStore.getState>["clients"][0]["workoutPlans"][0]) {
    const newPlan = addWorkoutPlan(client!.id, {
      name: `${wp.name} (copia)`,
      description: wp.description,
      daysPerWeek: wp.daysPerWeek,
      totalWeeks: wp.totalWeeks,
      restSeconds: wp.restSeconds,
      phaseId: wp.phaseId,
      active: false,
      dayLabels: wp.dayLabels,
    });
    // Copy exercises
    const withExercises = { ...newPlan, exercises: wp.exercises.map((e) => ({ ...e, id: crypto.randomUUID() })) };
    updateWorkoutPlan(client!.id, newPlan.id, { exercises: withExercises.exercises });
    try {
      await dbWorkoutPlans.create({ ...withExercises });
      showToast("Scheda duplicata");
    } catch (err) {
      removeWorkoutPlan(client!.id, newPlan.id);
      showToast("Errore nella duplicazione", "error");
    }
  }

  async function handleDietSave(data: Omit<DietPlan, "id" | "clientId" | "createdAt">) {
    setSaving(true); setSaveError("");
    if (editingDietPlan) {
      // Edit existing
      updateDietPlan(client!.id, editingDietPlan.id, data);
      try {
        await dbDietPlans.update(editingDietPlan.id, data);
        setDietEditorOpen(false);
        setEditingDietPlan(null);
        showToast("Piano aggiornato");
      } catch (err) {
        // Rollback
        updateDietPlan(client!.id, editingDietPlan.id, editingDietPlan);
        setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
        showToast("Errore nel salvataggio", "error");
      }
    } else {
      // Create new
      const d = addDietPlan(client!.id, data);
      try {
        await dbDietPlans.create(d);
        setDietEditorOpen(false);
        showToast("Piano alimentare creato");
      } catch (err) {
        removeDietPlan(client!.id, d.id);
        setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
        showToast("Errore nel salvataggio", "error");
      }
    }
    setSaving(false);
  }

  async function saveNote() {
    if (!noteText.trim()) return;
    const n = addNote(client!.id, noteText.trim());
    try {
      await dbNotes.create(n);
      setNoteText("");
      showToast("Nota aggiunta");
    } catch (err) {
      removeNote(client!.id, n.id);
      showToast("Errore nel salvataggio", "error");
    }
  }

  const tabs: { key: Tab; label: string; icon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }>; count?: number; beta?: boolean }[] = [
    { key: "overview", label: "Overview", icon: BarChart2 },
    { key: "fasi", label: "Fasi", icon: Activity, count: client.phases.length },
    { key: "schede", label: "Schede", icon: Dumbbell, count: client.workoutPlans.length },
    { key: "dieta", label: "Dieta", icon: UtensilsCrossed, count: client.dietPlans.length },
    { key: "misurazioni", label: "Misurazioni", icon: TrendingUp, count: client.measurements.length },
    { key: "note", label: "Note", icon: StickyNote, count: client.notes.length },
    { key: "foto", label: "Foto", icon: Camera, count: photosLoaded ? photos.length : undefined },
    { key: "scan", label: "Fitness Scan", icon: Scan, beta: true },
  ];

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm outline-none";
  const inputStyle = { background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" };
  const selectStyle = { background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" };

  const activePhase = [...client.phases]
    .filter((p) => !p.completed)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

  // Recent logs: last 2 weeks across all plans
  const recentLogCount = client.workoutPlans.reduce((acc, wp) => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return acc + wp.logs.filter((l) => new Date(l.loggedAt).getTime() > twoWeeksAgo).length;
  }, 0);

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
      {/* Back + header */}
      <button onClick={() => router.push("/dashboard/clienti")}
        className="flex items-center gap-2 text-sm mb-5 hover:opacity-80 transition-all"
        style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={15} /> Tutti i clienti
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl accent-btn flex items-center justify-center text-xl font-bold flex-shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{client.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[client.status] }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{statusLabel[client.status]}</span>
              </div>
              {client.goal && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(229,50,50,0.1)", color: "var(--accent-light)" }}>{goalLabel[client.goal]}</span>}
              {client.level && <span className="text-xs" style={{ color: "var(--text-dim)" }}>{levelLabel[client.level]}</span>}
            </div>
          </div>
        </div>
        {client.monthlyFee && (
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>Quota mensile</p>
            <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>€{client.monthlyFee}</p>
          </div>
        )}
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="mb-4 p-3 rounded-xl flex items-center justify-between gap-2 text-xs"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          <span>⚠ {saveError}</span>
          <button onClick={() => setSaveError("")} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ key, label, icon: Icon, count, beta }) => (
          <button key={key} onClick={() => { setTab(key); if (key === "scan") loadScans(); if (key === "foto" && hasPinSet === null) checkPinStatus(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
            style={{
              background: tab === key ? "rgba(229,50,50,0.12)" : "transparent",
              color: tab === key ? "var(--accent-light)" : "var(--text-muted)",
              border: tab === key ? "1px solid rgba(229,50,50,0.22)" : "1px solid transparent",
              fontWeight: tab === key ? "600" : "400",
            }}>
            <Icon size={14} />
            {label}
            {beta && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: "0.55rem", letterSpacing: "0.05em" }}>BETA</span>
            )}
            {count !== undefined && count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(229,50,50,0.16)", color: "var(--accent-light)" }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card-luxury rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Informazioni personali</h3>
            <div className="space-y-3">
              {client.email && <div className="flex items-center gap-3 text-sm"><Mail size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "var(--text-muted)" }}>{client.email}</span></div>}
              {client.phone && <div className="flex items-center gap-3 text-sm"><Phone size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "var(--text-muted)" }}>{client.phone}</span></div>}
              {client.birthDate && <div className="flex items-center gap-3 text-sm"><Calendar size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "var(--text-muted)" }}>{formatDate(client.birthDate)}</span></div>}
              {client.goal && <div className="flex items-center gap-3 text-sm"><Target size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "var(--text-muted)" }}>{goalLabel[client.goal]}</span></div>}
              <div className="flex items-center gap-3 text-sm"><Calendar size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "var(--text-muted)" }}>Inizio: {formatDate(client.startDate)}</span></div>
            </div>
          </div>

          <div className="card-luxury rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Riepilogo attività</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Fasi", value: client.phases.length, color: "#a78bfa" },
                { label: "Schede", value: client.workoutPlans.length, color: "var(--accent)" },
                { label: "Diete", value: client.dietPlans.length, color: "#34d399" },
                { label: "Log recenti", value: recentLogCount, color: "#38bdf8" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface-sm)" }}>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {activePhase && (
            <div className="card-luxury rounded-2xl p-5 sm:col-span-2">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Fase attiva</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: phaseTypeColor[activePhase.type] }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{activePhase.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {formatDate(activePhase.startDate)} → {activePhase.endDate ? formatDate(activePhase.endDate) : "In corso"}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${phaseTypeColor[activePhase.type]}18`, color: phaseTypeColor[activePhase.type] }}>
                  {phaseTypeLabel[activePhase.type]}
                </span>
                {activePhase.targetCalories && (
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                    {activePhase.targetCalories} kcal target
                  </span>
                )}
              </div>
            </div>
          )}

          {recentLogCount > 0 && (
            <div className="card-luxury rounded-2xl p-5 sm:col-span-2">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Attività recente (14 giorni)</h3>
              <div className="space-y-2">
                {client.workoutPlans.map((wp) => {
                  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
                  const recentLogs = wp.logs.filter((l) => new Date(l.loggedAt).getTime() > twoWeeksAgo);
                  if (recentLogs.length === 0) return null;
                  const lastLog = [...recentLogs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
                  return (
                    <div key={wp.id} className="flex items-center gap-3 text-sm">
                      <Dumbbell size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                      <span className="flex-1" style={{ color: "var(--text-muted)" }}>{wp.name}</span>
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>{recentLogs.length} log · ultima {formatDate(lastLog.loggedAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FASI ── */}
      {tab === "fasi" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{client.phases.length} {client.phases.length === 1 ? "fase" : "fasi"}</p>
            <button onClick={() => setShowPhaseModal(true)} className="accent-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <Plus size={14} /> Nuova fase
            </button>
          </div>
          {client.phases.length === 0 ? (
            <div className="text-center py-16 card-luxury rounded-2xl">
              <Activity size={40} className="mx-auto mb-3" style={{ color: "rgba(229,50,50,0.3)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nessuna fase pianificata</p>
              <button onClick={() => setShowPhaseModal(true)} className="mt-3 text-xs hover:underline" style={{ color: "var(--accent-light)" }}>Aggiungi la prima fase</button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...client.phases].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((phase) => (
                <div key={phase.id} className="card-luxury rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: phaseTypeColor[phase.type] }} />
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>{phase.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {formatDate(phase.startDate)} → {phase.endDate ? formatDate(phase.endDate) : "In corso"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${phaseTypeColor[phase.type]}18`, color: phaseTypeColor[phase.type] }}>
                        {phaseTypeLabel[phase.type]}
                      </span>
                      <button
                        onClick={() => setEditingPhase({ id: phase.id, name: phase.name, type: phase.type, startDate: phase.startDate, endDate: phase.endDate ?? "", targetCalories: phase.targetCalories ? String(phase.targetCalories) : "", targetWeight: phase.targetWeight ? String(phase.targetWeight) : "", notes: phase.notes ?? "" })}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-all" title="Modifica fase">
                        <Pencil size={13} style={{ color: "var(--text-muted)" }} />
                      </button>
                      <button onClick={() => { updatePhase(client!.id, phase.id, { completed: !phase.completed }); dbPhases.update(phase.id, { completed: !phase.completed }).catch(() => {}); }}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-all">
                        {phase.completed ? <CheckCircle2 size={15} style={{ color: "#22c55e" }} /> : <Circle size={15} style={{ color: "var(--text-dim)" }} />}
                      </button>
                      <button onClick={async () => { removePhase(client!.id, phase.id); try { await dbPhases.remove(phase.id); } catch {} }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 size={14} style={{ color: "rgba(239,68,68,0.6)" }} />
                      </button>
                    </div>
                  </div>
                  {(phase.targetCalories || phase.targetWeight || phase.notes) && (
                    <div className="mt-3 pt-3 flex flex-wrap gap-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      {phase.targetCalories && <div><p className="text-xs" style={{ color: "var(--text-dim)" }}>Calorie target</p><p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{phase.targetCalories} kcal</p></div>}
                      {phase.targetWeight && <div><p className="text-xs" style={{ color: "var(--text-dim)" }}>Peso target</p><p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{phase.targetWeight} kg</p></div>}
                      {phase.notes && <p className="text-xs w-full" style={{ color: "var(--text-muted)" }}>{phase.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SCHEDE ── */}
      {tab === "schede" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{client.workoutPlans.length} {client.workoutPlans.length === 1 ? "scheda" : "schede"}</p>
            <button onClick={() => setShowWorkoutModal(true)} className="accent-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <Plus size={14} /> Nuova scheda
            </button>
          </div>

          {client.workoutPlans.length === 0 ? (
            <div className="text-center py-16 card-luxury rounded-2xl">
              <Dumbbell size={40} className="mx-auto mb-3" style={{ color: "rgba(229,50,50,0.3)" }} />
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Nessuna scheda di allenamento</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>Crea la prima scheda e condividi il link col cliente</p>
              <button onClick={() => setShowWorkoutModal(true)} className="accent-btn px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus size={14} /> Crea la prima scheda
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...client.workoutPlans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((wp) => {
                const linkedPhase = client.phases.find((ph) => ph.id === wp.phaseId);
                return (
                  <div key={wp.id} className="card-luxury rounded-2xl p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold" style={{ color: "var(--text)" }}>{wp.name}</p>
                          {wp.active && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>Attiva</span>
                          )}
                          {linkedPhase && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${phaseTypeColor[linkedPhase.type]}18`, color: phaseTypeColor[linkedPhase.type] }}>
                              {linkedPhase.name}
                            </span>
                          )}
                        </div>
                        {wp.description && (
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{wp.description}</p>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => duplicatePlan(wp)}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
                          title="Duplica scheda">
                          <Copy size={13} style={{ color: "var(--text-muted)" }} />
                        </button>
                        <button
                          onClick={() => setEditingPlan({ id: wp.id, name: wp.name, description: wp.description ?? "", daysPerWeek: String(wp.daysPerWeek), totalWeeks: String(wp.totalWeeks ?? 12), restSeconds: String(wp.restSeconds ?? 90), phaseId: wp.phaseId ?? "" })}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
                          title="Modifica scheda">
                          <Pencil size={13} style={{ color: "var(--text-muted)" }} />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Eliminare la scheda "${wp.name}"?`)) return;
                            removeWorkoutPlan(client!.id, wp.id);
                            try { await dbWorkoutPlans.remove(wp.id); } catch {}
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                          title="Elimina scheda">
                          <Trash2 size={13} style={{ color: "rgba(239,68,68,0.55)" }} />
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        { label: `${wp.daysPerWeek} gg/sett` },
                        { label: wp.totalWeeks ? `${wp.totalWeeks} sett.` : "Durata libera" },
                        { label: `${wp.exercises.length} esercizi` },
                        ...(wp.restSeconds ? [{ label: formatRestTime(wp.restSeconds), icon: true }] : []),
                      ].map(({ label, icon }) => (
                        <span key={label} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                          {icon && <Timer size={10} />}
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* Share link + open */}
                    <div className="flex items-center gap-2 pt-3 flex-wrap" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      {wp.shareToken && (
                        <button
                          onClick={() => copyPortalLink(wp.shareToken, wp.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                          style={copiedPlanId === wp.id
                            ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }
                            : { background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          {copiedPlanId === wp.id ? <><Check size={11} /> Link copiato!</> : <><Copy size={11} /> Portale cliente</>}
                        </button>
                      )}
                      <Link
                        href={`/dashboard/clienti/${id}/schede/${wp.id}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ml-auto"
                        style={{ background: "rgba(229,50,50,0.1)", border: "1px solid rgba(229,50,50,0.22)", color: "var(--accent-light)" }}>
                        <ExternalLink size={11} /> Apri &amp; Modifica
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DIETA ── */}
      {tab === "dieta" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{client.dietPlans.length} piani</p>
            <button onClick={() => { setEditingDietPlan(null); setDietEditorOpen(true); }} className="accent-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <Plus size={14} /> Nuovo piano
            </button>
          </div>
          {client.dietPlans.length === 0 ? (
            <div className="text-center py-16 card-luxury rounded-2xl">
              <UtensilsCrossed size={40} className="mx-auto mb-3" style={{ color: "rgba(229,50,50,0.3)" }} />
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Nessun piano alimentare</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>Crea un piano con macro, range di grammi e pasti dettagliati</p>
              <button onClick={() => { setEditingDietPlan(null); setDietEditorOpen(true); }}
                className="accent-btn px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus size={14} /> Crea il primo piano
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {client.dietPlans.map((dp) => {
                const linkedPhase = client.phases.find((ph) => ph.id === dp.phaseId);
                const mealsData: Array<{ id: string; name: string; time?: string; items: Array<{ id: string; name: string; grams: number; gramsMax?: number; protein?: number; carbs?: number; fat?: number }> }> = (() => {
                  try { const p = JSON.parse(dp.meals); if (Array.isArray(p) && p[0]?.items) return p; } catch {}
                  return [];
                })();
                const isExpanded = expandedDietId === dp.id;
                return (
                  <div key={dp.id} className="card-luxury rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold" style={{ color: "var(--text)" }}>{dp.name}</p>
                            {dp.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>Attivo</span>}
                            {linkedPhase && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${phaseTypeColor[linkedPhase.type]}18`, color: phaseTypeColor[linkedPhase.type] }}>
                                {linkedPhase.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { setEditingDietPlan(dp); setDietEditorOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-all" title="Modifica piano">
                            <Pencil size={13} style={{ color: "var(--text-muted)" }} />
                          </button>
                          <button onClick={async () => {
                            if (!confirm(`Eliminare "${dp.name}"?`)) return;
                            removeDietPlan(client!.id, dp.id);
                            try { await dbDietPlans.remove(dp.id); } catch {}
                          }} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                            <Trash2 size={13} style={{ color: "rgba(239,68,68,0.55)" }} />
                          </button>
                        </div>
                      </div>
                      {/* Macro grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { label: "Calorie", value: formatCalories(dp.calories, dp.caloriesMax), color: "var(--accent)", icon: <Flame size={11} /> },
                          { label: "Proteine", value: dp.proteinMax ? `${dp.protein}–${dp.proteinMax}g` : `${dp.protein}g`, color: "#a78bfa", icon: <Beef size={11} /> },
                          { label: "Carboidrati", value: dp.carbsMax ? `${dp.carbs}–${dp.carbsMax}g` : `${dp.carbs}g`, color: "#38bdf8", icon: <Wheat size={11} /> },
                          { label: "Grassi", value: dp.fatMax ? `${dp.fat}–${dp.fatMax}g` : `${dp.fat}g`, color: "#fbbf24", icon: <Droplets size={11} /> },
                        ].map(({ label, value, color, icon }) => (
                          <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-sm)" }}>
                            <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
                              {icon}
                              <p className="text-xs" style={{ color: "var(--text-dim)" }}>{label}</p>
                            </div>
                            <p className="text-sm font-bold leading-tight" style={{ color }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      {dp.notes && <p className="text-xs mt-3 italic" style={{ color: "var(--text-muted)" }}>{dp.notes}</p>}
                    </div>

                    {/* Meals section */}
                    {mealsData.length > 0 && (
                      <div style={{ borderTop: "1px solid rgba(229,50,50,0.1)" }}>
                        <button onClick={() => setExpandedDietId(isExpanded ? null : dp.id)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-all"
                          style={{ color: "var(--text-muted)" }}>
                          <span className="text-xs font-medium flex items-center gap-2">
                            <UtensilsCrossed size={12} style={{ color: "var(--accent)" }} />
                            {mealsData.length} {mealsData.length === 1 ? "pasto" : "pasti"} nel piano
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {isExpanded && (
                          <div className="px-5 pb-4 space-y-3">
                            {mealsData.map((meal, mi) => (
                              <div key={meal.id} className="rounded-xl p-3" style={{ background: "var(--surface-xs)", border: "1px solid rgba(229,50,50,0.1)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center flex-shrink-0"
                                    style={{ background: "rgba(229,50,50,0.14)", color: "var(--accent-light)" }}>{mi + 1}</span>
                                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{meal.name}</span>
                                  {meal.time && <span className="text-xs" style={{ color: "var(--text-dim)" }}>{meal.time}</span>}
                                </div>
                                {meal.items.length > 0 && (
                                  <div className="space-y-1">
                                    {meal.items.map((item) => (
                                      <div key={item.id} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                        <span className="flex-1">{item.name || "—"}</span>
                                        <span className="font-medium" style={{ color: "var(--text)" }}>
                                          {item.gramsMax ? `${item.grams}–${item.gramsMax}g` : `${item.grams}g`}
                                        </span>
                                        {(item.protein || item.carbs || item.fat) && (
                                          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                                            {item.protein ? `P:${item.protein}g` : ""}{item.carbs ? ` C:${item.carbs}g` : ""}{item.fat ? ` G:${item.fat}g` : ""}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NOTE ── */}
      {tab === "note" && (
        <div>
          <div className="card-luxury rounded-2xl p-4 mb-4">
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Aggiungi una nota sul cliente…"
              rows={3}
              className="w-full bg-transparent outline-none text-sm resize-none"
              style={{ color: "var(--text)" }} />
            <div className="flex justify-end mt-2">
              <button onClick={saveNote} disabled={!noteText.trim()}
                className="accent-btn px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40">
                <Plus size={13} /> Aggiungi nota
              </button>
            </div>
          </div>
          {client.notes.length === 0 ? (
            <div className="text-center py-10" style={{ color: "var(--text-dim)" }}>
              <StickyNote size={32} className="mx-auto mb-2" style={{ color: "rgba(229,50,50,0.25)" }} />
              <p className="text-sm">Nessuna nota ancora</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...client.notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((note) => (
                <div key={note.id} className="card-luxury rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm flex-1" style={{ color: "var(--text-muted)" }}>{note.content}</p>
                    <button onClick={async () => { removeNote(client!.id, note.id); try { await dbNotes.remove(note.id); } catch {} }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0">
                      <Trash2 size={13} style={{ color: "rgba(239,68,68,0.5)" }} />
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>{formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOTO ── */}
      {tab === "foto" && (
        <div>
          {!photoUnlocked ? (
            <div className="max-w-sm mx-auto mt-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(229,50,50,0.1)", border: "1px solid rgba(229,50,50,0.22)" }}>
                  <KeyRound size={24} style={{ color: "var(--accent)" }} />
                </div>
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>Sezione protetta</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Le foto di progresso sono protette da un PIN personale che imposti tu.
                  Verificato server-side — non è nel codice sorgente.
                </p>
              </div>

              {/* Set PIN for first time */}
              {hasPinSet === false || settingNewPin ? (
                <div className="card-luxury rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    {hasPinSet === false ? "Primo accesso — imposta il tuo PIN (4-8 cifre):" : "Cambia PIN:"}
                  </p>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={newPinVal}
                      onChange={e => { setNewPinVal(e.target.value.replace(/\D/g, "")); setPwError(""); }}
                      onKeyDown={e => e.key === "Enter" && saveNewPin()}
                      placeholder="es. 1234" maxLength={8}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-12"
                      style={{ background: "var(--surface)", border: `1px solid ${pwError ? "rgba(239,68,68,0.5)" : "rgba(229,50,50,0.22)"}`, color: "var(--text)" }} autoFocus />
                    <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwError && <p className="text-xs" style={{ color: "#f87171" }}>{pwError}</p>}
                  <div className="flex gap-2">
                    {settingNewPin && (
                      <button onClick={() => { setSettingNewPin(false); setPwError(""); setNewPinVal(""); }}
                        className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                        Annulla
                      </button>
                    )}
                    <button onClick={saveNewPin} disabled={pinVerifying}
                      className="flex-1 accent-btn py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                      {pinVerifying ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      {pinVerifying ? "Salvataggio…" : "Salva PIN"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card-luxury rounded-2xl p-5 space-y-3">
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={photoPin}
                      onChange={e => { setPhotoPin(e.target.value.replace(/\D/g, "")); setPwError(""); }}
                      onKeyDown={e => e.key === "Enter" && unlockPhotos()}
                      placeholder="Inserisci PIN" maxLength={8}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-12"
                      style={{ background: "var(--surface)", border: `1px solid ${pwError ? "rgba(239,68,68,0.5)" : "rgba(229,50,50,0.22)"}`, color: "var(--text)" }} autoFocus />
                    <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwError && <p className="text-xs" style={{ color: "#f87171" }}>{pwError}</p>}
                  <button onClick={unlockPhotos} disabled={pinVerifying}
                    className="w-full accent-btn py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    {pinVerifying ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    {pinVerifying ? "Verifica in corso…" : "Sblocca sezione"}
                  </button>
                  <button onClick={() => { setSettingNewPin(true); setPwError(""); checkPinStatus(); }}
                    className="w-full text-xs text-center" style={{ color: "var(--text-faint)" }}>
                    Cambia PIN
                  </button>
                  <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
                    PIN verificato server-side · SHA-256 salted hash · rate limited 5 tentativi/5 min
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Photo gallery + upload */
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs flex items-center gap-1.5" style={{ color: "#22c55e" }}>
                  <ShieldCheck size={12} /> Sessione sicura attiva · link usa-e-getta · scade in 30 min
                </p>
                <button onClick={() => { setPhotoUnlocked(false); setPhotos([]); setPhotosLoaded(false); setPhotoUrls({}); sessionStorage.removeItem("photo_session"); }}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{ background: "rgba(239,68,68,0.07)", color: "rgba(239,68,68,0.7)" }}>
                  Blocca
                </button>
              </div>

              {/* Upload form */}
              <div className="card-luxury rounded-2xl p-5 mb-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Upload size={15} style={{ color: "var(--accent)" }} /> Aggiungi foto
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Data foto *</label>
                    <input type="date" value={uploadDate} onChange={e => setUploadDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Note (opzionale)</label>
                    <input type="text" value={uploadNotes} onChange={e => setUploadNotes(e.target.value)}
                      placeholder="es. Settimana 4 bulk"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" }} />
                  </div>
                </div>
                <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${uploading ? "opacity-60 pointer-events-none" : "hover:opacity-90"} accent-btn`}>
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                  {uploading ? "Caricamento..." : "Seleziona foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
                <p className="text-xs mt-2 text-center" style={{ color: "var(--text-faint)" }}>
                  Ridimensionata · Cifrata a riposo · Link single-use 90s · Audit log
                </p>
              </div>

              {/* Gallery — use view-token secured URLs */}
              {photos.length === 0 ? (
                <div className="text-center py-16 card-luxury rounded-2xl">
                  <Camera size={40} className="mx-auto mb-3" style={{ color: "rgba(229,50,50,0.3)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nessuna foto ancora</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>
                    {photos.length} foto · URL a uso singolo · scadono dopo la visualizzazione
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map(photo => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        secureUrl={photoUrls[photo.id]}
                        onDelete={() => handlePhotoDelete(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MISURAZIONI ── */}
      {tab === "misurazioni" && (() => {
        const sortedM = [...client.measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const chartData = [...client.measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // SVG weight chart
        const WeightChart = () => {
          if (chartData.length < 2) return null;
          const weights = chartData.map((m) => m.weight);
          const minW = Math.min(...weights), maxW = Math.max(...weights);
          const rangeW = maxW - minW || 1;
          const W = 100, H = 60;
          const pts = chartData.map((m, i) => {
            const x = (i / (chartData.length - 1)) * W;
            const y = H - ((m.weight - minW) / rangeW) * (H - 10) - 5;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
          }).join(" ");
          const areaPath = `M ${pts.split(" ")[0]} L ${pts.split(" ").slice(1).join(" L ")} L ${W},${H} L 0,${H} Z`;
          return (
            <div className="card-luxury rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Andamento peso</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{chartData[chartData.length - 1].weight}</span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>kg</span>
                  {chartData.length > 1 && (() => {
                    const diff = chartData[chartData.length - 1].weight - chartData[0].weight;
                    return (
                      <span className="text-xs ml-1 font-semibold" style={{ color: diff < 0 ? "#22c55e" : diff > 0 ? "#f87171" : "var(--text-dim)" }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg
                      </span>
                    );
                  })()}
                </div>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "90px", display: "block" }}>
                <defs>
                  <linearGradient id="wgc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E53232" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#E53232" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#wgc)" />
                <polyline points={pts} fill="none" stroke="#E53232" strokeWidth="1.5"
                  strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {chartData.map((m, i) => {
                  const x = (i / (chartData.length - 1)) * W;
                  const y = H - ((m.weight - minW) / rangeW) * (H - 10) - 5;
                  return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="1.8" fill="#E53232" vectorEffect="non-scaling-stroke" />;
                })}
              </svg>
              <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                <span>{formatDate(chartData[0].date)}</span>
                <span>{formatDate(chartData[chartData.length - 1].date)}</span>
              </div>
            </div>
          );
        };

        return (
          <div>
            <WeightChart />

            {/* Add form */}
            <div className="card-luxury rounded-2xl p-5 mb-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Nuova misurazione</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Data *</label>
                  <input type="date" value={measForm.date} onChange={(e) => setMeasForm({ ...measForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Peso (kg) *</label>
                  <input type="number" step="0.1" placeholder="82.5" value={measForm.weight} onChange={(e) => setMeasForm({ ...measForm, weight: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>% Grasso</label>
                  <input type="number" step="0.1" placeholder="18.5" value={measForm.bodyFat} onChange={(e) => setMeasForm({ ...measForm, bodyFat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                {([
                  { key: "chest", label: "Petto" },
                  { key: "waist", label: "Vita" },
                  { key: "hips",  label: "Fianchi" },
                  { key: "arms",  label: "Braccia" },
                  { key: "legs",  label: "Gambe" },
                ] as const).map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label} (cm)</label>
                    <input type="number" step="0.5" placeholder="—"
                      value={measForm[key]}
                      onChange={(e) => setMeasForm({ ...measForm, [key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                  </div>
                ))}
              </div>
              <button onClick={saveMeasurement} disabled={!measForm.date || !measForm.weight || measSaving}
                className="accent-btn px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 disabled:opacity-40">
                {measSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Salva misurazione
              </button>
            </div>

            {/* History */}
            {sortedM.length === 0 ? (
              <div className="text-center py-12 card-luxury rounded-2xl">
                <TrendingUp size={32} className="mx-auto mb-2" style={{ color: "rgba(229,50,50,0.3)" }} />
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>Nessuna misurazione ancora</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedM.map((m) => (
                  <div key={m.id} className="card-luxury rounded-2xl p-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                        <span className="text-xs" style={{ color: "var(--text-dim)" }}>{formatDate(m.date)}</span>
                        <span className="font-bold text-base" style={{ color: "var(--text)" }}>{m.weight} kg</span>
                        {m.bodyFat && <span className="text-sm" style={{ color: "#a78bfa" }}>{m.bodyFat}% grasso</span>}
                      </div>
                      {(m.chest || m.waist || m.hips || m.arms || m.legs) && (
                        <div className="flex flex-wrap gap-3">
                          {m.chest && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Petto {m.chest}cm</span>}
                          {m.waist && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Vita {m.waist}cm</span>}
                          {m.hips  && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Fianchi {m.hips}cm</span>}
                          {m.arms  && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Braccia {m.arms}cm</span>}
                          {m.legs  && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Gambe {m.legs}cm</span>}
                        </div>
                      )}
                    </div>
                    <button onClick={async () => { removeMeasurement(client!.id, m.id); try { await dbMeasurements.remove(m.id); } catch {} }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0">
                      <Trash2 size={13} style={{ color: "rgba(239,68,68,0.5)" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── FITNESS SCAN ── */}
      {tab === "scan" && (() => {
        // Group scans by month "YYYY-MM"
        const byMonth: Record<string, FitnessScan[]> = {};
        [...scans].sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())
          .forEach(s => {
            const key = s.taken_at.slice(0, 7);
            if (!byMonth[key]) byMonth[key] = [];
            byMonth[key].push(s);
          });
        const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));
        const activeMonth = activeTimelineMonth ?? months[0] ?? null;

        // Build tier history: for each analysed scan (sorted oldest→newest), compute tier
        const tierHistory: { date: string; tier: Tier }[] = [...scans]
          .filter(s => s.ai_analysis)
          .sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime())
          .map(s => ({
            date: s.taken_at,
            tier: computeTier(s.ai_analysis!.body_fat_est, s.ai_analysis!.muscle_mass_est),
          }));
        const currentTier = tierHistory.length > 0 ? tierHistory[tierHistory.length - 1].tier : null;
        const prevTier    = tierHistory.length > 1 ? tierHistory[tierHistory.length - 2].tier : null;
        const delta       = currentTier && prevTier ? tierDelta(prevTier, currentTier) : 0;
        const cfg         = currentTier ? TIERS[currentTier] : null;

        // For compare mode: pick the first scan of each selected month
        const scanA = selectedMonthA ? byMonth[selectedMonthA]?.[0] : null;
        const scanB = selectedMonthB ? byMonth[selectedMonthB]?.[0] : null;
        const canCompare = !!(scanA && scanB && selectedMonthA !== selectedMonthB);

        return (
          <div>
            {/* ── SOLO LEVELING RANK HEADER ── */}
            {cfg && (
              <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, boxShadow: `0 0 30px ${cfg.glow}` }}>
                {/* Ambient glow */}
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`, opacity: 0.5 }} />
                <div className="flex items-center gap-4 relative z-10">
                  {/* Big rank badge */}
                  <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative"
                    style={{ background: cfg.badge_bg, border: `2px solid ${cfg.color}`, boxShadow: `0 0 20px ${cfg.glow}, inset 0 0 12px ${cfg.glow}` }}>
                    <span className="text-2xl font-black leading-none" style={{ color: cfg.color }}>
                      {currentTier}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: cfg.color, opacity: 0.7, fontSize: "0.5rem" }}>RANK</span>
                    {delta > 0 && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white font-black animate-bounce"
                        style={{ background: "#22c55e", fontSize: "0.55rem", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }}>↑{delta}</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color, letterSpacing: "0.15em" }}>
                        RANK {currentTier}
                      </p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.badge_bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    {delta > 0 && prevTier && (
                      <p className="text-xs font-bold mb-1" style={{ color: "#22c55e" }}>
                        ↑ RANK UP: {prevTier} → {currentTier} · {cfg.rank_up_msg}
                      </p>
                    )}
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{cfg.description}</p>
                  </div>
                </div>

                {/* Tier progression track */}
                <div className="flex items-center gap-1.5 mt-4 relative z-10">
                  {TIER_ORDER.map((t, i) => {
                    const tc = TIERS[t];
                    const isReached = tierHistory.some(h => h.tier === t);
                    const isCurrent = t === currentTier;
                    return (
                      <div key={t} className="flex items-center gap-1">
                        <div className={`flex items-center justify-center rounded-lg font-black transition-all ${isCurrent ? "w-10 h-8 text-sm" : "w-7 h-7 text-xs"}`}
                          style={{
                            background: isReached ? tc.badge_bg : "var(--surface-xs)",
                            border: `1px solid ${isReached ? tc.color : "var(--border)"}`,
                            color: isReached ? tc.color : "var(--text-faint)",
                            boxShadow: isCurrent ? `0 0 10px ${tc.glow}` : undefined,
                            opacity: isReached ? 1 : 0.4,
                          }}>
                          {t}
                        </div>
                        {i < TIER_ORDER.length - 1 && (
                          <ChevronRight size={10} style={{ color: isReached ? "var(--text-dim)" : "var(--text-faint)", opacity: 0.5 }} />
                        )}
                      </div>
                    );
                  })}
                  {tierHistory.length > 0 && (
                    <span className="ml-auto text-xs" style={{ color: "var(--text-faint)" }}>
                      {tierHistory.length} scan{tierHistory.length !== 1 ? " analizzate" : " analizzata"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Security notice (compact) */}
            <div className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2"
              style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.14)" }}>
              <ShieldCheck size={12} style={{ color: "#fbbf24", flexShrink: 0 }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="font-bold" style={{ color: "#fbbf24" }}>BETA · Enterprise security</span>
                {" "}· Bucket privato · Link 5 min TTL · Rate limiting · Audit SHA-256 · AI server-side
              </p>
            </div>

            {/* Upload + Compare mode toggle row */}
            <div className="flex items-center gap-3 mb-4">
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all flex-1 justify-center ${scanUploading ? "opacity-60 pointer-events-none" : "hover:opacity-90"} accent-btn`}>
                {scanUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {scanUploading ? "Caricamento…" : "Carica nuova foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handleScanUpload} disabled={scanUploading} />
              </label>
              {months.length >= 2 && (
                <button
                  onClick={() => { setCompareMode(c => !c); setComparingResult(null); setSelectedMonthA(null); setSelectedMonthB(null); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: compareMode ? "rgba(99,102,241,0.18)" : "var(--surface-sm)",
                    border: `1px solid ${compareMode ? "rgba(99,102,241,0.4)" : "var(--border)"}`,
                    color: compareMode ? "#a78bfa" : "var(--text-muted)",
                  }}>
                  <GitCompare size={14} />
                  {compareMode ? "Esci dal confronto" : "Confronta mesi"}
                </button>
              )}
            </div>

            {/* Upload date + notes — shown when no compare mode */}
            {!compareMode && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Data foto</label>
                  <input type="date" value={scanUploadDate} onChange={e => setScanUploadDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Note</label>
                  <input type="text" value={scanUploadNotes} onChange={e => setScanUploadNotes(e.target.value)}
                    placeholder="es. Fronte, Lato, Schiena…"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" }} />
                </div>
              </div>
            )}

            {!scansLoaded ? (
              <div className="text-center py-10">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" style={{ color: "rgba(229,50,50,0.5)" }} />
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>Caricamento scansioni…</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="text-center py-14 card-luxury rounded-2xl">
                <Brain size={36} className="mx-auto mb-3" style={{ color: "rgba(229,50,50,0.3)" }} />
                <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Nessuna scansione ancora</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "var(--text-dim)" }}>Carica la prima foto per avviare il tracciamento mensile della composizione corporea</p>
              </div>
            ) : (
              <>
                {/* Month timeline pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
                  {months.map(m => {
                    const label = new Date(m + "-01").toLocaleDateString("it-IT", { month: "short", year: "2-digit" }).replace(" ", " '");
                    const count = byMonth[m].length;
                    const isSelA = compareMode && selectedMonthA === m;
                    const isSelB = compareMode && selectedMonthB === m;
                    const isActive = !compareMode && activeMonth === m;
                    let bg = "var(--surface-sm)", border = "var(--border)", color = "var(--text-muted)";
                    if (isActive) { bg = "rgba(229,50,50,0.12)"; border = "rgba(229,50,50,0.32)"; color = "var(--accent-light)"; }
                    if (isSelA) { bg = "rgba(99,102,241,0.18)"; border = "rgba(99,102,241,0.4)"; color = "#a78bfa"; }
                    if (isSelB) { bg = "rgba(20,184,166,0.18)"; border = "rgba(20,184,166,0.4)"; color = "#14b8a6"; }
                    return (
                      <button key={m}
                        onClick={() => {
                          if (!compareMode) {
                            setActiveTimelineMonth(m);
                          } else {
                            if (!selectedMonthA || (selectedMonthA && selectedMonthB)) {
                              setSelectedMonthA(m); setSelectedMonthB(null); setComparingResult(null);
                            } else if (m !== selectedMonthA) {
                              setSelectedMonthB(m); setComparingResult(null);
                            }
                          }
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: bg, border: `1px solid ${border}`, color }}>
                        {label}
                        <span className="opacity-60">{count}</span>
                        {isSelA && <span style={{ fontSize: "0.55rem", fontWeight: 800 }}>A</span>}
                        {isSelB && <span style={{ fontSize: "0.55rem", fontWeight: 800 }}>B</span>}
                      </button>
                    );
                  })}
                </div>

                {/* ── COMPARE MODE ── */}
                {compareMode && (
                  <div>
                    <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                      Seleziona due mesi dalla timeline per confrontarli. <span style={{ color: "#a78bfa" }}>A</span> = Prima · <span style={{ color: "#14b8a6" }}>B</span> = Dopo
                    </p>

                    {/* Side-by-side preview */}
                    {(scanA || scanB) && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {[{ scan: scanA, label: "A — Prima", color: "#a78bfa", accentAlpha: "rgba(99,102,241,0.2)" },
                          { scan: scanB, label: "B — Dopo",  color: "#14b8a6", accentAlpha: "rgba(20,184,166,0.2)" }
                        ].map(({ scan: s, label, color, accentAlpha }) => (
                          <div key={label} className="rounded-2xl overflow-hidden"
                            style={{ border: `1px solid ${accentAlpha}`, background: "var(--surface-xs)" }}>
                            <div className="px-3 py-2 text-xs font-bold" style={{ color, borderBottom: `1px solid ${accentAlpha}` }}>
                              {label}
                            </div>
                            {s ? (
                              <div>
                                <div className="aspect-[3/4] relative overflow-hidden">
                                  {scanUrls[s.id] ? (
                                    <img src={scanUrls[s.id]} alt={s.taken_at} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-sm)" }}>
                                      <Loader2 size={18} className="animate-spin" style={{ color: "rgba(229,50,50,0.4)" }} />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                                    style={{ background: "rgba(0,0,0,0.65)" }}>
                                    <p className="text-xs font-semibold text-white">
                                      {new Date(s.taken_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                                    </p>
                                    {s.notes && <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{s.notes}</p>}
                                  </div>
                                </div>
                                {s.ai_analysis && (
                                  <div className="px-3 py-2 space-y-1">
                                    {s.ai_analysis.body_fat_est != null && (
                                      <p className="text-xs" style={{ color: "#fbbf24" }}>Grasso stimato: <strong>{s.ai_analysis.body_fat_est}%</strong></p>
                                    )}
                                    {s.ai_analysis.muscle_mass_est && (
                                      <p className="text-xs" style={{ color: "#a78bfa" }}>Muscolarità: <strong>{s.ai_analysis.muscle_mass_est}</strong></p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="aspect-[3/4] flex items-center justify-center" style={{ color: "var(--text-faint)" }}>
                                <p className="text-xs">Seleziona mese</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Run comparison button */}
                    {canCompare && (
                      <button
                        onClick={() => handleCompare(scanA!.id, scanB!.id)}
                        disabled={comparing}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 mb-4"
                        style={{ background: "rgba(99,102,241,0.16)", border: "1px solid rgba(99,102,241,0.35)", color: "#a78bfa" }}>
                        {comparing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {comparing ? "Analisi AI in corso…" : "Analizza miglioramenti con AI"}
                      </button>
                    )}

                    {/* Comparison result */}
                    {comparingResult?.analysis && (() => {
                      const ca = comparingResult.analysis as ComparisonAnalysis;
                      const trendIcon = ca.overall_trend === "positive"
                        ? <TrendingUp size={14} style={{ color: "#22c55e" }} />
                        : ca.overall_trend === "negative"
                          ? <TrendingDown size={14} style={{ color: "#ef4444" }} />
                          : <Minus size={14} style={{ color: "#fbbf24" }} />;
                      const trendColor = ca.overall_trend === "positive" ? "#22c55e" : ca.overall_trend === "negative" ? "#ef4444" : "#fbbf24";
                      return (
                        <div className="card-luxury rounded-2xl p-5">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-4">
                            <GitCompare size={14} style={{ color: "#a78bfa" }} />
                            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#a78bfa", letterSpacing: "0.1em" }}>
                              Analisi Progressione AI — Beta
                            </p>
                            <span className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: trendColor }}>
                              {trendIcon}
                              {ca.overall_trend === "positive" ? "Trend positivo" : ca.overall_trend === "negative" ? "Trend negativo" : "Stabile"}
                            </span>
                          </div>

                          {/* Delta metrics */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--surface-xs)", border: "1px solid rgba(251,191,36,0.2)" }}>
                              <p className="text-sm font-black" style={{ color: ca.body_fat_change != null && ca.body_fat_change < 0 ? "#22c55e" : "#fbbf24" }}>
                                {ca.body_fat_change != null ? `${ca.body_fat_change > 0 ? "+" : ""}${ca.body_fat_change}%` : "—"}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>Δ Grasso</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--surface-xs)", border: "1px solid rgba(167,139,250,0.2)" }}>
                              <p className="text-sm font-black capitalize" style={{ color: ca.muscle_change === "increased" ? "#22c55e" : ca.muscle_change === "decreased" ? "#ef4444" : "#fbbf24" }}>
                                {ca.muscle_change === "increased" ? "↑" : ca.muscle_change === "decreased" ? "↓" : "="}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>Massa musc.</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--surface-xs)", border: `1px solid ${trendColor}22` }}>
                              <p className="text-sm font-black" style={{ color: trendColor }}>
                                {ca.confidence === "high" ? "Alta" : ca.confidence === "medium" ? "Media" : "Bassa"}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>Confidenza</p>
                            </div>
                          </div>

                          {/* Summary narrative */}
                          <p className="text-xs leading-relaxed italic px-3 py-2.5 rounded-xl mb-4"
                            style={{ color: "var(--text-muted)", background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                            {ca.summary}
                          </p>

                          {/* Improvements + Areas to work */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "#22c55e", letterSpacing: "0.1em" }}>
                                Miglioramenti
                              </p>
                              {ca.key_improvements?.map((item, i) => (
                                <div key={i} className="flex items-start gap-1.5 mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                                  <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span> {item}
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "#ef4444", letterSpacing: "0.1em" }}>
                                Da lavorare
                              </p>
                              {ca.areas_to_work?.map((item, i) => (
                                <div key={i} className="flex items-start gap-1.5 mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                                  <span style={{ color: "#ef4444", flexShrink: 0 }}>→</span> {item}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Coach tips */}
                          {ca.coach_tips?.length > 0 && (
                            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--accent)", letterSpacing: "0.1em" }}>
                                Consigli per il trainer
                              </p>
                              {ca.coach_tips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-1.5 mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                                    style={{ background: "rgba(229,50,50,0.14)", color: "var(--accent)", fontSize: "0.6rem" }}>{i + 1}</span>
                                  {tip}
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-xs mt-3" style={{ color: "var(--text-faint)" }}>
                            Claude Haiku · Analisi effettuata il {new Date(ca.analyzed_at).toLocaleDateString("it-IT")}
                          </p>
                          <p className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ color: "rgba(251,191,36,0.7)", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.14)" }}>
                            GDPR: le immagini vengono elaborate da Anthropic AI. Informa il cliente nella privacy policy.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── TIMELINE MODE (non-compare) ── */}
                {!compareMode && activeMonth && byMonth[activeMonth] && (
                  <div className="space-y-4">
                    {byMonth[activeMonth].map(scan => {
                      const analysis = scan.ai_analysis;
                      const cv = scan.body_features;
                      const isAnalyzing = scanAnalyzing === scan.id;
                      const imgUrl = scanUrls[scan.id];
                      const scanTier = analysis ? computeTier(analysis.body_fat_est, analysis.muscle_mass_est) : null;
                      const tierCfg  = scanTier ? TIERS[scanTier] : null;
                      return (
                        <div key={scan.id} className="card-luxury rounded-2xl overflow-hidden"
                          style={tierCfg ? { borderColor: `${tierCfg.color}28`, boxShadow: `0 0 20px ${tierCfg.glow}` } : undefined}>

                          {/* ── Scan header ── */}
                          <div className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Thumbnail + tier badge */}
                              <div className="relative flex-shrink-0">
                                <div className="w-24 h-32 rounded-xl overflow-hidden"
                                  style={{ background: "var(--surface-sm)", border: `1px solid ${tierCfg ? tierCfg.color + "30" : "rgba(229,50,50,0.12)"}` }}>
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={scan.taken_at} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Loader2 size={16} className="animate-spin" style={{ color: "rgba(229,50,50,0.4)" }} />
                                    </div>
                                  )}
                                </div>
                                {/* Tier badge overlaid on photo */}
                                {tierCfg && (
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full font-black text-xs flex items-center gap-1"
                                    style={{ background: tierCfg.badge_bg, border: `1px solid ${tierCfg.color}`, color: tierCfg.color, boxShadow: `0 0 8px ${tierCfg.glow}`, whiteSpace: "nowrap" }}>
                                    <Award size={9} /> RANK {scanTier}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                                  {new Date(scan.taken_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                                </p>
                                {scan.notes && <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{scan.notes}</p>}

                                {/* Key metrics row (if analysed) */}
                                {analysis && (
                                  <div className="flex gap-2 mb-2 flex-wrap">
                                    {analysis.body_fat_est != null && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
                                        {analysis.body_fat_est}% BF
                                      </span>
                                    )}
                                    {analysis.muscle_mass_est && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                                        style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
                                        {analysis.muscle_mass_est}
                                      </span>
                                    )}
                                    {analysis.body_type && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize"
                                        style={{ background: "rgba(56,189,248,0.10)", color: "#38bdf8" }}>
                                        {analysis.body_type}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                  <button onClick={() => handleScanAnalyze(scan)} disabled={isAnalyzing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                                    style={{ background: analysis ? "var(--surface-sm)" : "rgba(229,50,50,0.12)", border: `1px solid ${analysis ? "var(--border)" : "rgba(229,50,50,0.28)"}`, color: analysis ? "var(--text-dim)" : "var(--accent-light)" }}>
                                    {isAnalyzing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                                    {isAnalyzing ? "Analisi…" : analysis ? "Rianalizza" : "Analizza con AI"}
                                  </button>
                                  <button onClick={() => handleScanDelete(scan)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition-all"
                                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.7)" }}>
                                    <Trash2 size={11} /> Elimina
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* CV MoveNet metrics */}
                            {cv && cv.metrics && (
                              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <ActivityIcon size={11} style={{ color: "#38bdf8" }} />
                                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#38bdf8", letterSpacing: "0.08em" }}>
                                    CV · MoveNet · {Math.round((cv.metrics.pose_confidence ?? 0) * 100)}% conf.
                                  </p>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[
                                    { k: "SHR", v: cv.metrics.shoulder_hip_ratio?.toFixed(2) ?? "—", label: "Spalle/Fianchi", color: "#38bdf8" },
                                    { k: "WHR", v: cv.metrics.waist_hip_ratio?.toFixed(2) ?? "—", label: "Vita/Fianchi", color: "#fbbf24" },
                                    { k: "SIM", v: cv.metrics.bilateral_symmetry ? `${Math.round(cv.metrics.bilateral_symmetry * 100)}%` : "—", label: "Simmetria", color: "#a78bfa" },
                                  ].map(({ k, v, label, color }) => (
                                    <div key={k} className="rounded-lg p-1.5 text-center" style={{ background: "var(--surface-xs)", border: `1px solid ${color}18` }}>
                                      <p className="font-bold" style={{ color, fontSize: "0.85rem" }}>{v}</p>
                                      <p style={{ color: "var(--text-faint)", fontSize: "0.58rem" }}>{label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ── AI Full Analysis ── */}
                            {analysis && (
                              <div className="mt-3 pt-3 space-y-3" style={{ borderTop: `1px solid ${tierCfg ? tierCfg.color + "20" : "rgba(229,50,50,0.1)"}` }}>

                                {/* Summary */}
                                <div className="flex items-center gap-2 mb-1">
                                  <Brain size={12} style={{ color: "var(--accent)" }} />
                                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(229,50,50,0.8)", letterSpacing: "0.08em" }}>
                                    Analisi AI · {analysis.confidence === "high" ? "Alta" : analysis.confidence === "medium" ? "Media" : "Bassa"} confidenza
                                  </p>
                                </div>
                                <p className="text-xs leading-relaxed italic px-3 py-2.5 rounded-xl"
                                  style={{ color: "var(--text-muted)", background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                                  {analysis.summary}
                                </p>

                                {/* Biomechanics */}
                                {analysis.biomechanics && (
                                  <div className="rounded-xl p-3" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.18)" }}>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <ActivityIcon size={11} style={{ color: "#38bdf8" }} />
                                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#38bdf8" }}>Biomeccanica</p>
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{analysis.biomechanics}</p>
                                  </div>
                                )}

                                {/* Strengths & Improvements side by side */}
                                {(analysis.strengths?.length || analysis.improvements?.length) && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {analysis.strengths?.length ? (
                                      <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
                                        <p className="text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "#22c55e" }}>Punti di Forza</p>
                                        {analysis.strengths.map((s, i) => (
                                          <p key={i} className="text-xs mb-1 flex items-start gap-1" style={{ color: "var(--text-muted)" }}>
                                            <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span> {s}
                                          </p>
                                        ))}
                                      </div>
                                    ) : null}
                                    {analysis.improvements?.length ? (
                                      <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
                                        <p className="text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "#fbbf24" }}>Da Migliorare</p>
                                        {analysis.improvements.map((s, i) => (
                                          <p key={i} className="text-xs mb-1 flex items-start gap-1" style={{ color: "var(--text-muted)" }}>
                                            <span style={{ color: "#fbbf24", flexShrink: 0 }}>→</span> {s}
                                          </p>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                )}

                                {/* Nutrition plan */}
                                {(analysis.nutrition_tips?.length || analysis.nutrition_calories) && (
                                  <div className="rounded-xl p-3" style={{ background: "rgba(229,50,50,0.04)", border: "1px solid rgba(229,50,50,0.18)" }}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <Utensils size={11} style={{ color: "var(--accent)" }} />
                                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>Piano Nutrizionale</p>
                                    </div>
                                    {(analysis.nutrition_calories || analysis.nutrition_protein_g) && (
                                      <div className="flex gap-3 mb-2">
                                        {analysis.nutrition_calories && (
                                          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                            style={{ background: "rgba(229,50,50,0.1)", color: "var(--accent-light)" }}>
                                            ~{analysis.nutrition_calories} kcal/die
                                          </span>
                                        )}
                                        {analysis.nutrition_protein_g && (
                                          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                            style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                                            {analysis.nutrition_protein_g}g proteine
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {analysis.nutrition_tips?.map((tip, i) => (
                                      <p key={i} className="text-xs mb-1 flex items-start gap-1" style={{ color: "var(--text-muted)" }}>
                                        <Zap size={9} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} /> {tip}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {/* Training recommendations */}
                                {analysis.recommendations?.length ? (
                                  <div>
                                    <p className="text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Raccomandazioni Allenamento</p>
                                    {analysis.recommendations.map((r, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                                          style={{ background: "rgba(229,50,50,0.14)", color: "var(--accent)", fontSize: "0.6rem" }}>{i + 1}</span>
                                        {r}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}

                                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                                  Claude Sonnet · {new Date(analysis.analyzed_at).toLocaleDateString("it-IT")}
                                </p>
                                <p className="text-xs px-2 py-1 rounded-lg" style={{ color: "rgba(251,191,36,0.7)", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)" }}>
                                  GDPR: immagine elaborata da Anthropic AI. Informa il cliente nella privacy policy.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* ── MODALS ── */}

      {/* Phase modal */}
      {showPhaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPhaseModal(false)}>
          <div className="absolute inset-0" style={{ background: "var(--surface-modal)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Nuova fase</h3>
              <button onClick={() => setShowPhaseModal(false)}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Nome fase *</label>
                <input value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} placeholder="es. Bulk invernale" className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Tipo</label>
                  <select value={phaseForm.type} onChange={(e) => setPhaseForm({ ...phaseForm, type: e.target.value })} className={`${inputClass}`} style={selectStyle}>
                    <option value="bulk">Bulk</option><option value="cut">Cut</option><option value="maintenance">Mantenimento</option><option value="custom">Personalizzata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Calorie target</label>
                  <input type="number" value={phaseForm.targetCalories} onChange={(e) => setPhaseForm({ ...phaseForm, targetCalories: e.target.value })} placeholder="3200" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Data inizio *</label>
                  <input type="date" value={phaseForm.startDate} onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Data fine</label>
                  <input type="date" value={phaseForm.endDate} onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })} className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Note</label>
                <textarea value={phaseForm.notes} onChange={(e) => setPhaseForm({ ...phaseForm, notes: e.target.value })} rows={2} placeholder="Obiettivi, indicazioni…" className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPhaseModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Annulla</button>
              <button onClick={savePhase} disabled={saving} className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Salva fase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit phase modal */}
      {editingPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingPhase(null)}>
          <div className="absolute inset-0" style={{ background: "var(--surface-modal)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Modifica fase</h3>
              <button onClick={() => setEditingPhase(null)}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Nome fase *</label>
                <input value={editingPhase.name} onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Tipo</label>
                  <select value={editingPhase.type} onChange={(e) => setEditingPhase({ ...editingPhase, type: e.target.value })} className={inputClass} style={selectStyle}>
                    <option value="bulk">Bulk</option><option value="cut">Cut</option><option value="maintenance">Mantenimento</option><option value="custom">Personalizzata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Calorie target</label>
                  <input type="number" value={editingPhase.targetCalories} onChange={(e) => setEditingPhase({ ...editingPhase, targetCalories: e.target.value })} placeholder="3200" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Data inizio *</label>
                  <input type="date" value={editingPhase.startDate} onChange={(e) => setEditingPhase({ ...editingPhase, startDate: e.target.value })} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Data fine</label>
                  <input type="date" value={editingPhase.endDate} onChange={(e) => setEditingPhase({ ...editingPhase, endDate: e.target.value })} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Peso target (kg)</label>
                  <input type="number" step="0.5" value={editingPhase.targetWeight} onChange={(e) => setEditingPhase({ ...editingPhase, targetWeight: e.target.value })} placeholder="85" className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Note</label>
                <textarea value={editingPhase.notes} onChange={(e) => setEditingPhase({ ...editingPhase, notes: e.target.value })} rows={2} placeholder="Obiettivi, indicazioni…" className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingPhase(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Annulla</button>
              <button onClick={saveEditPhase} disabled={saving || !editingPhase.name || !editingPhase.startDate} className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />} Salva modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowWorkoutModal(false)}>
          <div className="absolute inset-0" style={{ background: "var(--surface-modal)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Nuova scheda</h3>
              <button onClick={() => setShowWorkoutModal(false)}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Nome scheda *</label>
                <input value={workoutForm.name} onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })} placeholder="es. Scheda A — Push/Pull/Legs" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Descrizione</label>
                <textarea value={workoutForm.description} onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })} rows={2} placeholder="Obiettivi, note sulla scheda…" className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Giorni a settimana</label>
                  <select value={workoutForm.daysPerWeek} onChange={(e) => setWorkoutForm({ ...workoutForm, daysPerWeek: e.target.value })} className={inputClass} style={selectStyle}>
                    {[2,3,4,5,6].map((d) => <option key={d} value={d}>{d} giorni</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Durata (settimane)</label>
                  <select value={workoutForm.totalWeeks} onChange={(e) => setWorkoutForm({ ...workoutForm, totalWeeks: e.target.value })} className={inputClass} style={selectStyle}>
                    <option value="">— Senza limite —</option>
                    {[4,6,8,10,12,16,20,24].map((w) => <option key={w} value={w}>{w} settimane</option>)}
                  </select>
                </div>
                {client.phases.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Fase collegata</label>
                    <select value={workoutForm.phaseId} onChange={(e) => setWorkoutForm({ ...workoutForm, phaseId: e.target.value })} className={inputClass} style={selectStyle}>
                      <option value="">— nessuna —</option>
                      {client.phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowWorkoutModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Annulla</button>
              <button onClick={saveWorkout} disabled={saving} className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Salva scheda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit workout plan modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingPlan(null)}>
          <div className="absolute inset-0" style={{ background: "var(--surface-modal)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Modifica scheda</h3>
              <button onClick={() => setEditingPlan(null)}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Nome scheda *</label>
                <input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Descrizione</label>
                <textarea value={editingPlan.description} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  rows={2} className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Giorni a settimana</label>
                  <select value={editingPlan.daysPerWeek} onChange={(e) => setEditingPlan({ ...editingPlan, daysPerWeek: e.target.value })}
                    className={inputClass} style={selectStyle}>
                    {[2,3,4,5,6].map((d) => <option key={d} value={d}>{d} giorni</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Durata (settimane)</label>
                  <select value={editingPlan.totalWeeks} onChange={(e) => setEditingPlan({ ...editingPlan, totalWeeks: e.target.value })}
                    className={inputClass} style={selectStyle}>
                    <option value="">— Senza limite —</option>
                    {[4,6,8,10,12,16,20,24].map((w) => <option key={w} value={w}>{w} settimane</option>)}
                  </select>
                </div>
                {client.phases.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Fase collegata</label>
                    <select value={editingPlan.phaseId} onChange={(e) => setEditingPlan({ ...editingPlan, phaseId: e.target.value })}
                      className={inputClass} style={selectStyle}>
                      <option value="">— nessuna —</option>
                      {client.phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingPlan(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                Annulla
              </button>
              <button onClick={saveEditPlan} disabled={saving || !editingPlan.name.trim()}
                className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />} Salva modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diet plan editor (create / edit) */}
      {dietEditorOpen && (
        <DietPlanEditor
          plan={editingDietPlan ?? undefined}
          clientId={client.id}
          phases={client.phases}
          onSave={handleDietSave}
          onClose={() => { setDietEditorOpen(false); setEditingDietPlan(null); }}
        />
      )}
    </div>
  );
}
