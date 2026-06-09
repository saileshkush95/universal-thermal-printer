# Bluetooth Transport

Print over Bluetooth — supports **Classic SPP** (Node.js/Bun) and **BLE** (Expo).

## Classic SPP (Node.js / Bun)

### Requirements

```bash
npm install bluetooth-serial-port
```
```bash
yarn add bluetooth-serial-port
```
```bash
bun add bluetooth-serial-port
```

### Usage

```typescript
import { print, listBluetoothPrinters } from "universal-thermal-printer";

// List paired devices
const devices = await listBluetoothPrinters();
console.log(devices);
// [{ name: "Printer", address: "00:11:22:33:44:55" }, ...]

// Print to a device
await print("bluetooth", "00:11:22:33:44:55", [
  { type: "Init" },
  { type: "Text", value: "Hello via Bluetooth!" },
  { type: "Cut" },
]);
```

### Address Format

Standard Bluetooth MAC address: `"00:11:22:33:44:55"`

### Discovery

`listBluetoothPrinters()` returns all paired SPP devices.  
Uses channel scanning to find the serial port channel.

## BLE (Expo)

### Requirements

```bash
npx expo install expo-ble
```

Configure in `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-ble", { "isBackgroundEnabled": true, "neverForLocation": true }]
    ]
  }
}
```

### Usage

```typescript
import { print, listBluetoothPrinters } from "universal-thermal-printer";

// Scan for BLE devices
const devices = await listBluetoothPrinters();

// Print
await print("bluetooth", deviceId, sections);
```

### BLE Details

- **Service UUID:** `6e400001-b5a3-f393-e0a9-e50e24dcca9e` (UART)
- **TX Characteristic UUID:** `6e400002-b5a3-f393-e0a9-e50e24dcca9e`
- Data is sent in 512-byte chunks
- Automatically connects, discovers services, writes, and disconnects

### Permissions

**iOS (`Info.plist`):**

```
NSBluetoothAlwaysUsageDescription
NSBluetoothPeripheralUsageDescription
```

**Android (`AndroidManifest.xml`):**

```
android.permission.BLUETOOTH
android.permission.BLUETOOTH_ADMIN
android.permission.BLUETOOTH_SCAN
android.permission.BLUETOOTH_CONNECT
```

### CLI

List devices:

```bash
node -e "import('universal-thermal-printer').then(m => m.listBluetoothPrinters().then(console.log))"
```

Print:

```bash
bun print.ts bluetooth "00:11:22:33:44:55"
```

```bash
npx thermal-print bluetooth "00:11:22:33:44:55"
```
