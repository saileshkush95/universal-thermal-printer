import { buildEscPos, type PrintSection } from "./escpos.js";
import { sendToPrinter } from "./transport/tcp.js";
import { printViaBluetooth, listBluetoothPrinters } from "./transport/bluetooth.js";
import { printViaUsb, listUsbPrinters } from "./transport/usb.js";
import { printViaSpooler, listSpoolerPrinters } from "./transport/spooler.js";
import { listNetworkPrinters } from "./transport/network-discovery.js";
import type { PdfOptions } from "./pdf.js";

export type { PrintSection };

export interface PrintOptions {
  port?: number;
  baudRate?: number;
  format?: "thermal" | "a4";
  pageSize?: "A4" | "Letter";
  margins?: number;
  title?: string;
}

export async function print(
  type: "network" | "bluetooth" | "usb" | "spooler",
  address: string,
  sections: PrintSection[],
  options?: PrintOptions
): Promise<string> {
  const format = options?.format ?? "thermal";
  const data = format === "a4"
    ? await importPdf(sections, options)
    : buildEscPos(sections);
  switch (type) {
    case "network":
      return await sendToPrinter(address, options?.port ?? 9100, data);
    case "bluetooth":
      return await printViaBluetooth(address, data);
    case "usb":
      return await printViaUsb(address, data, options?.baudRate ?? 9600);
    case "spooler":
      return await printViaSpooler(address, data);
  }
}

export { listBluetoothPrinters, listUsbPrinters, listSpoolerPrinters, listNetworkPrinters };

async function importPdf(
  sections: PrintSection[],
  options?: PrintOptions
): Promise<Uint8Array> {
  try {
    const { buildPdf } = await import("./pdf.js");
    return await buildPdf(sections, {
      pageSize: options?.pageSize,
      margins: options?.margins,
      title: options?.title,
    });
  } catch {
    throw new Error(
      'A4/PDF printing requires pdf-lib. Install it with: npm install pdf-lib'
    );
  }
}
