import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DentalRecord } from "../types";
import { useAuth } from "../contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Canvas constants
// ─────────────────────────────────────────────────────────────────────────────

const CW = 580;          // canvas width (px)
const CH = 400;          // canvas height (px)
const DEPTH = 65;        // how deep the arch curves inward

// Upper occlusal tips (biting edge) sit at this y at the molar edges,
// then drop by DEPTH toward the incisors in the center.
const U_BASE = 95;       // y at upper molar tips
const L_BASE = 305;      // y at lower molar tips

// Gap at incisors   = L_BASE − DEPTH − (U_BASE + DEPTH) = 305−65−95−65 = 80 px  ✓
// Gap at molars     = L_BASE − U_BASE = 210 px                                   ✓

// Tooth element heights
const T_SVG_H = 50;      // SVG tooth height (px)
const T_LBL_H = 14;      // number label height (px)
const T_EL_H  = T_SVG_H + T_LBL_H;   // 64 px per tooth

// ─────────────────────────────────────────────────────────────────────────────
// Universal numbering
// ─────────────────────────────────────────────────────────────────────────────

const PERM_NAMES: Record<number, string> = {
  1:"UR 3rd Molar",2:"UR 2nd Molar",3:"UR 1st Molar",
  4:"UR 2nd Premolar",5:"UR 1st Premolar",6:"UR Canine",
  7:"UR Lateral Incisor",8:"UR Central Incisor",
  9:"UL Central Incisor",10:"UL Lateral Incisor",11:"UL Canine",
  12:"UL 1st Premolar",13:"UL 2nd Premolar",14:"UL 1st Molar",
  15:"UL 2nd Molar",16:"UL 3rd Molar",
  17:"LL 3rd Molar",18:"LL 2nd Molar",19:"LL 1st Molar",
  20:"LL 2nd Premolar",21:"LL 1st Premolar",22:"LL Canine",
  23:"LL Lateral Incisor",24:"LL Central Incisor",
  25:"LR Central Incisor",26:"LR Lateral Incisor",27:"LR Canine",
  28:"LR 1st Premolar",29:"LR 2nd Premolar",30:"LR 1st Molar",
  31:"LR 2nd Molar",32:"LR 3rd Molar",
};

// Primary (A-T) stored as tooth_number 51–70
const PRIM_CHARS = "ABCDEFGHIJKLMNOPQRST".split("");
const PRIM_NAMES: Record<string, string> = {
  A:"UR 2nd Primary Molar",B:"UR 1st Primary Molar",
  C:"UR Primary Canine",D:"UR Primary Lateral",E:"UR Primary Central",
  F:"UL Primary Central",G:"UL Primary Lateral",H:"UL Primary Canine",
  I:"UL 1st Primary Molar",J:"UL 2nd Primary Molar",
  K:"LL 2nd Primary Molar",L:"LL 1st Primary Molar",
  M:"LL Primary Canine",N:"LL Primary Lateral",O:"LL Primary Central",
  P:"LR Primary Central",Q:"LR Primary Lateral",R:"LR Primary Canine",
  S:"LR 1st Primary Molar",T:"LR 2nd Primary Molar",
};

const letterToNum = (l: string) => 51 + PRIM_CHARS.indexOf(l);
const numToLetter = (n: number) => PRIM_CHARS[n - 51] ?? "";

// Display order in arch (left → right = patient right → patient left)
const U_PERM: number[]  = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
const L_PERM: number[]  = [32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17];
const U_PRIM: string[]  = ["A","B","C","D","E","F","G","H","I","J"];
const L_PRIM: string[]  = ["T","S","R","Q","P","O","N","M","L","K"];

// ─────────────────────────────────────────────────────────────────────────────
// Tooth classification
// ─────────────────────────────────────────────────────────────────────────────

type TClass = "incisor" | "canine" | "premolar" | "molar";

