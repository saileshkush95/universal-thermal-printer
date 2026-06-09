# Support

## Documentation

See the [README](https://github.com/saileshkush95/universal-thermal-printer#readme)
for usage examples and API reference.

## Issues

- **Bug reports** — open a [bug report](https://github.com/saileshkush95/universal-thermal-printer/issues/new?labels=bug&template=bug_report.md)
- **Feature requests** — open a [feature request](https://github.com/saileshkush95/universal-thermal-printer/issues/new?labels=enhancement&template=feature_request.md)

## Common questions

### Bluetooth isn't working

Ensure `bluetooth-serial-port` is installed and your printer is paired:

```bash
npm install bluetooth-serial-port
```

### USB isn't working

Ensure `serialport` is installed:

```bash
npm install serialport
```

### `net` module not found

This package requires Node.js 18+ for TCP printing. The `net` module is built-in.
