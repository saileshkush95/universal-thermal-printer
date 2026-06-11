import type { PaperFormat } from "../../types";
import type { TextLine } from "./utils";
import { padCell, calcColumnWidths } from "./utils";

export function TableBlock({ line, format }: { line: TextLine; format: PaperFormat }) {
  const { header, rows, sep, gap, hBold } = line.table!;
  const cw = calcColumnWidths(header, rows, gap, line.table!.columnWidths, format as any);
  const gapStr = " ".repeat(gap);
  const render = (cells: string[]) => cells.map((c, ci) => padCell(c, cw[ci])).join(gapStr);
  const sepLine = sep ? cw.map((w: number) => sep.repeat(w)).join(gapStr) : "";
  return (
    <div>
      {header.length > 0 && <div className={hBold ? "font-bold" : ""}>{render(header)}</div>}
      {sepLine && <div className="text-[10px] leading-tight" style={{ letterSpacing: "0.5px" }}>{sepLine}</div>}
      {rows.map((row, ri) => <div key={ri}>{render(row)}</div>)}
    </div>
  );
}
