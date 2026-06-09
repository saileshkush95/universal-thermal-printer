import { runtime } from "./detect.js";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { writeFileSync, unlinkSync } from "fs";

const USBPRINT_PREFIX = "usbprint:";

export async function listUsbPrinters(): Promise<
  { name: string; deviceId: string }[]
> {
  const rt = runtime();
  if (rt === "expo") {
    throw new Error(
      "USB printing is not available on Expo/React Native"
    );
  }

  const printers: { name: string; deviceId: string }[] = [];

  // Discover serial port devices
  try {
    const modName = "serial" + "port";
    const { SerialPort } = await import(modName);
    const ports = await SerialPort.list();
    for (const p of ports) {
      printers.push({
        name: p.manufacturer
          ? `${p.manufacturer} ${p.productId || ""}`.trim()
          : p.path,
        deviceId: p.path,
      });
    }
  } catch {
    // serialport not installed, skip serial devices
  }

  // On Windows, also discover USB printer class devices (e.g. POS80, ZKP8008)
  if (process.platform === "win32") {
    try {
      const out = execSync(
        `powershell -NoProfile -Command "& {Get-CimInstance Win32_Printer | Where-Object { $_.DriverName -notlike '*Microsoft*' -and $_.DriverName -notlike '*Fax*' -and $_.DriverName -notlike '*OneNote*' -and $_.DriverName -notlike '*XPS*' -and $_.Name -notlike '*AnyDesk*' } | ForEach-Object { Write-Output ($_.Name + '|' + $_.DriverName) }}"`,
        { encoding: "utf8", timeout: 10000 }
      );
      for (const line of out.trim().split("\n").filter(Boolean)) {
        const [name] = line.split("|");
        const trimmed = name.trim();
        if (trimmed && !printers.some((p) => p.name === trimmed)) {
          printers.push({
            name: trimmed,
            deviceId: `${USBPRINT_PREFIX}${trimmed}`,
          });
        }
      }
    } catch {
      // WMI query failed, skip
    }
  }

  // On Linux, discover USB raw printers
  if (process.platform === "linux") {
    try {
      const out = execSync("lpstat -p 2>&1", {
        encoding: "utf8",
        timeout: 5000,
      });
      for (const line of out.split("\n").filter((l) => l.startsWith("printer "))) {
        const name = line.split(" ")[1];
        if (name && !printers.some((p) => p.name === name)) {
          printers.push({ name, deviceId: `${USBPRINT_PREFIX}${name}` });
        }
      }
    } catch {
      // lpstat not available
    }
  }

  return printers;
}

function looksLikeSerialPath(path: string): boolean {
  const p = path.toLowerCase();
  if (process.platform === "win32") {
    return /^com\d+$/i.test(p);
  }
  return p.startsWith("/dev/");
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

  // Strip prefix if present
  const address = deviceId.startsWith(USBPRINT_PREFIX)
    ? deviceId.slice(USBPRINT_PREFIX.length)
    : deviceId;

  // Route based on whether it looks like a serial port path
  if (looksLikeSerialPath(address)) {
    return await printViaSerialPort(address, data, baudRate);
  }

  // Treat as system printer (Windows spooler / CUPS)
  return await printViaSpooler(address, data);
}

async function printViaSerialPort(
  deviceId: string,
  data: Uint8Array,
  baudRate: number
): Promise<string> {
  let SerialPort: any;
  try {
    const modName = "serial" + "port";
    SerialPort = (await import(modName)).SerialPort;
  } catch {
    throw new Error(
      "USB printing via serial port requires 'serialport'. Run: npm install serialport"
    );
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { port.close(); } catch {}
        reject(`Serial port operation timed out on ${deviceId}`);
      }
    }, 10000);

    const port = new SerialPort(
      { path: deviceId, baudRate, autoOpen: false },
      (err: any) => {
        if (settled) return;
        if (err) {
          settled = true;
          clearTimeout(timeout);
          reject(`USB open failed: ${err.message}`);
          return;
        }
        port.write(Buffer.from(data), (writeErr: any) => {
          if (settled) return;
          if (writeErr) {
            settled = true;
            clearTimeout(timeout);
            port.close();
            reject(`USB write failed: ${writeErr.message}`);
            return;
          }
          port.drain(() => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            port.close();
            resolve("Print job sent successfully");
          });
        });
      }
    );
    port.open();
  });
}

