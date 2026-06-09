# ESC/POS Section Reference

Build thermal printer receipts using an array of `PrintSection` objects. Each section maps to one or more ESC/POS commands.

## Section Types

### Init

Reset the printer to factory defaults.

```typescript
{ type: "Init" }
```
**ESC/POS:** `ESC @` (0x1b 0x40)

---

### Text

Print a line of text (appends newline).

```typescript
{ type: "Text", value: "Hello World" }
```
**ESC/POS:** raw bytes + `LF` (0x0a)

---

### Align

Set horizontal alignment.

```typescript
{ type: "Align", value: "left" }    // ESC a 0
{ type: "Align", value: "center" }  // ESC a 1
{ type: "Align", value: "right" }   // ESC a 2
```
**ESC/POS:** `ESC a n` (0x1b 0x61)

---

### Size

Set character size (1x or 2x width/height).

```typescript
{ type: "Size", value: { width: 1, height: 1 } }  // Normal
{ type: "Size", value: { width: 2, height: 2 } }  // Double width + height
{ type: "Size", value: { width: 2, height: 1 } }  // Double width only
```
**ESC/POS:** `GS ! n` where `n = (height-1)*16 + (width-1)*32`

---

### Bold

Toggle bold printing.

```typescript
{ type: "Bold", value: true }   // ESC E 1
{ type: "Bold", value: false }  // ESC E 0
```
**ESC/POS:** `ESC E n` (0x1b 0x45)

---

### Underline

Toggle underline.

```typescript
{ type: "Underline", value: true }   // ESC - 1
{ type: "Underline", value: false }  // ESC - 0
```
**ESC/POS:** `ESC - n` (0x1b 0x2d)

---

### Italic

Toggle italic printing.

```typescript
{ type: "Italic", value: true }   // ESC 4
{ type: "Italic", value: false }  // ESC 5
```
**ESC/POS:** `ESC 4` (0x1b 0x34) / `ESC 5` (0x1b 0x35)

---

### Invert

Toggle reverse (white-on-black) printing.

```typescript
{ type: "Invert", value: true }   // GS B 1
{ type: "Invert", value: false }  // GS B 0
```
**ESC/POS:** `GS B n` (0x1d 0x42)

---

### Font

Select font.

```typescript
{ type: "Font", value: "A" }  // ESC M 0
{ type: "Font", value: "B" }  // ESC M 1
{ type: "Font", value: "C" }  // ESC M 2
```
**ESC/POS:** `ESC M n` (0x1b 0x4d)

---

### Rotate

Toggle 90-degree character rotation.

```typescript
{ type: "Rotate", value: true }   // ESC V 1
{ type: "Rotate", value: false }  // ESC V 0
```
**ESC/POS:** `ESC V n` (0x1b 0x56)

---

### UpsideDown

Toggle 180-degree flip.

```typescript
{ type: "UpsideDown", value: true }   // ESC { 1
{ type: "UpsideDown", value: false }  // ESC { 0
```
**ESC/POS:** `ESC { n` (0x1b 0x7b)

---

### Feed

Feed paper by a number of lines.

```typescript
{ type: "Feed", value: 3 }  // Feed 3 lines
```
**ESC/POS:** `ESC d n` (0x1b 0x64), n = 1–255

---

### FeedDots

Feed paper by a number of dots (fine control).

```typescript
{ type: "FeedDots", value: 100 }  // Feed 100 dots
```
**ESC/POS:** `ESC J n` (0x1b 0x4a), n = 1–255

---

### Cut

Cut paper.

```typescript
{ type: "Cut", value: "full" }     // GS V 0 — full cut
{ type: "Cut", value: "partial" }  // GS V 1 — partial cut
{ type: "Cut" }                     // defaults to full cut
```
**ESC/POS:** `GS V m` (0x1d 0x56)

---

### Line

Print a horizontal rule.

```typescript
{ type: "Line" }              // 40x "="
{ type: "Line", value: "-" }  // 40x "-"
```
**ESC/POS:** 40 repeated characters + `LF`

---

### Drawer

Open cash drawer.

```typescript
{ type: "Drawer", value: 2 }  // Pin 2
{ type: "Drawer", value: 5 }  // Pin 5
```
**ESC/POS:** `ESC p m t1 t2` (0x1b 0x70), pulse = 50ms

---

### Beep

Sound the buzzer.

```typescript
{ type: "Beep", value: { times: 3, duration: 5 } }
```
**ESC/POS:** `ESC (A 05 00 61 t d` (0x1b 0x28 0x41)

| Field | Range | Description |
|-------|-------|-------------|
| `times` | 1–9 | Number of beeps |
| `duration` | 1–9 | Beep duration |

---

### CodePage

Select character encoding page.

```typescript
{ type: "CodePage", value: 0 }    // PC437 (USA, Europe)
{ type: "CodePage", value: 2 }    // PC850 (Multilingual)
{ type: "CodePage", value: 17 }   // PC866 (Cyrillic)
{ type: "CodePage", value: 255 }  // User-defined
```
**ESC/POS:** `ESC t n` (0x1b 0x74), n = 0–255

---

### Barcode

Print a 1D barcode.

