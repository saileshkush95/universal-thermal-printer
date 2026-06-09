import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { PrintSection, PaperFormat } from "../types";
import QRCode from "qrcode";

function QRImg({ data, size }: { data: string; size: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(data || " ", {
      width: size,
      margin: 1,
      color: { dark: "#000", light: "#fff" },
    }).then(setUrl).catch(() => setUrl(""));
  }, [data, size]);
  return url ? <img src={url} style={{ width: size, maxWidth: "100%" }} alt="QR" /> : null;
}

interface Props { sections: PrintSection[]; format: PaperFormat }

export function Preview({ sections, format }: Props) {
  const isThermal = format === "58mm" || format === "80mm";
  const pw = format === "58mm" ? 280 : format === "80mm" ? 384 : 612;
  const minH = isThermal ? 200 : 400;

  const lines: { text: string; bold: boolean; center: boolean; right: boolean; size: number; font?: string; lh?: number; ls?: number; img?: string; imgW?: number; cut?: string; qr?: { data: string; size: number }; barcode?: { data: string; type: string }; table?: { header: string[]; rows: string[][]; sep: string; gap: number; hBold: boolean; columnWidths?: number[] }; mc?: { cols: { text: string; width: number; align?: string }[]; gap: number }; ch?: string }[] = [];
  let bold = false, center = false, right = false, size = 1, font = "A", lh = 0, ls = 0;

  for (const s of sections) {
    switch (s.type) {
      case "Text":
        (s.value ?? "").split("\n").forEach((l: string) => lines.push({ text: l, bold, center, right, size, font, lh, ls }));
        break;
      case "Bold": bold = !!s.value; break;
      case "Align": center = s.value === "center"; right = s.value === "right"; break;
      case "Font": font = s.value || "A"; break;
      case "LineHeight": lh = Math.min(Math.max(s.value ?? 30, 0), 255); break;
      case "LetterSpacing": ls = s.value ?? 0; break;
      case "ResetStyle": bold = false; center = false; right = false; size = 1; font = "A"; lh = 0; ls = 0; break;
      case "Size": {
        const v = s.value as { width?: number; height?: number } | undefined;
        size = Math.max(v?.width ?? 1, v?.height ?? 1);
        break;
      }
      case "Line": {
        lines.push({ text: "", bold: false, center: false, right: false, size: 1, ch: (s.value || "─")[0] });
        break;
      }
      case "Feed": for (let i = 0; i < (+s.value || 1); i++) lines.push({ text: "", bold: false, center: false, right: false, size: 1 }); break;
      case "Barcode": lines.push({ text: "", bold: false, center: true, right: false, size: 1, barcode: { data: s.value?.data ?? "", type: s.value?.barcode_type ?? "CODE128" } }); break;
      case "Qr": lines.push({ text: "", bold: false, center: true, right: false, size: 1, qr: { data: s.value?.data ?? "", size: (s.value?.size ?? 6) * 12 } }); break;
      case "Cut": lines.push({ text: "", bold: false, center: false, right: false, size: 1, cut: s.value === "partial" ? "partial" : "full" }); break;
      case "Image": lines.push({ text: "", bold: false, center: false, right: false, size: 1, img: s.value?.base64, imgW: s.value?.displayWidth }); break;
      case "Table": {
        const v = s.value || {};
        lines.push({ text: "", bold: false, center: false, right: false, size: 1, table: {
          header: v.header || [], rows: v.rows || [],
          sep: v.separator === "double" ? "=" : v.separator === "none" ? "" : "-",
          gap: v.gap ?? 1, hBold: v.headerBold !== false,
          columnWidths: v.columnWidths } });
        break;
      }
      case "MultiColumn":
        lines.push({ text: "", bold: false, center: false, right: false, size: 1, mc: { cols: s.value?.columns || [], gap: s.value?.gap ?? 2 } });
        break;
    }
  }

  function renderTableCell(text: string, w: number): string {
    const t = String(text ?? "");
    return t.length >= w ? t.slice(0, w) : t.padEnd(w);
  }

  return (
    <div className="w-full max-w-[700px]">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-semibold text-center">Preview</div>
      <div className="bg-white text-black p-3 rounded shadow-lg mx-auto" style={{ width: pw, minHeight: minH, fontFamily: "'Courier New', Courier, monospace" }}>
        <div className="whitespace-pre-wrap break-all text-[11px] leading-relaxed">
          {lines.map((l, i) => {
            if (l.table) {
              const { header, rows, sep, gap, hBold } = l.table;
              const cols = Math.max(header.length, ...rows.map((r) => r.length));
              let cw: number[] = Array(cols);
              const colWidths = l.table.columnWidths;
              const hasCustom = Array.isArray(colWidths) && colWidths.length === cols;
              if (hasCustom) {
                cw = colWidths.map((w: number) => Math.max(w, 2));
              } else {
                for (let c = 0; c < cols; c++) {
                  let maxW = 4;
                  if (header[c]) maxW = Math.max(maxW, header[c].length);
                  for (const r of rows) if (r[c]) maxW = Math.max(maxW, r[c].length);
                  cw[c] = maxW;
                }
                const availW = format === "58mm" ? 30 : format === "80mm" ? 40 : 60;
                const total = cw.reduce((a, b) => a + b, 0) + (cols - 1) * gap;
                const scale = total > 0 && total < availW ? (availW - (cols - 1) * gap) / (total - (cols - 1) * gap) : 1;
                cw = cw.map((w) => Math.max(Math.floor(w * scale), 4));
              }
              const gapStr = " ".repeat(gap);
              const render = (cells: string[]) => cells.map((c, ci) => renderTableCell(c, cw[ci])).join(gapStr);
              const sepLine = sep ? cw.map((w: number) => sep.repeat(w)).join(gapStr) : "";
              return (
                <div key={i}>
                  {header.length > 0 && <div className={hBold ? "font-bold" : ""}>{render(header)}</div>}
                  {sepLine && <div className="text-[10px] leading-tight" style={{ letterSpacing: "0.5px" }}>{sepLine}</div>}
                  {rows.map((row, ri) => <div key={ri}>{render(row)}</div>)}
                </div>
              );
            }

            if (l.mc) {
              const { cols, gap } = l.mc;
              const maxLines = cols.reduce((m, c) => Math.max(m, (c.text || "").split("\n").length), 0);
              const gapStr = " ".repeat(gap);
              const sep = " \u2502 ";
              const els: ReactNode[] = [];
              for (let li = 0; li < maxLines; li++) {
                const parts = cols.map((c, ci) => {
                  const cell = (c.text || "").split("\n")[li] ?? "";
                  const w = Math.max(c.width ?? 10, 2);
                  let padded: string;
                  if (c.align === "right") padded = cell.padStart(w);
                  else if (c.align === "center") {
                    const left = Math.max(0, Math.ceil((w - cell.length) / 2));
                    padded = " ".repeat(left) + cell + " ".repeat(Math.max(0, w - cell.length - left));
                  } else padded = cell.padEnd(w);
                  return ci < cols.length - 1 ? padded + sep : padded;
                });
                els.push(<div key={li} className="w-full">{parts.join(gapStr)}</div>);
              }
              return <div key={i} className="w-full">{els}</div>;
            }

            if (l.img) {
              const maxW = pw - 24;
              const w = Math.min(maxW, l.imgW ?? 200);
              return (
                <div key={i} className="flex justify-center my-1">
                  <img src={l.img} style={{ width: w, maxHeight: 160 }} className="object-contain" alt="" />
                </div>
              );
            }

            if (l.qr) {
              const maxW = pw - 24;
              const sz = Math.min(maxW, Math.max(40, l.qr.size));
              return (
                <div key={i} className="flex justify-center my-1">
                  <QRImg data={l.qr.data} size={sz} />
                </div>
              );
            }

            if (l.barcode) {
              return (
                <div key={i} className="text-center text-[10px] my-1">
                  <div className="text-slate-500 text-[12px] tracking-widest">||||||||||||||||||||||</div>
                  <div>{l.barcode.data}</div>
                </div>
              );
            }

            if (l.cut) {
              return (
                <div key={i} className="mt-2">
                  {l.cut === "partial" ? (
                    <div className="flex items-center gap-1 text-[10px] text-slate-300 dark:text-slate-500">
                      <span className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-600" />
                      <span className="whitespace-nowrap">partial cut</span>
                      <span className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-600" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] text-slate-300 dark:text-slate-500">
                      <span className="flex-1 border-t-2 border-slate-400 dark:border-slate-500" />
                      <span className="whitespace-nowrap">full cut</span>
                      <span className="flex-1 border-t-2 border-slate-400 dark:border-slate-500" />
                    </div>
                  )}
                </div>
              );
            }

            if (l.ch) {
              return (
                <div key={i} className="text-[11px] leading-relaxed overflow-hidden whitespace-nowrap text-center"
                  style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                  {l.ch.repeat(200)}
                </div>
              );
            }

            const fs = Math.max(6, 11 * l.size);
            const lhMultiplier = l.lh && l.lh > 0 ? Math.max(0.5, l.lh / 30) : 1;
            const lsVal = l.ls ?? 0;
            const fontStyle = l.font === "B" ? { letterSpacing: `${-0.3 + lsVal}px`, fontSize: Math.max(5, fs - 1) } as const
              : l.font === "C" ? { letterSpacing: `${0.5 + lsVal}px`, fontSize: fs + 1 } as const
              : lsVal !== 0 ? { letterSpacing: `${lsVal}px` } as const
              : {};
            return (
              <div key={i} className={`${l.bold ? "font-bold" : ""} ${l.center ? "text-center" : ""} ${l.right ? "text-right" : ""}`}
                style={{ fontSize: fs, lineHeight: fs * 1.5 * lhMultiplier / 11, ...fontStyle }}>
                {l.text || "\u00A0"}
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-1">{sections.length} sections · {pw}px</div>
    </div>
  );
}
