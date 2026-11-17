import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/app.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "chrome120",
  outfile: "dist/app.js",
  minify: true,
  legalComments: "linked",
});
for (const name of ["index.html", "style.css"]) {
  await copyFile(name, `dist/${name}`);
}
execFileSync(process.platform === "win32" ? "python" : "python3", [
  "../../scripts/package-wireless-setup.py",
  "dist/waalid-kaab-wireless-setup.zip",
], { stdio: "inherit" });