function permClass(n: number): TClass {
  // distance from midline 1=central .. 8=wisdom
  let d: number;
  if (n <= 8) d = 9 - n;
  else if (n <= 16) d = n - 8;
  else if (n <= 24) d = 25 - n;
  else d = n - 24;
  if (d <= 2) return "incisor";
  if (d === 3) return "canine";
  if (d <= 5) return "premolar";
  return "molar";
}

function primClass(l: string): TClass {
  if ("DEFGNOPQ".includes(l)) return "incisor";
  if ("CHMR".includes(l)) return "canine";
  return "molar";
}

// ─────────────────────────────────────────────────────────────────────────────
// Status → colors
// ─────────────────────────────────────────────────────────────────────────────

interface TC { crown: string; root: string; border: string; glow: string }

const STATUS_COLORS: Record<DentalRecord["status"], TC> = {
  healthy:        { crown:"#FFFFFF",   root:"#FEF9F0", border:"#CBD5E1", glow:"#94A3B8" },
  caries:         { crown:"#FCA5A5",   root:"#FFF1F2", border:"#EF4444", glow:"#F87171" },
  needs_treatment:{ crown:"#FED7AA",   root:"#FFF7ED", border:"#EA580C", glow:"#FB923C" },
  treated:        { crown:"#67E8F9",   root:"#ECFEFF", border:"#0891B2", glow:"#22D3EE" },
  missing:        { crown:"#E2E8F0",   root:"#F8FAFC", border:"#94A3B8", glow:"#CBD5E1" },
  extracted:      { crown:"#94A3B8",   root:"#E2E8F0", border:"#64748B", glow:"#94A3B8" },
};

