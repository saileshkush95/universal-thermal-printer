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
    renderSection(state, section);
  }

  return await doc.save();
}

function needsNewPage(state: RenderState): boolean {
  return state.y < state.margin;
}

function renderSection(state: RenderState, section: PrintSection): void {
  switch (section.type) {
    case "Init":
    case "CodePage":
    case "Drawer":
    case "Beep":
    case "Cut":
    case "Rotate":
    case "UpsideDown":
    case "Invert":
    case "Font":
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
