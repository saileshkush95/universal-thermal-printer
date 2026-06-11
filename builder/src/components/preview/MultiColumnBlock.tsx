import type { ReactNode } from "react";
import type { TextLine } from "./utils";

export function MultiColumnBlock({ line }: { line: TextLine }) {
  const { cols, gap } = line.mc!;
  const maxLines = cols.reduce((m, c) => Math.max(m, (c.text || "").split("\n").length), 0);
  const gapStr = " ".repeat(gap);
  const sep = " \u2502 ";
  const els: ReactNode[] = [];
  for (let li = 0; li < maxLines; li++) {
    const parts = cols.map((c, ci) => {
      const cell = (c.text || "").split("\n")[li] ?? "";
      const w = Math.max(c.width ?? 10, 2);
      const padded = c.align === "right" ? cell.padStart(w)
        : c.align === "center" ? (() => {
          const left = Math.max(0, Math.ceil((w - cell.length) / 2));
          return " ".repeat(left) + cell + " ".repeat(Math.max(0, w - cell.length - left));
        })()
        : cell.padEnd(w);
      return ci < cols.length - 1 ? padded + sep : padded;
    });
    els.push(<div key={li} className="w-full">{parts.join(gapStr)}</div>);
  }
  return <div className="w-full">{els}</div>;
}
