import type { Config } from 'tailwindcss';

/**
 * Design system NkapZen
 * — primary : bleu marine (couleur d'action, navigation, en-têtes)
 * — accent  : or / laiton (accents premium, emblème, états clés)
 * — surface : fonds neutres clairs
 * Les neutres de texte/bordures utilisent l'échelle `slate` de Tailwind.
 * On évite volontairement les couleurs ad-hoc (indigo/violet/emerald…).
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bleu marine — couleur primaire de la marque NkapZen
        primary: {
          50: '#f0f4fa',
          100: '#dbe4f1',
          200: '#bccee3',
          300: '#92accf',
          400: '#5f80b0',
          500: '#3c5d91',
          600: '#2a4575',
          700: '#1d325b',
          800: '#162848', // marine du mot-symbole
          900: '#0f1c33',
          950: '#0a1326',
        },
        // Or / laiton — accent premium (emblème, surlignes, états)
        accent: {
          50: '#fbf7ec',
          100: '#f6ecca',
          200: '#eed896',
          300: '#e3be57',
          400: '#d9a838',
          500: '#c6902a', // or du bouclier
          600: '#a9741f',
          700: '#86571c',
          800: '#6e461d',
          900: '#3d2710',
        },
        // Alias rétro-compat : `brand-*` pointe désormais vers le marine
        brand: {
          50: '#f0f4fa',
          100: '#dbe4f1',
          500: '#3c5d91',
          600: '#2a4575',
          700: '#1d325b',
          900: '#0f1c33',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f6f7f9',
          tertiary: '#eef1f5',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 40 72 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(16 40 72 / 0.12), 0 2px 6px -2px rgb(16 40 72 / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'nav-progress': 'navProgress 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        navProgress: {
          '0%': { transform: 'translateX(-100%)' },
          '60%': { transform: 'translateX(30%)' },
          '100%': { transform: 'translateX(110%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
