import { buildEscPos, type PrintSection } from "./escpos.js";
import { runtime } from "./transport/detect.js";

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
    case "usb":
      throw new Error("USB printing is not available on React Native");
  }
}

async function importNetworkTcp() {
  const rt = runtime();
  if (rt === "expo") {
    const tcp = await import("react-native-tcp-socket");
    return {
      sendToPrinter: async (ip: string, port: number, data: Uint8Array) => {
        return new Promise<string>((resolve, reject) => {
          const client = tcp.createConnection(
            { host: ip, port, timeout: 5000 },
            () => {
              const payload = typeof Buffer !== "undefined"
                ? Buffer.from(data)
                : (data as any);
              client.write(payload);
              client.destroy();
              resolve("Print job sent successfully");
            }
          );
          client.on("error", (err: Error) => {
            client.destroy();
            reject(`Failed to send data: ${err.message}`);
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
  throw new Error("USB printing is not available on React Native");
}
