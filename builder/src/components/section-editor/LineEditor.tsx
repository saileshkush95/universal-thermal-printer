import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;
const label = "text-[10px] text-slate-400 dark:text-slate-500";

const CHARS = [
  { value: "─", label: "Single (─)" },
  { value: "═", label: "Double (═)" },
  { value: "=", label: "Double dash (=)" },
  { value: "-", label: "Dashed (-)" },
  { value: "·", label: "Dotted (·)" },
  { value: "*", label: "Star (*)" },
  { value: "~", label: "Wave (~)" },
  { value: "#", label: "Hash (#)" },
];

export function LineEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  const curVal = s.value ?? "─";
  return (
    <div className="flex gap-1 items-center">
      <select className={sel} style={{ flex: 1 }} value={curVal}
        onChange={(e) => onChange({ ...s, value: e.target.value })}>
        {CHARS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <span className={label}>or</span>
      <input type="text" className={base} style={{ width: 36 }} value={curVal} maxLength={1}
        onChange={(e) => onChange({ ...s, value: e.target.value || "─" })} />
    </div>
  );
}
