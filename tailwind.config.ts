import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
      colors: {
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        // Cores customizadas do Figma
        brand: {
          yellow: 'var(--brand-yellow)',
          'yellow-light': 'var(--brand-yellow-light)',
          'yellow-lighter': 'var(--brand-yellow-lighter)',
          blue: 'var(--brand-blue)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          dark: 'var(--text-dark)',
        },
        status: {
          'error-bg': 'var(--status-error-bg)',
          'error-text': 'var(--status-error-text)',
          'warning-bg': 'var(--status-warning-bg)',
          'warning-text': 'var(--status-warning-text)',
          'success-bg': 'var(--status-success-bg)',
          'success-text': 'var(--status-success-text)',
        },
        border: {
          DEFAULT: 'var(--border)',
          default: 'var(--border-default)',
        },
        bg: {
          DEFAULT: 'var(--background)',
          secondary: 'var(--bg-secondary)',
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
