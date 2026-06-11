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
