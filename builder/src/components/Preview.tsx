import type { PrintSection, PaperFormat } from "../types";
import { buildLines } from "./preview/utils";
import { RenderLine } from "./preview/RenderLine";

interface Props { sections: PrintSection[]; format: PaperFormat }

export function Preview({ sections, format }: Props) {
  const lines = buildLines(sections);
  const isThermal = format === "58mm" || format === "80mm";
  const pw = format === "58mm" ? 280 : format === "80mm" ? 384 : 612;
  const minH = isThermal ? 200 : 400;

  return (
    <div className="w-full max-w-[700px]">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold text-center">Preview</div>
      <div className="bg-white text-black border border-slate-200 dark:border-slate-600 rounded-sm shadow-md mx-auto"
        style={{ width: pw, minHeight: minH, fontFamily: "'Courier New', Courier, monospace" }}>
        <div className="whitespace-pre-wrap break-all text-[11px] leading-relaxed p-3"
          style={{ minHeight: minH - (isThermal ? 28 : 0) }}>
          {lines.map((l, i) => <RenderLine key={i} line={l} pw={pw} format={format} />)}
        </div>
        {isThermal && (
          <div className="border-t border-dashed border-slate-300 dark:border-slate-600 mx-3 py-1 text-center text-[8px] tracking-wider text-slate-400 dark:text-slate-500 select-none">
            ~ tear here ~
          </div>
        )}
      </div>
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-1">{sections.length} sections · {pw}px</div>
    </div>
  );
}
