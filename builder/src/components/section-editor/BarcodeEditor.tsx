import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;

const TYPES = ["UPC-A","UPC-E","EAN13","EAN8","CODE39","ITF","CODABAR","CODE93","CODE128"];

export function BarcodeEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <input type="text" className={base} value={s.value?.data ?? ""} placeholder="Data"
        onChange={(e) => onChange({ ...s, value: { ...s.value, data: e.target.value } })} />
      <select className={sel} value={s.value?.barcode_type ?? "CODE128"}
        onChange={(e) => onChange({ ...s, value: { ...s.value, barcode_type: e.target.value } })}>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}
