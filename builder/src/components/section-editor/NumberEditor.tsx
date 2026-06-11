import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";

export function NumberEditor({ s, onChange, min, max }: { s: PrintSection; onChange: (s: PrintSection) => void; min?: number; max?: number }) {
  return (
    <input type="number" min={min} max={max} className={base} value={s.value ?? 1}
      onChange={(e) => onChange({ ...s, value: +e.target.value })} />
  );
}
