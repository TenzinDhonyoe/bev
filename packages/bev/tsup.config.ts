import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

// Bundles the shared ../../lib code (Jev adapter, validation, Bev's scripts) into
// the package, so the website and the package can never drift apart.
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const shared = {
  format: "esm" as const,
  target: "node22",
  platform: "node" as const,
  external: ["ai"],
  define: { __BEV_VERSION__: JSON.stringify(version) },
};

export default defineConfig([
  { ...shared, entry: { index: "src/index.ts" }, dts: true, clean: true },
  { ...shared, entry: { cli: "src/cli.ts" }, banner: { js: "#!/usr/bin/env node" } },
]);
