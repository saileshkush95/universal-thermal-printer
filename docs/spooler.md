# Spooler Transport

Print via the operating system's print spooler. Sends raw ESC/POS data directly to a printer installed in the OS.

## Requirements

No additional packages required. Uses built-in OS APIs:

- **Windows:** `winspool.drv` via PowerShell P/Invoke (`OpenPrinter`, `StartDocPrinter`, `WritePrinter` with `RAW` datatype)
- **Linux / macOS:** CUPS `lp -o raw` command

## Usage

```typescript
import { print, listSpoolerPrinters } from "universal-thermal-printer";

// List available system printers
const printers = await listSpoolerPrinters();
console.log(printers);
// [{ name: "POS80 Printer", deviceId: "POS80 Printer" }, ...]

// Print
await print("spooler", "POS80 Printer", [
  { type: "Init" },
  { type: "Align", value: "center" },
  { type: "Size", value: { width: 2, height: 2 } },
  { type: "Bold", value: true },
  { type: "Text", value: "SPOOLER TEST" },
  { type: "Bold", value: false },
  { type: "Size", value: { width: 1, height: 1 } },
  { type: "Feed", value: 3 },
  { type: "Cut" },
]);
```

## Address Format

The printer name as registered in the OS:

| OS | Example |
|----|---------|
| Windows | `"POS80 Printer"`, `"ZKP8008"` |
| Linux (CUPS) | `"ZJ-80"`, `"TM-T88V"` |
| macOS (CUPS) | `"Thermal_Printer"` |

## Discovery

`listSpoolerPrinters()` detects system printers:

| Platform | Method |
|----------|--------|
| Windows | `Get-Printer` PowerShell cmdlet |
| Linux / macOS | `lpstat -p` |

## How It Works

1. Writes the ESC/POS byte data to a temporary file
2. Sends the raw data to the printer via the OS spooler API
3. Cleans up temporary files

## CLI

```bash
bun print.ts spooler "POS80 Printer"
```

```bash
npx thermal-print spooler "POS80 Printer"
```

```bash
thermal-print spooler "POS80 Printer"
```
