import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Notion Light Theme Colors
        notion: {
          bg: '#ffffff',
          bgHover: '#f1f1f0',
          bgActive: '#ebebea',
          border: 'rgba(55, 53, 47, 0.16)',
          text: '#37352f',
          textSecondary: 'rgba(55, 53, 47, 0.65)',
          textDivider: 'rgba(55, 53, 47, 0.09)',
          // Tag colors
          tagGray: 'rgba(227, 226, 224, 0.5)',
          tagGrayText: '#32302C',
          tagBrown: '#E9E5E3',
          tagBrownText: '#4A3219',
          tagOrange: '#FAEBDD',
          tagOrangeText: '#D9730D',
          tagYellow: '#FBF3DB',
          tagYellowText: '#CB912F',
          tagGreen: '#DDEDEA',
          tagGreenText: '#0F7B6C',
          tagBlue: '#DDEBF1',
          tagBlueText: '#0B6E99',
          tagPurple: '#EAE4F2',
          tagPurpleText: '#6940A5',
          tagPink: '#F4DFEB',
          tagPinkText: '#AD1A72',
          tagRed: '#FBE4E4',
          tagRedText: '#E03E3E',
        },
        // Notion Dark Theme Colors
        notionDark: {
          bg: '#191919',
          bgHover: '#252525',
          bgActive: '#2f2f2f',
          border: 'rgba(255, 255, 255, 0.13)',
          text: 'rgba(255, 255, 255, 0.81)',
          textSecondary: 'rgba(255, 255, 255, 0.44)',
          textDivider: 'rgba(255, 255, 255, 0.09)',
          // Tag colors
          tagGray: 'rgba(255, 255, 255, 0.055)',
          tagGrayText: 'rgba(255, 255, 255, 0.65)',
          tagBrown: 'rgba(140, 46, 0, 0.2)',
          tagBrownText: '#BA856F',
          tagOrange: 'rgba(245, 93, 0, 0.2)',
          tagOrangeText: '#C77D48',
          tagYellow: 'rgba(233, 168, 0, 0.2)',
          tagYellowText: '#CA9849',
          tagGreen: 'rgba(0, 135, 107, 0.2)',
          tagGreenText: '#529E72',
          tagBlue: 'rgba(0, 120, 223, 0.2)',
          tagBlueText: '#5E87C9',
          tagPurple: 'rgba(103, 36, 222, 0.2)',
          tagPurpleText: '#9D68D3',
          tagPink: 'rgba(221, 0, 129, 0.2)',
          tagPinkText: '#D15796',
          tagRed: 'rgba(255, 0, 26, 0.2)',
          tagRedText: '#DF5452',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', '"Apple Color Emoji"', 'Arial', 'sans-serif', '"Segoe UI Emoji"', '"Segoe UI Symbol"'],
      },
      boxShadow: {
        'notion': 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
        'notion-dropdown': 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
        'notion-dark': 'rgba(255, 255, 255, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.4) 0px 3px 6px, rgba(0, 0, 0, 0.6) 0px 9px 24px',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-in forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
