# CLI

The package provides a `thermal-print` CLI binary for quick testing.

## Installation

```bash
npm install -g universal-thermal-printer
```
```bash
yarn global add universal-thermal-printer
```
```bash
bun add -g universal-thermal-printer
```

Or use via `npx` (no install required):

```bash
npx thermal-print <type> <address> <port>
```

## Usage

```
thermal-print [type] [address] [port]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `type` | `"network"` | `"network"`, `"bluetooth"`, `"usb"`, `"spooler"` |
| `address` | `"192.168.1.87"` | IP, MAC, device path, or printer name |
| `port` | `9100` | TCP port (network only) |

## Examples

```bash
# Network printer
npx thermal-print network 192.168.1.100 9100

# USB serial port
npx thermal-print usb COM3

# USB system printer
npx thermal-print usb "POS80 Printer"

# Bluetooth
npx thermal-print bluetooth "00:11:22:33:44:55"

# System spooler
npx thermal-print spooler "POS80 Printer"
```

## What It Prints

Sends a sample receipt with:

| Section | Value |
|---------|-------|
| Init | Reset printer |
| Align | Center |
| Size | 2x width, 2x height |
| Bold | On |
| Text | "STORE NAME" |
| Bold | Off |
| Size | 1x width, 1x height |
| Text | "123 Main Street" |
| Text | "City, State 12345" |
| Line | Horizontal rule |
| Text | "Item 1 ........... $10.00" |
| Text | "Item 2 ........... $15.00" |
| Text | "Total ............ $25.00" |
| Line | "-" rule |
| Align | Center |
| Qr | QR with "ORDER-12345" |
| Feed | 2 lines |
| Text | "Thank you!" |
| Feed | 5 lines |
| Cut | Full cut |

## Demo Script

The root `print.ts` script is equivalent to the CLI and accepts the same arguments:

```bash
bun print.ts network 192.168.1.100
```

```bash
bun print.ts usb "POS80 Printer"
```

```bash
node --experimental-strip-types print.ts spooler "POS80 Printer"
```
