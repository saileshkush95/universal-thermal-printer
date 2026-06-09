# Network (TCP) Transport

Print over Ethernet or WiFi using TCP (typically port `9100` for ESC/POS printers).

## Usage

```typescript
import { print } from "universal-thermal-printer";

await print("network", "192.168.1.100", [
  { type: "Init" },
  { type: "Text", value: "Hello from network!" },
  { type: "Cut" },
], { port: 9100 });
```

## Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `address` | `string` | — | Printer IP address |
| `options.port` | `number` | `9100` | TCP port |

## Backend Selection

| Runtime | Backend | Package |
|---------|---------|---------|
| Node.js | built-in `net` module | (none required) |
| Bun | built-in `net` module | (none required) |
| Expo | `react-native-tcp-socket` | `npx expo install react-native-tcp-socket` |

## Timeout

Connection attempt times out after 5 seconds.

## CLI

```bash
bun print.ts network 192.168.1.100 9100
```

```bash
npx thermal-print network 192.168.1.100 9100
```

```bash
# If installed globally
thermal-print network 192.168.1.100 9100
```

## Error Handling

- Connection refused or timeout → throws descriptive error
- Write failure → throws `Network write failed`
