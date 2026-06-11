import type { PrintSection, PaperFormat } from "../../types";

export interface TextLine {
  text: string;
  bold: boolean;
  center: boolean;
  right: boolean;
  size: number;
  font?: string;
  lh?: number;
  ls?: number;
  img?: string;
  imgW?: number;
  cut?: string;
  qr?: { data: string; size: number };
  barcode?: { data: string; type: string };
  table?: {
    header: string[];
    rows: string[][];
    sep: string;
    gap: number;
    hBold: boolean;
    columnWidths?: number[];
  };
  mc?: {
    cols: { text: string; width: number; align?: string }[];
    gap: number;
  };
  ch?: string;
}

export function buildLines(sections: PrintSection[]): TextLine[] {
  const lines: TextLine[] = [];
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
      case "Line": lines.push({ text: "", bold: false, center: false, right: false, size: 1, ch: (s.value || "─")[0] }); break;
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
  return lines;
}

export function padCell(text: string, w: number): string {
  const t = String(text ?? "");
  return t.length >= w ? t.slice(0, w) : t.padEnd(w);
}

export function calcColumnWidths(
  header: string[], rows: string[][], gap: number,
  columnWidths: number[] | undefined, format: PaperFormat
): number[] {
  const cols = Math.max(header.length, ...rows.map((r) => r.length));
  const cw: number[] = Array(cols);
  if (Array.isArray(columnWidths) && columnWidths.length === cols) {
    return columnWidths.map((w: number) => Math.max(w, 2));
  }
  for (let c = 0; c < cols; c++) {
    let maxW = 4;
    if (header[c]) maxW = Math.max(maxW, header[c].length);
    for (const r of rows) if (r[c]) maxW = Math.max(maxW, r[c].length);
    cw[c] = maxW;
  }
  const availW = format === "58mm" ? 30 : format === "80mm" ? 40 : 60;
  const total = cw.reduce((a, b) => a + b, 0) + (cols - 1) * gap;
  const scale = total > 0 && total < availW ? (availW - (cols - 1) * gap) / (total - (cols - 1) * gap) : 1;
  return cw.map((w) => Math.max(Math.floor(w * scale), 4));
}
