import {defineConfig} from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        composition: "index.html",
        preview: "preview.html"
      }
    }
  }
});
