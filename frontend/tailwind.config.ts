import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#0B0F17",
          surface: "#111827",
          elevated: "#151E2E",
          border: "rgba(255, 255, 255, 0.08)",
          panel: "#111827",
        },
        brand: {
          DEFAULT: "#2563EB",
          hover: "#3B82F6",
          light: "#60A5FA",
          soft: "rgba(37, 99, 235, 0.12)",
        },
        success: {
          DEFAULT: "#10B981",
          soft: "rgba(16, 185, 129, 0.12)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          soft: "rgba(245, 158, 11, 0.12)",
        },
        danger: {
          DEFAULT: "#EF4444",
          soft: "rgba(239, 68, 68, 0.12)",
        },
        t: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
        fin: {
          safe: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Be Vietnam Pro",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.3)",
        elevated: "0 4px 12px rgba(0, 0, 0, 0.35)",
        glow: "0 0 0 2px rgba(59, 130, 246, 0.18)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};

export default config;
