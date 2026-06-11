import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function SizeEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <div className="flex gap-2">
      <label className={`flex items-center gap-1 ${label}`}>W:
        <input type="number" min={1} max={8} className={base} style={{ width: 52 }} value={s.value?.width ?? 1}
          onChange={(e) => onChange({ ...s, value: { ...s.value, width: +e.target.value } })} />
      </label>
      <label className={`flex items-center gap-1 ${label}`}>H:
        <input type="number" min={1} max={8} className={base} style={{ width: 52 }} value={s.value?.height ?? 1}
          onChange={(e) => onChange({ ...s, value: { ...s.value, height: +e.target.value } })} />
      </label>
    </div>
  );
}
