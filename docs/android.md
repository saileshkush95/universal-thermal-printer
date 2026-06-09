# Android Native USB Module

The package includes a native Android module for direct USB printing.  
Located in the `android/` directory.

## Architecture

```
android/
├── build.gradle
└── src/main/java/com/universalthermalprinter/
    ├── UsbPrinterModule.java   — Native module (name: "UniversalThermalUsb")
    └── UsbPrinterPackage.java  — ReactPackage registration
```

## Module: UniversalThermalUsb

### Methods

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `listDevices` | — | `Promise<WritableArray>` | Lists USB devices with `deviceId`, `name`, `vendorId`, `productId` |
| `requestPermission` | `vendorId: int, productId: int` | `Promise<boolean>` | Request USB permission via `PendingIntent` |
| `connect` | `vendorId: int, productId: int` | `Promise<boolean>` | Open device, claim interface, find bulk OUT endpoint |
| `write` | `base64Data: string` | `Promise<number>` | Send base64-encoded data via `bulkTransfer` |
| `disconnect` | — | `Promise<boolean>` | Release interface, close device |

### Internal Flow

```
listDevices → finds all USB devices with printer interface
requestPermission → shows system dialog
connect(vendorId, productId) →
  ├── findDevice(vid, pid)
  ├── findPrinterInterface(device) → class 0x07 or interface with bulk OUT
  ├── claimInterface(iface, force=true)
  └── findBulkOutEndpoint(iface)
write(base64Data) →
  ├── decodeBase64(base64Data)
  └── bulkTransfer(endpoint, rawBytes, rawBytes.length, 10000)
disconnect →
  ├── releaseInterface()
  └── close()
```

### build.gradle

```groovy
namespace = "com.universalthermalprinter"
compileSdk = 34
minSdk = 24
targetSdk = 34
javaVersion = JavaVersion.VERSION_11
dependencies: com.facebook.react:react-android
```

## Config Plugin

Path: `plugin/withUsbPrinter.js`

Adds `android.hardware.usb.host` (non-required) to `AndroidManifest.xml`.

```json
{
  "expo": {
    "plugins": ["universal-thermal-printer/plugin/withUsbPrinter"]
  }
}
```

## Device Detection Logic

`findPrinterInterface(device)` searches for:

1. Interface with class `USB_CLASS_PRINTER` (0x07)
2. Fallback: any interface with a bulk OUT endpoint

`findBulkOutEndpoint(iface)` finds:
- Endpoint with `USB_ENDPOINT_XFER_BULK` + `USB_DIR_OUT`

## USB Address Format

Expo USB uses `"vendorId:productId"` format:

```typescript
const address = "10473:528";  // vendorId:productId
```

## Requirements

- **Android only** — throws on iOS
- **USB Host mode** — device must support OTG
- **Development build** — not available in Expo Go
- **API 24+** (Android 7.0)

## Testing USB Printers

```typescript
import { listUsbPrinters, print } from "universal-thermal-printer";

const devices = await listUsbPrinters();
console.log(devices);
// [{ deviceId: "10473:528", name: "POS Printer", vendorId: 10473, productId: 528 }]

await print("usb", "10473:528", [
  { type: "Init" },
  { type: "Text", value: "Hello from Android USB!" },
  { type: "Cut" },
]);
```
