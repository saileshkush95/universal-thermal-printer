import { runtime } from "./detect.js";

export interface NetworkPrinter {
  name: string;
  address: string;
  port: number;
}

function moduleName(name: string): string {
  return name;
}

async function getLocalSubnet(): Promise<string | null> {
  try {
    const os: any = await import(moduleName("os"));
    const ifaces = os.networkInterfaces();
    for (const entries of Object.values(ifaces)) {
      if (!entries) continue;
      for (const entry of entries as any[]) {
        if (entry.family === "IPv4" && !entry.internal) {
          const parts = entry.address.split(".");
          return parts[0] + "." + parts[1] + "." + parts[2] + ".";
        }
      }
    }
  } catch {
    // os module not available (React Native / Expo)
  }
  return null;
}

async function tryConnect(
  ip: string,
  port: number,
  signal: AbortSignal
): Promise<boolean> {
  const rt = runtime();
  if (rt === "expo") {
    try {
      const { TcpSocket } = await import(
        moduleName("react-native-tcp-socket")
      );
      return new Promise((resolve) => {
        if (signal.aborted) {
          resolve(false);
          return;
        }
        const client = TcpSocket.createConnection(
          { host: ip, port, timeout: 2000 },
          () => {
            client.destroy();
            resolve(true);
          }
        );
        client.on("error", () => {
          client.destroy();
          resolve(false);
        });
        client.on("timeout", () => {
          client.destroy();
          resolve(false);
        });
        signal.addEventListener("abort", () => {
          client.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  try {
    const net: any = await import(moduleName("net"));
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve(false);
        return;
      }
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      signal.addEventListener("abort", () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, ip);
    });
  } catch {
    return false;
  }
}

export async function listNetworkPrinters(
  options?: { port?: number; subnet?: string; maxScans?: number }
): Promise<NetworkPrinter[]> {
  const port = options?.port ?? 9100;
  const maxScans = options?.maxScans ?? 254;

  const rt = runtime();
  if (rt === "expo") {
    // On Expo, try common subnets (192.168.x, 10.x, 172.x)
    const subnets = ["192.168.1.", "192.168.0.", "10.0.0."];
    const results: NetworkPrinter[] = [];
    const controller = new AbortController();

    for (const subnet of subnets) {
      const promises: Promise<void>[] = [];
      for (let i = 1; i <= Math.min(maxScans, 254); i++) {
        const ip = subnet + i;
        promises.push(
          (async () => {
            if (await tryConnect(ip, port, controller.signal)) {
              results.push({ name: ip, address: ip, port });
              controller.abort();
            }
          })()
        );
      }
      await Promise.race([
        Promise.all(promises),
        new Promise<void>((r) => {
          const check = setInterval(() => {
            if (controller.signal.aborted || results.length > 0) {
              clearInterval(check);
              r();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            r();
          }, 15000);
        }),
      ]);
      if (results.length > 0) break;
    }
    return results;
  }

  // Node.js / Bun
  let subnets: string[] = [];
  const detected = await getLocalSubnet();
  if (detected) {
    subnets.push(detected);
  }
  subnets.push("192.168.1.", "192.168.0.", "10.0.0.");

  const results: NetworkPrinter[] = [];
  const controller = new AbortController();

  for (const subnet of subnets) {
    const promises: Promise<void>[] = [];
    for (let i = 1; i <= Math.min(maxScans, 254); i++) {
      const ip = subnet + i;
      promises.push(
        (async () => {
          if (await tryConnect(ip, port, controller.signal)) {
            results.push({ name: ip, address: ip, port });
            controller.abort();
          }
        })()
      );
    }
    await Promise.race([
      Promise.all(promises),
      new Promise<void>((r) => {
        const check = setInterval(() => {
          if (controller.signal.aborted) {
            clearInterval(check);
            r();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(check);
          r();
        }, 30000);
      }),
    ]);
    if (results.length > 0) break;
  }

  return results;
}
