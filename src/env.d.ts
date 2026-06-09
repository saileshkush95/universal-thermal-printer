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

declare module "expo-ble" {
  interface BleCharacteristic {
    uuid: string;
    serviceUuid: string;
    write(data: ArrayBuffer | number[], withoutResponse: boolean): Promise<void>;
  }

  interface BleService {
    uuid: string;
    discoverCharacteristic(uuid: string): Promise<BleCharacteristic>;
  }

  interface BleDevice {
    id: string;
    name: string | null;
    rssi?: number;
    discoverService(uuid: string): Promise<BleService>;
  }

  class BleManager {
    constructor();
    scan(serviceUuids: string[]): Promise<BleDevice[]>;
    connect(deviceId: string): Promise<BleDevice>;
    disconnect(deviceId: string): Promise<void>;
  }

  export { BleManager, BleDevice, BleCharacteristic, BleService };
}

declare module "react-native-tcp-socket" {
  class TcpSocket {
    static createConnection(
      options: { host: string; port: number; timeout?: number },
      callback: () => void
    ): TcpSocket;
    write(buffer: Buffer): void;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  export { TcpSocket };
}

// Bun global
declare var Bun: {
  version: string;
  [key: string]: any;
};
