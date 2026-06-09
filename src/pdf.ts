import { PDFDocument, PDFPage, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import type { PrintSection } from "./escpos.js";

export interface PdfOptions {
  pageSize?: "A4" | "Letter";
  margins?: number;
  fontSize?: number;
  title?: string;
}

const PAGE_DIMENSIONS: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
};

const DEFAULT_FONT_SIZE = 10;
const LINE_HEIGHT_RATIO = 1.4;

interface RenderState {
  x: number;
  y: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  fontSize: number;
  bold: boolean;
  align: "left" | "center" | "right";
  font: PDFFont;
  boldFont: PDFFont;
  page: PDFPage;
  doc: PDFDocument;
}

export async function buildPdf(
  sections: PrintSection[],
  options?: PdfOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const [pw, ph] = PAGE_DIMENSIONS[options?.pageSize || "A4"];
  const margin = options?.margins ?? 40;
  const baseFontSize = options?.fontSize ?? DEFAULT_FONT_SIZE;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([pw, ph]);
  const state: RenderState = {
    x: margin,
    y: ph - margin,
    margin,
    pageWidth: pw,
    pageHeight: ph,
    fontSize: baseFontSize,
    bold: false,
    align: "left",
    font,
    boldFont,
    page,
    doc,
  };

  if (options?.title) {
    state.fontSize = 16;
    state.bold = true;
    state.align = "center";
    writeText(state, options.title);
    state.fontSize = baseFontSize;
    state.bold = false;
    state.align = "left";
    state.y -= 8;
  }

  for (const section of sections) {
    if (needsNewPage(state)) {
      state.y = ph - margin;
    }
    await renderSection(state, section);
  }

  return await doc.save();
}

function needsNewPage(state: RenderState): boolean {
  return state.y < state.margin;
}

