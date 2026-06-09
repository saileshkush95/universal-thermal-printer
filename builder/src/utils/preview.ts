import type { PrintSection, PaperFormat } from "../types";

const PAPER_WIDTHS: Record<PaperFormat, number> = {
  "58mm": 32,
  "80mm": 48,
  A4: 80,
  Letter: 72,
};

export function renderPreview(sections: PrintSection[], format: PaperFormat): string[] {
  const width = PAPER_WIDTHS[format];
  const lines: string[] = [];
  let bold = false;
  let align: "left" | "center" | "right" = "left";

  for (const s of sections) {
    switch (s.type) {
      case "Text": {
        const text = String(s.value || "");
        const wrapped = wrapText(text, width);
        for (const line of wrapped) {
          lines.push(applyAlign(line, width, align, bold));
        }
        break;
      }
      case "Align":
        align = s.value === "center" ? "center" : s.value === "right" ? "right" : "left";
        break;
      case "Bold":
        bold = !!s.value;
        break;
      case "Line":
        lines.push(applyAlign("─".repeat(width), width, align, false));
        break;
      case "Feed": {
        const n = Math.min(Math.max(s.value || 1, 1), 255);
        for (let i = 0; i < n; i++) lines.push("");
        break;
      }
      case "Size": {
        const w = Math.min(Math.max(s.value?.width || 1, 1), 8);
        const h = Math.min(Math.max(s.value?.height || 1, 1), 8);
        const scale = Math.max(w, h);
        const tag = `[SIZE ${scale}x]`;
        lines.push(applyAlign(tag, width, "left", false));
        break;
      }
      case "Init":
        lines.push(applyAlign("[RESET]", width, "left", false));
        break;
      case "Cut":
        lines.push(applyAlign("--- CUT ---", width, "center", false));
        break;
      case "Qr":
        lines.push(applyAlign("[QR: " + (s.value?.data || "").slice(0, 20) + "]", width, "center", false));
        break;
      case "Barcode":
        lines.push(applyAlign("▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄", width, "center", false));
        lines.push(applyAlign((s.value?.data || ""), width, "center", false));
        break;
      case "Invert":
        lines.push(applyAlign(s.value ? "[INVERT ON]" : "[INVERT OFF]", width, "left", false));
        break;
      case "Underline":
        lines.push(applyAlign(s.value ? "[UNDERLINE ON]" : "[UNDERLINE OFF]", width, "left", false));
        break;
      case "Italic":
        lines.push(applyAlign(s.value ? "[ITALIC ON]" : "[ITALIC OFF]", width, "left", false));
        break;
      case "Font":
        lines.push(applyAlign(`[FONT ${s.value}]`, width, "left", false));
        break;
      case "Rotate":
        lines.push(applyAlign(s.value ? "[ROTATE 90°]" : "[ROTATE OFF]", width, "left", false));
        break;
      case "UpsideDown":
        lines.push(applyAlign(s.value ? "[UPSIDE DOWN]" : "[NORMAL]", width, "left", false));
        break;
      case "Drawer":
        lines.push(applyAlign(`[CASH DRAWER PIN ${s.value || 2}]`, width, "left", false));
        break;
      case "Beep":
        lines.push(applyAlign("[BEEP]", width, "left", false));
        break;
      case "CodePage":
        lines.push(applyAlign(`[CODEPAGE ${s.value}]`, width, "left", false));
        break;
      case "FeedDots":
        lines.push(applyAlign(`[FEED ${s.value} DOTS]`, width, "left", false));
        break;
      default:
        lines.push(applyAlign(`[${s.type}]`, width, "left", false));
    }
  }

  return lines;
}

function wrapText(text: string, width: number): string[] {
  if (!text) return [""];
  const lines: string[] = [];
  for (const word of text.split("\n")) {
    if (word.length <= width) {
      lines.push(word);
    } else {
      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }
    }
  }
  return lines;
}

function applyAlign(text: string, width: number, align: string, bold: boolean): string {
  const prefix = bold ? "■ " : "  ";
  if (align === "center") {
    const pad = Math.max(0, width - text.length);
    const left = Math.floor(pad / 2);
    return prefix + " ".repeat(left) + text;
  }
  if (align === "right") {
    const pad = Math.max(0, width - text.length);
    return prefix + " ".repeat(pad) + text;
  }
  return prefix + text;
}