function statusColors(recs: DentalRecord[]): TC {
  if (!recs.length) return STATUS_COLORS.healthy;
  return STATUS_COLORS[recs[recs.length - 1].status] ?? STATUS_COLORS.healthy;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG tooth paths  (viewBox "0 0 36 70" — root top, crown bottom)
// ─────────────────────────────────────────────────────────────────────────────

const CROWN: Record<TClass, string> = {
  incisor: "M10,35 L10,62 C10,66 12,70 18,70 C24,70 26,66 26,62 L26,35 Z",
  canine:  "M11,35 L10,60 C12,67 18,70 18,70 C24,67 26,60 25,35 Z",
  premolar:"M8,35 C7,44 7,52 9,60 C10,65 13,69 15,70 L17,68 L18,70 L19,68 L21,70 C23,69 26,65 27,60 C29,52 29,44 28,35 Z",
  molar:   "M6,35 C5,44 5,52 7,60 L8,65 C10,69 12,70 14,70 L15,68 L17,70 L19,68 L21,70 L22,68 L24,70 C26,70 28,68 29,65 L30,60 C31,52 31,44 30,35 Z",
};

const ROOTS: Record<string, string[]> = {
  single:  ["M18,3 C15,7 10,18 10,35 L26,35 C26,18 21,7 18,3 Z"],
  bifurc:  [
    "M12,4 C10,8 8,20 8,35 L18,35 C17,22 14,10 12,4 Z",
    "M24,4 C26,8 28,20 28,35 L18,35 C19,22 22,10 24,4 Z",
  ],
  trifurc: [
    "M10,5 C8,8 6,20 6,35 L16,35 C15,22 12,10 10,5 Z",
    "M18,4 C17,7 16,20 16,35 L20,35 C20,20 19,7 18,4 Z",
    "M26,5 C28,8 30,20 30,35 L20,35 C21,22 24,10 26,5 Z",
  ],
};

function rootKey(tc: TClass, upper: boolean): string {
  if (tc === "incisor" || tc === "canine") return "single";
  if (tc === "premolar") return upper ? "bifurc" : "single";
  return upper ? "trifurc" : "bifurc";
}

// SVG width per tooth class (height is always T_SVG_H=50)
const SVG_W: Record<TClass, number> = {
  incisor: 18, canine: 20, premolar: 22, molar: 26,
};

// ─────────────────────────────────────────────────────────────────────────────
// Arch position computation
// ─────────────────────────────────────────────────────────────────────────────

function archPos(
  idx: number,
  total: number,
  isUpper: boolean,
  slotW: number,
  xOffset: number,
): { cx: number; oy: number } {
  const cx = xOffset + idx * slotW + slotW / 2;
  const t = (idx - (total - 1) / 2) / ((total - 1) / 2);
  const curve = DEPTH * (1 - t * t);
  const oy = isUpper ? U_BASE + curve : L_BASE - curve;
  return { cx, oy };
}

// Slot widths
const PERM_SLOT = CW / 16;                        // ≈ 36 px
const PRIM_W    = CW * 0.72;                       // 418 px for 10 primary teeth
const PRIM_OX   = (CW - PRIM_W) / 2;              // 81 px left offset
const PRIM_SLOT = PRIM_W / 10;                     // ≈ 42 px

// ─────────────────────────────────────────────────────────────────────────────
// Arch outline path (drawn behind teeth)
// ─────────────────────────────────────────────────────────────────────────────

function makeArchPath(total: number, isUpper: boolean, slotW: number, xOff: number): string {
  const pts = Array.from({ length: total }, (_, i) => {
    const { cx, oy } = archPos(i, total, isUpper, slotW, xOff);
    return `${cx.toFixed(1)},${oy.toFixed(1)}`;
  });
  return "M " + pts.join(" L ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Single tooth (absolutely positioned on the canvas)
// ─────────────────────────────────────────────────────────────────────────────

function ToothItem({
  label, tc, upper, colors, selected, onClick, entranceDelay,
}: {
  label: string;
  tc: TClass;
  upper: boolean;
  colors: TC;
  selected: boolean;
  onClick: () => void;
  entranceDelay: number;
}) {
  const w = SVG_W[tc];
  const rk = rootKey(tc, upper);
  const bc = selected ? "#0EA5E9" : colors.border;
  const sw = selected ? 2.2 : 1.1;

  // The SVG has root at top, crown at bottom.
  // For lower teeth we flip it with scaleY(-1) so crown faces up.
  const toothSVG = (
    <svg
      width={w}
      height={T_SVG_H}
      viewBox="0 0 36 70"
      style={!upper ? { transform: "scaleY(-1)" } : undefined}
    >
      {ROOTS[rk].map((d, i) => (
        <path key={i} d={d} fill={colors.root} stroke={bc} strokeWidth={sw} strokeLinejoin="round" />
      ))}
      <path d={CROWN[tc]} fill={colors.crown} stroke={bc} strokeWidth={sw} strokeLinejoin="round" />
      <line x1="7" y1="35" x2="29" y2="35" stroke="#E2E8F0" strokeWidth="0.6" />
    </svg>
  );

  const numLabel = (
    <div
      className="flex items-center justify-center"
      style={{ height: T_LBL_H, width: w }}
    >
      <span
        className={`text-[9px] font-bold leading-none tabular-nums ${
          selected ? "text-sky-500" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );

  return (
    // Entrance wrapper: slides in from outside the arch
    <motion.div
      initial={{ opacity: 0, y: upper ? -12 : 12, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: entranceDelay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "absolute", width: w }}
    >
      {/* Interactive button: controls hover + selected scale independently */}
      <motion.button
        onClick={onClick}
        title={`${label}`}
        animate={{ scale: selected ? 1.14 : 1 }}
        whileHover={{ scale: selected ? 1.18 : 1.24 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
          border: "none",
          background: "none",
          padding: 0,
          outline: "none",
          filter: selected ? `drop-shadow(0 0 6px ${colors.glow})` : undefined,
        }}
      >
        {upper
          ? <>{numLabel}{toothSVG}</>   // label above, tooth hangs down
          : <>{toothSVG}{numLabel}</>   // tooth hangs up, label below
        }
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────────────────────────────────────

const LEGEND_COLORS = [
  { key: "healthy",        crown:"#FFFFFF", border:"#CBD5E1" },
  { key: "caries",         crown:"#FCA5A5", border:"#EF4444" },
  { key: "needsTreatment", crown:"#FED7AA", border:"#EA580C" },
  { key: "treated",        crown:"#67E8F9", border:"#0891B2" },
  { key: "missing",        crown:"#E2E8F0", border:"#94A3B8" },
  { key: "extracted",      crown:"#94A3B8", border:"#64748B" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  records: DentalRecord[];
  onAddRecord: (r: Omit<DentalRecord, "id" | "patient_id">) => void;
  canCreate: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function DentalChart({ records, onAddRecord, canCreate }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"permanent" | "primary">("permanent");
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isPerm = mode === "permanent";
  const upperIds = isPerm ? U_PERM : U_PRIM;
  const lowerIds = isPerm ? L_PERM : L_PRIM;
  const slotW    = isPerm ? PERM_SLOT : PRIM_SLOT;
  const xOff     = isPerm ? 0 : PRIM_OX;
  const total    = upperIds.length;

  function toNum(id: number | string): number {
    return isPerm ? (id as number) : letterToNum(id as string);
  }
  function getClass(id: number | string): TClass {
    return isPerm ? permClass(id as number) : primClass(id as string);
  }
  function displayLabel(id: number | string): string {
    return String(id);
  }
  function toothName(n: number): string {
    return isPerm ? PERM_NAMES[n] : PRIM_NAMES[numToLetter(n)];
  }

  const selectedRecs = selected !== null
    ? records.filter((r) => r.tooth_number === selected)
    : [];

  const toggle = (id: number | string) => {
    const n = toNum(id);
    setSelected(prev => (prev === n ? null : n));
    setShowForm(false);
  };

  // Arch outline paths for SVG backdrop
  const uPath = makeArchPath(total, true,  slotW, xOff);
  const lPath = makeArchPath(total, false, slotW, xOff);

  return (
    <div className="space-y-4">

      {/* ── Mode toggle ── */}
      <div className="flex items-center gap-2">
        {(["permanent", "primary"] as const).map((m) => (
          <motion.button
            key={m}
            onClick={() => { setMode(m); setSelected(null); setShowForm(false); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "permanent" ? t("dentalChart.permanent") : t("dentalChart.primary")}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Chart panel ── */}
        <div className="xl:col-span-2 bg-card rounded-xl border border-border p-5">

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {LEGEND_COLORS.map(({ key, crown, border }) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-sm border flex-shrink-0"
                  style={{ background: crown, borderColor: border }} />
                {t(`dentalChart.legend.${key}`)}
              </span>
            ))}
          </div>

          {/* Arch canvas — overflow-x allows small screens to scroll */}
          <div className="overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ width: CW, height: CH, position: "relative" }}
              >
                {/* ── SVG backdrop: arch outlines + midline + quadrant labels ── */}
                <svg
                  width={CW}
                  height={CH}
                  style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                >
                  {/* Arch curve lines */}
                  <path d={uPath} fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
                  <path d={lPath} fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Vertical midline */}
                  <line
                    x1={CW / 2} y1={20} x2={CW / 2} y2={CH - 20}
                    stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4"
                  />

                  {/* Horizontal occlusal guide */}
                  <line
                    x1={40} y1={CH / 2} x2={CW - 40} y2={CH / 2}
                    stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 6"
                  />

                  {/* Quadrant labels */}
                  <text x={10}      y={16} fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.05em">{t("dentalChart.quadrant.upperRight")}</text>
                  <text x={CW - 10} y={16} fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.05em" textAnchor="end">{t("dentalChart.quadrant.upperLeft")}</text>
                  <text x={10}      y={CH - 6} fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.05em">{t("dentalChart.quadrant.lowerRight")}</text>
                  <text x={CW - 10} y={CH - 6} fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.05em" textAnchor="end">{t("dentalChart.quadrant.lowerLeft")}</text>

                  {/* Occlusal plane label */}
                  <text x={CW / 2} y={CH / 2 - 4} fontSize="8" fill="#CBD5E1" textAnchor="middle" letterSpacing="0.08em">{t("dentalChart.quadrant.occlusal")}</text>
                </svg>

                {/* ── Upper arch teeth ── */}
                {upperIds.map((id, i) => {
                  const n   = toNum(id);
                  const tc  = getClass(id);
                  const { cx, oy } = archPos(i, total, true, slotW, xOff);
                  const w   = SVG_W[tc];
                  // element top: label on top, then SVG tooth; bottom edge = oy (occlusal)
                  const top  = oy - T_EL_H;
                  const left = cx - w / 2;
                  return (
                    <div key={String(id)} style={{ position: "absolute", top, left }}>
                      <ToothItem
                        label={displayLabel(id)}
                        tc={tc}
                        upper={true}
                        colors={statusColors(records.filter(r => r.tooth_number === n))}
                        selected={selected === n}
                        onClick={() => toggle(id)}
                        entranceDelay={i * 0.022}
                      />
                    </div>
                  );
                })}

                {/* ── Lower arch teeth ── */}
                {lowerIds.map((id, i) => {
                  const n   = toNum(id);
                  const tc  = getClass(id);
                  const { cx, oy } = archPos(i, total, false, slotW, xOff);
                  const w   = SVG_W[tc];
                  // element top = oy (occlusal); SVG tooth, then label below
                  const top  = oy;
                  const left = cx - w / 2;
                  return (
                    <div key={String(id)} style={{ position: "absolute", top, left }}>
                      <ToothItem
                        label={displayLabel(id)}
                        tc={tc}
                        upper={false}
                        colors={statusColors(records.filter(r => r.tooth_number === n))}
                        selected={selected === n}
                        onClick={() => toggle(id)}
                        entranceDelay={i * 0.022}
                      />
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Side panel ── */}
        <div className="bg-card rounded-xl border border-border p-5 min-h-[340px]">
          <AnimatePresence mode="wait">
            {selected === null ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[300px] flex items-center justify-center text-center"
              >
                <div>
                  <svg className="w-12 h-[90px] mx-auto mb-3 opacity-10" viewBox="0 0 36 70">
                    <path d="M18,3 C14,7 10,18 10,35 L26,35 C26,18 22,7 18,3 Z" fill="#94A3B8" />
                    <path d="M10,35 L10,62 C10,66 12,70 18,70 C24,70 26,66 26,62 L26,35 Z" fill="#CBD5E1" />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    {t("dentalChart.selectToothHint").split("\n").map((line, i) => (
                      <span key={i}>{line}{i === 0 && <br />}</span>
                    ))}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selected}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground text-lg leading-none">
                      {t("dentalChart.tooth")} {isPerm ? selected : numToLetter(selected)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-[180px]">
                      {toothName(selected)}
                    </p>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setSelected(null)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mini tooth preview */}
                <div className="flex justify-center mb-4">
                  <MiniTooth
                    tc={isPerm ? permClass(selected) : primClass(numToLetter(selected))}
                    upper={isPerm ? selected <= 16 : selected <= 60}
                    colors={statusColors(selectedRecs)}
                  />
                </div>

                {/* History */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("dentalChart.history")}
                </p>
                <div className="mb-4 flex-1 overflow-y-auto">
                  {selectedRecs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("dentalChart.noRecords")}</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedRecs.map((r, i) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="relative pl-5"
                        >
                          {i < selectedRecs.length - 1 && (
                            <div className="absolute left-1.5 top-4 bottom-0 w-px bg-border" />
                          )}
                          <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-card" />
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <StatusPill status={r.status} />
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fmtDate(r.date)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{r.condition}</p>
                            {r.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                            )}
                            {r.treatment && (
                              <p className="text-xs text-foreground mt-1">
                                <span className="text-muted-foreground">Tx: </span>{r.treatment}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{r.doctor}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {canCreate && !showForm && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 w-full justify-center border border-dashed border-primary/40 hover:border-primary text-primary text-sm font-medium py-2.5 rounded-lg transition-colors"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-4 h-4" /> {t("dentalChart.addCondition")}
                  </motion.button>
                )}

                {showForm && (
                  <AddRecordForm
                    toothNumber={selected}
                    doctorName={user?.full_name ?? ""}
                    onSave={(r) => { onAddRecord(r); setShowForm(false); }}
                    onCancel={() => setShowForm(false)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini tooth for side panel
// ─────────────────────────────────────────────────────────────────────────────

function MiniTooth({ tc, upper, colors }: { tc: TClass; upper: boolean; colors: TC }) {
  const rk = rootKey(tc, upper);
  return (
    <svg
      width={44} height={82} viewBox="0 0 36 70"
      style={!upper ? { transform: "scaleY(-1)" } : undefined}
    >
      {ROOTS[rk].map((d, i) => (
        <path key={i} d={d} fill={colors.root} stroke={colors.border} strokeWidth="1.8" strokeLinejoin="round" />
      ))}
      <path d={CROWN[tc]} fill={colors.crown} stroke={colors.border} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="7" y1="35" x2="29" y2="35" stroke="#E2E8F0" strokeWidth="0.8" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status pill
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_PILL_CLS: Record<DentalRecord["status"], string> = {
  healthy:         "text-emerald-700 bg-emerald-50 border border-emerald-200",
  caries:          "text-red-700 bg-red-50 border border-red-200",
  needs_treatment: "text-orange-700 bg-orange-50 border border-orange-200",
  treated:         "text-cyan-700 bg-cyan-50 border border-cyan-200",
  missing:         "text-slate-500 bg-slate-100 border border-slate-200",
  extracted:       "text-slate-600 bg-slate-100 border border-slate-200",
};

function StatusPill({ status }: { status: DentalRecord["status"] }) {
  const { t } = useTranslation();
  const cls = STATUS_PILL_CLS[status] ?? STATUS_PILL_CLS.healthy;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {t(`dentalChart.status.${status}`)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add record form
// ─────────────────────────────────────────────────────────────────────────────

function AddRecordForm({
  toothNumber, doctorName, onSave, onCancel,
}: {
  toothNumber: number;
  doctorName: string;
  onSave: (r: Omit<DentalRecord, "id" | "patient_id">) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    condition: "", description: "", treatment: "",
    status: "caries" as DentalRecord["status"],
    date: new Date().toISOString().split("T")[0],
    doctor: doctorName,
  });

  const inp = "w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <motion.form
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => { e.preventDefault(); onSave({ ...form, tooth_number: toothNumber }); }}
      className="border border-border rounded-lg p-4 space-y-3 bg-muted/30"
    >
      <p className="text-xs font-semibold text-foreground">{t("dentalChart.newRecord", { number: toothNumber })}</p>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          {t("dentalChart.form.condition")} <span className="text-destructive">*</span>
        </label>
        <input required className={inp} value={form.condition}
          onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
          placeholder={t("dentalChart.form.conditionPlaceholder")} />
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("dentalChart.form.description")}</label>
        <textarea className={`${inp} resize-none`} rows={2} value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder={t("dentalChart.form.descriptionPlaceholder")} />
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("dentalChart.form.treatment")}</label>
        <input className={inp} value={form.treatment}
          onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))}
          placeholder={t("dentalChart.form.treatmentPlaceholder")} />
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t("dentalChart.form.status")}</label>
        <select className={inp} value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value as DentalRecord["status"] }))}>
          {(["healthy","caries","needs_treatment","treated","missing","extracted"] as DentalRecord["status"][]).map(s => (
            <option key={s} value={s}>{t(`dentalChart.status.${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
          {t("common.cancel")}
        </button>
        <button type="submit"
          className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
          {t("dentalChart.form.save")}
        </button>
      </div>
    </motion.form>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
