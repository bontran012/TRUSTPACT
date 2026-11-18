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
          bg: "#070A11",
          surface: "#0D121D",
          elevated: "#131A29",
          border: "rgba(255, 255, 255, 0.08)",
          panel: "#0D121D",
        },
        brand: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
          light: "#818CF8",
          soft: "rgba(99, 102, 241, 0.12)",
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
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255, 255, 255, 0.05) inset, 0 12px 32px -12px rgba(0, 0, 0, 0.6)",
        elevated: "0 1px 0 0 rgba(255, 255, 255, 0.08) inset, 0 20px 44px -12px rgba(0, 0, 0, 0.75)",
        glow: "0 0 24px -4px rgba(99, 102, 241, 0.35)",
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
