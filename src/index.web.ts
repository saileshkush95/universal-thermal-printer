import { buildEscPos, type PrintSection } from "./escpos.js";

export type { PrintSection };

export interface PrintOptions {
  format?: "thermal" | "a4";
  pageSize?: "A4" | "Letter";
  margins?: number;
  title?: string;
}

// ─── Print ─────────────────────────────────────────────────────────

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

// ─── WebUSB ────────────────────────────────────────────────────────

export async function browseUsbDevice(): Promise<string> {
  const { browseUsbDevice: fn } = await import("./transport/usb-web.js");
  return await fn();
}

export async function listUsbPrinters(): Promise<{ name: string; deviceId: string }[]> {
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

// ─── Web Serial (shared) ───────────────────────────────────────────

export async function listSerialPrinters(): Promise<{ name: string; deviceId: string }[]> {
  const { listSerialPrinters: fn } = await import("./transport/serial-web.js");
  const devices = await fn();
  return devices.map((d) => ({ name: d.name, deviceId: d.deviceId }));
}

export async function requestSerialDevice(): Promise<{ name: string; deviceId: string }> {
  const { requestSerialPort: fn } = await import("./transport/serial-web.js");
  const device = await fn();
  return { name: device.name, deviceId: device.deviceId };
}

// ─── Customer Display ──────────────────────────────────────────────

export type { DisplayOptions } from "./transport/serial-web.js";

export async function displayText(
  deviceId: string,
  options: { line1: string; line2?: string; clear?: boolean; brightness?: "normal" | "dim" | "bright" }
): Promise<string> {
  const { displayText: fn } = await import("./transport/serial-web.js");
  return await fn(deviceId, options);
}

export async function displayClear(deviceId: string): Promise<string> {
  const { displayClear: fn } = await import("./transport/serial-web.js");
  return await fn(deviceId);
}

// ─── Weighing Scale ────────────────────────────────────────────────

export type { WeightReading, ScaleOptions, ScaleStreamCallbacks } from "./transport/serial-web.js";

export async function scaleRead(
  deviceId: string,
  options?: { baudRate?: number; timeout?: number; pollCommand?: string }
): Promise<import("./transport/serial-web.js").WeightReading> {
  const { scaleRead: fn } = await import("./transport/serial-web.js");
  return await fn(deviceId, options);
}

export async function scaleStartStream(
  deviceId: string,
  callbacks: import("./transport/serial-web.js").ScaleStreamCallbacks,
  options?: import("./transport/serial-web.js").ScaleOptions
): Promise<() => Promise<void>> {
  const { scaleStartStream: fn } = await import("./transport/serial-web.js");
  return await fn(deviceId, callbacks, options);
}

// ─── HID Scale ─────────────────────────────────────────────────────

export type { HidWeightReading } from "./transport/hid-web.js";

export async function listHidScales(): Promise<{ name: string; deviceId: string; vendorId: number; productId: number }[]> {
  const { listHidScales: fn } = await import("./transport/hid-web.js");
  return await fn();
}

export async function requestHidScale(
  filters?: { vendorId?: number; productId?: number; usagePage?: number; usage?: number }[]
): Promise<{ name: string; deviceId: string; vendorId: number; productId: number }> {
  const { requestHidScale: fn } = await import("./transport/hid-web.js");
  return await fn(filters);
}

export async function hidScaleRead(
  deviceId: string,
  options?: { timeout?: number; reportId?: number }
): Promise<import("./transport/hid-web.js").HidWeightReading> {
  const { hidScaleRead: fn } = await import("./transport/hid-web.js");
  return await fn(deviceId, options);
}

export async function hidScaleStartStream(
  deviceId: string,
  callbacks: { onWeight: (reading: import("./transport/hid-web.js").HidWeightReading) => void; onError?: (err: Error) => void },
  options?: { reportId?: number }
): Promise<() => Promise<void>> {
  const { hidScaleStartStream: fn } = await import("./transport/hid-web.js");
  return await fn(deviceId, callbacks, options);
}
