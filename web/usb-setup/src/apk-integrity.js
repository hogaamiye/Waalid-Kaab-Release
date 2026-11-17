export function validateRelease(manifest) {
  if (!manifest || !Number.isSafeInteger(manifest.build) || manifest.build < 1 ||
      !Number.isSafeInteger(manifest.size) || manifest.size < 1 || manifest.size > 300 * 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(manifest.sha256 ?? "")) {
    throw new Error("Official release details are unavailable. Reload and try again.");
  }
  return { build: manifest.build, size: manifest.size, sha256: manifest.sha256 };
}

export async function checkApk(file, metadata, subtle = globalThis.crypto.subtle) {
  const expected = validateRelease(metadata);
  if (file.size !== expected.size) {
    return { code: `APK_SIZE_MISMATCH_${expected.build}`, size: file.size, expectedSize: expected.size };
  }
  const bytes = await file.arrayBuffer();
  const digest = await subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return {
    code: `${sha256 === expected.sha256 ? "APK_OK" : "APK_HASH_MISMATCH"}_${expected.build}`,
    size: file.size,
    expectedSize: expected.size,
    sha256,
    expectedSha256: expected.sha256,
  };
}
