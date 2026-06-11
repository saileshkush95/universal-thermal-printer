import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function LetterSpacingEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <div className="flex gap-1 items-center">
      <input type="number" step={0.1} className={base} style={{ flex: 1 }} value={s.value ?? 0}
        onChange={(e) => onChange({ ...s, value: +e.target.value })} />
      <span className={label}>px</span>
    </div>
  );
}
