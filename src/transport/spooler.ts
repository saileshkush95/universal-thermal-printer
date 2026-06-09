import { execSync } from "child_process";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { writeFileSync, unlinkSync } from "fs";

const PLATFORM = process.platform;

function escapeArg(arg: string): string {
  if (PLATFORM === "win32") {
    return "'" + arg.replace(/'/g, "''") + "'";
  }
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

export async function listSpoolerPrinters(): Promise<
  { name: string; deviceId: string }[]
> {
  if (PLATFORM === "win32") {
    const out = execSync(
      `powershell -NoProfile -Command "& {Get-Printer | ForEach-Object { Write-Output $_.Name }}"`,
      { encoding: "utf8", timeout: 10000 }
    );
    return out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((n) => ({ name: n.trim(), deviceId: n.trim() }));
  }

  try {
    const out = execSync("lpstat -p 2>&1", {
      encoding: "utf8",
      timeout: 10000,
    });
    return out
      .split("\n")
      .filter((l) => l.startsWith("printer "))
      .map((l) => {
        const name = l.split(" ")[1];
        return { name, deviceId: name };
      });
  } catch {
    throw new Error(
      "No system printers found. Ensure CUPS/lp is installed on Linux/macOS."
    );
  }
}

export async function printViaSpooler(
  printerName: string,
  data: Uint8Array
): Promise<string> {
  if (PLATFORM === "win32") {
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
$data = [System.IO.File]::ReadAllBytes(${escapeArg(binPath)})
try {
    [RawPrinter]::Send(${escapeArg(printerName)}, $data)
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

    execSync(`lp -d ${escapeArg(printerName)} -o raw ${escapeArg(binPath)}`, {
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
