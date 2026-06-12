export interface UsbDeviceInfo {
  deviceId: string;
  name: string;
  vendorId: number;
  productId: number;
}

interface NativeUsbModule {
  listDevices(): Promise<UsbDeviceInfo[]>;
  requestPermission(vendorId: number, productId: number): Promise<boolean>;
  connect(vendorId: number, productId: number): Promise<boolean>;
  write(base64Data: string): Promise<number>;
  disconnect(): Promise<boolean>;
}

function getNativeModule(): NativeUsbModule {
  const { NativeModules, Platform }: any = require("react-native");
  if (Platform.OS !== "android") {
    throw new Error("USB printing is not available on iOS");
  }
  const mod = NativeModules.UniversalThermalUsb as NativeUsbModule | undefined;
  if (!mod || typeof mod.listDevices !== "function") {
    throw new Error(
      "USB native module not found. Ensure universal-thermal-printer is " +
        "properly linked and you are using a development build."
    );
  }
  return mod;
}

function base64Encode(data: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < data.length; i += 3) {
    const a = data[i];
    const b = i + 1 < data.length ? data[i + 1] : 0;
    const c = i + 2 < data.length ? data[i + 2] : 0;
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    if (i + 1 >= data.length) {
      result += "==";
      break;
    }
    result += chars[((b & 15) << 2) | (c >> 6)];
    if (i + 2 >= data.length) {
      result += "=";
      break;
    }
    result += chars[c & 63];
  }
  return result;
}

export async function listUsbPrinters(): Promise<UsbDeviceInfo[]> {
  return getNativeModule().listDevices();
}

export async function requestUsbPermission(
  vendorId: number,
  productId: number
): Promise<boolean> {
  return getNativeModule().requestPermission(vendorId, productId);
}

export async function connectUsb(
  vendorId: number,
  productId: number
): Promise<boolean> {
  return getNativeModule().connect(vendorId, productId);
}

export async function writeUsb(data: Uint8Array): Promise<number> {
  const b64 = base64Encode(data);
  return getNativeModule().write(b64);
}

export async function disconnectUsb(): Promise<boolean> {
  return getNativeModule().disconnect();
}

export async function printViaUsb(
  address: string,
  data: Uint8Array
): Promise<string> {
  const parts = address.split(":");
  const vendorId = parseInt(parts[0], 10);
  const productId = parseInt(parts[1], 10);

  if (isNaN(vendorId) || isNaN(productId)) {
    throw new Error(
      'Invalid USB address format. Expected "vendorId:productId" ' +
        '(e.g. "10473:528")'
    );
  }

  const mod = getNativeModule();

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(`USB operation timed out for device ${vendorId}:${productId}`);
      }
    }, 10000);

    (async () => {
      try {
        const hasPermission = await mod.requestPermission(vendorId, productId);
        if (settled) return;
        if (!hasPermission) {
          settled = true;
          clearTimeout(timer);
          reject("USB permission denied");
          return;
        }

        await mod.connect(vendorId, productId);
        if (settled) return;

        try {
          await mod.write(base64Encode(data));
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve("Print job sent successfully");
          }
        } finally {
          if (!settled) {
            await mod.disconnect();
          }
        }
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err instanceof Error ? err.message : String(err));
        }
      }
    })();
  });
}
