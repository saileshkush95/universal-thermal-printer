import type { PrintSection } from "../../types";

const base = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs";
const label = "text-[10px] text-slate-400 dark:text-slate-500";

export function ImageEditor({ s, onChange }: { s: PrintSection; onChange: (s: PrintSection) => void }) {
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
