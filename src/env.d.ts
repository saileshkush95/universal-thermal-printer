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

declare module "react-native-ble-plx" {
  interface Device {
    id: string;
    name: string | null;
    isConnected: boolean;
    connect(): Promise<Device>;
    disconnect(): Promise<void>;
    discoverAllServicesAndCharacteristics(): Promise<Device>;
    writeCharacteristicWithoutResponseForService(
      serviceUUID: string,
      characteristicUUID: string,
      valueBase64: string
    ): Promise<Characteristic>;
    writeCharacteristicWithResponseForService(
      serviceUUID: string,
      characteristicUUID: string,
      valueBase64: string
    ): Promise<Characteristic>;
  }

  interface Characteristic {
    uuid: string;
    serviceUUID: string;
    value: string | null;
  }

  class BleManager {
    constructor();
    startDeviceScan(
      serviceUUIDs: string[] | null,
      options: { allowDuplicates?: boolean } | null,
      listener: (error: { message: string } | null, device: Device | null) => void
    ): void;
    stopDeviceScan(): void;
    connectToDevice(deviceIdentifier: string): Promise<Device>;
    cancelDeviceConnection(deviceIdentifier: string): Promise<Device>;
  }

  export { BleManager, Device, Characteristic };
}

declare module "react-native-tcp-socket" {
  interface TcpSocket {
    write(buffer: Buffer | string, cb?: () => void): void;
    end(): void;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  export function createConnection(
    options: { host: string; port: number; timeout?: number },
    callback: () => void
  ): TcpSocket;

  export function createServer(...args: any[]): any;
}

// UniversalThermalUsb native module (Android only)
declare module "react-native" {
  interface NativeModulesStatic {
    UniversalThermalUsb: {
      listDevices(): Promise<{
        deviceId: string;
        name: string;
        vendorId: number;
        productId: number;
      }[]>;
      requestPermission(vendorId: number, productId: number): Promise<boolean>;
      connect(vendorId: number, productId: number): Promise<boolean>;
      write(base64Data: string): Promise<number>;
      disconnect(): Promise<boolean>;
    };
  }
}

// Bun global
declare var Bun: {
  version: string;
  [key: string]: any;
};
