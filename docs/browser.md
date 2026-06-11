# Browser Transport (WebUSB / Web Serial)

Print to thermal (ESC/POS) printers directly from the browser using **WebUSB** or **Web Serial API**.  
No Node.js, no drivers, no plugins — just a modern browser.

## Requirements

- **Browser:** Chrome / Edge ≥ 89 (WebUSB) or ≥ 89 (Web Serial)
- **Connection:** HTTPS or `localhost` — both APIs require a secure context
- **OS:** Windows, macOS, Linux, ChromeOS

> WebUSB and Web Serial do **not** work in Firefox, Safari, or mobile browsers.

## Installation

```bash
npm install universal-thermal-printer
```

## Quick Start

```ts
import { print, requestUsbDevice, listUsbPrinters } from "universal-thermal-printer/web";

// 1. Connect — shows browser chooser dialog
const device = await requestUsbDevice();

// 2. Print
await print("usb", device.deviceId, [
  { type: "Init" },
  { type: "Align", value: "center" },
  { type: "Size", value: { width: 2, height: 2 } },
  { type: "Text", value: "Hello from WebUSB!" },
  { type: "Feed", value: 3 },
  { type: "Cut" },
]);
```

## WebUSB

### How it works

1. `requestUsbDevice()` opens the browser's device chooser — user selects the printer
2. The library claims the USB interface and sends raw ESC/POS data
3. The device stays open for the page session; subsequent prints reuse the connection

### Windows Driver Issue

On Windows, the default USB printer driver (`usbprint.sys`) claims the interface and blocks WebUSB. You'll see "Could not claim the printer interface" errors. The device may show as **"Virtual PRN"** in the browser — this is the OS driver masking the real USB hardware.

**Fix with Zadig** — replaces the OS driver with WinUSB so the browser can access the device:

