import type { BleManager } from "react-native-ble-plx";

const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function chunk(data: Uint8Array, size: number): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }
  return chunks;
}

export async function listBluetoothPrinters(): Promise<
  { name: string; address: string }[]
> {
  const { BleManager } = await import("react-native-ble-plx");
  const manager = new BleManager();

  return new Promise((resolve, reject) => {
    const devices: { name: string; address: string }[] = [];
    const timeout = setTimeout(() => {
      manager.stopDeviceScan();
      resolve(devices);
    }, 5000);

    manager.startDeviceScan(
      null,
      null,
      (error, device) => {
        if (error) {
          clearTimeout(timeout);
          manager.stopDeviceScan();
          reject(error.message);
          return;
        }
        if (device && device.name) {
          devices.push({ name: device.name, address: device.id });
        }
      }
    );
  });
}

export async function printViaBluetooth(
  address: string,
  data: Uint8Array
): Promise<string> {
  const { BleManager } = await import("react-native-ble-plx");
  const manager = new BleManager();

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(`Bluetooth operation timed out for ${address}`);
      }
    }, 10000);

    (async () => {
      try {
        const device = await manager.connectToDevice(address);
        if (settled) return;
        await device.discoverAllServicesAndCharacteristics();
        if (settled) return;

        const chunks = chunk(data, 512);
        for (const c of chunks) {
          if (settled) return;
          const base64 = toBase64(c);
          await device.writeCharacteristicWithoutResponseForService(
            UART_SERVICE_UUID,
            UART_TX_CHAR_UUID,
            base64
          );
        }

        if (settled) return;
        await manager.cancelDeviceConnection(address);
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve("Print job sent successfully");
        }
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err instanceof Error ? err.message : String(err));
        }
      }
    })();
  });
}
