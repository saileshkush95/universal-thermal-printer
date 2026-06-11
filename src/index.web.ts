import { buildEscPos, type PrintSection } from "./escpos.js";

export type { PrintSection };

export interface PrintOptions {
  format?: "thermal" | "a4";
  pageSize?: "A4" | "Letter";
  margins?: number;
  title?: string;
}

export async function print(
  type: "usb" | "serial",
  address: string,
  sections: PrintSection[],
  _options?: PrintOptions
): Promise<string> {
  const data = buildEscPos(sections);
  if (type === "usb") {
    const { printViaUsb } = await import("./transport/usb-web.js");
    return await printViaUsb(address, data);
  }
  if (type === "serial") {
    const { printViaSerial } = await import("./transport/serial-web.js");
    return await printViaSerial(address, data);
  }
  throw new Error(`Print type "${type}" is not supported in the browser`);
}

export async function browseUsbDevice(): Promise<string> {
  const { browseUsbDevice: fn } = await import("./transport/usb-web.js");
  return await fn();
}

export async function listUsbPrinters(): Promise<
  { name: string; deviceId: string }[]
> {
  const { listUsbPrinters: fn } = await import("./transport/usb-web.js");
  const devices = await fn();
  return devices.map((d) => ({ name: d.name, deviceId: d.deviceId }));
}

export async function requestUsbDevice(
  filters?: { vendorId?: number; productId?: number }[]
): Promise<{ name: string; deviceId: string }> {
  const { requestDevice } = await import("./transport/usb-web.js");
  const device = await requestDevice(filters);
  return { name: device.name, deviceId: device.deviceId };
}

export async function listSerialPrinters(): Promise<
  { name: string; deviceId: string }[]
> {
  const { listSerialPrinters: fn } = await import("./transport/serial-web.js");
  const devices = await fn();
  return devices.map((d) => ({ name: d.name, deviceId: d.deviceId }));
}

export async function requestSerialDevice(): Promise<{
  name: string;
  deviceId: string;
}> {
  const { requestSerialPort: fn } = await import("./transport/serial-web.js");
  const device = await fn();
  return { name: device.name, deviceId: device.deviceId };
}
