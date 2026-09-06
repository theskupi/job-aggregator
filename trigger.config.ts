import { defineConfig } from "@trigger.dev/sdk";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
export default defineConfig({
  project: "proj_mbffclcfpeuitsqttnfw",
  runtime: "node-26",
  dirs: ["./src/trigger"],
  maxDuration: 300,
  build: {
    // apify-client dynamically imports the CommonJS proxy-agent package.
    // Keeping both external preserves Node's native CJS/ESM interop.
    external: ["apify-client", "proxy-agent"],
    extensions: [additionalFiles({ files: ["./config/**/*.json"] })],
  },
});
