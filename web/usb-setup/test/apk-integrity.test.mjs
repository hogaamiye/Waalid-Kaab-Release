import assert from "node:assert/strict";
import test from "node:test";
import { createHash, webcrypto } from "node:crypto";
import { checkApk, validateRelease } from "../src/apk-integrity.js";

const bytes = Buffer.from("APK fixture bytes");
const release = { build: 54, size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
const file = payload => ({ size: payload.length, arrayBuffer: async () => Uint8Array.from(payload).buffer });

test("matching byte count and checksum identify the exact release", async () => {
  assert.equal((await checkApk(file(bytes), release, webcrypto.subtle)).code, "APK_OK_54");
});
test("a same-size altered file is rejected", async () => {
  const altered = Buffer.from(bytes); altered[0] ^= 1;
  assert.equal((await checkApk(file(altered), release, webcrypto.subtle)).code, "APK_HASH_MISMATCH_54");
});
test("partial downloads are rejected without loading the entire file into memory", async () => {
  const partial = { size: bytes.length - 1, arrayBuffer: () => { throw Error("Must not read"); } };
  const result = await checkApk(partial, release, webcrypto.subtle);
  assert.equal(result.code, "APK_SIZE_MISMATCH_54");
  assert.equal(result.expectedSize, bytes.length);
});
test("invalid metadata never enables a successful check", () => {
  for (const invalid of [null, {}, {...release, size: -1}, {...release, size: 301 * 1024 * 1024}, {...release, sha256: "invalid"}, {...release, build: 0}]) {
    assert.throws(() => validateRelease(invalid));
  }
});
