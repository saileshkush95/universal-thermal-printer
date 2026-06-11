import { buildEscPos, type PrintSection } from "./escpos.js";
import { runtime } from "./transport/detect.js";

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
  type: "network" | "bluetooth" | "usb",
  address: string,
  sections: PrintSection[],
  options?: PrintOptions
): Promise<string> {
  const format = options?.format ?? "thermal";
  const data = format === "a4"
    ? await importPdfBuilder(sections, options)
    : buildEscPos(sections);
  switch (type) {
    case "network": {
      const { sendToPrinter } = await importNetworkTcp();
      return await sendToPrinter(address, options?.port ?? 9100, data);
    }
    case "bluetooth": {
      const { printViaBluetooth, listBluetoothPrinters } = await importBluetooth();
      if (arguments.length === 1 && typeof address === "undefined") {
        return listBluetoothPrinters() as any;
      }
      return await printViaBluetooth(address, data);
    }
    case "usb": {
      const usb = await import("./transport/usb-expo.js");
      if (arguments.length === 1 && typeof address === "undefined") {
        return usb.listUsbPrinters() as any;
      }
      return await usb.printViaUsb(address, data);
    }
  }
}

async function importNetworkTcp() {
  const rt = runtime();
  if (rt === "expo") {
    const tcp = await import("react-native-tcp-socket");
    return {
      sendToPrinter: async (ip: string, port: number, data: Uint8Array) => {
        return new Promise<string>((resolve, reject) => {
          let settled = false;
          const client = tcp.createConnection(
            { host: ip, port, timeout: 10000 },
            () => {
              (client as any).write(data, undefined, (err?: Error) => {
                if (err) {
                  if (!settled) {
                    settled = true;
                    reject(`Failed to send data: ${err.message}`);
                  }
                  return;
                }
                client.end();
                if (!settled) {
                  settled = true;
                  resolve("Print job sent successfully");
                }
              });
            }
          );
          client.on("error", (err: Error) => {
            client.destroy();
            if (!settled) {
              settled = true;
              reject(`Failed to send data: ${err.message}`);
            }
          });
        });
      },
    };
  }
  throw new Error("TCP printing not available in this runtime");
}

async function importBluetooth() {
  const rt = runtime();
  if (rt === "expo") {
    const expo = await import("./transport/bluetooth-expo.js");
    return {
      printViaBluetooth: expo.printViaBluetooth,
      listBluetoothPrinters: expo.listBluetoothPrinters,
    };
  }
  throw new Error("Bluetooth printing not available in this runtime");
}

export async function listBluetoothPrinters(): Promise<{ name: string; address: string }[]> {
  const { listBluetoothPrinters: fn } = await importBluetooth();
  return fn();
}

export async function listUsbPrinters(): Promise<{ name: string; deviceId: string }[]> {
  const usb = await import("./transport/usb-expo.js");
  const devices = await usb.listUsbPrinters();
  return devices.map((d) => ({
    name: d.name,
    deviceId: `${d.vendorId}:${d.productId}`,
  }));
}

async function importPdfBuilder(
  sections: PrintSection[],
  options?: PrintOptions
): Promise<Uint8Array> {
  const { buildPdf } = await import("./pdf.js");
  return await buildPdf(sections, {
    pageSize: options?.pageSize,
    margins: options?.margins,
    title: options?.title,
  });
}
