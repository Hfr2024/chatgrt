import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" يجعل التطبيق يعمل على GitHub Pages مهما كان اسم المستودع
export default defineConfig({
  base: "./",
  plugins: [react()],
});
