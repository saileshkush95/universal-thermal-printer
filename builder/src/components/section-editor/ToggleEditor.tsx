import type { PrintSection } from "../../types";

const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function ToggleEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-xs">
      <input type="checkbox" className="accent-blue-500" checked={!!s.value}
        onChange={(e) => onChange({ ...s, value: e.target.checked })} />
      <span className={label}>On</span>
    </label>
  );
}
