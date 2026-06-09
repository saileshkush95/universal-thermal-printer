import type { BleManager } from "expo-ble";

const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

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
  const { BleManager } = await import("expo-ble");
  const manager = new BleManager();
  const devices = await manager.scan([]);
  return devices.map((d) => ({
    name: d.name || "Unknown",
    address: d.id,
  }));
}

export async function printViaBluetooth(
  address: string,
  data: Uint8Array
): Promise<string> {
  const { BleManager } = await import("expo-ble");
  const manager = new BleManager();

  let device: import("expo-ble").BleDevice;
  try {
    device = await manager.connect(address);
  } catch {
    const devices = await manager.scan([]);
    const found = devices.find((d) => d.id === address);
    if (!found) throw new Error("Device not found");
    device = await manager.connect(found.id);
  }

  const service = await device.discoverService(UART_SERVICE_UUID);
  const txChar = await service.discoverCharacteristic(UART_TX_CHAR_UUID);

  const chunks = chunk(data, 512);
  for (const c of chunks) {
    await txChar.write(c.buffer as ArrayBuffer, false);
  }

  await manager.disconnect(address);
  return "Print job sent successfully";
}
