interface HidDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  collections: {
    usage: number;
    usagePage: number;
    inputReports: { reportId: number }[];
    outputReports: { reportId: number }[];
    featureReports: { reportId: number }[];
  }[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: Uint8Array): Promise<void>;
  sendFeatureReport(reportId: number, data: Uint8Array): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
  oninputreport: ((event: { reportId: number; data: DataView; device: HidDevice }) => void) | null;
}

interface Hid {
  getDevices(): Promise<HidDevice[]>;
  requestDevice(filters: { vendorId?: number; productId?: number; usagePage?: number; usage?: number }[]): Promise<HidDevice[]>;
  onconnect: ((event: { device: HidDevice }) => void) | null;
  ondisconnect: ((event: { device: HidDevice }) => void) | null;
}

function getHid(): Hid {
  const nav = navigator as { hid?: Hid };
  if (!nav.hid) {
    throw new Error("WebHID not supported. Use Chrome/Edge 89+ on HTTPS or localhost.");
  }
  return nav.hid;
}

export interface HidDeviceInfo {
  deviceId: string;
  name: string;
  vendorId: number;
  productId: number;
}

const deviceMap = new Map<string, HidDevice>();

function makeId(d: HidDevice): string {
  return `${d.vendorId}:${d.productId}`;
}

export async function listHidScales(): Promise<HidDeviceInfo[]> {
  const hid = getHid();
  const devices = await hid.getDevices();
  return devices.map((d) => ({
    deviceId: makeId(d),
    name: d.productName || `HID Device (${d.vendorId.toString(16)}:${d.productId.toString(16)})`,
    vendorId: d.vendorId,
    productId: d.productId,
  }));
}

export async function requestHidScale(
  filters?: { vendorId?: number; productId?: number; usagePage?: number; usage?: number }[]
): Promise<HidDeviceInfo> {
  const hid = getHid();
  const devices = await hid.requestDevice(
    filters || [{ usagePage: 0x0001 }] // Generic Desktop Controls (common for scales)
  );
  if (devices.length === 0) throw new Error("No device selected");
  const device = devices[0];
  const id = makeId(device);
  deviceMap.set(id, device);
  return {
    deviceId: id,
    name: device.productName || `HID Device (${device.vendorId.toString(16)}:${device.productId.toString(16)})`,
    vendorId: device.vendorId,
    productId: device.productId,
  };
}

export interface HidWeightReading {
  weight: number;
  unit: string;
  stable: boolean;
  raw: number[];
}

function parseHidWeight(data: DataView): HidWeightReading | null {
  const bytes: number[] = [];
  for (let i = 0; i < data.byteLength; i++) {
    bytes.push(data.getUint8(i));
  }

  // Common HID scale report formats:
  // Byte 0: status (bit 0 = stable, bit 1 = zero, bit 6 = unit)
  // Byte 1-2 or 1-4: weight value (usually signed 16-bit or 32-bit in 0.01 or 0.001 units)
  // Subsequent bytes: unit, tare, etc.

  if (bytes.length < 3) return null;

  const status = bytes[0];
  const stable = !(status & 0x01); // bit 0 often = not stable

  // Try to parse weight from different positions
  let rawWeight = 0;
  let divisor = 100; // default: 0.01 resolution

  if (bytes.length >= 6) {
    // Common 6-byte format: status(1) + weight(4 little-endian) + unit(1)
    rawWeight = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
    divisor = bytes[5] === 0x02 ? 1000 : 100;
  } else if (bytes.length >= 3) {
    // Compact 3-byte format: status(1) + weight(2 little-endian)
    rawWeight = bytes[1] | (bytes[2] << 8);
    divisor = 100;
  }

  const weight = rawWeight / divisor;

  // Determine unit from status or fixed byte
  let unit = "kg";
  if (bytes.length >= 6) {
    const unitByte = bytes[5];
    if (unitByte === 0x03 || unitByte === 0x0B) unit = "lb";
    else if (unitByte === 0x04 || unitByte === 0x0C) unit = "oz";
    else if (unitByte === 0x02) unit = "g";
  }

  return { weight, unit, stable, raw: bytes };
}

export async function hidScaleRead(
  deviceId: string,
  options?: { timeout?: number; reportId?: number }
): Promise<HidWeightReading> {
  let device = deviceMap.get(deviceId);
  if (!device) {
    const hid = getHid();
    const devices = await hid.getDevices();
    device = devices.find((d) => makeId(d) === deviceId);
    if (!device) throw new Error("HID device not found. Call requestHidScale() first.");
    deviceMap.set(deviceId, device);
  }

  if (!device.opened) await device.open();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("HID scale read timeout")), options?.timeout || 3000);

    device!.oninputreport = (event) => {
      const parsed = parseHidWeight(event.data);
      if (parsed) {
        clearTimeout(timeout);
        device!.oninputreport = null;
        resolve(parsed);
      }
    };
  });
}

export async function hidScaleStartStream(
  deviceId: string,
  callbacks: {
    onWeight: (reading: HidWeightReading) => void;
    onError?: (err: Error) => void;
  },
  _options?: { reportId?: number }
): Promise<() => Promise<void>> {
  let device = deviceMap.get(deviceId);
  if (!device) {
    const hid = getHid();
    const devices = await hid.getDevices();
    device = devices.find((d) => makeId(d) === deviceId);
    if (!device) throw new Error("HID device not found. Call requestHidScale() first.");
    deviceMap.set(deviceId, device);
  }

  if (!device.opened) await device.open();

  device.oninputreport = (event) => {
    const parsed = parseHidWeight(event.data);
    if (parsed) {
      try { callbacks.onWeight(parsed); } catch { /* ignore */ }
    }
  };

  return async () => {
    if (device) {
      device.oninputreport = null;
      try { await device.close(); } catch { /* ignore */ }
    }
  };
}
