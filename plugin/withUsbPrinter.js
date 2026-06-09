const { withAndroidManifest } = require("expo/config-plugins");

function addUsbFeature(androidManifest) {
  const manifest = androidManifest.manifest;

  if (!manifest["uses-feature"]) {
    manifest["uses-feature"] = [];
  }

  const hasUsbFeature = manifest["uses-feature"].some(
    (f) => f["$"]["android:name"] === "android.hardware.usb.host"
  );

  if (!hasUsbFeature) {
    manifest["uses-feature"].push({
      $: {
        "android:name": "android.hardware.usb.host",
        "android:required": false,
      },
    });
  }

  return androidManifest;
}

function withUsbPrinter(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addUsbFeature(config.modResults);
    return config;
  });
}

module.exports = withUsbPrinter;
