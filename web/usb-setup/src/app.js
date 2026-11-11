import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";
import { PackageManager } from "@yume-chan/android-bin";
import {
  adminComponent,
  checkManifest,
  downloadCompanion,
  inspectPhone,
  installStream,
} from "./core.js";

const element = (id) => document.getElementById(id);
const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
const credentials = new AdbWebCredentialStore("Waalid Kaab USB Setup");
let adb;
let device;
let readiness;
let manifest;
let busy = false;
let phase = "ready";
let generation = 0;
let downloadController;

function status(message, badge = "Ready") {
  element("status").textContent = message;
  element("state").textContent = badge;
}

function log(message) {
  const item = document.createElement("li");
  item.textContent = message;
  element("activity").append(item);
}

function updateButtons() {
  element("connect").disabled = busy || !manager || !!adb;
  element("connect").textContent = adb ? "Phone connected" : "Connect phone";
  element("disconnect").hidden = !adb;
  element("disconnect").disabled = busy;
  element("install").disabled =
    busy || !adb || !readiness || !manifest || !element("consent").checked;
  element("install").textContent = readiness?.managed
    ? "Install Companion update"
    : "Install & set up";
}

function progress(value) {
  element("progress").hidden = false;
  element("progress").value = Math.round(value * 100);
}

function disconnected(currentGeneration) {
  if (generation !== currentGeneration) return;
  downloadController?.abort();
  adb = undefined;
  readiness = undefined;
  element("connection-check").textContent = "Disconnected";
  element("readiness-check").textContent = "Check again after connecting";
  updateButtons();
  if (phase !== "complete") {
    status(
      phase === "installing" || phase === "enrolling"
        ? "USB disconnected during setup. Open Companion on the phone and check its version and managed status before retrying. Protection may have disabled USB debugging."
        : "The phone disconnected. Reconnect it when ready.",
      "Check phone",
    );
  }
}

element("connect").addEventListener("click", async () => {
  if (busy || adb || !manager) return;
  busy = true;
  phase = "connecting";
  const currentGeneration = ++generation;
  updateButtons();
  let connection;
  let authenticationTimer;
  try {
    device = await manager.requestDevice();
    if (!device) {
      status("No phone selected. Choose Connect phone when ready.");
      return;
    }
    connection = await device.connect();
    status(
      "Tap Allow on the phone's USB debugging prompt. Keep the phone unlocked.",
      "Approve on phone",
    );
    authenticationTimer = setTimeout(() => {
      if (generation === currentGeneration && !adb) {
        device.raw.close().catch(() => {});
      }
    }, 60000);
    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection,
      credentialStore: credentials,
    });
    clearTimeout(authenticationTimer);
    adb = new Adb(transport);
    adb.disconnected.then(
      () => disconnected(currentGeneration),
      () => disconnected(currentGeneration),
    );
    status(
      "Checking Android version, device management, and enrollment readiness…",
      "Checking",
    );
    element("connection-check").textContent = "Connected";
    readiness = await inspectPhone(adb);
    element("phone-name").textContent = readiness.model || "Android phone";
    element("phone-detail").textContent =
      `Android API ${readiness.api} · ${readiness.managed ? "Companion already manages this phone" : "Ready for first-time managed setup"}`;
    element("readiness-check").textContent = readiness.managed
      ? "Already managed"
      : "Ready";
    status(
      "Device checks passed. Review the guardian confirmation to continue.",
      "Ready",
    );
    log("Phone authorized and readiness checks passed.");
    phase = "ready";
  } catch (error) {
    readiness = undefined;
    element("readiness-check").textContent = "Needs attention";
    const message = error?.message || "The phone could not connect.";
    status(
      /claim|busy|access denied/i.test(message)
        ? "USB access is busy or blocked. Close other ADB tools, reconnect the cable, and check the manufacturer's USB driver."
        : message.slice(0, 400),
      "Needs attention",
    );
    if (!adb && device) await device.raw.close().catch(() => {});
  } finally {
    clearTimeout(authenticationTimer);
    busy = false;
    updateButtons();
  }
});

element("disconnect").addEventListener("click", async () => {
  if (busy) return;
  const current = adb;
  ++generation;
  adb = undefined;
  readiness = undefined;
  await current?.close().catch(() => {});
  element("connection-check").textContent = "Disconnected";
  element("readiness-check").textContent = "Waiting";
  element("phone-name").textContent = "Ready when you are";
  element("phone-detail").textContent =
    "Choose a phone to start another setup.";
  status("Phone disconnected.");
  updateButtons();
});

element("consent").addEventListener("change", updateButtons);

element("install").addEventListener("click", async () => {
  if (busy || !adb || !manifest || !element("consent").checked) return;
  busy = true;
  const current = adb;
  phase = "checking";
  updateButtons();
  try {
    readiness = await inspectPhone(current);
    downloadController = new AbortController();
    phase = "downloading";
    status(
      "Downloading the signed Companion APK into browser memory…",
      "Downloading",
    );
    const bytes = await downloadCompanion(
      manifest,
      progress,
      downloadController.signal,
    );
    log("APK size and SHA-256 match the public release.");
    if (adb !== current)
      throw new Error("The phone disconnected before installation.");
    phase = "installing";
    status(
      "Installing Companion. Keep the cable connected and the phone unlocked.",
      "Installing",
    );
    progress(0);
    const packages = new PackageManager(current);
    await packages.installStream(
      bytes.byteLength,
      installStream(bytes, progress),
      {
        skipExisting: false,
        requestDowngrade: false,
      },
    );
    log("Android confirmed APK installation.");
    if (!readiness.managed) {
      phase = "enrolling";
      status(
        "Asking Android to enable Companion device management…",
        "Enrolling",
      );
      const result = await current.subprocess.shellProtocol.spawnWaitText([
        "dpm",
        "set-device-owner",
        adminComponent,
      ]);
      if (result.exitCode !== 0 || !/success/i.test(result.stdout)) {
        throw new Error(
          "Android did not confirm managed enrollment. Open the installed Companion and review its managed status before retrying.",
        );
      }
      log("Android confirmed Companion device management.");
    }
    phase = "complete";
    readiness = undefined;
    element("readiness-check").textContent = "Setup confirmed";
    progress(1);
    status(
      "Setup confirmed. Open Companion on the phone to finish pairing and parent PIN setup. USB may disconnect when protection starts.",
      "Complete",
    );
  } catch (error) {
    if (adb !== current) {
      disconnected(generation);
    } else {
      status(
        (
          error?.message ||
          "Setup could not finish. Check the phone before retrying."
        ).slice(0, 400),
        "Needs attention",
      );
    }
  } finally {
    downloadController = undefined;
    busy = false;
    updateButtons();
  }
});

if (!manager) {
  element("browser-note").textContent =
    "Open this page in desktop Chrome or Edge over HTTPS to connect a USB phone.";
  status(
    "This browser does not provide USB access. Use Chrome or Edge on the computer connected to the phone.",
    "Browser required",
  );
} else {
  element("browser-note").textContent =
    "The browser will ask you to select a USB phone. Approve the debugging prompt on the phone too.";
}
updateButtons();

try {
  const response = await fetch("./release.json", {
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok)
    throw new Error(
      "The public release is still being prepared. Refresh this page shortly.",
    );
  manifest = checkManifest(await response.json());
  element("release-check").textContent = `Companion build ${manifest.build}`;
  updateButtons();
} catch (error) {
  element("release-check").textContent = "Unavailable";
  status(error.message, "Release unavailable");
}

window.addEventListener("pagehide", () => {
  downloadController?.abort();
  adb?.close().catch(() => {});
});
