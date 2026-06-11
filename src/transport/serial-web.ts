interface SerialPort {
  readable: ReadableStream | null;
  writable: WritableStream | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
}

interface SerialRequestFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface Serial {
  getPorts(): Promise<SerialPort[]>;
  requestPort(filters: { filters?: SerialRequestFilter[] }): Promise<SerialPort>;
}

function getSerial(): Serial {
  const nav = navigator as { serial?: Serial };
  if (!nav.serial) {
    throw new Error(
      "Web Serial not supported. Use Chrome/Edge on HTTPS or localhost."
    );
  }
  return nav.serial;
}

export interface SerialDeviceInfo {
  deviceId: string;
  name: string;
}

const portMap = new Map<string, SerialPort>();

export async function listSerialPrinters(): Promise<SerialDeviceInfo[]> {
  const serial = getSerial();
  const ports = await serial.getPorts();
  return ports.map((p, i) => {
    const info = p.getInfo();
    const id = info.usbVendorId
      ? `${info.usbVendorId}:${info.usbProductId}:${i}`
      : `serial:${i}`;
    return {
      deviceId: id,
      name: info.usbVendorId
        ? `Serial Printer (${info.usbVendorId.toString(16)}:${info.usbProductId?.toString(16)})`
        : "Serial Printer",
    };
  });
}

export async function requestSerialPort(): Promise<SerialDeviceInfo> {
  const serial = getSerial();
  const port = await serial.requestPort({});
  const info = port.getInfo();
  const i = (await serial.getPorts()).length;
  const id = info.usbVendorId
    ? `${info.usbVendorId}:${info.usbProductId}:${i}`
    : `serial:${i}`;
  portMap.set(id, port);
  return {
    deviceId: id,
    name: info.usbVendorId
      ? `Serial Printer (${info.usbVendorId.toString(16)}:${info.usbProductId?.toString(16)})`
      : "Serial Printer",
  };
}

export async function printViaSerial(
  deviceId: string,
  data: Uint8Array
): Promise<string> {
  let port = portMap.get(deviceId);
  if (!port) {
    const serial = getSerial();
    const ports = await serial.getPorts();
    const idx = parseInt(deviceId.split(":").pop() || "0", 10);
    port = ports[idx];
    if (!port) {
      throw new Error(
        "Serial port not found. Call requestSerialPort() to grant access first."
      );
    }
    portMap.set(deviceId, port);
  }

  await port.open({ baudRate: 19200 });

  const writer = port.writable!.getWriter();
  try {
    let offset = 0;
    while (offset < data.length) {
      const chunk = data.slice(offset, offset + 256);
      await writer.write(chunk);
      offset += chunk.length;
    }
  } finally {
    writer.releaseLock();
  }

  await port.close();
  return "Print job sent successfully via Web Serial";
}