1. Download [Zadig](https://zadig.akeo.ie/) (the executable, no install needed)
2. **Run Zadig as Administrator** (right-click → Run as administrator)
3. Go to **Options → List All Devices** (important — printer won't appear in default mode)
4. From the dropdown, select your printer. Look for:
   - `USB Printing Support` (common name)
   - `Virtual PRN` (if showing in browser)
   - Or find by VID/PID: `0FE6:811E` for common thermal printers
   - Check the USB ID matches what you see in `browseUsbDevice()`
5. In the right column (target driver), select **WinUSB** (not libusb-win32, not libusb0)
6. Click **Replace Driver**
7. Wait for "Driver installed successfully"
8. **Restart the browser** (not just refresh the tab)

**After Zadig:**
- The printer disappears from Windows **Printers & Scanners** — this is expected
- Open the test app, click Connect — the printer should appear and `claimInterface()` should succeed
- To verify it worked: run `browseUsbDevice()` and check it shows `Opened: true`

**To revert (get back Windows printing):**
1. Run Zadig again as Administrator
2. Select the same device
3. Choose the original driver (`usbprint`) or click **Install WCID Driver**
4. Or go to **Device Manager** → right-click printer → **Update driver** → **Browse my computer** → **Let me pick from a list** → select **USB Printing Support**

> ⚠️ **Why this happens:** Windows loads `usbprint.sys` when a printer-class USB device is plugged in. This kernel driver has exclusive access to the USB interface. WebUSB needs WinUSB instead, which allows user-space applications (like Chrome) to claim the interface. Zadig swaps the driver at the USB level — this is the official Microsoft-recommended approach for WinUSB.

### API

```ts
import {
  print,              // Print ESC/POS data
  requestUsbDevice,   // Show browser chooser → get device
  listUsbPrinters,    // List already-paired devices
  browseUsbDevice,    // Debug: show USB interface details
} from "universal-thermal-printer/web";

// Request device access (shows chooser dialog)
const device: { name: string; deviceId: string } = await requestUsbDevice();

// List devices already paired with this origin
const devices: { name: string; deviceId: string }[] = await listUsbPrinters();
```

### Using `print()`

```ts
const result: string = await print("usb", device.deviceId, sections, options?);
```

| Arg | Type | Description |
|-----|------|-------------|
| `type` | `"usb"` | Use WebUSB transport |
| `address` | `string` | Device ID from `requestUsbDevice()` or `listUsbPrinters()` |
| `sections` | `PrintSection[]` | ESC/POS sections |
| `options` | — | Not used for WebUSB |

### Auto-reconnect on page load

```ts
import { listUsbPrinters } from "universal-thermal-printer/web";

const paired = await listUsbPrinters();
if (paired.length > 0) {
  // Printer was previously paired — auto-connect
  await print("usb", paired[0].deviceId, sections);
}
```

## Web Serial

Some thermal printers use a USB-to-serial chip (CH340, CP2102, FTDI) and appear as virtual COM ports.  
Use Web Serial API to communicate with them.

```ts
import { print, requestSerialDevice, listSerialPrinters } from "universal-thermal-printer/web";

// Request serial port (shows browser chooser)
const device = await requestSerialDevice();

// Print
await print("serial", device.deviceId, [
  { type: "Init" },
  { type: "Text", value: "Hello from Web Serial!" },
  { type: "Cut" },
]);
```

### API

```ts
import {
  requestSerialDevice,  // Show browser chooser → get serial port
  listSerialPrinters,   // List previously granted serial ports
} from "universal-thermal-printer/web";

const device = await requestSerialDevice();
// { name: string, deviceId: string }
```

### Baud Rate

Web Serial transport uses **19200 baud** by default. Most thermal printers support this rate.  
If your printer uses a different rate, you'll need to modify the transport.

## Customer Display

Control serial customer-facing displays (pole displays, LCD customer displays) like Epson DM-D, Star SPCD, and POS-X.

```ts
import { requestSerialDevice, displayText, displayClear } from "universal-thermal-printer/web";

const device = await requestSerialDevice();

// Show two lines
await displayText(device.deviceId, {
  line1: "Total: $42.00",
  line2: "Thank you!",
  clear: true,         // clear display before writing (default: true)
  brightness: "normal", // "normal" | "dim" | "bright"
});

// Clear display
await displayClear(device.deviceId);
```

### API

```ts
// Update display text
displayText(deviceId: string, options: {
  line1: string;       // top line text (max ~20 chars)
  line2?: string;      // bottom line text (max ~20 chars)
  clear?: boolean;     // clear before write (default: true)
  brightness?: "normal" | "dim" | "bright";
}): Promise<string>

// Clear display
displayClear(deviceId: string): Promise<string>
```

### Command Set

Uses Epson DM-D compatible ESC/POS display commands:
- `0x0C` (FF) — clear display
- `ESC @` — reset
- `ESC L row col` — set cursor position (1-indexed)
- Plain text — write to current position

Most 2-line x 20-character pole displays are supported. Baud rate: **9600**.

## Weighing Scale

Read weight from USB-serial scales via Web Serial. Supports continuous stream mode and poll/request mode.

```ts
import { requestSerialDevice, scaleRead, scaleStartStream } from "universal-thermal-printer/web";

const device = await requestSerialDevice();

// One-time read (sends poll command, waits for response)
const reading = await scaleRead(device.deviceId, {
  baudRate: 9600,
  pollCommand: "W\r\n",   // command to request weight (varies by scale)
  timeout: 3000,          // ms to wait for response
});

console.log(reading);
// { weight: 1.500, unit: "kg", stable: true, raw: "S, +001.500kg" }

// Continuous stream (scale sends data periodically)
const stop = await scaleStartStream(device.deviceId, {
  onWeight: (r) => {
    console.log(`${r.weight} ${r.unit} ${r.stable ? "(stable)" : "(unstable)"}`);
  },
  onError: (err) => console.error(err),
}, { baudRate: 9600 });

// Later: stop the stream
await stop();
```

### API

```ts
// One-time weight reading
scaleRead(deviceId: string, options?: {
  baudRate?: number;       // default: 9600
  timeout?: number;        // default: 3000ms
  pollCommand?: string;    // default: "W\r\n"
}): Promise<WeightReading>

// Continuous weight stream
scaleStartStream(deviceId: string, callbacks: {
  onWeight: (reading: WeightReading) => void;
  onError?: (err: Error) => void;
}, options?: {
  baudRate?: number;
  pollCommand?: string;
}): Promise<() => Promise<void>>  // returns stop function
```

### WeightReading

```ts
interface WeightReading {
  weight: number;   // parsed weight value (e.g., 1.500)
  unit: string;     // "kg", "g", "lb", "oz"
  stable: boolean;  // true if scale reports stable reading
  raw: string;      // raw response from scale
}
```

### Supported Scale Protocols

| Format | Example | Scales |
|--------|---------|--------|
| CAS / Dibal | `S, +001.500kg` | CAS, Dibal, many POS scales |
| Mettler Toledo | `ST,GS,+0001.500kg` | Mettler Toledo |
| Simple | `   1.500 kg` | Generic scales in continuous mode |
| NCR | `S 1.500kg` | NCR scales |

### Common Poll Commands

| Scale Brand | Command |
|-------------|---------|
| CAS / Dibal | `W\r\n` |
| Mettler Toledo | `SI\r\n` or `\x05` (ENQ) |
| Generic | `W\r\n` or `\x05` |
| Continuous mode (no poll) | just wait for incoming data |

## HID Scale (WebHID)

Some USB scales support HID (Human Interface Device) mode — they appear as a HID device instead of a serial port. WebHID API allows reading weight data directly.

```ts
import { requestHidScale, hidScaleRead, hidScaleStartStream } from "universal-thermal-printer/web";

// Request HID scale (shows browser chooser)
const device = await requestHidScale();

// One-time read
const reading = await hidScaleRead(device.deviceId);
console.log(reading);
// { weight: 1.500, unit: "kg", stable: true, raw: [18, 0, 150, ...] }

// Continuous stream
const stop = await hidScaleStartStream(device.deviceId, {
  onWeight: (r) => console.log(`${r.weight} ${r.unit}`),
  onError: (err) => console.error(err),
});
```

### API

```ts
// List previously granted HID scales
listHidScales(): Promise<{ name, deviceId, vendorId, productId }[]>

// Request HID scale (browser chooser)
requestHidScale(filters?): Promise<{ name, deviceId, vendorId, productId }>

// One-time weight reading
hidScaleRead(deviceId, options?): Promise<HidWeightReading>

// Continuous HID input stream
hidScaleStartStream(deviceId, callbacks, options?): Promise<stopFunction>
```

### HID Weight Report Parsing

The transport attempts to parse common HID scale report formats:

| Byte(s) | Field |
|---------|-------|
| Byte 0 | Status (bit 0 = unstable) |
| Bytes 1-4 | Weight value (32-bit signed LE, ÷100 or ÷1000) |
| Byte 5 | Unit indicator (0x02=g, 0x03=lb, 0x04=oz) |

This covers most POS and industrial scales in HID mode. If your scale uses a different format, the `raw` field contains the unparsed byte array.

### HID vs Serial Scale

| Aspect | Serial Scale | HID Scale |
|--------|-------------|-----------|
| Chooser | Serial port picker | HID device picker |
| Baud rate | Configurable | Not needed (USB) |
| Data format | Text string | Binary report |
| Latency | Low | Very low |
| Common scales | CAS, Dibal, NCR | Mettler Toledo, some POS scales |

## Transport Comparison

| Feature | WebUSB | Web Serial | WebHID |
|---------|--------|------------|--------|
| Best for | Native USB printers | USB-serial printers + displays + scales | HID scales |
| Driver needed | WinUSB (Zadig) | None (built-in) | None (built-in) |
| Browser dialog | Device chooser | Serial port chooser | HID device chooser |

## Debugging

Use `browseUsbDevice()` to inspect USB interface details (class codes, endpoints):

```ts
import { browseUsbDevice } from "universal-thermal-printer/web";

const info = await browseUsbDevice();
console.log(info);
// Device: Virtual PRN (fe6:811e)
//   Serial: ... | Opened: false
//   Configuration #1
//     Interface #0 class=0x07 sub=1 proto=2
//       EP 1 dir=out size=64
//       EP 2 dir=in size=64
```

- `class=0x07` = Printer class (claimed by OS driver)
- `class=0xFF` = Vendor-specific (usually accessible via WebUSB)
- OUT endpoints = data sent to printer; IN endpoints = status responses

## Transport Comparison

| Feature | WebUSB | Web Serial |
|---------|--------|------------|
| Best for | Native USB printers | USB-serial printers (CH340/CP2102/FTDI) |
| Driver needed | WinUSB (Zadig on Windows) | None (built-in CDC driver) |
| OS conflict | Often blocked by `usbprint.sys` | Usually works out of box |
| Browser dialog | Device chooser | Serial port chooser |
| Speed | USB 1.1/2.0 full speed | Baud rate limited (19200+ typical) |

## Examples

### React + Vite

```tsx
import { useState, useEffect } from "react";
import { requestUsbDevice, print, listUsbPrinters } from "universal-thermal-printer/web";

export default function App() {
  const [device, setDevice] = useState<{ name: string; deviceId: string } | null>(null);

  useEffect(() => {
    listUsbPrinters().then(list => {
      if (list[0]) setDevice(list[0]);
    });
  }, []);

  return (
    <div>
      <button onClick={async () => setDevice(await requestUsbDevice())}>
        Connect Printer
      </button>
      <button onClick={async () => {
        if (!device) return;
        await print("usb", device.deviceId, [
          { type: "Init" },
          { type: "Text", value: "React + WebUSB!" },
          { type: "Cut" },
        ]);
      }}>
        Print
      </button>
    </div>
  );
}
```

### Vanilla JS (HTML)

```html
<script type="module">
import { requestUsbDevice, print } from "https://unpkg.com/universal-thermal-printer/web";

document.getElementById("connect").onclick = async () => {
  const device = await requestUsbDevice();
  document.getElementById("status").textContent = `Connected: ${device.name}`;
};

document.getElementById("print").onclick = async () => {
  await print("usb", device.deviceId, [
    { type: "Init" },
    { type: "Text", value: "Hello from the browser!" },
    { type: "Cut" },
  ]);
};
</script>
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Could not claim the printer interface` | OS driver has the interface | Use Zadig to install WinUSB (Windows) or remove from Printers & Scanners (macOS) |
| `Access denied` on `open()` | Device session stuck | Unplug and replug printer, or call `device.forget()` and re-pair |
| `WebUSB not supported` | Browser doesn't support WebUSB | Use Chrome/Edge 89+ on HTTPS/localhost |
| `Web Serial not supported` | Browser doesn't support Serial API | Use Chrome/Edge 89+ on HTTPS/localhost |
| Device shown as "Virtual PRN" | Manufacturer's virtual driver | Replace driver with WinUSB via Zadig |
| Print garbled or wrong | Wrong transport type | Use WebUSB for native USB printers, Web Serial for serial-based printers |
