import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;

export function FontEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <select className={sel} value={s.value ?? "A"}
      onChange={(e) => onChange({ ...s, value: e.target.value })}>
      <option value="A">Font A</option>
      <option value="B">Font B</option>
      <option value="C">Font C</option>
    </select>
  );
}
