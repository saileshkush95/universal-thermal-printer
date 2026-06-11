import { runtime } from "./detect.js";

function moduleName(name: string): string {
  return name;
}

export async function sendToPrinter(
  ip: string,
  port: number,
  data: Uint8Array
): Promise<string> {
  const rt = runtime();

  if (rt === "expo") {
    const tcp = await import(moduleName("react-native-tcp-socket"));
    return new Promise((resolve, reject) => {
      let settled = false;
      const client = tcp.createConnection(
        { host: ip, port, timeout: 5000 },
        () => {
          (client as any).write(data, undefined, (err?: Error) => {
            if (err) {
              if (!settled) {
                settled = true;
                reject(`Failed to send data: ${err.message}`);
              }
              return;
            }
            client.end();
            if (!settled) {
              settled = true;
              resolve("Print job sent successfully");
            }
          });
        }
      );
      client.on("error", (err: Error) => {
        client.destroy();
        if (!settled) {
          settled = true;
          reject(`Failed to send data: ${err.message}`);
        }
      });
    });
  }

  const net: any = await import(moduleName("net"));
  return new Promise((resolve, reject) => {
    let settled = false;

    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(port, ip, () => {
      socket.write(Buffer.from(data), (err?: Error | null) => {
        if (err) {
          socket.destroy();
          if (!settled) {
            settled = true;
            reject(`Failed to send data: ${err.message}`);
          }
          return;
        }
        socket.end();
        if (!settled) {
          settled = true;
          resolve("Print job sent successfully");
        }
      });
    });

    socket.on("error", (err: Error) => {
      socket.destroy();
      if (!settled) {
        settled = true;
        reject(`Failed to send data: ${err.message}`);
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      if (!settled) {
        settled = true;
        reject(`Connection timed out to ${ip}:${port}`);
      }
    });
  });
}
