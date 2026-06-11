import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;

export function CutEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <select className={sel} value={s.value ?? "full"}
      onChange={(e) => onChange({ ...s, value: e.target.value })}>
      <option value="full">Full Cut (solid)</option>
      <option value="partial">Partial Cut (notch)</option>
    </select>
  );
}
