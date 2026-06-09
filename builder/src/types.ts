export interface PrintSection { type: string; value?: any }

export type PaperFormat = "58mm" | "80mm" | "A4" | "Letter";

export interface Template { name: string; paperFormat: PaperFormat; sections: PrintSection[] }

export const SECTION_DEFS: { type: string; label: string; defaults: any; thermal: boolean; a4: boolean }[] = [
  { type: "Init", label: "Init", defaults: null, thermal: true, a4: false },
  { type: "Text", label: "Text", defaults: "Sample text", thermal: true, a4: true },
  { type: "Align", label: "Align", defaults: "left", thermal: true, a4: true },
  { type: "Size", label: "Size", defaults: { width: 1, height: 1 }, thermal: true, a4: true },
  { type: "Bold", label: "Bold", defaults: true, thermal: true, a4: true },
  { type: "Underline", label: "Underline", defaults: true, thermal: true, a4: false },
  { type: "Italic", label: "Italic", defaults: true, thermal: true, a4: false },
  { type: "Invert", label: "Invert", defaults: true, thermal: true, a4: false },
  { type: "Font", label: "Font", defaults: "A", thermal: true, a4: false },
  { type: "Rotate", label: "Rotate", defaults: true, thermal: true, a4: false },
  { type: "UpsideDown", label: "Upside Down", defaults: true, thermal: true, a4: false },
  { type: "Feed", label: "Feed", defaults: 3, thermal: true, a4: true },
  { type: "FeedDots", label: "Feed Dots", defaults: 30, thermal: true, a4: true },
  { type: "Cut", label: "Cut Full", defaults: "full", thermal: true, a4: false },
  { type: "Cut", label: "Cut Partial", defaults: "partial", thermal: true, a4: false },
  { type: "Line", label: "Line", defaults: "─", thermal: true, a4: true },
  { type: "Drawer", label: "Drawer", defaults: 2, thermal: true, a4: false },
  { type: "Beep", label: "Beep", defaults: { times: 1, duration: 5 }, thermal: true, a4: false },
  { type: "CodePage", label: "CodePage", defaults: 0, thermal: true, a4: false },
  { type: "Barcode", label: "Barcode", defaults: { data: "1234567890", barcode_type: "CODE128", height: 100, width: 3 }, thermal: true, a4: false },
  { type: "Qr", label: "QR Code", defaults: { data: "https://example.com", size: 6, error_correction: "M" }, thermal: true, a4: false },
  { type: "Table", label: "Table", defaults: { header: ["Item", "Qty", "Price"], rows: [["Widget", "2", "$10"], ["Gadget", "1", "$20"]], headerBold: true, separator: "single", gap: 1 }, thermal: true, a4: true },
  { type: "MultiColumn", label: "MultiCol", defaults: { columns: [{ text: "Left col\nline 2", width: 15 }, { text: "Right col\nmore text", width: 15 }], gap: 2 }, thermal: true, a4: true },
  { type: "Image", label: "Image", defaults: { base64: "", mimeType: "image/png", displayWidth: 200 }, thermal: true, a4: true },
  { type: "LineHeight", label: "Line Height", defaults: 30, thermal: true, a4: true },
  { type: "ResetStyle", label: "Reset Style", defaults: null, thermal: true, a4: true },
  { type: "LetterSpacing", label: "Letter Spacing", defaults: 0, thermal: true, a4: true },
];
