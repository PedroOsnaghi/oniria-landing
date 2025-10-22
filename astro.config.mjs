// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

import glsl from "vite-plugin-glsl";

// https://astro.build/config
export default defineConfig({
  site: "https://www.oniria3d.com.ar", // TODO
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss(), glsl()],
  },
});
