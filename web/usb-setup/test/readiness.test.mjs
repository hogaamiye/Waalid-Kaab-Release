import test from "node:test";
import assert from "node:assert/strict";
import {
  adminComponent,
  checkDevice,
  checkManifest,
  chunkSize,
} from "../src/core.js";

function phone(overrides = {}) {
  return {
    model: "Android phone",
    api: "36",
    emulator: "0",
    user: "0",
    policy: "Current Device Policy Manager state:",
    users: "UserInfo{0:Owner:13}",
    accounts: "Accounts: 0",
    ...overrides,
  };
}

test("first-time enrollment accepts a primary user without accounts", () => {
  assert.equal(checkDevice(phone()).managed, false);
});

test("Companion owner updates remain available with existing accounts", () => {
  assert.equal(
    checkDevice(
      phone({
        policy: `Device Owner:\nadmin=ComponentInfo{${adminComponent}}`,
        accounts: "Accounts: 2",
      }),
    ).managed,
    true,
  );
});

test("an existing owner and accounts are rejected before new enrollment", () => {
  assert.throws(
    () =>
      checkDevice(
        phone({
          policy:
            "Device Owner:\nadmin=ComponentInfo{org.other/org.other.Admin}",
        }),
      ),
    /already manages/,
  );
  assert.throws(
    () => checkDevice(phone({ accounts: "Accounts: 1" })),
    /accounts can prevent/,
  );
});

test("unknown account state, extra users, emulator and old Android fail closed", () => {
  assert.throws(
    () => checkDevice(phone({ accounts: "" })),
    /could not be confirmed/,
  );
  assert.throws(
    () =>
      checkDevice(phone({ users: "UserInfo{0:Owner}\nUserInfo{10:Guest}" })),
    /one Android user/,
  );
  assert.throws(() => checkDevice(phone({ emulator: "1" })), /physical phone/);
  assert.throws(() => checkDevice(phone({ api: "25" })), /Android 8/);
  assert.throws(
    () => checkDevice(phone({ user: "10" })),
    /primary Android user/,
  );
});

test("only bounded, sequential APK parts with a full SHA-256 are accepted", () => {
  const manifest = {
    build: 44,
    size: chunkSize + 3,
    sha256: "a".repeat(64),
    chunks: [
      { path: "apk/part-000.bin", size: chunkSize },
      { path: "apk/part-001.bin", size: 3 },
    ],
  };
  assert.equal(checkManifest(manifest), manifest);
  assert.throws(
    () => checkManifest({ ...manifest, sha256: "invalid" }),
    /invalid/,
  );
  assert.throws(
    () =>
      checkManifest({
        ...manifest,
        chunks: [
          manifest.chunks[0],
          { path: "https://other.invalid/file", size: 3 },
        ],
      }),
    /invalid/,
  );
});
