const fs = require("fs");
const path = require("path");
const os = require("os");

function detectAndroidSdk() {
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }

  const home = os.homedir();
  const candidates = [
    path.join(home, "Library", "Android", "sdk"),
    path.join(home, "Android", "Sdk"),
    path.join(home, "android", "sdk"),
    path.join(os.platform() === "win32" ? process.env.LOCALAPPDATA || "" : "", "Android", "Sdk"),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  return null;
}

function ensureLocalProperties(projectRoot) {
  const propsPath = path.join(projectRoot, "android", "local.properties");
  if (fs.existsSync(propsPath)) return;

  const sdkPath = detectAndroidSdk();
  if (!sdkPath) return;

  const dir = path.dirname(propsPath);
  if (!fs.existsSync(dir)) return;

  fs.writeFileSync(propsPath, `sdk.dir=${sdkPath.replace(/\\/g, "\\\\")}\n`, "utf8");
}

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
  ensureLocalProperties(config.modRequest.projectRoot);

  const { createRequire } = require("module");
  const projectRequire = createRequire(path.join(config.modRequest.projectRoot, "noop.js"));
  const { withAndroidManifest } = projectRequire("expo/config-plugins");

  return withAndroidManifest(config, (config) => {
    config.modResults = addUsbFeature(config.modResults);
    return config;
  });
}

module.exports = withUsbPrinter;
