# React Native / Expo

Use `universal-thermal-printer` in Expo or React Native apps for mobile printing.

## Installation

```bash
npx expo install universal-thermal-printer
```

Optional transports:

```bash
npx expo install react-native-tcp-socket
npx expo install expo-ble
```

For bare React Native:

```bash
npm install universal-thermal-printer
```
```bash
yarn add universal-thermal-printer
```
```bash
bun add universal-thermal-printer
```

Then install native deps:

```bash
npx expo install react-native-tcp-socket expo-ble
cd ios && pod install
```

## Entry Point

The package has a separate entry point for React Native (`index.rn.js`).  
The export map handles this automatically — just import normally:

```typescript
import { print } from "universal-thermal-printer";
```

## Available Transports

| Transport | Android | iOS | Package |
|-----------|---------|-----|---------|
| Network (TCP) | ✅ | ✅ | `react-native-tcp-socket` |
| Bluetooth (BLE) | ✅ | ✅ | `expo-ble` |
| USB (native) | ✅ | ❌ | Built-in |
| USB (serial) | ❌ | ❌ | — |
| Spooler | ❌ | ❌ | — |

## Expo Config Plugin

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      ["expo-ble", {
        "isBackgroundEnabled": true,
        "neverForLocation": true
      }],
      "universal-thermal-printer/plugin/withUsbPrinter"
    ]
  }
}
```

The USB plugin adds `android.hardware.usb.host` feature to `AndroidManifest.xml`.

## Development Build Required

These transports require a native development build (`npx expo run:android` / `npx expo run:ios`).  
They do **not** work in Expo Go.

## Network Printing

```typescript
import { print } from "universal-thermal-printer";

await print("network", "192.168.1.100", [
  { type: "Init" },
  { type: "Text", value: "Hello from mobile!" },
  { type: "Cut" },
], { port: 9100 });
```

Uses `react-native-tcp-socket` on both Android and iOS.

## Bluetooth BLE Printing

```typescript
import { print, listBluetoothPrinters } from "universal-thermal-printer";

// Scan for BLE printers
const devices = await listBluetoothPrinters();

// Print
await print("bluetooth", devices[0].address, [
  { type: "Init" },
  { type: "Text", value: "Hello via BLE!" },
  { type: "Cut" },
]);
```

Uses `expo-ble` with UART service UUID `6e400001-b5a3-f393-e0a9-e50e24dcca9e`.  
Data is sent in 512-byte chunks.

### BLE Permissions

**iOS (`Info.plist`):**

```
NSBluetoothAlwaysUsageDescription
NSBluetoothPeripheralUsageDescription
```

**Android (included via config plugin):**

```
android.permission.BLUETOOTH
android.permission.BLUETOOTH_ADMIN
android.permission.BLUETOOTH_SCAN
android.permission.BLUETOOTH_CONNECT
android.permission.BLUETOOTH_ADVERTISE
```

## USB Printing (Android Only)

```typescript
import { print, listUsbPrinters } from "universal-thermal-printer";

// List connected USB devices
const devices = await listUsbPrinters();
// [{ name: "POS Printer", deviceId: "10473:528" }, ...]

// Request permission (auto-handled by library)
// Print via USB
await print("usb", "10473:528", [
  { type: "Init" },
  { type: "Text", value: "Hello via USB!" },
  { type: "Cut" },
]);
```

USB address format on Expo Android is `"vendorId:productId"`.

The native module:
1. Requests USB permission via `PendingIntent`
2. Finds the printer interface (class 0x07 or bulk OUT endpoint)
3. Claims exclusive access
4. Sends data via `bulkTransfer` (10s timeout)
5. Releases interface on completion

### Android USB Limitations

- Android only (not iOS)
- Requires USB OTG cable
- Device must support USB Host mode
- Development build required (not Expo Go)

## Example Component

```tsx
import React, { useEffect, useState } from "react";
import { View, Button, FlatList } from "react-native";
import { print, listBluetoothPrinters } from "universal-thermal-printer";

export default function PrintScreen() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    listBluetoothPrinters().then(setDevices).catch(console.error);
  }, []);

  const printReceipt = async (address: string) => {
    await print("bluetooth", address, [
      { type: "Init" },
      { type: "Align", value: "center" },
      { type: "Bold", value: true },
      { type: "Text", value: "MOBILE RECEIPT" },
      { type: "Bold", value: false },
      { type: "Feed", value: 2 },
      { type: "Cut" },
    ]);
  };

  return (
    <View>
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <Button title={item.name} onPress={() => printReceipt(item.address)} />
        )}
      />
    </View>
  );
}
```
