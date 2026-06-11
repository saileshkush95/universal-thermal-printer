import type { TextLine } from "./utils";

export function TextRenderer({ line }: { line: TextLine }) {
  const fs = Math.max(6, 11 * line.size);
  const lhMultiplier = line.lh && line.lh > 0 ? Math.max(0.5, line.lh / 30) : 1;
  const lsVal = line.ls ?? 0;
  const fontStyle = line.font === "B"
    ? { letterSpacing: `${-0.3 + lsVal}px`, fontSize: Math.max(5, fs - 1) } as const
    : line.font === "C"
      ? { letterSpacing: `${0.5 + lsVal}px`, fontSize: fs + 1 } as const
      : lsVal !== 0
        ? { letterSpacing: `${lsVal}px` } as const
        : {};
  return (
    <div className={`${line.bold ? "font-bold" : ""} ${line.center ? "text-center" : ""} ${line.right ? "text-right" : ""}`}
      style={{ fontSize: fs, lineHeight: 1.5 * lhMultiplier, ...fontStyle }}>
      {line.text || "\u00A0"}
    </div>
  );
}
