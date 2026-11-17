import { checkApk, validateRelease } from "./apk-integrity.js";

const element = id => document.getElementById(id);
let metadata;
async function loadRelease() {
  element("apk-file").disabled = true;
  element("retry-metadata").hidden = true;
  try {
    const response = await fetch("./release.json", { cache: "no-store", credentials: "omit" });
    if (!response.ok) throw Error("Could not load official release details.");
    metadata = validateRelease(await response.json());
    element("release-info").textContent = `Official Companion build ${metadata.build} · ${metadata.size.toLocaleString()} bytes`;
    element("apk-file").disabled = false;
  } catch (_) {
    metadata = undefined;
    element("release-info").textContent = "Could not load official release details. Check your connection and reload.";
    element("retry-metadata").hidden = false;
  }
}
element("retry-metadata").addEventListener("click", loadRelease);
element("apk-file").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file || !metadata) return;
  element("apk-file").disabled = true;
  element("check-result").hidden = true;
  element("check-state").textContent = "Checking locally on this phone… Keep this page open.";
  try {
    const result = await checkApk(file, metadata);
    element("check-result").textContent = [result.code, `File: ${file.name}`, `Actual bytes: ${result.size}`, `Expected bytes: ${result.expectedSize}`, ...(result.sha256 ? [`Actual SHA-256: ${result.sha256}`, `Expected SHA-256: ${result.expectedSha256}`] : [])].join("\n");
    element("check-result").hidden = false;
    if (result.code.startsWith("APK_OK_")) {
      element("check-state").textContent = "The file exactly matches the official Companion APK.";
      element("next-step").textContent = "Send the APK_OK result when reporting the installation error. The download is intact; the next step is diagnosing the phone’s installer. Keep the existing app installed.";
    } else {
      element("check-state").textContent = "This file does not match the current official APK. It may be incomplete, altered or an older version.";
      element("next-step").textContent = "Send the result code and byte counts. Download a fresh copy of the current Companion APK in Chrome; keep the existing app installed.";
    }
  } catch (_) {
    element("check-state").textContent = "The check could not finish. Open this page in Chrome, close other tabs and try again.";
  } finally {
    element("apk-file").disabled = false;
  }
});
loadRelease();