```typescript
{ type: "Barcode", value: {
  data: "1234567890",
  barcode_type: "CODE128",  // optional, default "CODE128"
  height: 100,              // optional, default 100 (dots)
  width: 3                  // optional, default 3 (2-6)
}}
```

**Supported barcode types:**

| Type | Description |
|------|-------------|
| `UPC-A` | Universal Product Code (12 digits) |
| `UPC-E` | Universal Product Code (6 digits) |
| `EAN13` | European Article Number (13 digits) |
| `EAN8` | European Article Number (8 digits) |
| `CODE39` | Code 39 (alphanumeric) |
| `ITF` | Interleaved 2 of 5 (digits, even count) |
| `CODABAR` | Codabar (numeric + $ + - : / .) |
| `CODE93` | Code 93 (alphanumeric) |
| `CODE128` | Code 128 (all ASCII, default) |

**ESC/POS commands:**
- `GS h n` — set height
- `GS w n` — set narrow bar width
- `GS H 2` — HRI below barcode
- `GS k m n d1...dn` — print barcode

---

### Qr

Print a QR Code.

```typescript
{ type: "Qr", value: {
  data: "https://example.com",
  size: 6,                    // optional, default 6 (1-16)
  error_correction: "M"       // optional, default "M"
}}
```

**Error correction levels:**

| Level | Recovery | Use case |
|-------|----------|----------|
| `L` | ~7% | High density |
| `M` | ~15% | Default, good balance |
| `Q` | ~25% | High reliability |
| `H` | ~30% | Maximum reliability |

**ESC/POS commands (7 total):**
1. Set model 2
2. Set module size
3. Set error correction
4. Store data length
5. Store data bytes
6. Print QR
7. Line feed

---

### Table

Print a formatted table with headers, rows, and separators.

```typescript
{ type: "Table", value: {
  header: ["Item", "Qty", "Price"],
  rows: [
    ["Widget", "2", "$10.00"],
    ["Gadget", "1", "$20.00"],
  ],
  separator: "single",     // "single" | "double" | "none" | "custom"
  customSeparator: "~",    // used when separator is "custom"
  headerBold: true,        // bold header row (default true)
  borderAll: false,         // border around all rows
  gap: 1,                   // gap between columns (default 1)
  columnWidths: [10, 5, 8] // custom column widths (optional)
}}
```

---

### MultiColumn

Print side-by-side text columns.

```typescript
{ type: "MultiColumn", value: {
  columns: [
    { text: "Left column\nline 2", width: 15 },
    { text: "Right column\nmore text", width: 15, align: "right" },
  ],
  gap: 2  // gap between columns (default 2)
}}
```

Per-column options:
| Field | Values | Description |
|-------|--------|-------------|
| `text` | string | Column content, `\n` for multiple lines |
| `width` | number | Character width of column |
| `align` | `"left"` \| `"center"` \| `"right"` | Text alignment within column |

---

### Image

Print a raster image (NV graphics bitmap command).

```typescript
{ type: "Image", value: {
  rasterData: "base64encoded...",  // base64 of pre-processed raster bytes
  bytesPerLine: 48,                // bytes per horizontal line
  height: 128,                     // image height in dots
  algorithm: 0                     // 0 = normal, 1 = double-width
}}
```

**ESC/POS:** `GS v 0 m xL xH yL yH d1...dk`

> Note: Images must be pre-processed to 1-bit raster format. The template builder handles this automatically for uploaded PNG/JPEG files.

---

### LineHeight

Set the line spacing (height between consecutive lines).

```typescript
{ type: "LineHeight", value: 30 }  // default ~30 dots (0–255)
```
**ESC/POS:** `ESC 3 n` (0x1b 0x33)

---

### LetterSpacing

Adjust character spacing. This is a visual-only section — it affects the template builder preview but is a **no-op in ESC/POS** (no standard command exists).

```typescript
{ type: "LetterSpacing", value: 0 }    // normal
{ type: "LetterSpacing", value: 1.5 }  // wider
{ type: "LetterSpacing", value: -0.5 } // tighter
```

---

### ResetStyle

Reset all style settings to defaults (bold off, size 1x1, left align, etc.).

```typescript
{ type: "ResetStyle" }
```
**ESC/POS:** `ESC @` (0x1b 0x40) — same as Init

---

## Complete Example

```typescript
const receipt = [
  { type: "Init" },
  { type: "Align", value: "center" },
  { type: "Size", value: { width: 2, height: 2 } },
  { type: "Bold", value: true },
  { type: "Text", value: "STORE NAME" },
  { type: "Bold", value: false },
  { type: "Size", value: { width: 1, height: 1 } },
  { type: "Text", value: "123 Main Street" },
  { type: "Text", value: "City, State 12345" },
  { type: "Line" },
  { type: "Text", value: "Item 1 ........... $10.00" },
  { type: "Text", value: "Item 2 ........... $15.00" },
  { type: "Bold", value: true },
  { type: "Text", value: "Total ............ $25.00" },
  { type: "Bold", value: false },
  { type: "Line", value: "-" },
  { type: "Align", value: "center" },
  { type: "Qr", value: { data: "ORDER-12345", size: 6, error_correction: "M" } },
  { type: "Feed", value: 2 },
  { type: "Text", value: "Thank you!" },
  { type: "Feed", value: 5 },
  { type: "Cut" },
];
```
