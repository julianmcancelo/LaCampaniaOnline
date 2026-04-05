import type { Config } from "tailwindcss";

/* Configuración de Tailwind CSS con el tema visual de La Campaña */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./componentes/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* Paleta de colores inspirada en el sitio oficial de La Campaña */
      colors: {
        campana: {
          /* Verdes oscuros — fondo principal y superficies */
          verde: {
            950: "#061410",
            900: "#0d2318",
            800: "#1a4a3a",
            700: "#245e4a",
            600: "#2e7a5e",
            500: "#3a9a76",
          },
          /* Dorados — acentos, bordes y detalles */
          dorado: {
            200: "#faf0c8",
            300: "#f5d98a",
            400: "#e8c45a",
            500: "#d4a017",
            600: "#a07810",
            700: "#7a5808",
          },
          /* Pergamino — fondos de cartas y paneles */
          pergamino: "#e8dcc4",
          pergaminoOscuro: "#c8b898",
          /* Sangre — elementos de daño y peligro */
          sangre: "#8b1a1a",
          sangreBrillante: "#c0392b",
          /* Neutros */
          crema: "#f5f0e8",
          carbon: "#1a1a1a",
        },
      },
      /* Tipografías medievales */
      fontFamily: {
        medieval: ["Cinzel Decorative", "Georgia", "serif"],
        cuerpo: ["Cinzel", "Georgia", "serif"],
        mono: ["Courier Prime", "Courier New", "monospace"],
      },
      /* Imágenes de fondo con texturas */
      backgroundImage: {
        "fieltro-oscuro": "url('/texturas/fieltro-oscuro.png')",
        pergamino: "url('/texturas/pergamino.png')",
        piedra: "url('/texturas/piedra.png')",
        madera: "url('/texturas/madera.png')",
        "gradiente-campana":
          "linear-gradient(135deg, #0d2318 0%, #1a4a3a 50%, #0d2318 100%)",
        "gradiente-dorado":
          "linear-gradient(135deg, #7a5808 0%, #d4a017 50%, #7a5808 100%)",
      },
      /* Sombras especiales para cartas y elementos del juego */
      boxShadow: {
        "brillo-dorado": "0 0 15px rgba(212, 160, 23, 0.6)",
        "brillo-dorado-intenso": "0 0 25px rgba(212, 160, 23, 0.9)",
        carta: "0 4px 16px rgba(0,0,0,0.6)",
        "carta-hover":
          "0 8px 32px rgba(0,0,0,0.8), 0 0 12px rgba(212, 160, 23, 0.3)",
        "carta-seleccionada":
          "0 0 0 3px #d4a017, 0 8px 32px rgba(0,0,0,0.8)",
        danio: "0 0 20px rgba(192, 57, 43, 0.8)",
      },
      /* Animaciones personalizadas */
      keyframes: {
        pulsoDorado: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(212, 160, 23, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(212, 160, 23, 0.9)" },
        },
        flotarCarta: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        sacudirAtaque: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        "pulso-dorado": "pulsoDorado 2s ease-in-out infinite",
        "flotar-carta": "flotarCarta 3s ease-in-out infinite",
        "sacudir-ataque": "sacudirAtaque 0.4s ease-in-out",
      },
      /* Bordes redondeados para cartas */
      borderRadius: {
        carta: "8px",
        "carta-grande": "12px",
      },
    },
  },
  plugins: [],
};

export default config;
