interface SerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
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
    throw new Error("Web Serial not supported. Use Chrome/Edge on HTTPS or localhost.");
  }
  return nav.serial;
}

export interface SerialDeviceInfo {
  deviceId: string;
  name: string;
}

const portMap = new Map<string, SerialPort>();

function makeId(info: { usbVendorId?: number; usbProductId?: number }, idx: number): string {
  return info.usbVendorId
    ? `${info.usbVendorId}:${info.usbProductId}:${idx}`
    : `serial:${idx}`;
}

function makeName(info: { usbVendorId?: number; usbProductId?: number }): string {
  if (!info.usbVendorId) return "Serial Device";
  const hex = (n: number) => n.toString(16).padStart(4, "0");
  return `Serial Device (${hex(info.usbVendorId)}:${info.usbProductId ? hex(info.usbProductId) : "????"})`;
}

export async function listSerialPrinters(): Promise<SerialDeviceInfo[]> {
  const serial = getSerial();
  const ports = await serial.getPorts();
  return ports.map((p, i) => {
    const info = p.getInfo();
    return { deviceId: makeId(info, i), name: makeName(info) };
  });
}

export async function requestSerialPort(): Promise<SerialDeviceInfo> {
  const serial = getSerial();
  const port = await serial.requestPort({});
  const info = port.getInfo();
  const i = (await serial.getPorts()).length - 1;
  const id = makeId(info, i);
  portMap.set(id, port);
  return { deviceId: id, name: makeName(info) };
}

async function resolvePort(deviceId: string): Promise<SerialPort> {
  let port = portMap.get(deviceId);
  if (!port) {
    const serial = getSerial();
    const ports = await serial.getPorts();
    const idx = parseInt(deviceId.split(":").pop() || "0", 10);
    port = ports[idx];
    if (!port) throw new Error("Serial port not found. Call requestSerialPort() first.");
    portMap.set(deviceId, port);
  }
  return port;
}

async function openPort(port: SerialPort, baudRate: number): Promise<void> {
  try {
    await port.open({ baudRate });
  } catch {
    // already open
  }
}

async function writeData(port: SerialPort, data: Uint8Array): Promise<void> {
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
}

// ─── Printer ──────────────────────────────────────────────────────

export async function printViaSerial(deviceId: string, data: Uint8Array): Promise<string> {
  const port = await resolvePort(deviceId);
  await openPort(port, 19200);
  await writeData(port, data);
  await port.close();
  return "Print job sent successfully via Web Serial";
}

// ─── Customer Display ──────────────────────────────────────────────

export interface DisplayOptions {
  line1: string;
  line2?: string;
  clear?: boolean;
  brightness?: "normal" | "dim" | "bright";
}

function displayCommand(opts: DisplayOptions): Uint8Array {
  const parts: number[] = [];

  if (opts.clear !== false) {
    parts.push(0x0C); // FF - clear
    parts.push(0x1B, 0x40); // ESC @ - reset
  }

  if (opts.brightness === "dim") {
    parts.push(0x1B, 0x43, 0x30); // ESC C 0 - dim/bottom line only
  } else if (opts.brightness === "bright") {
    // typical bright command - ESC C 1
    parts.push(0x1B, 0x43, 0x31);
  }

  if (opts.line1) {
    // home + line 1
    parts.push(0x1B, 0x4C, 0x01, 0x01); // ESC L row=1 col=1
    for (const ch of opts.line1) {
      parts.push(ch.charCodeAt(0));
    }
  }

  if (opts.line2) {
    parts.push(0x1B, 0x4C, 0x02, 0x01); // ESC L row=2 col=1
    for (const ch of opts.line2) {
      parts.push(ch.charCodeAt(0));
    }
  }

  return new Uint8Array(parts);
}

export async function displayText(deviceId: string, options: DisplayOptions): Promise<string> {
  const port = await resolvePort(deviceId);
  await openPort(port, 9600);
  await writeData(port, displayCommand(options));
  await port.close();
  return "Display updated";
}

export async function displayClear(deviceId: string): Promise<string> {
  return displayText(deviceId, { line1: "", clear: true });
}

// ─── Weighing Scale ────────────────────────────────────────────────

export interface WeightReading {
  weight: number;
  unit: string;
  stable: boolean;
  raw: string;
}

function parseWeight(raw: string): WeightReading | null {
  const s = raw.trim();

  // CAS / Dibal: "S, +001.500kg" or "ST,GS,+0001.500kg"
  const commaMatch = s.match(/[+-]\d+\.?\d*\s*(kg|g|lb|oz|t)\b/i);
  if (commaMatch) {
    const num = parseFloat(commaMatch[0].replace(/[^0-9.\-]/g, ""));
    const unit = commaMatch[0].replace(/[0-9.\-+\s]/g, "").toLowerCase() || "kg";
    const stable = s.startsWith("S") || s.includes("ST");
    if (!isNaN(num)) return { weight: num, unit, stable, raw: s };
  }

  // NCR / simple: "   1.500 kg"
  const simple = s.match(/^[\s+-]*(\d+\.?\d*)\s*(kg|g|lb|oz)?\s*$/i);
  if (simple) {
    const num = parseFloat(simple[1]);
    const unit = (simple[2] || "kg").toLowerCase();
    if (!isNaN(num)) return { weight: num, unit, stable: true, raw: s };
  }

  return null;
}

export interface ScaleOptions {
  baudRate?: number;
  timeout?: number;
  pollCommand?: string;
}

export async function scaleRead(deviceId: string, options?: ScaleOptions): Promise<WeightReading> {
  const port = await resolvePort(deviceId);
  await openPort(port, options?.baudRate || 9600);

  const reader = port.readable!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const pollCmd = options?.pollCommand || "W\r\n";
  const timeout = options?.timeout || 3000;

  try {
    // Send poll command
    await writeData(port, new TextEncoder().encode(pollCmd));

    const result = await new Promise<WeightReading>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Scale read timeout")), timeout);

      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const parsed = parseWeight(line);
              if (parsed) {
                clearTimeout(timer);
                resolve(parsed);
                return;
              }
            }
          }
          clearTimeout(timer);
          reject(new Error("No weight data received"));
        } catch (err) {
          clearTimeout(timer);
          reject(err);
        }
      })();
    });

    return result;
  } finally {
    reader.releaseLock();
    await port.close();
  }
}

export interface ScaleStreamCallbacks {
  onWeight: (reading: WeightReading) => void;
  onError?: (err: Error) => void;
}

export async function scaleStartStream(
  deviceId: string,
  callbacks: ScaleStreamCallbacks,
  options?: ScaleOptions
): Promise<() => Promise<void>> {
  const port = await resolvePort(deviceId);
  await openPort(port, options?.baudRate || 9600);

  const reader = port.readable!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let running = true;

  (async () => {
    try {
      while (running) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const parsed = parseWeight(line);
          if (parsed) {
            try { callbacks.onWeight(parsed); } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      if (running) {
        try { callbacks.onError?.(err as Error); } catch { /* ignore */ }
      }
    }
  })();

  return async () => {
    running = false;
    try { reader.releaseLock(); } catch { /* ignore */ }
    try { await port.close(); } catch { /* ignore */ }
  };
}
