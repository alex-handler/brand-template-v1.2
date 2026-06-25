import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://brand-template-v1-2.pages.dev",
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});
