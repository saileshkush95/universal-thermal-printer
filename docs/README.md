# universal-thermal-printer

Cross-platform thermal printer library for Node.js, Bun, and React Native (Expo).  
Supports **Network (TCP)**, **Bluetooth (SPP + BLE)**, **USB (serial + system spooler)**, and **OS print spooler** transports.

## Features

| Transport | Node.js | Bun | Expo Android | Expo iOS |
|-----------|---------|-----|-------------|----------|
| Network (TCP) | built-in `net` | built-in `net` | `react-native-tcp-socket` | `react-native-tcp-socket` |
| Bluetooth (SPP) | `bluetooth-serial-port` | `bluetooth-serial-port` | — | — |
| Bluetooth (BLE) | — | — | `expo-ble` | `expo-ble` |
| USB (serial) | `serialport` | `serialport` | — | — |
| USB (system printer) | winspool / CUPS | winspool / CUPS | — | — |
| USB (native Android) | — | — | Built-in native module | — |
| OS Print Spooler | winspool / CUPS | winspool / CUPS | — | — |

## Documentation

- [Getting Started](getting-started.md) — Installation, quick start, basic usage
- [Network (TCP)](network.md) — Print over Ethernet/WiFi
- [Bluetooth](bluetooth.md) — Print via Bluetooth SPP or BLE
- [USB](usb.md) — Print via USB serial or system printer
- [Spooler](spooler.md) — Print via OS print spooler (Windows/CUPS)
- [ESC/POS Reference](escpos.md) — All supported print sections and commands
- [CLI](cli.md) — Command-line interface
- [React Native / Expo](expo.md) — Mobile printing setup
- [Android Native Module](android.md) — USB native module internals
