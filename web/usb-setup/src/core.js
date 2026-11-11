export const companionPackage = "com.nidaam.family.child_app";
export const adminComponent =
  companionPackage + "/com.nidaam.child_control.FamilyAdminReceiver";
export const chunkSize = 8 * 1024 * 1024;

function normalizeComponent(value) {
  const [name, activity] = value.split("/");
  return name + "/" + (activity?.startsWith(".") ? name + activity : activity);
}

export function checkDevice(snapshot) {
  if (!/^\d+$/.test(snapshot.api) || Number(snapshot.api) < 26) {
    throw new Error("Companion requires Android 8.0 or later.");
  }
  if (snapshot.emulator === "1") {
    throw new Error("Connect the physical phone you want to set up.");
  }
  if (snapshot.user !== "0") {
    throw new Error("Switch the phone to its primary Android user.");
  }
  if (
    !/Device Policy|DevicePolicy|mHasFeature|Enabled Device Admins|Device Owner/i.test(
      snapshot.policy,
    )
  ) {
    throw new Error("Android management status could not be read.");
  }
  const owner = /Device\s+Owner(?:\s*\([^)]*\))?:\s*([\s\S]{0,1800})/i.exec(
    snapshot.policy,
  );
  if (owner) {
    const component = /ComponentInfo\{([^}]+)\}/.exec(owner[1]);
    if (!component) {
      throw new Error(
        "Android reports a device owner whose identity could not be confirmed.",
      );
    }
    if (normalizeComponent(component[1]) !== adminComponent) {
      throw new Error(
        "Another organization or app already manages this phone. Review it with its administrator.",
      );
    }
    return { managed: true, api: Number(snapshot.api), model: snapshot.model };
  }
  if (/^\s*Profile\s+Owner\b/im.test(snapshot.policy)) {
    throw new Error(
      "This phone already has a managed profile. Review it with its administrator.",
    );
  }
  if ((snapshot.users.match(/UserInfo\{/g) || []).length !== 1) {
    throw new Error(
      "First-time managed setup requires one Android user. Review the phone's users and profiles.",
    );
  }
  const accounts = [
    ...snapshot.accounts.matchAll(/^\s*Accounts:\s*(\d+)\s*$/gm),
  ];
  if (!accounts.length) {
    throw new Error(
      "Android account readiness could not be confirmed. Review this phone before enrollment.",
    );
  }
  if (accounts.some((item) => Number(item[1]) > 0)) {
    throw new Error(
      "Android accounts can prevent first-time managed setup. The parent should review the phone's account settings.",
    );
  }
  return { managed: false, api: Number(snapshot.api), model: snapshot.model };
}

export async function phoneCommand(adb, command) {
  const result = await adb.subprocess.shellProtocol.spawnWaitText(command);
  if (result.exitCode !== 0) {
    throw new Error("Android could not complete the device readiness command.");
  }
  return result.stdout.trim();
}

export async function inspectPhone(adb) {
  const snapshot = {
    model: (await phoneCommand(adb, ["getprop", "ro.product.model"]))
      .replace(/[\x00-\x1f\x7f]/g, "")
      .slice(0, 100),
    api: await phoneCommand(adb, ["getprop", "ro.build.version.sdk"]),
    emulator: await phoneCommand(adb, ["getprop", "ro.kernel.qemu"]),
    user: await phoneCommand(adb, ["am", "get-current-user"]),
    policy: await phoneCommand(adb, ["dumpsys", "device_policy"]),
    users: "",
    accounts: "",
  };
  if (!/Device\s+Owner(?:\s*\([^)]*\))?:/i.test(snapshot.policy)) {
    snapshot.users = await phoneCommand(adb, ["pm", "list", "users"]);
    snapshot.accounts = await phoneCommand(adb, ["dumpsys", "account"]);
  }
  return checkDevice(snapshot);
}

export function checkManifest(manifest) {
  if (
    !manifest ||
    !Number.isSafeInteger(manifest.build) ||
    manifest.build < 1 ||
    !Number.isSafeInteger(manifest.size) ||
    manifest.size < 1 ||
    manifest.size > 300 * 1024 * 1024 ||
    !/^[a-f0-9]{64}$/.test(manifest.sha256) ||
    !Array.isArray(manifest.chunks) ||
    manifest.chunks.length !== Math.ceil(manifest.size / chunkSize)
  ) {
    throw new Error("The published Companion download information is invalid.");
  }
  for (const [index, part] of manifest.chunks.entries()) {
    const expected = Math.min(chunkSize, manifest.size - index * chunkSize);
    if (
      part.path !== `apk/part-${String(index).padStart(3, "0")}.bin` ||
      part.size !== expected
    ) {
      throw new Error("The published Companion download parts are invalid.");
    }
  }
  return manifest;
}

export async function downloadCompanion(manifest, onProgress, signal) {
  checkManifest(manifest);
  const bytes = new Uint8Array(manifest.size);
  let offset = 0;
  for (const part of manifest.chunks) {
    const response = await fetch(new URL(part.path, document.baseURI), {
      signal,
      cache: "no-store",
      credentials: "omit",
    });
    if (!response.ok)
      throw new Error("The APK download was interrupted. Try again.");
    const chunk = new Uint8Array(await response.arrayBuffer());
    if (chunk.byteLength !== part.size)
      throw new Error("An APK download part is incomplete.");
    bytes.set(chunk, offset);
    offset += chunk.length;
    onProgress(offset / manifest.size);
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  if (hash !== manifest.sha256) {
    throw new Error(
      "The APK checksum does not match the public release. Refresh this page and retry.",
    );
  }
  return bytes;
}

export function installStream(bytes, onProgress) {
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      const end = Math.min(offset + 1024 * 1024, bytes.length);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
      onProgress(offset / bytes.length);
    },
  });
}
