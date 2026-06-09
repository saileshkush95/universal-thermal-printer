export interface PrintSection {
  type: string;
  value?: any;
}

export function buildEscPos(sections: PrintSection[]): Uint8Array {
  const parts: Uint8Array[] = [];

  for (const section of sections) {
    switch (section.type) {
      case "Init":
        parts.push(new Uint8Array([0x1b, 0x40]));
        break;

      case "Text":
        parts.push(new Uint8Array([...(section.value || "").split("").map((c: string) => c.charCodeAt(0)), 0x0a]));
        break;

      case "Align": {
        const val = section.value === "center" ? 0x01 : section.value === "right" ? 0x02 : 0x00;
        parts.push(new Uint8Array([0x1b, 0x61, val]));
        break;
      }

      case "Size": {
        const w = Math.min(Math.max(section.value?.width || 1, 1), 2);
        const h = Math.min(Math.max(section.value?.height || 1, 1), 2);
        const cmd = (h - 1) * 16 + (w - 1) * 32;
        parts.push(new Uint8Array([0x1d, 0x21, cmd]));
        break;
      }

      case "Bold":
        parts.push(new Uint8Array(section.value ? [0x1b, 0x45, 0x01] : [0x1b, 0x45, 0x00]));
        break;

      case "Underline":
        parts.push(new Uint8Array(section.value ? [0x1b, 0x2d, 0x01] : [0x1b, 0x2d, 0x00]));
        break;

      case "Italic":
        parts.push(new Uint8Array(section.value ? [0x1b, 0x34] : [0x1b, 0x35]));
        break;

      case "Invert":
        parts.push(new Uint8Array(section.value ? [0x1d, 0x42, 0x01] : [0x1d, 0x42, 0x00]));
        break;

      case "Font": {
        const val = section.value === "B" ? 0x01 : section.value === "C" ? 0x02 : 0x00;
        parts.push(new Uint8Array([0x1b, 0x4d, val]));
        break;
      }

      case "Rotate":
        parts.push(new Uint8Array(section.value ? [0x1b, 0x56, 0x01] : [0x1b, 0x56, 0x00]));
        break;

      case "UpsideDown":
        parts.push(new Uint8Array(section.value ? [0x1b, 0x7b, 0x01] : [0x1b, 0x7b, 0x00]));
        break;

      case "Feed": {
        const n = Math.min(Math.max(section.value || 1, 1), 255);
        parts.push(new Uint8Array([0x1b, 0x64, n]));
        break;
      }

      case "FeedDots": {
        const n = Math.min(Math.max(section.value || 1, 1), 255);
        parts.push(new Uint8Array([0x1b, 0x4a, n]));
        break;
      }

      case "Cut":
        parts.push(new Uint8Array(section.value === "partial" ? [0x1d, 0x56, 0x01] : [0x1d, 0x56, 0x00]));
        break;

      case "Line": {
        const ch = (section.value || "=").charCodeAt(0);
        parts.push(new Uint8Array(Array(40).fill(ch)));
        parts.push(new Uint8Array([0x0a]));
        break;
      }

      case "Drawer": {
        const pin = section.value || 2;
        const pulse = 50;
        if (pin === 5) {
          parts.push(new Uint8Array([0x1b, 0x70, 0x01, pulse, pulse]));
        } else {
          parts.push(new Uint8Array([0x1b, 0x70, 0x00, pulse, pulse]));
        }
        break;
      }

      case "Beep": {
        const times = Math.min(Math.max(section.value?.times || 1, 1), 9);
        const dur = Math.min(Math.max(section.value?.duration || 5, 1), 9);
        parts.push(new Uint8Array([0x1b, 0x28, 0x41, 0x05, 0x00, 0x61, times, dur]));
        break;
      }

      case "Barcode": {
        const barcodeData = section.value?.data || "";
        const barcodeType = section.value?.barcode_type || "CODE128";
        const height = section.value?.height || 100;
        const width = Math.min(Math.max(section.value?.width || 3, 2), 6);
        const typeMap: Record<string, number> = {
          "UPC-A": 65, "UPC-E": 66, "EAN13": 67, "EAN8": 68,
          "CODE39": 69, "ITF": 70, "CODABAR": 71, "CODE93": 72, "CODE128": 73,
        };
        const typeByte = typeMap[barcodeType] || 73;
        const bytes = new TextEncoder().encode(barcodeData);
        const len = Math.min(bytes.length, 255);

        parts.push(new Uint8Array([0x1d, 0x68, height]));
        parts.push(new Uint8Array([0x1d, 0x77, width]));
        parts.push(new Uint8Array([0x1d, 0x48, 0x02]));
        parts.push(new Uint8Array([0x1d, 0x6b, typeByte, len]));
        parts.push(new Uint8Array(bytes.slice(0, len)));
        parts.push(new Uint8Array([0x0a]));
        break;
      }

      case "Qr": {
        const qrData = section.value?.data || "";
        const size = Math.min(Math.max(section.value?.size || 6, 1), 16);
        const ecMap: Record<string, number> = { L: 48, Q: 50, H: 51 };
        const ec = ecMap[section.value?.error_correction] || 49;
        const bytes = new TextEncoder().encode(qrData);
        const totalLen = bytes.length + 3;
        const pL = totalLen & 0xff;
        const pH = (totalLen >> 8) & 0xff;

        parts.push(new Uint8Array([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
        parts.push(new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]));
        parts.push(new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, ec]));
        parts.push(new Uint8Array([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]));
        parts.push(new Uint8Array(bytes));
        parts.push(new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
        parts.push(new Uint8Array([0x0a]));
        break;
      }

      case "CodePage":
        parts.push(new Uint8Array([0x1b, 0x74, section.value || 0]));
        break;
    }
  }

  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}
