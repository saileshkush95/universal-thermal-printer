import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function BeepEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <div className="flex gap-2">
      <label className={`flex items-center gap-1 ${label}`}>x:
        <input type="number" min={1} max={9} className={base} style={{ width: 52 }} value={s.value?.times ?? 1}
          onChange={(e) => onChange({ ...s, value: { ...s.value, times: +e.target.value } })} />
      </label>
      <label className={`flex items-center gap-1 ${label}`}>dur:
        <input type="number" min={1} max={9} className={base} style={{ width: 52 }} value={s.value?.duration ?? 5}
          onChange={(e) => onChange({ ...s, value: { ...s.value, duration: +e.target.value } })} />
      </label>
    </div>
  );
}
