import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import createDocsRouter from "../../routes/docsRoutes.js";
import buildOpenApiSpec from "../../docs/openapi.js";

/**
 * Test de integración chiquito del router de documentación (Clase 15).
 * Se monta SOLO este router en una app de Express nueva: no hace falta el contenedor, ni .env, ni base de datos.
 * `supertest` le hace pedidos HTTP a la app sin abrir un puerto.
 */
const app = express().use(createDocsRouter(buildOpenApiSpec({ serverUrl: "http://localhost:8000" })));

describe("router de documentación", () => {
  it("GET /openapi.json devuelve el contrato en JSON", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toMatchObject({ openapi: "3.1.0", servers: [{ url: "http://localhost:8000" }] });
  });

  it("GET /docs/ sirve la página de Swagger UI", async () => {
    const res = await request(app).get("/docs/");

    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });
});
