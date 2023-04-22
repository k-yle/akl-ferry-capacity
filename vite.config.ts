/* eslint-disable import/no-extraneous-dependencies -- this is a config file */
import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";
/* eslint-enable import/no-extraneous-dependencies */

// https://vitejs.dev/config
export default defineConfig(() => {
  return {
    plugins: [reactPlugin()],
    server: {
      port: 5120,
      proxy: {
        "/api": "http://localhost:51200",
      },
    },
  };
});