async function renderSection(state: RenderState, section: PrintSection): Promise<void> {
  switch (section.type) {
    case "Init":
    case "CodePage":
    case "Drawer":
    case "Beep":
    case "Cut":
    case "Rotate":
    case "UpsideDown":
    case "Invert":
      break;

    case "Font":
      break;

    case "LetterSpacing":
      break;

    case "ResetStyle":
      state.bold = false;
      state.align = "left";
      state.fontSize = 10;
      break;

    case "Text":
      writeText(state, section.value || "");
      break;

    case "Align":
      state.align = section.value === "center" ? "center" : section.value === "right" ? "right" : "left";
      break;

    case "Size": {
      const w = Math.min(Math.max(section.value?.width || 1, 1), 8);
      const h = Math.min(Math.max(section.value?.height || 1, 1), 8);
      state.fontSize = baseFontSize(state) * Math.max(w, h);
      break;
    }

    case "Bold":
      state.bold = !!section.value;
      break;

    case "Underline":
      break;

    case "Italic":
      break;

    case "Feed": {
      const n = Math.min(Math.max(section.value || 1, 1), 255);
      state.y -= n * lineHeight(state);
      break;
    }

    case "FeedDots": {
      const n = Math.min(Math.max(section.value || 1, 1), 255);
      state.y -= (n / 8) * lineHeight(state);
      break;
    }

    case "LineHeight": {
      const n = Math.min(Math.max(section.value || 30, 0), 255);
      state.fontSize = Math.max(4, n / 3);
      break;
    }

    case "Line": {
      const ch = section.value || "=";
      const lineStr = typeof ch === "string" ? ch.repeat(80) : "=".repeat(80);
      const width = stringWidth(state, lineStr);
      const y = state.y;
      const x = calcX(state, width);
      const font = currentFont(state);
      const fontSize = Math.min(state.fontSize, 8);
      state.page.drawText(lineStr, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      state.y -= lineHeight(state) * 0.5;
      break;
    }

    case "Barcode":
    case "Qr":
      break;

    case "Table": {
      const t = section.value || {};
      const headers: string[] = t.header || [];
      const rows: string[][] = t.rows || [];
      const sep = t.separator === "none" ? "" : "─";
      const headerBold = t.headerBold !== false;
      const borderAll = t.borderAll === true;
      const gap = t.gap ?? 1;
      const colCount = Math.max(headers.length, ...rows.map((r: string[]) => r.length));
      if (colCount === 0) break;

      const maxW = state.pageWidth - 2 * state.margin;
      const colWidths: number[] = t.columnWidths
        ? t.columnWidths.slice(0, colCount)
        : Array(colCount).fill(maxW / colCount);

      if (!t.columnWidths) {
        for (let c = 0; c < colCount; c++) {
          colWidths[c] = maxW / colCount;
        }
      }

      const fs = state.fontSize;
      const totalW = colWidths.reduce((a: number, b: number) => a + b, 0);
      const scale = totalW > 0 ? maxW / totalW : 1;

      function drawRow(cells: string[], isHeader: boolean): void {
        if (isHeader && headerBold) state.bold = true;
        const f = currentFont(state);
        const rowY = state.y;
        const maxH = Math.max(fs, ...cells.map((c: string, i: number) => {
          const w = colWidths[i] * scale;
          const lines = wrapText(c, state, w - gap);
          return lines.length * lineHeight(state);
        }));

        if (borderAll && sep) {
          const parts = colWidths.map((w: number) => {
            const ch = isHeader ? "═" : "─";
            state.page.drawText(ch.repeat(80), { x: state.margin, y: rowY, size: Math.min(fs, 6), font: f, color: rgb(0, 0, 0) });
          });
        }

        for (let c = 0; c < cells.length; c++) {
          const w = colWidths[c] * scale;
          const text = cells[c] || "";
          const wrapLines = wrapText(text, state, w - gap);
          state.y = rowY;
          for (const line of wrapLines) {
            const lw = stringWidth(state, line);
            if (lw > w) {
              state.fontSize = Math.max(4, fs * (w / lw));
            }
            const lw2 = stringWidth(state, line);
            let x: number;
            if (c === 0) {
              x = state.margin;
            } else {
              const offset = colWidths.slice(0, c).reduce((a: number, b: number) => a + b * scale, 0);
              x = state.margin + offset + gap / 2;
            }
            if (t.align?.[c] === "center") {
              x = x + (w - lw2 - gap) / 2;
            } else if (t.align?.[c] === "right") {
              x = x + w - lw2 - gap;
            }
            x = Math.max(state.margin, x);
            state.page.drawText(line, { x, y: state.y, size: state.fontSize, font: f, color: rgb(0, 0, 0) });
            state.y -= lineHeight(state);
          }
          state.fontSize = fs;
        }
        state.bold = false;
        state.y = Math.min(...Array.from({ length: cells.length }, (_, i) => {
          const w = colWidths[i] * scale;
          const lines = (cells[i] || "").length;
          const wrapLines = wrapText(cells[i] || "", state, w - gap);
          return rowY - wrapLines.length * lineHeight(state);
        }));

        if (borderAll && sep) {
          state.y -= lineHeight(state) * 0.3;
        }

        if (isHeader && sep) {
          const y = state.y;
          const sepLine = "─".repeat(80);
          state.page.drawText(sepLine, { x: state.margin, y, size: Math.min(fs, 6), font: state.font, color: rgb(0.7, 0.7, 0.7) });
        }
      }

      if (headers.length > 0) {
        drawRow(headers, true);
      }
      for (const row of rows) {
        drawRow(row, false);
      }
      state.y -= lineHeight(state);
      break;
    }

    case "MultiColumn": {
      const mc = section.value || {};
      const cols: { text: string; width?: number; align?: string }[] = mc.columns || [];
      if (cols.length === 0) break;
      const maxW = state.pageWidth - 2 * state.margin;
      const colW = maxW / cols.length;
      const maxLines = cols.reduce((max: number, col: { text: string; width?: number; align?: string }) => {
        const lines = (col.text || "").split("\n");
        return Math.max(max, lines.length);
      }, 0);

      for (let li = 0; li < maxLines; li++) {
        const y = state.y;
        for (let ci = 0; ci < cols.length; ci++) {
          const lines = (cols[ci].text || "").split("\n");
          const cell = lines[li] ?? "";
          const f = currentFont(state);
          const fs = state.fontSize;
          const wrapLines = wrapText(cell, state, colW - 4);
          state.y = y;
          for (const line of wrapLines) {
            let x = state.margin + ci * colW;
            if (cols[ci].align === "center") {
              x += (colW - stringWidth(state, line)) / 2;
            } else if (cols[ci].align === "right") {
              x += colW - stringWidth(state, line) - 2;
            }
            state.page.drawText(line, { x, y: state.y, size: fs, font: f, color: rgb(0, 0, 0) });
            state.y -= lineHeight(state);
          }
        }
        state.y = Math.min(
          ...cols.map((_, ci) => {
            const lines = (cols[ci].text || "").split("\n");
            const cell = lines[li] ?? "";
            const wrapLines = wrapText(cell, state, colW - 4);
            return y - wrapLines.length * lineHeight(state);
          })
        );
      }
      state.y -= lineHeight(state);
      break;
    }

    case "Image": {
      const img = section.value || {};
      if (img.base64) {
        try {
          const imgData = img.base64.startsWith("data:")
            ? img.base64.split(",")[1]
            : img.base64;
          const binary = Uint8Array.from(atob(imgData), (c) => c.charCodeAt(0));
          let image;
          if (img.mimeType?.includes("png")) {
            image = await state.doc.embedPng(binary);
          } else if (img.mimeType?.includes("jpeg") || img.mimeType?.includes("jpg")) {
            image = await state.doc.embedJpg(binary);
          }
          if (image) {
            const maxW = state.pageWidth - 2 * state.margin;
            const aspect = image.width / image.height;
            const w = Math.min(maxW, parseInt(img.displayWidth) || maxW);
            const h = w / aspect;
            const x = state.align === "center" ? (state.pageWidth - w) / 2
              : state.align === "right" ? state.pageWidth - state.margin - w
              : state.margin;
            state.page.drawImage(image, { x, y: state.y - h, width: w, height: h });
            state.y -= h + lineHeight(state) * 0.5;
          }
        } catch {
          // image rendering failed, skip
        }
      }
      break;
    }
  }
}

function baseFontSize(state: RenderState): number {
  return 10;
}

function lineHeight(state: RenderState): number {
  return state.fontSize * LINE_HEIGHT_RATIO;
}

function currentFont(state: RenderState): PDFFont {
  return state.bold ? state.boldFont : state.font;
}

function stringWidth(state: RenderState, text: string): number {
  return currentFont(state).widthOfTextAtSize(text, state.fontSize);
}

function calcX(state: RenderState, textWidth: number): number {
  if (state.align === "center") {
    return state.margin + (state.pageWidth - 2 * state.margin - textWidth) / 2;
  }
  if (state.align === "right") {
    return state.pageWidth - state.margin - textWidth;
  }
  return state.margin;
}

function writeText(state: RenderState, text: string): void {
  const maxWidth = state.pageWidth - 2 * state.margin;
  const lines = wrapText(text, state, maxWidth);
  const f = currentFont(state);
  const fs = state.fontSize;

  for (const line of lines) {
    if (line === "") {
      state.y -= lineHeight(state) * 0.5;
      continue;
    }
    const w = stringWidth(state, line);
    const x = calcX(state, w);
    state.page.drawText(line, { x, y: state.y, size: fs, font: f, color: rgb(0, 0, 0) });
    state.y -= lineHeight(state);
  }
}

function wrapText(text: string, state: RenderState, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(" ");
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (stringWidth(state, test) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0 && text) lines.push(text);
  return lines;
}
