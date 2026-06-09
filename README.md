# universal-thermal-printer

[![npm version](https://img.shields.io/npm/v/universal-thermal-printer?color=blue)](https://www.npmjs.com/package/universal-thermal-printer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Print to thermal printers over **TCP**, **Bluetooth**, or **USB** — works in **Node.js**, **Bun**, and **Expo**.

## Install

```bash
npm install universal-thermal-printer
```

### Requirements

| Runtime | Version |
|---------|---------|
| Node.js | >= 18 (for `net` module) |
| Bun     | >= 1.0  |

### Dependencies

Only the transport packages you actually use are required — everything else is **optional**:

| Dependency | Runtime | Required for | Install |
|------------|---------|-------------|---------|
| `bluetooth-serial-port` | Node.js / Bun | Classic Bluetooth (SPP) | `npm install bluetooth-serial-port` |
| `expo-ble` | Expo | BLE Bluetooth | `npx expo install expo-ble` |
| `react-native-tcp-socket` | Expo | TCP/Network | `npx expo install react-native-tcp-socket` |
| `serialport` | Node.js | USB printing | `npm install serialport` |
| — (built-in) | Expo (Android) | USB printing | Included in `universal-thermal-printer` |

TCP printing on **Node.js/Bun** uses the built-in `net` module — zero additional packages needed.
On **Expo**, TCP requires `react-native-tcp-socket` and a **development build** (not Expo Go).

USB printing on **Expo (Android)** uses a built-in native module — no extra package needed, just add the config plugin (see below).

> Calling a transport function without its optional package installed throws a clear error telling you exactly what to install.

```bash
# Node.js: TCP-only (zero extra deps)
npm install universal-thermal-printer

# Node.js: all transports
npm install universal-thermal-printer bluetooth-serial-port serialport

# Expo: all transports (requires dev build)
npx expo install universal-thermal-printer expo-ble react-native-tcp-socket
```

---

## API

```ts
import { print, listBluetoothPrinters, listUsbPrinters } from "universal-thermal-printer";
import type { PrintSection } from "universal-thermal-printer";
```

### `print(type, address, sections, options?)`

Print sections to a thermal printer.

| Arg | Type | Description |
|-----|------|-------------|
| `type` | `"network"` \| `"bluetooth"` \| `"usb"` | Transport type |
| `address` | `string` | IP address, Bluetooth MAC, or USB device path. On **Expo Android** use `"vendorId:productId"` (e.g. `"10473:528"`). |
| `sections` | `PrintSection[]` | Array of print commands |
| `options.port` | `number` (default `9100`) | TCP port (network only) |
| `options.baudRate` | `number` (default `9600`) | Baud rate (Node.js USB via serialport only) |

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
| Expo | `expo-ble` | Scans for BLE peripherals |

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
| Expo | — | Always throws (USB not available on mobile) |

**Throws** on Expo with: `"USB printing is not available on React Native"`.

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
// [{ name: "XP-58", address: "00:11:22:33:44:55" }]

await print("bluetooth", printers[0].address, [
  { type: "Init" },
  { type: "Text", value: "Hello from Bluetooth!" },
  { type: "Cut" },
]);
```

### USB print

**Node.js / Bun** (via `serialport`):

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

**Expo (Android)** (via built-in native module + config plugin):

```ts
import { print, listUsbPrinters } from "universal-thermal-printer";

const devices = await listUsbPrinters();
// [{ name: "USB Printer", deviceId: "10473:528" }]

await print("usb", devices[0].deviceId, [
  { type: "Init" },
  { type: "Text", value: "Hello from Android USB!" },
  { type: "Cut" },
]);
```

---

## Expo / React Native usage

> **Expo Go vs dev build**: `react-native-tcp-socket` and `expo-ble` require a **development build** (`npx expo run:ios` / `npx expo run:android`). They do **not** work in Expo Go because both ship native modules.

### Quick start from scratch

```sh
npx create-expo-app@latest my-print-app
cd my-print-app
npx expo install universal-thermal-printer react-native-tcp-socket expo-ble
```

Configure `app.json` with plugins and permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-ble",
        {
          "isBackgroundEnabled": true,
          "neverForLocation": true
        }
      ],
      "universal-thermal-printer/plugin/withUsbPrinter"
    ],
    "ios": {
      "infoPlist": {
        "NSBluetoothAlwaysUsageDescription": "Used to connect to thermal printers",
        "NSBluetoothPeripheralUsageDescription": "Used to connect to thermal printers"
      },
      "bundleIdentifier": "com.example.myapp"
    },
    "android": {
      "permissions": [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT"
      ]
    }
  }
}
```

Build and run:

```sh
npx expo run:ios      # iOS development build
# or
npx expo run:android  # Android development build (USB requires Android)
```

### Bare React Native

```bash
npm install universal-thermal-printer expo-ble react-native-tcp-socket
cd ios && pod install
```

Add the same permissions above to `Info.plist` (iOS) and `AndroidManifest.xml` (Android).

### Example

```tsx
import { useState } from "react";
import { Button, View, TextInput } from "react-native";
import { print, listBluetoothPrinters } from "universal-thermal-printer";

export default function PrintScreen() {
  const [ip, setIp] = useState("192.168.1.87");
  const [printers, setPrinters] =
    useState<{ name: string; address: string }[]>([]);

  return (
    <View>
      <TextInput value={ip} onChangeText={setIp} placeholder="Printer IP" />
      <Button
        title="Print via Network"
        onPress={() =>
          print("network", ip, [
            { type: "Init" },
            { type: "Bold", value: true },
            { type: "Align", value: "center" },
            { type: "Text", value: "Hello from Expo!" },
            { type: "Bold", value: false },
            { type: "Feed", value: 3 },
            { type: "Cut" },
          ])
        }
      />

      <Button
        title="Scan Bluetooth Printers"
        onPress={async () => {
          const list = await listBluetoothPrinters();
          setPrinters(list);
        }}
      />

      {printers.map((p) => (
        <Button
          key={p.address}
          title={`Print to ${p.name}`}
          onPress={() =>
            print("bluetooth", p.address, [
              { type: "Init" },
              { type: "Text", value: "Hello via Bluetooth!" },
              { type: "Cut" },
            ])
          }
        />
      ))}
    </View>
  );
}
```

## Runtime auto-detection

The package automatically detects the runtime and uses the right transport:

| Runtime | TCP | Bluetooth | USB |
|---------|-----|-----------|-----|
| Node.js | `net` (built-in) | `bluetooth-serial-port` | `serialport` |
| Bun | `net` (built-in) | `bluetooth-serial-port` | `serialport` |
| Expo (Android) | `react-native-tcp-socket` | `expo-ble` | Built-in native module |
| Expo (iOS) | `react-native-tcp-socket` | `expo-ble` | ❌ |

No configuration needed — just `npm install` the optional packages you need.

### What doesn't work on Expo

| Transport | Platform | Reason |
|-----------|----------|--------|
| USB | iOS | No USB host API on iOS |

## CLI

```bash
# Via npx
npx thermal-print 192.168.1.87 9100

# Or globally
npm install -g universal-thermal-printer
thermal-print 192.168.1.87 9100
```

The `print.ts` script at the project root sends a sample receipt to a network printer:

```bash
# Direct TS (Node 22.6+ / 25+)
node --experimental-strip-types print.ts
bun print.ts
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
├── cli.ts                # CLI entry point (`thermal-print`)
├── escpos.ts             # ESC/POS command builder
└── transport/
    ├── tcp.ts            # Node.js built-in net module
    ├── bluetooth.ts      # bluetooth-serial-port (optional)
    └── usb.ts            # serialport (optional)
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT &copy; 2026 Sandeep Kushwaha
