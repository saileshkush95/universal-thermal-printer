package com.universalthermalprinter;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.Map;

public class UsbPrinterModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "UniversalThermalUsb";
    private static final String ACTION_USB_PERMISSION =
            "com.universalthermalprinter.USB_PERMISSION";

    private final ReactApplicationContext reactContext;
    private UsbDeviceConnection currentConnection;
    private UsbEndpoint currentOutEndpoint;
    private UsbInterface currentInterface;
    private Promise permissionPromise;

    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (device != null && permissionPromise != null) {
                            permissionPromise.resolve(true);
                        }
                    } else {
                        if (permissionPromise != null) {
                            permissionPromise.reject("USB_PERMISSION_DENIED",
                                    "USB permission denied by user");
                        }
                    }
                    permissionPromise = null;
                }
            }
        }
    };

    UsbPrinterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(usbReceiver, filter, Context.RECEIVER_EXPORTED, null);
        } else {
            reactContext.registerReceiver(usbReceiver, filter);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    private UsbManager getUsbManager() {
        return (UsbManager) reactContext.getSystemService(Context.USB_SERVICE);
    }

    @ReactMethod
    public void listDevices(Promise promise) {
        try {
            UsbManager usbManager = getUsbManager();
            HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
            WritableArray devices = Arguments.createArray();

            for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
                UsbDevice device = entry.getValue();
                WritableMap map = Arguments.createMap();
                map.putString("deviceId", entry.getKey());
                map.putString("name", device.getProductName() != null
                        ? device.getProductName() : "USB Printer");
                map.putInt("vendorId", device.getVendorId());
                map.putInt("productId", device.getProductId());
                devices.pushMap(map);
            }

            promise.resolve(devices);
        } catch (Exception e) {
            promise.reject("USB_LIST_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestPermission(int vendorId, int productId, Promise promise) {
        try {
            UsbManager usbManager = getUsbManager();
            UsbDevice device = findDevice(vendorId, productId);

            if (device == null) {
                promise.reject("USB_DEVICE_NOT_FOUND",
                        "No USB device found with vendorId=" + vendorId
                                + " productId=" + productId);
                return;
            }

            if (usbManager.hasPermission(device)) {
                promise.resolve(true);
                return;
            }

            permissionPromise = promise;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    reactContext, 0,
                    new Intent(ACTION_USB_PERMISSION)
                            .putExtra(UsbManager.EXTRA_DEVICE, device),
                    PendingIntent.FLAG_IMMUTABLE);
            usbManager.requestPermission(device, pendingIntent);
        } catch (Exception e) {
            promise.reject("USB_PERMISSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void connect(int vendorId, int productId, Promise promise) {
        try {
            disconnect();
            UsbManager usbManager = getUsbManager();
            UsbDevice device = findDevice(vendorId, productId);

            if (device == null) {
                promise.reject("USB_DEVICE_NOT_FOUND",
                        "No USB device found with vendorId=" + vendorId
                                + " productId=" + productId);
                return;
            }

            if (!usbManager.hasPermission(device)) {
                promise.reject("USB_NO_PERMISSION",
                        "Permission not granted. Call requestPermission first.");
                return;
            }

            UsbInterface usbInterface = findPrinterInterface(device);
            if (usbInterface == null) {
                promise.reject("USB_NO_INTERFACE",
                        "No suitable USB interface found on device");
                return;
            }

            UsbDeviceConnection connection = usbManager.openDevice(device);
            if (connection == null) {
                promise.reject("USB_CONNECTION_FAILED",
                        "Failed to open USB device connection");
                return;
            }

            if (!connection.claimInterface(usbInterface, true)) {
                connection.close();
                promise.reject("USB_CLAIM_FAILED",
                        "Failed to claim USB interface");
                return;
            }

            UsbEndpoint outEndpoint = findBulkOutEndpoint(usbInterface);
            if (outEndpoint == null) {
                connection.releaseInterface(usbInterface);
                connection.close();
                promise.reject("USB_NO_OUT_ENDPOINT",
                        "No bulk OUT endpoint found");
                return;
            }

            currentConnection = connection;
            currentInterface = usbInterface;
            currentOutEndpoint = outEndpoint;

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("USB_CONNECT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void write(String base64Data, Promise promise) {
        try {
            if (currentConnection == null || currentOutEndpoint == null) {
                promise.reject("USB_NOT_CONNECTED", "Not connected to any USB device");
                return;
            }

            byte[] data = Base64.decode(base64Data, Base64.NO_WRAP);
            int transferred = currentConnection.bulkTransfer(
                    currentOutEndpoint, data, data.length, 10000);

            if (transferred < 0) {
                promise.reject("USB_WRITE_FAILED", "Failed to write data to USB device");
            } else {
                promise.resolve(transferred);
            }
        } catch (Exception e) {
            promise.reject("USB_WRITE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disconnect(Promise promise) {
        try {
            if (currentConnection != null) {
                if (currentInterface != null) {
                    currentConnection.releaseInterface(currentInterface);
                }
                currentConnection.close();
            }
            currentConnection = null;
            currentInterface = null;
            currentOutEndpoint = null;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("USB_DISCONNECT_ERROR", e.getMessage());
        }
    }

    private UsbDevice findDevice(int vendorId, int productId) {
        UsbManager usbManager = getUsbManager();
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (UsbDevice device : deviceList.values()) {
            if (device.getVendorId() == vendorId
                    && device.getProductId() == productId) {
                return device;
            }
        }
        return null;
    }

    private UsbInterface findPrinterInterface(UsbDevice device) {
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            UsbInterface iface = device.getInterface(i);
            if (iface.getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER
                    || iface.getInterfaceClass() == 7) {
                return iface;
            }
        }
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            UsbInterface iface = device.getInterface(i);
            if (hasBulkOutEndpoint(iface)) {
                return iface;
            }
        }
        return null;
    }

    private boolean hasBulkOutEndpoint(UsbInterface iface) {
        for (int i = 0; i < iface.getEndpointCount(); i++) {
            UsbEndpoint ep = iface.getEndpoint(i);
            if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK
                    && ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                return true;
            }
        }
        return false;
    }

    private UsbEndpoint findBulkOutEndpoint(UsbInterface iface) {
        for (int i = 0; i < iface.getEndpointCount(); i++) {
            UsbEndpoint ep = iface.getEndpoint(i);
            if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK
                    && ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                return ep;
            }
        }
        return null;
    }
}
