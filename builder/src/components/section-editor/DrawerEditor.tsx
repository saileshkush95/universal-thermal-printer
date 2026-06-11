import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;

export function DrawerEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <select className={sel} value={s.value ?? 2}
      onChange={(e) => onChange({ ...s, value: +e.target.value })}>
      <option value={2}>Pin 2</option>
      <option value={5}>Pin 5</option>
    </select>
  );
}
