import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;
const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function QrEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <input type="text" className={base} value={s.value?.data ?? ""} placeholder="QR data"
        onChange={(e) => onChange({ ...s, value: { ...s.value, data: e.target.value } })} />
      <div className="flex gap-2">
        <label className={`flex items-center gap-1 ${label}`}>Sz:
          <input type="number" min={1} max={16} className={base} style={{ width: 52 }} value={s.value?.size ?? 6}
            onChange={(e) => onChange({ ...s, value: { ...s.value, size: +e.target.value } })} />
        </label>
        <label className={`flex items-center gap-1 ${label}`}>EC:
          <select className={sel} style={{ width: 80 }} value={s.value?.error_correction ?? "M"}
            onChange={(e) => onChange({ ...s, value: { ...s.value, error_correction: e.target.value } })}>
            <option value="L">L 7%</option>
            <option value="M">M 15%</option>
            <option value="Q">Q 25%</option>
            <option value="H">H 30%</option>
          </select>
        </label>
      </div>
    </div>
  );
}
