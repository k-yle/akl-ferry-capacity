import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";

// https://vitejs.dev/config
export default defineConfig(() => {
  return {
    plugins: [reactPlugin()],
    server: {
      port: 5120,
    },
  };
});
