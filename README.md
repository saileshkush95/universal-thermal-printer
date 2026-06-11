# universal-thermal-printer

[![npm version](https://img.shields.io/npm/v/universal-thermal-printer?color=blue)](https://www.npmjs.com/package/universal-thermal-printer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Print to thermal (ESC/POS) and A4 (PDF) printers over **TCP**, **Bluetooth**, **USB**, **system spooler**, or **WebUSB / Web Serial** — works in **Node.js**, **Bun**, **Electron**, **Expo**, and the **browser**.

## Install

```bash
npm install universal-thermal-printer
```

### Requirements

| Runtime | Version |
|---------|---------|
| Node.js | >= 18 (for `net` module) |
| Bun     | >= 1.0  |
| Electron| >= 28 (uses Node.js `net` module) |
| Browser | Chrome / Edge >= 89 (WebUSB + Web Serial) |

### Dependencies

Only the transport packages you actually use are required — everything else is **optional**:

| Dependency | Runtime | Required for | Install |
|------------|---------|-------------|---------|
| `bluetooth-serial-port` | Node.js / Bun | Classic Bluetooth (SPP) | `npm install bluetooth-serial-port` |
| `react-native-ble-plx` | Expo | BLE Bluetooth | `npx expo install react-native-ble-plx` |
| `react-native-tcp-socket` | Expo | TCP/Network | `npx expo install react-native-tcp-socket` |
| `serialport` | Node.js | USB serial | `npm install serialport` |
| `pdf-lib` | Node.js / Bun / Expo | A4/PDF printing | `npm install pdf-lib` |
| — (built-in) | Expo (Android) | USB native | Included in `universal-thermal-printer` |

TCP printing on **Node.js/Bun** uses the built-in `net` module — zero additional packages needed.
On **Expo**, TCP requires `react-native-tcp-socket` and a **development build** (not Expo Go).

USB printing on **Expo (Android)** uses a built-in native module — just add the config plugin.

> Calling a transport function without its optional package installed throws a clear error telling you exactly what to install.

```bash
# Node.js: TCP-only (zero extra deps)
npm install universal-thermal-printer

# Node.js: all transports
npm install universal-thermal-printer bluetooth-serial-port serialport

# Expo: all transports (requires dev build)
npx expo install universal-thermal-printer react-native-ble-plx react-native-tcp-socket
```

---

## API

```ts
import { print, listBluetoothPrinters, listUsbPrinters, listSpoolerPrinters, listNetworkPrinters } from "universal-thermal-printer";
import type { PrintSection } from "universal-thermal-printer";
```

### Browser entry

```ts
import { print, requestUsbDevice, listUsbPrinters, requestSerialDevice } from "universal-thermal-printer/web";
```

WebUSB and Web Serial transports are available via the `"/web"` sub-path export.

### `print(type, address, sections, options?)`

Print sections to a thermal printer.

| Arg | Type | Description |
|-----|------|-------------|
| `type` | `"network"` \| `"bluetooth"` \| `"usb"` \| `"spooler"` | Transport type |
| `address` | `string` | IP address, Bluetooth MAC, USB path, or printer name. On **Expo Android** use `"vendorId:productId"` for USB. In **browser** use `deviceId` from `requestUsbDevice()`. |
| `sections` | `PrintSection[]` | Array of print commands |
| `options.port` | `number` (default `9100`) | TCP port (network only) |
| `options.baudRate` | `number` (default `9600`) | Baud rate (Node.js USB via serialport only) |
| `options.format` | `"thermal"` \| `"a4"` (default `"thermal"`) | Output format — ESC/POS or PDF |
| `options.pageSize` | `"A4"` \| `"Letter"` (default `"A4"`) | Page size (A4 format only) |
| `options.margins` | `number` (default `40`) | Page margins in points (A4 format only) |
| `options.title` | `string` | Optional centered title at top (A4 format only) |

**Returns**: `Promise<string>` — success message.

**Throws** when the transport package is not installed or connection fails.

---

### `listBluetoothPrinters()`

List paired/available Bluetooth printers.

```ts
async function listBluetoothPrinters(): Promise<{ name: string; address: string }[]>
```

| Runtime | Backend | Behavior |
|---------|---------|----------|
| Node.js / Bun | `bluetooth-serial-port` | Lists paired SPP devices |
| Expo | `react-native-ble-plx` | Scans for BLE peripherals (5s timeout) |

**Throws** if the optional dependency is not installed.

---

### `listUsbPrinters()`

List connected USB printer devices.

```ts
async function listUsbPrinters(): Promise<{ name: string; deviceId: string }[]>
```

| Runtime | Backend | Behavior |
|---------|---------|----------|
| Node.js / Bun | `serialport` | Lists USB serial devices |
| Expo | Built-in native module (Android) | |
| Expo (iOS) | — | Always throws |
| Browser | WebUSB | Lists previously paired devices (no chooser) |

---

### `listNetworkPrinters()`

Discover network printers via mDNS/Bonjour + SNMP + port scan.

```ts
async function listNetworkPrinters(options?): Promise<{ name: string; address: string; port: number }[]>
```

| Runtime | Backend |
|---------|---------|
| Node.js / Bun | Multicast DNS + SNMP queries + TCP scan |

---

### `listSpoolerPrinters()`

List system-installed printers (spooler).

```ts
async function listSpoolerPrinters(): Promise<{ name: string; deviceId: string }[]>
```

| Runtime | Backend |
|---------|---------|
| Node.js / Bun | Windows: PowerShell WMI; macOS: `lpstat`; Linux: `lpstat` |

---

## Examples

### Network print

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

await print("bluetooth", printers[0].address, [
  { type: "Init" },
  { type: "Text", value: "Hello from Bluetooth!" },
  { type: "Cut" },
]);
```

### USB print (Node.js)

```ts
import { print, listUsbPrinters } from "universal-thermal-printer";

const devices = await listUsbPrinters();
await print("usb", devices[0].deviceId, [
  { type: "Init" },
  { type: "Text", value: "USB print works too" },
  { type: "Cut" },
], { baudRate: 9600 });
```

### USB print (Expo Android)

```ts
import { print, listUsbPrinters } from "universal-thermal-printer";

const devices = await listUsbPrinters();
await print("usb", devices[0].deviceId, [
  { type: "Init" },
  { type: "Text", value: "Hello from Android USB!" },
  { type: "Cut" },
]);
```

### A4 / PDF print

```ts
import { print } from "universal-thermal-printer";

await print("spooler", "My Printer Name", [
  { type: "Init" },
  { type: "Align", value: "center" },
  { type: "Bold", value: true },
  { type: "Size", value: { width: 3, height: 3 } },
  { type: "Text", value: "INVOICE" },
  { type: "Bold", value: false },
  { type: "Line", value: "-" },
  { type: "Text", value: "Item 1 ................ $10.00" },
  { type: "Text", value: "Item 2 ................ $20.00" },
  { type: "Text", value: "Total: $30.00" },
  { type: "Feed", value: 3 },
], {
  format: "a4",
  title: "My Store",
  pageSize: "A4",
});
```

### Browser WebUSB print

```ts
import { print, requestUsbDevice } from "universal-thermal-printer/web";

// Shows browser chooser dialog — user selects printer
const device = await requestUsbDevice();

await print("usb", device.deviceId, [
  { type: "Init" },
  { type: "Align", value: "center" },
  { type: "Size", value: { width: 2, height: 2 } },
  { type: "Text", value: "Hello from the browser!" },
  { type: "Feed", value: 3 },
  { type: "Cut" },
]);
```

Requires Chrome/Edge 89+ on HTTPS or localhost. See [docs/browser.md](docs/browser.md) for Web USB troubleshooting (Zadig driver fix).

### System spooler print

```ts
import { print } from "universal-thermal-printer";

// macOS/Linux: CUPS lp, Windows: PowerShell .NET
await print("spooler", "POS80 Printer", [
  { type: "Init" },
  { type: "Text", value: "Print via system spooler" },
  { type: "Cut" },
]);
```

---

## Expo / React Native

> **Expo Go vs dev build**: `react-native-tcp-socket` and `react-native-ble-plx` require a **development build** (`npx expo run:ios` / `npx expo run:android`). They do **not** work in Expo Go.

### Quick start

```sh
npx create-expo-app@latest my-print-app
cd my-print-app
npx expo install universal-thermal-printer react-native-tcp-socket react-native-ble-plx
```

Configure `app.json`:

```json
{
  "expo": {
    "plugins": [
      "universal-thermal-printer/plugin/withUsbPrinter"
    ],
    "ios": {
      "infoPlist": {
        "NSBluetoothAlwaysUsageDescription": "Connect to thermal printers",
        "NSBluetoothPeripheralUsageDescription": "Connect to thermal printers"
      }
    }
  }
}
```

The config plugin auto-detects your Android SDK and creates `android/local.properties` if missing — no manual setup needed.

```sh
npx expo run:android   # Android dev build
npx expo run:ios       # iOS dev build
```

### Example component

```tsx
import { useState } from "react";
import { Button, View, TextInput } from "react-native";
import { print, listBluetoothPrinters } from "universal-thermal-printer";

export default function PrintScreen() {
  const [ip, setIp] = useState("192.168.1.87");
  const [printers, setPrinters] = useState([]);

  async function scanBt() {
    const list = await listBluetoothPrinters();
    setPrinters(list);
  }

  return (
    <View>
      <TextInput value={ip} onChangeText={setIp} placeholder="Printer IP" />
      <Button title="Print via Network" onPress={() =>
        print("network", ip, [
          { type: "Init" },
          { type: "Bold", value: true },
          { type: "Align", value: "center" },
          { type: "Text", value: "Hello from Expo!" },
          { type: "Feed", value: 3 },
          { type: "Cut" },
        ])
      } />
      <Button title="Scan Bluetooth Printers" onPress={scanBt} />
      {printers.map(p => (
        <Button key={p.address} title={`Print to ${p.name}`} onPress={() =>
          print("bluetooth", p.address, [
            { type: "Init" },
            { type: "Text", value: "Hello via BLE!" },
            { type: "Cut" },
          ])
        } />
      ))}
    </View>
  );
}
```

---

## Runtime auto-detection

| Runtime | TCP | Bluetooth | USB |
|---------|-----|-----------|-----|
| Node.js | `net` (built-in) | `bluetooth-serial-port` | `serialport` |
| Bun | `net` (built-in) | `bluetooth-serial-port` | `serialport` |
| Electron | `net` (built-in) | `bluetooth-serial-port` | `serialport` |
| Expo (Android) | `react-native-tcp-socket` | `react-native-ble-plx` | Built-in native module |
| Expo (iOS) | `react-native-tcp-socket` | `react-native-ble-plx` | ❌ |
| Browser | ❌ | ❌ | WebUSB + Web Serial (via `"/web"` entry) |

No configuration needed — just install the optional packages you need.

---

## PrintSection Reference

Each section is `{ type, value? }`.

| type | value | Thermal | A4/PDF |
|------|-------|---------|--------|
| `Init` | — | Reset printer | Ignored |
| `Text` | `string` | Print text with newline | PDF text (auto-wrapped) |
| `Align` | `"left"` \| `"center"` \| `"right"` | Horizontal alignment | ✓ |
| `Size` | `{ width: 1-8, height: 1-8 }` | Text size multiplier | Font size scaled by `max(w,h)` |
| `Bold` | `boolean` | Bold on/off | ✓ |
| `Underline` | `boolean` | Underline | Ignored |
| `Italic` | `boolean` | Italic | Ignored |
| `Invert` | `boolean` | Reverse printing | Ignored |
| `Font` | `"A"` \| `"B"` \| `"C"` | Font face | Ignored |
| `Rotate` | `boolean` | 90° rotation | Ignored |
| `UpsideDown` | `boolean` | 180° flip | Ignored |
| `Feed` | `number` (1-255) | Feed n lines | Adds spacing |
| `FeedDots` | `number` (1-255) | Feed n dots | Adds spacing |
| `Cut` | `"full"` \| `"partial"` | Paper cut | Ignored |
| `Line` | `string` | Horizontal rule (40× char) | PDF horizontal rule |
| `Drawer` | `2` \| `5` | Open cash drawer | Ignored |
| `Beep` | `{ times, duration }` | Buzzer | Ignored |
| `CodePage` | `number` (0-255) | Character page | Ignored |
| `Barcode` | `{ data, barcode_type?, height?, width? }` | 1D barcode | Ignored |
| `Qr` | `{ data, size?, error_correction? }` | QR code | Ignored |
| `Table` | `{ header, rows, separator?, headerBold?, borderAll?, gap?, columnWidths? }` | Formatted table | ✓ |
| `MultiColumn` | `{ columns: [{text, width, align?}], gap? }` | Side-by-side columns | ✓ |
| `Image` | `{ rasterData, bytesPerLine, height, algorithm? }` | NV bitmap image | ✓ (embedded) |
| `LineHeight` | `number` (0-255) | ESC 3 n line spacing | Adds spacing |
| `LetterSpacing` | `number` | Preview-only (no-op in ESC/POS) | ✓ |
| `ResetStyle` | — | ESC @ reset all styles | ✓ |

> **Note**: Section types use **PascalCase** (`"Init"`, `"Text"`, `"Bold"`, `"Cut"`, etc.). Lowercase values will be silently ignored.

### Table

```ts
{ type: "Table", value: {
  header: ["Item", "Qty", "Price"],
  rows: [["Widget", "2", "$10"], ["Gadget", "1", "$20"]],
  separator: "single",     // "single" | "double" | "none" | "custom"
  customSeparator: "~",
  headerBold: true,
  borderAll: false,
  gap: 1,
  columnWidths: [10, 5, 8]
}}
```

### MultiColumn

```ts
{ type: "MultiColumn", value: {
  columns: [
    { text: "Left column\nline 2", width: 15 },
    { text: "Right column", width: 15, align: "right" },
  ],
  gap: 2
}}
```

### Barcode types

`UPC-A` `UPC-E` `EAN13` `EAN8` `CODE39` `ITF` `CODABAR` `CODE93` `CODE128`

### QR error correction

| Value | Recovery |
|-------|----------|
| `L` | ~7% |
| `M` | ~15% (default) |
| `Q` | ~25% |
| `H` | ~30% |

---

## Template Builder

Visual drag-and-drop template builder at:

**[https://thermal-print-builder.pages.dev](https://thermal-print-builder.pages.dev)**

- Design receipts with live preview
- 25+ section types (text, barcode, QR, table, image, multi-column, cut, drawer, beep…)
- Export/import JSON templates
- Paper sizes: 58mm, 80mm, A4, Letter
- Theme support (dark/light)
- Run locally: `cd builder && bun dev`

---

## Browser Troubleshooting

### WebUSB on Windows — "Could not claim the printer interface" / "Virtual PRN"

On Windows, the default USB printer driver (`usbprint.sys`) claims the interface and blocks WebUSB. The device may show as **"Virtual PRN"** — a virtual device created by the manufacturer's driver.

**Fix with Zadig** — replaces the OS driver with WinUSB:

1. Download [Zadig](https://zadig.akeo.ie/) and **run as Administrator**
2. **Options → List All Devices** (critical — printer won't appear in default mode)
3. Select your printer from the dropdown (`USB Printing Support`, `Virtual PRN`, or `VID_0FE6&PID_811E`)
4. In the right column, select **WinUSB** (not libusb-win32)
5. Click **Replace Driver**, then **restart the browser**

After swapping to WinUSB, WebUSB can claim the interface. The printer won't appear in Windows Printers & Scanners (revert with Zadig anytime by selecting the original `usbprint` driver).

### WebUSB on Windows — "Failed to execute 'open' on 'USBDevice': Access denied"

The device session is stuck. Unplug the printer, wait 5 seconds, plug it back in, then click Connect again in the browser.

### WebUSB on macOS — "Could not claim the printer interface"

macOS kernel driver (IOKit) has the interface. Remove the printer from **System Settings → Printers & Scanners**, then reconnect.

### Web Serial doesn't show any ports

Only printers with USB-to-serial chips (CH340, CP2102, FTDI) appear as serial ports. Native USB printers won't show up here. Use the **WebUSB** transport with Zadig instead.

## CLI

```bash
npx thermal-print <ip> <port>

# Sample receipt to network printer
bun print.ts
node --experimental-strip-types print.ts
```

---

## Project Structure

```
src/
├── index.ts              # Node.js/Bun entry
├── index.rn.ts           # Expo/RN entry (dynamic imports)
├── index.web.ts          # Browser entry (WebUSB + Web Serial)
├── cli.ts                # CLI entry point
├── escpos.ts             # ESC/POS command builder
├── pdf.ts                # A4/PDF builder (pdf-lib)
├── env.d.ts              # Type declarations for optional deps
└── transport/
    ├── tcp.ts            # Node.js built-in net
    ├── bluetooth.ts      # bluetooth-serial-port (Node.js)
    ├── bluetooth-expo.ts # react-native-ble-plx (Expo)
    ├── usb.ts            # serialport (Node.js)
    ├── usb-expo.ts       # Android USB native bridge
    ├── usb-web.ts        # WebUSB transport (browser)
    ├── serial-web.ts     # Web Serial transport (browser)
    ├── spooler.ts        # CUPS / PowerShell spooler
    ├── detect.ts         # Runtime detection
    └── network-discovery.ts # mDNS + SNMP discovery
android/                  # Android USB native module
plugin/                   # Expo config plugin
builder/                  # Visual template builder (Vite + React)
docs/                     # Per-transport documentation
```

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT &copy; 2026 Sandeep Kushwaha