async function printViaSpooler(
  printerName: string,
  data: Uint8Array
): Promise<string> {
  if (process.platform === "win32") {
    return await printWindows(printerName, data);
  }
  return await printCups(printerName, data);
}

async function printWindows(
  printerName: string,
  data: Uint8Array
): Promise<string> {
  const psScriptPath = join(tmpdir(), `thermal-print-${randomUUID()}.ps1`);
  const binPath = join(tmpdir(), `thermal-print-${randomUUID()}.bin`);

  try {
    writeFileSync(binPath, Buffer.from(data));

    const escapedName = "'" + printerName.replace(/'/g, "''") + "'";
    const escapedBin = "'" + binPath.replace(/'/g, "''") + "'";

    const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
    [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
    [DllImport("winspool.drv")]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] ref DOC_INFO_1 pDocInfo);
    [DllImport("winspool.drv")]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.drv")]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv")]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv")]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct DOC_INFO_1 { public string pDocName; public string pOutputFile; public string pDatatype; }
    public static void Send(string printer, byte[] data) {
        IntPtr hPrinter;
        if (!OpenPrinter(printer, out hPrinter, IntPtr.Zero))
            throw new Exception("Cannot open printer: " + printer);
        try {
            DOC_INFO_1 docInfo = new DOC_INFO_1();
            docInfo.pDocName = "Thermal Print";
            docInfo.pDatatype = "RAW";
            if (!StartDocPrinter(hPrinter, 1, ref docInfo))
                throw new Exception("StartDocPrinter failed");
            try {
                if (!StartPagePrinter(hPrinter))
                    throw new Exception("StartPagePrinter failed");
                try {
                    IntPtr p = Marshal.AllocHGlobal(data.Length);
                    try {
                        Marshal.Copy(data, 0, p, data.Length);
                        int written;
                        if (!WritePrinter(hPrinter, p, data.Length, out written))
                            throw new Exception("WritePrinter failed");
                    } finally { Marshal.FreeHGlobal(p); }
                } finally { EndPagePrinter(hPrinter); }
            } finally { EndDocPrinter(hPrinter); }
        } finally { ClosePrinter(hPrinter); }
    }
}
"@
$data = [System.IO.File]::ReadAllBytes(${escapedBin})
try {
    [RawPrinter]::Send(${escapedName}, $data)
    Write-Output "OK"
} catch {
    Write-Output ("ERROR:" + $_.Exception.Message)
}
`;

    writeFileSync(psScriptPath, psScript, "utf8");

    const result = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File ${psScriptPath}`,
      { encoding: "utf8", timeout: 30000 }
    );

    const output = result.trim();
    if (output.startsWith("ERROR:")) {
      throw new Error(output.slice(6));
    }

    return "Print job sent successfully";
  } finally {
    try {
      if (existsSync(psScriptPath)) unlinkSync(psScriptPath);
      if (existsSync(binPath)) unlinkSync(binPath);
    } catch {
      // cleanup best effort
    }
  }
}

async function printCups(
  printerName: string,
  data: Uint8Array
): Promise<string> {
  const binPath = join(tmpdir(), `thermal-print-${randomUUID()}.bin`);

  try {
    writeFileSync(binPath, Buffer.from(data));
    const escapedName = "'" + printerName.replace(/'/g, "'\\''") + "'";
    const escapedBin = "'" + binPath.replace(/'/g, "'\\''") + "'";
    execSync(`lp -d ${escapedName} -o raw ${escapedBin}`, {
      encoding: "utf8",
      timeout: 30000,
    });
    return "Print job sent successfully";
  } finally {
    try {
      if (existsSync(binPath)) unlinkSync(binPath);
    } catch {
      // cleanup best effort
    }
  }
}
