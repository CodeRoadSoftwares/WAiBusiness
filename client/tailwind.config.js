/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", "class"],
  theme: {
  	extend: {
  		colors: {
  			wa: {
  				brand: '#25D366',
  				brandDark: '#128C7E',
  				link: {
  					light: '#027EB5',
  					dark: '#53BDEB'
  				},
  				icon: {
  					light: '#54656F',
  					dark: '#8696A0'
  				},
  				text: {
  					primary: {
  						light: '#111B21',
  						dark: '#E9EDEF'
  					},
  					secondary: {
  						light: '#667781',
  						dark: '#8696A0'
  					}
  				},
  				bg: {
  					app: {
  						light: '#F0F2F5',
  						dark: '#111B21'
  					},
  					panel: {
  						light: '#FFFFFF',
  						dark: '#202C33'
  					},
  					panelHeader: {
  						light: '#F0F2F5',
  						dark: '#202C33'
  					},
  					chat: {
  						light: '#FCF5EB',
  						dark: '#0B141A'
  					}
  				},
  				border: {
  					light: '#E9EDEF',
  					dark: '#2A3942'
  				},
  				bubble: {
  					incoming: {
  						light: '#FFFFFF',
  						dark: '#202C33'
  					},
  					outgoing: {
  						light: '#D9FDD3',
  						dark: '#005C4B'
  					}
  				}
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Segoe UI',
  				'Helvetica Neue',
  				'Helvetica',
  				'Ubuntu',
  				'Noto Sans',
  				'Arial',
  				'sans-serif',
  				'Apple Color Emoji',
  				'Segoe UI Emoji',
  				'Segoe UI Symbol'
  			]
  		},
  		boxShadow: {
  			waHeader: '0 1px 0 0 rgba(0,0,0,0.06)',
  			waPanel: '0 0 2px rgba(0,0,0,0.06), 0 0 32px rgba(0,0,0,0.05)'
  		},
  		borderRadius: {
  			wa: '30px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		padding: {
  			wa: '36px'
  		},
  		keyframes: {
  			spinPulse: {
  				'0%': {
  					transform: 'rotate(0deg)'
  				},
  				'25%': {
  					transform: 'rotate(360deg)'
  				},
  				'50%': {
  					transform: 'rotate(720deg)'
  				},
  				'75%': {
  					transform: 'rotate(1080deg)'
  				},
  				'100%': {
  					transform: 'rotate(1440deg)'
  				}
  			}
  		},
  		animation: {
  			'spin-pulse': 'spinPulse 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
