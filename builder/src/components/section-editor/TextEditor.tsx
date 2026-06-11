import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";

export function TextEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <textarea className={`${base} font-mono resize-y`} value={s.value ?? ""} rows={2} placeholder="Text"
      onChange={(e) => onChange({ ...s, value: e.target.value })} />
  );
}
