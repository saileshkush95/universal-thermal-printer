declare module "bluetooth-serial-port" {
  class BluetoothSerialPort {
    listPairedDevices(callback: (err: any, devices: any[]) => void): void;
    findSerialPortChannel(address: string, callback: (err: any, channel?: number) => void): void;
    connect(address: string, channel: number, callback: (err: any) => void): void;
    write(buffer: Buffer, callback: (err: any) => void): void;
    close(): void;
  }

  export default BluetoothSerialPort;
}
