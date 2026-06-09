# Contributing

Thanks for considering contributing to universal-thermal-printer!

## Development

```bash
git clone https://github.com/saileshkush95/universal-thermal-printer.git
cd universal-thermal-printer
bun install
bun run build
```

## Adding a new transport

1. Create `src/transport/<name>.ts`
2. Export `printVia<Name>` and optionally `list<Name>Printers`
3. Wire it into `src/index.ts`
4. Add the optional peer dependency to `package.json`

## Testing

Test with an actual printer or use the `print.ts` script:

```bash
bun print.ts network 192.168.1.87 9100
```

## Pull request

See `PULL_REQUEST_TEMPLATE.md` for the checklist.
