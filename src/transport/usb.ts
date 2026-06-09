import { runtime } from "./detect.js";

export async function listUsbPrinters(): Promise<
  { name: string; deviceId: string }[]
> {
  const rt = runtime();

  if (rt === "expo") {
    throw new Error(
      "USB printing is not available on Expo/React Native"
    );
  }

  try {
    const modName = "serial" + "port";
    const { SerialPort } = await import(modName);
    const ports = await SerialPort.list();
    return ports.map((p: any) => ({
      name: p.manufacturer
        ? `${p.manufacturer} ${p.productId || ""}`.trim()
        : p.path,
      deviceId: p.path,
    }));
  } catch {
    throw new Error(
      "USB printing requires 'serialport'. Run: npm install serialport"
    );
  }
}

export async function printViaUsb(
  deviceId: string,
  data: Uint8Array,
  baudRate: number = 9600
): Promise<string> {
  const rt = runtime();

  if (rt === "expo") {
    throw new Error(
      "USB printing is not available on Expo/React Native"
    );
  }

  let SerialPort: any;
  try {
    const modName = "serial" + "port";
    SerialPort = (await import(modName)).SerialPort;
  } catch {
    throw new Error(
      "USB printing requires 'serialport'. Run: npm install serialport"
    );
  }

  return new Promise((resolve, reject) => {
    const port = new SerialPort({ path: deviceId, baudRate }, (err: any) => {
      if (err) {
        reject(`USB open failed: ${err.message}`);
        return;
      }
      port.write(Buffer.from(data), (writeErr: any) => {
        if (writeErr) {
          port.close();
          reject(`USB write failed: ${writeErr.message}`);
          return;
        }
        port.drain(() => {
          port.close();
          resolve("Print job sent successfully");
        });
      });
    });
  });
}
