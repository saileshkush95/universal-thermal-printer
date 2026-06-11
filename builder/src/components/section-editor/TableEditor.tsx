import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;
const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function TableEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
  const v = s.value || {};
  let colCount = 0;
  try {
    const hdr = v.header;
    if (Array.isArray(hdr)) colCount = hdr.length;
    else {
      const p = JSON.parse(JSON.stringify({ header: v.header, rows: v.rows }));
      colCount = p.header?.length || (p.rows?.[0]?.length ?? 0);
    }
  } catch { colCount = 0; }
  const cw = Array.isArray(v.columnWidths) ? [...v.columnWidths] : [];
  while (cw.length < colCount) cw.push(8);
  while (cw.length > colCount && colCount > 0) cw.pop();
  const hasCustomWidths = Array.isArray(v.columnWidths) && v.columnWidths.length > 0;
  return (
    <div className="flex flex-col gap-1">
      <textarea className={`${base} font-mono resize-y`} rows={2}
        value={JSON.stringify({ header: v.header, rows: v.rows })}
        placeholder='{"header":["A","B"],"rows":[["1","2"]]}'
        onChange={(e) => {
          try {
            const p = JSON.parse(e.target.value);
            onChange({ ...s, value: { ...v, header: p.header || [], rows: p.rows || [] } });
          } catch {}
        }} />
      {colCount > 0 && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer text-[10px] mb-1">
            <input type="checkbox" className="accent-blue-500" checked={hasCustomWidths}
              onChange={(e) => onChange({ ...s, value: { ...v, columnWidths: e.target.checked ? cw : undefined } })} />
            <span className={label}>Custom column widths</span>
          </label>
          {hasCustomWidths && (
            <div className="flex gap-1 flex-wrap">
              {cw.map((w: number, ci: number) => (
                <label key={ci} className={`flex items-center gap-0.5 ${label}`}>
                  {ci}:
                  <input type="number" min={2} max={40} className={base} style={{ width: 40 }}
                    value={w}
                    onChange={(e) => {
                      const next = [...cw];
                      next[ci] = +e.target.value;
                      onChange({ ...s, value: { ...v, columnWidths: next } });
                    }} />
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <label className={`flex items-center gap-1 ${label}`}>Sep:
          <select className={sel} value={v.separator ?? "single"}
            onChange={(e) => onChange({ ...s, value: { ...v, separator: e.target.value } })}>
            <option value="single">─</option>
            <option value="double">═</option>
            <option value="none">none</option>
          </select>
        </label>
        <label className={`flex items-center gap-1 ${label}`}>Gap:
          <input type="number" min={0} max={8} className={base} style={{ width: 44 }} value={v.gap ?? 1}
            onChange={(e) => onChange({ ...s, value: { ...v, gap: +e.target.value } })} />
        </label>
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-xs">
        <input type="checkbox" className="accent-blue-500" checked={v.headerBold !== false}
          onChange={(e) => onChange({ ...s, value: { ...v, headerBold: e.target.checked } })} />
        <span className={label}>Bold header</span>
      </label>
    </div>
  );
}
