// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";
import * as packageJson from "./package.json";
import { createRequire } from "module";

const prismaClientPath = createRequire(import.meta.url)
  .resolve("@prisma/client")
  .replace("@prisma/client/default.js", ".prisma/client/index-browser.js");

export default defineNuxtConfig({
  compatibilityDate: "2025-02-16",
  devtools: { enabled: true },
  modules: [
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
    "@primevue/nuxt-module",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "@nuxt/image",
    "nuxt-auth-utils",
    "@prisma/nuxt",
    "@nuxtjs/mdc",
  ],
  tailwindcss: { exposeConfig: true },
  css: ["primeicons/primeicons.css"],
  build: {
    transpile: ["primevue"],
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          prefix: "p",
          darkModeSelector: ".dark",
          cssLayer: false,
        },
      },
    },
  },
  vite: {
    server: {
      fs: {
        allow: [".."],
      },
    },
  },
  app: {
    // pageTransition: { name: "page", mode: "out-in" }, Disabled due to errors with HMR -> https://github.com/nuxt/nuxt/issues/29289
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
  alias: {
    quill: import.meta.dev ? "quill/dist/quill.js" : "quill",
    ".prisma/client/index-browser": prismaClientPath,
  },
  nitro: {
    experimental: {
      openAPI: true,
      websocket: true,
    },
    openAPI: {
      meta: {
        title: "BoardStack API",
        description:
          "To test requests on this page, you can login on BoardStack and come back here.",
        version: packageJson.version,
      },
      production: "prerender",
      route: "/api-docs/_openapi.json",
      ui: {
        scalar: {
          route: "/api-docs/scalar",
        },
        swagger: {
          route: "/api-docs/swagger",
        },
      },
    },
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },
  runtimeConfig: {
    public: {
      enableRegistration: process.env.ENABLE_REGISTRATION,
    },
  },
  prisma: {
    runMigration: true,
    skipPrompts: true,
  },
  mdc: {
    headings: {
      anchorLinks: false,
    },
  },
});
