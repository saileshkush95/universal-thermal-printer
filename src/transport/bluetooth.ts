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
    const modName = "bluetooth" + "-serial-port";
    const mod = await import(modName);
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
    const modName = "bluetooth" + "-serial-port";
    mod = await import(modName);
  } catch {
    throw new Error(
      "Bluetooth requires 'bluetooth-serial-port'. Run: npm install bluetooth-serial-port"
    );
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const bt = new mod.default();
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { bt.close(); } catch {}
        reject(`Bluetooth operation timed out for ${address}`);
      }
    }, 10000);

    bt.findSerialPortChannel(address, (chanErr: any, channel: number) => {
      if (settled) return;
      if (chanErr) {
        settled = true;
        clearTimeout(timeout);
        reject(`Bluetooth find channel failed: ${chanErr.message || chanErr}`);
        return;
      }
      bt.connect(address, channel, (connErr: any) => {
        if (settled) return;
        if (connErr) {
          settled = true;
          clearTimeout(timeout);
          reject(`Bluetooth connect failed: ${connErr.message || connErr}`);
          return;
        }
        bt.write(Buffer.from(data), (writeErr: any) => {
          if (settled) return;
          if (writeErr) {
            settled = true;
            clearTimeout(timeout);
            bt.close();
            reject(`Bluetooth write failed: ${writeErr.message || writeErr}`);
            return;
          }
          setTimeout(() => {
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              bt.close();
              resolve("Print job sent successfully");
            }
          }, 500);
        });
      });
    });
  });
}
