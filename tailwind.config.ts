import {heroui} from '@heroui/theme';
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/globals.css",
    "// Ensure this line is present",
    "./node_modules/@heroui/theme/dist/components/(accordion|divider).js"
  ],
   theme: {
   	extend: {
      colors: {
        'rh': {
          'white': '#ffffff',
          'yellow': '#ffc65a',
          'purple': {
            'light': '#7f819e',
            'dark': '#402c7f'
          },
          'orange': '#f483f5',
          'pink': '#c32c9a',
          'navy': {
            'light': '#21215b',
            'dark': '#0a0037'
          },
          'background': '#030c1b'
        }
      },
      fontFamily: {
        'terminal': ['Terminal Grotesque', 'Gotham', 'sans-serif'],
        'gotham': ['Gotham', 'sans-serif'],
        'agrandir': ['Agrandir Wide', 'sans-serif'],
        'jakarta': ['Plus Jakarta Sans', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
        'glow': '0 0 20px rgba(255, 196, 90, 0.5)',
        'glow-lg': '0 0 40px rgba(255, 196, 90, 0.8)'
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px'
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
          '3xl': '1600px',
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideInUp 0.6s ease-out forwards',
        'fade-scale': 'fadeInScale 0.5s ease-out forwards',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite'
      },
   		keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px #ffc65a, 0 0 10px #ffc65a, 0 0 15px #ffc65a'
          },
          '50%': { 
            boxShadow: '0 0 10px #ffc65a, 0 0 20px #ffc65a, 0 0 30px #ffc65a'
          }
        },
        slideInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        fadeInScale: {
          from: {
            opacity: '0',
            transform: 'scale(0.8)'
          },
          to: {
            opacity: '1',
            transform: 'scale(1)'
          }
        },
   			'accordion-down': {
   				from: {
   					height: '0'
   				},
   				to: {
   					height: 'var(--radix-accordion-content-height)'
   				}
   			},
   			'accordion-up': {
   				from: {
   					height: 'var(--radix-accordion-content-height)'
   				},
   				to: {
   					height: '0'
   				}
   			}
   		}
   	}
   },
  plugins: [heroui()],
};
export default config;