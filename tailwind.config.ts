import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        quest: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          850: "#141e33",
          900: "#0f172a",
          950: "#090d16",
        },
        column: {
          d90: {
            bg: "#ecfdf5",
            border: "#a7f3d0",
            header: "#065f46",
            badge: "#10b981",
            text: "#064e3b"
          },
          d60: {
            bg: "#f0f9ff",
            border: "#bae6fd",
            header: "#075985",
            badge: "#0ea5e9",
            text: "#0c4a6e"
          },
          d30: {
            bg: "#fffbeb",
            border: "#fde68a",
            header: "#92400e",
            badge: "#f59e0b",
            text: "#78350f"
          },
          risk: {
            bg: "#fef2f2",
            border: "#fecaca",
            header: "#991b1b",
            badge: "#ef4444",
            text: "#7f1d1d"
          }
        }
      },
      boxShadow: {
        'card': '0 2px 10px -2px rgba(15, 23, 42, 0.08), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
        'column': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;
