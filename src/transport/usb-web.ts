interface WebUsbEndpoint {
  direction: "in" | "out";
  endpointNumber: number;
  packetSize: number;
}

interface WebUsbAlternate {
  endpoints: WebUsbEndpoint[];
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
}

interface WebUsbInterface {
  interfaceNumber: number;
  alternate: WebUsbAlternate;
}

interface WebUsbDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  serialNumber?: string;
  configuration: { configurationValue: number; interfaces: WebUsbInterface[] } | null;
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(n: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  releaseInterface(n: number): Promise<void>;
  transferOut(endpoint: number, data: Uint8Array): Promise<void>;
  reset(): Promise<void>;
  forget(): Promise<void>;
}

interface WebUsbRequestFilter {
  vendorId?: number;
  productId?: number;
}

interface WebUsb {
  getDevices(): Promise<WebUsbDevice[]>;
  requestDevice(filters: { filters?: WebUsbRequestFilter[] }): Promise<WebUsbDevice>;
}

export interface WebUsbDeviceInfo {
  deviceId: string;
  name: string;
  vendorId: number;
  productId: number;
}

export interface UsbInterfaceInfo {
  number: number;
  classCode: number;
  subclassCode: number;
  protocolCode: number;
  endpoints: { number: number; direction: string; packetSize: number }[];
}

export interface UsbDeviceDetail {
  vendorId: number;
  productId: number;
  productName?: string;
  serialNumber?: string;
  opened: boolean;
  configurations: {
    configurationValue: number;
    interfaces: UsbInterfaceInfo[];
  }[];
}

const deviceMap = new Map<string, WebUsbDevice>();

function getUsb(): WebUsb {
  const nav = navigator as { usb?: WebUsb };
  if (!nav.usb) {
    throw new Error("WebUSB not supported. Use Chrome/Edge on HTTPS or localhost.");
  }
  return nav.usb;
}

function makeDeviceId(d: WebUsbDevice): string {
  return d.serialNumber
    ? `${d.vendorId}:${d.productId}:${d.serialNumber}`
    : `${d.vendorId}:${d.productId}`;
}

function outInterfaces(device: WebUsbDevice): WebUsbInterface[] {
  if (!device.configuration) return [];
  return device.configuration.interfaces.filter((iface) =>
    iface.alternate.endpoints.some((ep) => ep.direction === "out")
  );
}

async function openAndClaim(device: WebUsbDevice): Promise<number> {
  if (!device.opened) {
    try {
      await device.open();
    } catch {
      // open may fail if device is already claimed by OS — proceed anyway
    }
  }
  if (device.configuration === null) {
    try {
      await device.selectConfiguration(1);
    } catch {
      /* may already be selected */
    }
  }
  const candidates = outInterfaces(device);
  if (candidates.length === 0) {
    throw new Error("No suitable USB interface with OUT endpoint found");
  }
  for (const iface of candidates) {
    try {
      await device.claimInterface(iface.interfaceNumber);
      return iface.interfaceNumber;
    } catch {
      continue;
    }
  }
  throw new Error(
    "Could not claim the printer interface. It may be in use by the OS."
  );
}

export async function getUsbDeviceInfo(device: WebUsbDevice): Promise<UsbDeviceDetail> {
  const configs: UsbDeviceDetail["configurations"] = [];
  if (device.configuration) {
    configs.push({
      configurationValue: device.configuration.configurationValue,
      interfaces: device.configuration.interfaces.map((iface) => ({
        number: iface.interfaceNumber,
        classCode: iface.alternate.interfaceClass,
        subclassCode: iface.alternate.interfaceSubclass,
        protocolCode: iface.alternate.interfaceProtocol,
        endpoints: iface.alternate.endpoints.map((ep) => ({
          number: ep.endpointNumber,
          direction: ep.direction,
          packetSize: ep.packetSize,
        })),
      })),
    });
  }
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName,
    serialNumber: device.serialNumber,
    opened: device.opened,
    configurations: configs,
  };
}

export async function browseUsbDevice(): Promise<string> {
  const usb = getUsb();
  const devices = await usb.getDevices();
  if (devices.length === 0) {
    return "No USB devices paired. Click Connect first.";
  }
  const lines: string[] = [];
  for (const dev of devices) {
    const info = await getUsbDeviceInfo(dev);
    lines.push(`Device: ${info.productName || "Unknown"} (${info.vendorId.toString(16)}:${info.productId.toString(16)})`);
    lines.push(`  Serial: ${info.serialNumber || "N/A"} | Opened: ${info.opened}`);
    for (const cfg of info.configurations) {
      lines.push(`  Configuration #${cfg.configurationValue}`);
      for (const iface of cfg.interfaces) {
        const cls = `0x${iface.classCode.toString(16).padStart(2, "0")}`;
        lines.push(`    Interface #${iface.number} class=${cls} sub=${iface.subclassCode} proto=${iface.protocolCode}`);
        for (const ep of iface.endpoints) {
          lines.push(`      EP ${ep.number} dir=${ep.direction} size=${ep.packetSize}`);
        }
      }
    }
  }
  return lines.join("\n");
}

export async function listUsbPrinters(): Promise<WebUsbDeviceInfo[]> {
  const usb = getUsb();
  const devices = await usb.getDevices();
  return devices.map((d) => ({
    deviceId: makeDeviceId(d),
    name: d.productName || `USB Device (${d.vendorId}:${d.productId})`,
    vendorId: d.vendorId,
    productId: d.productId,
  }));
}

export async function requestDevice(
  filters?: WebUsbRequestFilter[]
): Promise<WebUsbDeviceInfo> {
  const usb = getUsb();
  const device = await usb.requestDevice({ filters: filters || [] });
  try {
    await openAndClaim(device);
  } catch (err) {
    await device.close().catch(() => {});
    throw err;
  }
  const id = makeDeviceId(device);
  deviceMap.set(id, device);
  return {
    deviceId: id,
    name: device.productName || `USB Device (${device.vendorId}:${device.productId})`,
    vendorId: device.vendorId,
    productId: device.productId,
  };
}

async function getDevice(deviceId: string): Promise<{ device: WebUsbDevice; ifaceId: number }> {
  const cached = deviceMap.get(deviceId);
  if (cached && cached.opened) {
    const ifaces = outInterfaces(cached);
    if (ifaces.length > 0) {
      return { device: cached, ifaceId: ifaces[0].interfaceNumber };
    }
  }
  const usb = getUsb();
  const [vendorId, productId] = deviceId.split(":").map(Number);
  const devices = await usb.getDevices();
  const device = devices.find(
    (d) => d.vendorId === vendorId && d.productId === productId
  );
  if (!device) {
    throw new Error("Device not found. Call requestDevice() to grant access first.");
  }
  const ifaceId = await openAndClaim(device);
  deviceMap.set(deviceId, device);
  return { device, ifaceId };
}

export async function printViaUsb(
  deviceId: string,
  data: Uint8Array
): Promise<string> {
  const { device, ifaceId } = await getDevice(deviceId);
  const iface = device.configuration!.interfaces.find(
    (iface) => iface.interfaceNumber === ifaceId
  )!;
  const endpoint = iface.alternate.endpoints.find(
    (ep) => ep.direction === "out"
  )!;
  const maxPacketSize = endpoint.packetSize || 64;
  let offset = 0;
  while (offset < data.length) {
    const chunk = data.slice(offset, offset + maxPacketSize);
    await device.transferOut(endpoint.endpointNumber, chunk);
    offset += chunk.length;
  }
  return "Print job sent successfully via WebUSB";
}
