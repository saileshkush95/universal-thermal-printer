import { buildEscPos, type PrintSection } from "./escpos.js";
import { sendToPrinter } from "./transport/tcp.js";
import { printViaBluetooth, listBluetoothPrinters } from "./transport/bluetooth.js";
import { printViaUsb, listUsbPrinters } from "./transport/usb.js";

export type { PrintSection };

export interface PrintOptions {
  port?: number;
  baudRate?: number;
}

export async function print(
  type: "network" | "bluetooth" | "usb",
  address: string,
  sections: PrintSection[],
  options?: PrintOptions
): Promise<string> {
  const data = buildEscPos(sections);
  switch (type) {
    case "network":
      return await sendToPrinter(address, options?.port ?? 9100, data);
    case "bluetooth":
      return await printViaBluetooth(address, data);
    case "usb":
      return await printViaUsb(address, data, options?.baudRate ?? 9600);
  }
}

export { listBluetoothPrinters, listUsbPrinters };
