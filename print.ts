#!/usr/bin/env node
import { print } from "./src/index.ts";

const type = process.argv[2] || "network";
const address = process.argv[3] || "192.168.1.87";
const port = parseInt(process.argv[4], 10) || 9100;

print(type, address, [
  { type: "Init" },
  { type: "Align", value: "center" },
  { type: "Size", value: { width: 2, height: 2 } },
  { type: "Bold", value: true },
  { type: "Text", value: "STORE NAME" },
  { type: "Bold", value: false },
  { type: "Size", value: { width: 1, height: 1 } },
  { type: "Text", value: "123 Main Street" },
  { type: "Text", value: "City, State 12345" },
  { type: "Line" },
  { type: "Text", value: "Item 1 ........... $10.00" },
  { type: "Text", value: "Item 2 ........... $15.00" },
  { type: "Bold", value: true },
  { type: "Text", value: "Total ............ $25.00" },
  { type: "Bold", value: false },
  { type: "Line", value: "-" },
  { type: "Align", value: "center" },
  { type: "Qr", value: { data: "ORDER-12345", size: 6, error_correction: "M" } },
  { type: "Feed", value: 2 },
  { type: "Text", value: "Thank you!" },
  { type: "Feed", value: 3 },
  { type: "Cut" },
], { port }).then((r) => console.log(r)).catch((e) => console.error(e));



