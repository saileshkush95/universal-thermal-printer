import * as net from "net";

export async function sendToPrinter(
  ip: string,
  port: number,
  data: Uint8Array
): Promise<string> {
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
