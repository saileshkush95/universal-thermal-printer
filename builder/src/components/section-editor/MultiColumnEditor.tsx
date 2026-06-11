import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;
const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function MultiColumnEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  const v = s.value || {};
  const cols = Array.isArray(v.columns) ? v.columns : [];
  const setCol = (ci: number, patch: Record<string, unknown>) => {
    const next = cols.map((c: unknown, i: number) => i === ci ? { ...(c as object), ...patch } : c);
    onChange({ ...s, value: { ...v, columns: next } });
  };
  return (
    <div className="flex flex-col gap-1">
      {cols.map((col: unknown, ci: number) => {
        const c = col as { align?: string; width?: number; text?: string };
        return (
          <div key={ci} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded p-1.5">
            <div className="flex items-center gap-1 mb-1">
              <span className={label}>#{ci}</span>
              <select className={sel} style={{ width: 60 }} value={c.align ?? "left"}
                onChange={(e) => setCol(ci, { align: e.target.value })}>
                <option value="left">L</option>
                <option value="center">C</option>
                <option value="right">R</option>
              </select>
              <label className={`flex items-center gap-0.5 ml-auto ${label}`}>W:
                <input type="number" min={2} max={60} className={base} style={{ width: 40 }}
                  value={c.width ?? 10}
                  onChange={(e) => setCol(ci, { width: +e.target.value })} />
              </label>
              <button onClick={() => onChange({ ...s, value: { ...v, columns: cols.filter((_: unknown, i: number) => i !== ci) } })}
                className="text-[10px] px-1 py-0.5 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-500 rounded">×</button>
            </div>
            <textarea className={`${base} font-mono resize-y`} rows={1} value={c.text ?? ""} placeholder="Text"
              onChange={(e) => setCol(ci, { text: e.target.value })} />
          </div>
        );
      })}
      <button onClick={() => onChange({ ...s, value: { ...v, columns: [...cols, { text: "", width: 10, align: "left" }] } })}
        className="text-[10px] px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700">+ Add column</button>
      <label className={`flex items-center gap-1 ${label}`}>Gap:
        <input type="number" min={0} max={8} className={base} style={{ width: 44 }} value={v.gap ?? 2}
          onChange={(e) => onChange({ ...s, value: { ...v, gap: +e.target.value } })} />
      </label>
    </div>
  );
}
