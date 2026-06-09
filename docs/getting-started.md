# Getting Started

## Installation

```bash
npm install universal-thermal-printer
```
```bash
yarn add universal-thermal-printer
```
```bash
bun add universal-thermal-printer
```

### Optional peer dependencies (install as needed)

**USB serial (Node.js / Bun):**

```bash
npm install serialport
```
```bash
yarn add serialport
```
```bash
bun add serialport
```

**Bluetooth SPP (Node.js / Bun):**

```bash
npm install bluetooth-serial-port
```
```bash
yarn add bluetooth-serial-port
```
```bash
bun add bluetooth-serial-port
```

**Network / Bluetooth for Expo:**

```bash
npx expo install react-native-tcp-socket expo-ble
```

## Quick Start (Node.js / Bun)

```typescript
import { print } from "universal-thermal-printer";

const receipt = [
  { type: "Init" },
  { type: "Align", value: "center" },
  { type: "Bold", value: true },
  { type: "Size", value: { width: 2, height: 2 } },
  { type: "Text", value: "MY STORE" },
  { type: "Bold", value: false },
  { type: "Size", value: { width: 1, height: 1 } },
  { type: "Text", value: "123 Main Street" },
  { type: "Line" },
  { type: "Text", value: "Item .............. $5.00" },
  { type: "Text", value: "Item .............. $10.00" },
  { type: "Bold", value: true },
  { type: "Text", value: "Total ............. $15.00" },
  { type: "Bold", value: false },
  { type: "Feed", value: 2 },
  { type: "Cut" },
];

// Print via network
await print("network", "192.168.1.100", receipt);

// Print via USB (auto-detects COM port or system printer)
await print("usb", "COM3", receipt);

// Print via system spooler
await print("spooler", "POS80 Printer", receipt);
```

## Demo Script

```bash
bun print.ts
```

```bash
node --experimental-strip-types print.ts
```

The demo script accepts arguments:

```bash
bun print.ts <type> <address> <port>

# Examples:
bun print.ts network 192.168.1.100 9100
bun print.ts usb "POS80 Printer"
bun print.ts spooler "POS80 Printer"
bun print.ts bluetooth "00:11:22:33:44:55"
```

## API

### `print(type, address, sections, options?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `"network"` \| `"bluetooth"` \| `"usb"` \| `"spooler"` | — | Transport type |
| `address` | `string` | — | IP, MAC, device path, or printer name |
| `sections` | `PrintSection[]` | — | Array of ESC/POS sections |
| `options.port` | `number` | `9100` | TCP port (network only) |
| `options.baudRate` | `number` | `9600` | Baud rate (USB serial only) |
| **Returns** | `Promise<string>` | — | Success message |

### `listBluetoothPrinters()`

Returns paired Bluetooth devices (`{ name, address }[]`).

### `listUsbPrinters()`

Returns connected USB devices (`{ name, deviceId }[]`). Discovers both serial ports and system printers.

### `listSpoolerPrinters()`

Returns system-installed printers (`{ name, deviceId }[]`).

## Transport Auto-Detection

The library automatically detects the runtime environment:

- **Bun** — detected via `typeof Bun !== "undefined"`
- **Node.js** — detected via `process.versions.node`
- **Expo/React Native** — detected via `navigator.product === "ReactNative"`

Each transport selects the appropriate backend for the current runtime.
