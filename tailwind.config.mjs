export default {
    content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
    theme: {
        extend: {
            fontFamily: {
                righteous: ['Righteous', 'sans-serif'],
                inder: ['Inder', 'sans-serif'],
            },
            colors: {
                bg1: '#0b0810',
                bg2: '#1b0f2a',
                bg3: '#06050b',
                blanco: '#FFFFFF',
                grisClaro: '#BFBFBF',
                grisclarotwo: '#BFBFBF',
                violetaOscuro: '#7305DA',
                violetaClaro: '#B987FF',
                blancoGris: '#C5C3C3',
                rosaClaro: '#E785FF',
                fuchsia: { 400: '#e879f9', 500: '#d946ef', 600: '#c026d3' },
                violet: { 400: '#a78bfa', 500: '#8b5cf6', 700: '#5b21b6' }
            },
            boxShadow: {
                glow: '0 0 40px 10px rgba(216,70,239,.25)',
                soft: '0 8px 40px rgba(0,0,0,.35)'
            },
            backgroundImage: {
                'oniria-radial': 'radial-gradient(60% 80% at 50% 0%, var(--bg-1) 0%, var(--bg-2) 55%, var(--bg-3) 100%)',
                'oniria-hero': 'radial-gradient(800px 400px at 50% 0%, rgba(216,70,239,.25), rgba(0,0,0,0))'
            }
        }
    },
    plugins: []
};
