import type { PrintSection } from "../types";

interface Props {
  section: PrintSection;
  index: number;
  onChange: (i: number, s: PrintSection) => void;
  onRemove: (i: number) => void;
  onMove: (i: number, d: -1 | 1) => void;
  onDragStart?: (e: React.DragEvent, i: number) => void;
  onDragOverSection?: (e: React.DragEvent, i: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragTarget?: boolean;
}

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const sel = `${base} cursor-pointer`;
const label = "text-[10px] text-slate-400 dark:text-slate-500";

function V({ section, onChange }: { section: PrintSection; onChange: (s: PrintSection) => void }) {
  const s = section;

  const typeText = () => {
    if (s.type === "Text") return (
      <textarea className={`${base} font-mono resize-y`} value={s.value ?? ""} rows={2} placeholder="Text"
        onChange={(e) => onChange({ ...s, value: e.target.value })} />
    );

    if (s.type === "Align") return (
      <select className={sel} value={s.value ?? "left"}
        onChange={(e) => onChange({ ...s, value: e.target.value })}>
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>
    );

    if (s.type === "Size") return (
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

    if (["Bold", "Underline", "Italic", "Invert", "Rotate", "UpsideDown"].includes(s.type)) return (
      <label className="flex items-center gap-2 cursor-pointer text-xs">
        <input type="checkbox" className="accent-blue-500" checked={!!s.value}
          onChange={(e) => onChange({ ...s, value: e.target.checked })} />
        <span className={label}>On</span>
      </label>
    );

    if (s.type === "Font") return (
      <select className={sel} value={s.value ?? "A"}
        onChange={(e) => onChange({ ...s, value: e.target.value })}>
        <option value="A">Font A</option>
        <option value="B">Font B</option>
        <option value="C">Font C</option>
      </select>
    );

    if (s.type === "Cut") return (
      <select className={sel} value={s.value ?? "full"}
        onChange={(e) => onChange({ ...s, value: e.target.value })}>
        <option value="full">Full Cut (solid)</option>
        <option value="partial">Partial Cut (notch)</option>
      </select>
    );

    if (s.type === "Drawer") return (
      <select className={sel} value={s.value ?? 2}
        onChange={(e) => onChange({ ...s, value: +e.target.value })}>
        <option value={2}>Pin 2</option>
        <option value={5}>Pin 5</option>
      </select>
    );

    if (s.type === "Beep") return (
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

    if (s.type === "Barcode") return (
      <div className="flex flex-col gap-1">
        <input type="text" className={base} value={s.value?.data ?? ""} placeholder="Data"
          onChange={(e) => onChange({ ...s, value: { ...s.value, data: e.target.value } })} />
        <select className={sel} value={s.value?.barcode_type ?? "CODE128"}
          onChange={(e) => onChange({ ...s, value: { ...s.value, barcode_type: e.target.value } })}>
          {["UPC-A","UPC-E","EAN13","EAN8","CODE39","ITF","CODABAR","CODE93","CODE128"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    );

    if (s.type === "Qr") return (
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

    if (s.type === "Line") {
      const curVal = s.value ?? "─";
      return (
        <div className="flex gap-1 items-center">
          <select className={sel} style={{ flex: 1 }} value={curVal}
            onChange={(e) => onChange({ ...s, value: e.target.value })}>
            <option value="─">Single (─)</option>
            <option value="═">Double (═)</option>
            <option value="=">Double dash (=)</option>
            <option value="-">Dashed (-)</option>
            <option value="·">Dotted (·)</option>
            <option value="*">Star (*)</option>
            <option value="~">Wave (~)</option>
            <option value="#">Hash (#)</option>
          </select>
          <span className={label}>or</span>
          <input type="text" className={base} style={{ width: 36 }} value={curVal} maxLength={1}
            onChange={(e) => onChange({ ...s, value: e.target.value || "─" })} />
        </div>
      );
    }

    if (["Feed", "FeedDots", "CodePage"].includes(s.type)) return (
      <input type="number" min={1} max={255} className={base} value={s.value ?? 1}
        onChange={(e) => onChange({ ...s, value: +e.target.value })} />
    );

    if (s.type === "LineHeight") return (
      <input type="number" className={base} value={s.value ?? 30}
        onChange={(e) => onChange({ ...s, value: +e.target.value })} />
    );

    if (s.type === "LetterSpacing") return (
      <div className="flex gap-1 items-center">
        <input type="number" step={0.1} className={base} style={{ flex: 1 }} value={s.value ?? 0}
          onChange={(e) => onChange({ ...s, value: +e.target.value })} />
        <span className={label}>px</span>
      </div>
    );

    if (s.type === "Table") {
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

    if (s.type === "MultiColumn") {
      const v = s.value || {};
      const cols = Array.isArray(v.columns) ? v.columns : [];
      const setCol = (ci: number, patch: Record<string, any>) => {
        const next = cols.map((c: any, i: number) => i === ci ? { ...c, ...patch } : c);
        onChange({ ...s, value: { ...v, columns: next } });
      };
      return (
        <div className="flex flex-col gap-1">
          {cols.map((col: any, ci: number) => (
            <div key={ci} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded p-1.5">
              <div className="flex items-center gap-1 mb-1">
                <span className={label}>#{ci}</span>
                <select className={sel} style={{ width: 60 }} value={col.align ?? "left"}
                  onChange={(e) => setCol(ci, { align: e.target.value })}>
                  <option value="left">L</option>
                  <option value="center">C</option>
                  <option value="right">R</option>
                </select>
                <label className={`flex items-center gap-0.5 ml-auto ${label}`}>W:
                  <input type="number" min={2} max={60} className={base} style={{ width: 40 }}
                    value={col.width ?? 10}
                    onChange={(e) => setCol(ci, { width: +e.target.value })} />
                </label>
                <button onClick={() => onChange({ ...s, value: { ...v, columns: cols.filter((_: any, i: number) => i !== ci) } })}
                  className="text-[10px] px-1 py-0.5 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-500 rounded">×</button>
              </div>
              <textarea className={`${base} font-mono resize-y`} rows={1} value={col.text ?? ""} placeholder="Text"
                onChange={(e) => setCol(ci, { text: e.target.value })} />
            </div>
          ))}
          <button onClick={() => onChange({ ...s, value: { ...v, columns: [...cols, { text: "", width: 10, align: "left" }] } })}
            className="text-[10px] px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700">+ Add column</button>
          <label className={`flex items-center gap-1 ${label}`}>Gap:
            <input type="number" min={0} max={8} className={base} style={{ width: 44 }} value={v.gap ?? 2}
              onChange={(e) => onChange({ ...s, value: { ...v, gap: +e.target.value } })} />
          </label>
        </div>
      );
    }

    if (s.type === "Image") {
      const v = s.value || {};
      return (
        <div className="flex flex-col gap-1">
          <label className={`flex items-center gap-2 text-xs cursor-pointer ${label} hover:text-blue-500`}>
            <input type="file" accept="image/png,image/jpeg" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const data = ev.target?.result as string;
                  onChange({ ...s, value: { ...v, base64: data, mimeType: file.type } });
                };
                reader.readAsDataURL(file);
              }} />
            Upload
          </label>
          {v.base64 && (
            <div className="flex gap-2">
              <img src={v.base64} className="max-h-12 rounded" alt="preview" />
              <label className={`flex items-center gap-1 ${label}`}>W:
                <input type="number" min={20} max={800} className={base} style={{ width: 52 }}
                  value={v.displayWidth ?? 200}
                  onChange={(e) => onChange({ ...s, value: { ...v, displayWidth: +e.target.value } })} />
              </label>
            </div>
          )}
        </div>
      );
    }

    if (s.type === "Init" || s.type === "ResetStyle") return <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">No params</span>;

    return <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">—</span>;
  };

  return <div>{typeText()}</div>;
}

export function SectionEditor({ section, index, onChange, onRemove, onMove, onDragStart, onDragOverSection, onDragEnd, isDragTarget }: Props) {
  return (
    <div draggable={section.type !== "Init"}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={(e) => onDragOverSection?.(e, index)}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-slate-800 border rounded overflow-hidden ${isDragTarget ? "border-blue-500 border-2" : "border-slate-200 dark:border-slate-700"}`}>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-700 text-[10px]">
        <span className="text-slate-400">#{index + 1}</span>
        <strong className="text-slate-600 dark:text-slate-300">{section.type}</strong>
        <div className="ml-auto flex gap-0.5">
          {section.type !== "Init" && <>
            <button onClick={() => onMove(index, -1)} disabled={index === 0} title="Up"
              className="text-[10px] px-1 py-0.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded hover:bg-slate-100 dark:hover:bg-slate-500 disabled:opacity-30">↑</button>
            <button onClick={() => onMove(index, 1)} title="Down"
              className="text-[10px] px-1 py-0.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded hover:bg-slate-100 dark:hover:bg-slate-500">↓</button>
          </>}
          {section.type !== "Init" && <button onClick={() => onRemove(index)} title="Remove"
            className="text-[10px] px-1 py-0.5 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-800">✕</button>}
        </div>
      </div>
      <div className="p-2"><V section={section} onChange={(s) => onChange(index, s)} /></div>
    </div>
  );
}
