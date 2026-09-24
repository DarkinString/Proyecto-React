import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Los plugins permiten a Vite transformar JSX y generar los estilos de Tailwind.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
