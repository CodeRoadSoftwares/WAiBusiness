/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // WhatsApp brand & UI palette (light + dark)
        wa: {
          brand: "#25D366",
          brandDark: "#128C7E",
          link: {
            light: "#027EB5",
            dark: "#53BDEB",
          },
          icon: {
            light: "#54656F",
            dark: "#8696A0",
          },
          text: {
            primary: {
              light: "#111B21",
              dark: "#E9EDEF",
            },
            secondary: {
              light: "#667781",
              dark: "#8696A0",
            },
          },
          bg: {
            app: {
              light: "#F0F2F5",
              dark: "#111B21",
            },
            panel: {
              light: "#FFFFFF",
              dark: "#202C33",
            },
            panelHeader: {
              light: "#F0F2F5",
              dark: "#202C33",
            },
            chat: {
              light: "#FCF5EB",
              dark: "#0B141A",
            },
          },
          border: {
            light: "#E9EDEF",
            dark: "#2A3942",
          },
          bubble: {
            incoming: {
              light: "#FFFFFF",
              dark: "#202C33",
            },
            outgoing: {
              light: "#D9FDD3",
              dark: "#005C4B",
            },
          },
        },
      },
      fontFamily: {
        // WhatsApp uses a clean system UI stack
        sans: [
          "Segoe UI",
          "Helvetica Neue",
          "Helvetica",
          "Ubuntu",
          "Noto Sans",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },
      boxShadow: {
        // Subtle separators and panel shadows similar to WhatsApp Web
        waHeader: "0 1px 0 0 rgba(0,0,0,0.06)",
        waPanel: "0 0 2px rgba(0,0,0,0.06), 0 0 32px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        // Default rounded chat bubble radius
        wa: "30px",
      },
      padding: {
        wa: "36px",
      },
    },
  },
  plugins: [],
};
