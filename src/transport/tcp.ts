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
    const { TcpSocket } = await import(moduleName("react-native-tcp-socket"));
    return new Promise((resolve, reject) => {
      const client = TcpSocket.createConnection(
        { host: ip, port, timeout: 5000 },
        () => {
          const payload = typeof Buffer !== "undefined"
            ? Buffer.from(data)
            : (data as any);
          client.write(payload);
          client.destroy();
          resolve("Print job sent successfully");
        }
      );
      client.on("error", (err: Error) => {
        client.destroy();
        reject(`Failed to send data: ${err.message}`);
      });
    });
  }

  const net: any = await import(moduleName("net"));
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(port, ip, () => {
      socket.write(Buffer.from(data), () => {
        socket.destroy();
        resolve("Print job sent successfully");
      });
    });

    socket.on("error", (err: Error) => {
      socket.destroy();
      reject(`Failed to send data: ${err.message}`);
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(`Connection timed out to ${ip}:${port}`);
    });
  });
}
