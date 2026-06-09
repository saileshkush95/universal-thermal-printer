import { runtime } from "./detect.js";

export async function listBluetoothPrinters(): Promise<
  { name: string; address: string }[]
> {
  const rt = runtime();

  if (rt === "expo") {
    const expo = await import("./bluetooth-expo.js");
    return expo.listBluetoothPrinters();
  }

  try {
    const mod = await import("bluetooth-serial-port");
    return new Promise((resolve) => {
      const bt = new mod.default();
      bt.listPairedDevices((err: any, devices: any[]) => {
        if (err || !devices) {
          resolve([]);
          return;
        }
        resolve(
          devices.map((d: any) => ({
            name: d.name || "Unknown",
            address: d.address || "",
          }))
        );
      });
    });
  } catch {
    throw new Error(
      "Bluetooth requires 'bluetooth-serial-port'. Run: npm install bluetooth-serial-port"
    );
  }
}

export async function printViaBluetooth(
  address: string,
  data: Uint8Array
): Promise<string> {
  const rt = runtime();

  if (rt === "expo") {
    const expo = await import("./bluetooth-expo.js");
    return expo.printViaBluetooth(address, data);
  }

  let mod: any;
  try {
    mod = await import("bluetooth-serial-port");
  } catch {
    throw new Error(
      "Bluetooth requires 'bluetooth-serial-port'. Run: npm install bluetooth-serial-port"
    );
  }

  return new Promise((resolve, reject) => {
    const bt = new mod.default();
    bt.findSerialPortChannel(address, (chanErr: any, channel: number) => {
      if (chanErr) {
        reject(`Bluetooth find channel failed: ${chanErr.message || chanErr}`);
        return;
      }
      bt.connect(address, channel, (connErr: any) => {
        if (connErr) {
          reject(`Bluetooth connect failed: ${connErr.message || connErr}`);
          return;
        }
        bt.write(Buffer.from(data), (writeErr: any) => {
          if (writeErr) {
            bt.close();
            reject(`Bluetooth write failed: ${writeErr.message || writeErr}`);
            return;
          }
          setTimeout(() => {
            bt.close();
            resolve("Print job sent successfully");
          }, 500);
        });
      });
    });
  });
}
