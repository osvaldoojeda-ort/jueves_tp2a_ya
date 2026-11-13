import { defineConfig } from "vitest/config";

/**
 * Configuración de Vitest (Clase 14).
 * - Solo corre los archivos *.test.js de la carpeta tests/ (no hace falta levantar el servidor ni tener un .env).
 * - restoreMocks: después de cada test se deshacen los vi.spyOn (por ejemplo, el silenciado de console.warn).
 * - La cobertura se mide sobre lo que testeamos hoy: dominio, casos de uso y utilidades.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["domain/**", "usecases/**", "utils/**"],
      reporter: ["text", "html"], // "html" deja un reporte navegable en coverage/index.html
    },
  },
});
