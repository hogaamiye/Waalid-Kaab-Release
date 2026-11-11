import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

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
