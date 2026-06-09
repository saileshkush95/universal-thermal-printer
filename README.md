# universal-thermal-printer

Print to thermal printers over **TCP**, **Bluetooth**, or **USB** — works in **Node.js** and **React Native**.

## Install

```bash
npm install /path/to/universal-thermal-printer
```

### Optional packages

Only needed for the transport types you use:

| Transport | Package | Install |
|-----------|---------|---------|
| TCP  | *(built-in `net` module)* | Nothing to install |
| Bluetooth | `bluetooth-serial-port` | `npm install bluetooth-serial-port` |
| USB  | `serialport` | `npm install serialport` |

Missing a transport? Calling its function throws a clear error telling you exactly which package to install.

---

## API

```ts
import { print, listBluetoothPrinters, listUsbPrinters } from "universal-thermal-printer";
import type { PrintSection } from "universal-thermal-printer";
```

### `print(type, address, sections, options?)`

| Arg | Type | Description |
|-----|------|-------------|
| `type` | `"network"` \| `"bluetooth"` \| `"usb"` | Transport type |
| `address` | `string` | IP address, Bluetooth MAC, or USB device path |
| `sections` | `PrintSection[]` | Array of print commands |
| `options.port` | `number` (default `9100`) | TCP port (network only) |
| `options.baudRate` | `number` (default `9600`) | Baud rate (USB only) |

### `listBluetoothPrinters()` — list paired Bluetooth printers
### `listUsbPrinters()` — list connected USB devices

---

## Examples

### Network print (Node.js & React Native)

```ts
import { print } from "universal-thermal-printer";

await print("network", "192.168.1.87", [
  { type: "Init" },
  { type: "Size", value: { width: 2, height: 2 } },
  { type: "Align", value: "center" },
  { type: "Bold", value: true },
  { type: "Text", value: "HELLO WORLD" },
  { type: "Bold", value: false },
  { type: "Feed", value: 3 },
  { type: "Cut" },
]);
```

### Bluetooth print

```ts
import { print, listBluetoothPrinters } from "universal-thermal-printer";

const printers = await listBluetoothPrinters();
// [{ name: "XP-58", address: "00:11:22:33:44:55" }]

await print("bluetooth", printers[0].address, [
  { type: "Init" },
  { type: "Text", value: "Hello from Bluetooth!" },
  { type: "Cut" },
]);
```

### USB print

```ts
import { print, listUsbPrinters } from "universal-thermal-printer";

const devices = await listUsbPrinters();
// [{ name: "USB Printer", deviceId: "/dev/ttyUSB0" }]

await print("usb", devices[0].deviceId, [
  { type: "Init" },
  { type: "Text", value: "USB print works too" },
  { type: "Cut" },
], { baudRate: 9600 });
```

---

## Running in Node.js (no React Native)

TCP printing uses Node's built-in `net` module — zero dependencies needed.

```bash
# Direct TS (Node 22.6+ / 25+)
node --experimental-strip-types print.ts

# Or with Bun
bun print.ts
```

The `print.ts` script at the project root sends a sample receipt to a network printer:

```bash
node --experimental-strip-types print.ts          # default 192.168.1.87:9100
node --experimental-strip-types print.ts 10.0.0.50 9100
```

---

## PrintSection Reference

Each section is `{ type, value? }`.

| type | value | Description |
|------|-------|-------------|
| `Init` | — | Reset printer to defaults |
| `Text` | `string` | Print text with newline |
| `Align` | `"left"` \| `"center"` \| `"right"` | Alignment |
| `Size` | `{ width: 1\|2, height: 1\|2 }` | Text size |
| `Bold` | `boolean` | Bold on/off |
| `Underline` | `boolean` | Underline on/off |
| `Italic` | `boolean` | Italic on/off |
| `Invert` | `boolean` | Reverse printing |
| `Font` | `"A"` \| `"B"` \| `"C"` | Font face |
| `Rotate` | `boolean` | 90° rotation |
| `UpsideDown` | `boolean` | 180° flip |
| `Feed` | `number` (1-255) | Feed n lines |
| `FeedDots` | `number` (1-255) | Feed n dots |
| `Cut` | `"full"` \| `"partial"` | Paper cut |
| `Line` | `string` | Horizontal line (default `=`) |
| `Drawer` | `2` \| `5` | Open cash drawer |
| `Beep` | `{ times, duration }` | Buzzer (1-9 each) |
| `CodePage` | `number` (0-255) | Character page |
| `Barcode` | `{ data, barcode_type?, height?, width? }` | 1D barcode |
| `Qr` | `{ data, size?, error_correction? }` | QR code |

### Barcode types

`UPC-A` `UPC-E` `EAN13` `EAN8` `CODE39` `ITF` `CODABAR` `CODE93` `CODE128`

### QR error correction

| value | Recovery |
|-------|----------|
| `L` | ~7% |
| `M` | ~15% (default) |
| `Q` | ~25% |
| `H` | ~30% |

---

## Project Structure

```
src/
├── index.ts              # Exports: print, listBluetoothPrinters, listUsbPrinters
├── escpos.ts             # ESC/POS command builder
└── transport/
    ├── tcp.ts            # Node.js built-in net module
    ├── bluetooth.ts      # bluetooth-serial-port (optional)
    └── usb.ts            # serialport (optional)
```
