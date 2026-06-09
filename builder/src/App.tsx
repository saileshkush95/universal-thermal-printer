import { useState, useCallback, useEffect } from "react";
import type { PrintSection, PaperFormat, Template } from "./types";
import { SECTION_DEFS } from "./types";
import { SectionEditor } from "./components/SectionEditor";
import { Preview } from "./components/Preview";
import { TEMPLATES } from "./utils/templates";

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("builder-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("builder-theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

export default function App() {
  const [dark, toggleTheme] = useTheme();
  const [sections, setSections] = useState<PrintSection[]>([{ type: "Init" }]);
  const [format, setFormat] = useState<PaperFormat>("80mm");
  const [templateName, setTemplateName] = useState("Untitled");

  const updateSection = useCallback((i: number, s: PrintSection) => setSections((p) => { const n = [...p]; n[i] = s; return n; }), []);
  const removeSection = useCallback((i: number) => setSections((p) => p.filter((_, j) => j !== i)), []);
  const moveSection = useCallback((i: number, d: -1 | 1) => setSections((p) => {
    const n = [...p], t = i + d;
    if (t < 0 || t >= n.length) return n;
    [n[i], n[t]] = [n[t], n[i]];
    return n;
  }), []);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, i: number) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== i) setDragOverIdx(i);
  }, [dragIdx]);

  const handleDragEnd = useCallback(() => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      setSections((p) => {
        const n = [...p];
        const [moved] = n.splice(dragIdx, 1);
        n.splice(dragOverIdx, 0, moved);
        return n;
      });
    }
    setDragIdx(null);
    setDragOverIdx(null);
  }, [dragIdx, dragOverIdx]);

  const addSection = useCallback((def: typeof SECTION_DEFS[0]) => {
    if (!def) return;
    if (def.type === "Init" && sections.some((s) => s.type === "Init")) return;
    setSections((p) => [...p, { type: def.type, value: def.defaults ?? undefined }]);
  }, [sections]);

  const loadTemplate = useCallback((name: string) => {
    const t = TEMPLATES.find((x) => x.name === name);
    if (!t) return;
    const s = t.sections.some((x) => x.type === "Init") ? t.sections : [{ type: "Init" }, ...t.sections];
    setSections(s);
    setFormat(t.paperFormat);
    setTemplateName(t.name);
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ name: templateName, paperFormat: format, sections } as Template, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${templateName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [templateName, format, sections]);

  const importJson = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async () => {
      try {
        const t: Template = JSON.parse(await (input.files![0]!).text());
        setSections(t.sections); setFormat(t.paperFormat || "80mm"); setTemplateName(t.name || "Imported");
      } catch { alert("Invalid file"); }
    };
    input.click();
  }, []);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify({ name: templateName, paperFormat: format, sections } as Template, null, 2));
  }, [templateName, format, sections]);

  const visibleSections = SECTION_DEFS.filter((d) => format === "A4" || format === "Letter" ? d.a4 : d.thermal);

  const groups: { label: string; types: typeof SECTION_DEFS }[] = [
    { label: "Text", types: visibleSections.filter((d) => ["Text", "Align", "Size", "Bold", "Underline", "Italic", "Font", "LetterSpacing", "LineHeight"].includes(d.type)) },
    { label: "Layout", types: visibleSections.filter((d) => ["Line", "Feed", "FeedDots", "Cut", "MultiColumn", "Table"].includes(d.type)) },
    { label: "Media", types: visibleSections.filter((d) => ["Image", "Barcode", "Qr"].includes(d.type)) },
    { label: "Actions", types: visibleSections.filter((d) => ["Init", "ResetStyle", "Drawer", "Beep", "CodePage"].includes(d.type)) },
    { label: "Toggles", types: visibleSections.filter((d) => ["Invert", "Rotate", "UpsideDown"].includes(d.type)) },
  ];

  const selCls = "bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs px-2 py-1 rounded";

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <h1 className="text-sm font-bold whitespace-nowrap">Print Builder</h1>
        <input className={selCls + " w-28"} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Name" />
        <select className={selCls} value={format} onChange={(e) => setFormat(e.target.value as PaperFormat)}>
          <option value="58mm">58mm</option>
          <option value="80mm">80mm</option>
          <option value="A4">A4 PDF</option>
          <option value="Letter">Letter PDF</option>
        </select>
        <div className="flex gap-1 ml-auto">
          <button onClick={exportJson} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600">Export</button>
          <button onClick={importJson} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600">Import</button>
          <button onClick={copyCode} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600">Copy</button>
          <button onClick={() => sections.length > 0 && confirm("Clear?") && setSections([{ type: "Init" }])}
            className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-800">Clear</button>
          <button onClick={toggleTheme} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600">
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 min-w-48 overflow-y-auto p-2 border-r border-slate-200 dark:border-slate-700 shrink-0 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold">Template</div>
            <select className={selCls + " w-full"} defaultValue=""
              onChange={(e) => { const v = e.target.value; if (v) loadTemplate(v); }}>
              <option value="" disabled>Select template...</option>
              {TEMPLATES.map((t, i) => <option key={i} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          {groups.map((g) => g.types.length > 0 && (
            <div key={g.label}>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold">{g.label}</div>
              <div className="flex flex-wrap gap-0.5">
                {g.types.map((d) => {
                  const disabled = d.type === "Init" && sections.some((s) => s.type === "Init");
                  return (
                    <button key={d.type + d.label} onClick={() => !disabled && addSection(d)} title={d.label}
                      className={`${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-700"} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-[10px] px-1.5 py-0.5 rounded`}>{d.label}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex justify-center items-start">
          <Preview sections={sections} format={format} />
        </div>

        <div className="w-64 min-w-56 overflow-y-auto p-2 border-l border-slate-200 dark:border-slate-700 shrink-0">
          {sections.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-xs mt-8">Add sections or load a template</div>
          ) : (
            <div className="flex flex-col gap-1 pb-4">
              {sections.map((s, i) => (
                <SectionEditor key={i} section={s} index={i} onChange={updateSection} onRemove={removeSection} onMove={moveSection}
                  onDragStart={handleDragStart} onDragOverSection={handleDragOver} onDragEnd={handleDragEnd}
                  isDragTarget={dragOverIdx === i && dragIdx !== i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
