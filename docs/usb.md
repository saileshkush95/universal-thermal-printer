# USB Transport

Print over USB — supports two modes:

1. **Serial port devices** (e.g. `COM3`, `/dev/ttyUSB0`) via `serialport`
2. **System printer devices** (e.g. `"POS80 Printer"`) via OS print spooler

The transport **auto-detects** which mode to use based on the address format.

## Requirements

### Serial port mode

```bash
npm install serialport
```
```bash
yarn add serialport
```
```bash
bun add serialport
```

### System printer mode

No additional packages required. Uses built-in OS print APIs:
- **Windows:** `winspool.drv` via PowerShell P/Invoke
- **Linux / macOS:** CUPS `lp` command

## Usage

```typescript
import { print, listUsbPrinters } from "universal-thermal-printer";

// List available USB devices
const devices = await listUsbPrinters();
console.log(devices);
// [
//   { name: "Silicon Labs CP210x", deviceId: "COM3" },
//   { name: "POS80 Printer",       deviceId: "usbprint:POS80 Printer" },
// ]

// Print via serial port
await print("usb", "COM3", [
  { type: "Init" },
  { type: "Text", value: "Hello via serial USB!" },
  { type: "Cut" },
]);

// Print via system printer (auto-detected)
await print("usb", "POS80 Printer", [
  { type: "Init" },
  { type: "Text", value: "Hello via system printer!" },
  { type: "Cut" },
]);
```

## Address Auto-Detection

| Format | Detected As | Example |
|--------|-------------|---------|
| `COM` + number (Windows) | Serial port | `"COM3"` |
| `/dev/...` (Linux/macOS) | Serial port | `"/dev/ttyUSB0"` |
| Anything else | System printer | `"POS80 Printer"` |

## Backend Selection

| Runtime | Serial Port | System Printer |
|---------|------------|----------------|
| Node.js | `serialport` | winspool.drv / CUPS `lp` |
| Bun | `serialport` | winspool.drv / CUPS `lp` |
| Expo | — | — (not available) |

## Discovery

`listUsbPrinters()` returns devices from all available sources:

- **Serial ports:** Via `serialport` (all platforms)
- **Windows printers:** Via WMI `Get-CimInstance Win32_Printer` (excluding Microsoft/OneNote/XPS/Fax/AnyDesk)
- **Linux/macOS printers:** Via `lpstat -p`

## CLI

```bash
bun print.ts usb COM3
```

```bash
bun print.ts usb "POS80 Printer"
```

```bash
npx thermal-print usb "POS80 Printer"
```

```bash
thermal-print usb "POS80 Printer"
```
