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
      <div className="bg-white text-black p-3 rounded shadow-lg mx-auto" style={{ width: pw, minHeight: minH, fontFamily: "'Courier New', Courier, monospace" }}>
        <div className="whitespace-pre-wrap break-all text-[11px] leading-relaxed">
          {lines.map((l, i) => <RenderLine key={i} line={l} pw={pw} format={format} />)}
        </div>
      </div>
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-1">{sections.length} sections · {pw}px</div>
    </div>
  );
}
