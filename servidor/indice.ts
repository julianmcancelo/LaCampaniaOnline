/**
 * indice.ts — Punto de entrada del servidor.
 * Combina Next.js (para el frontend) con Socket.io (para el multijugador).
 * Ambos corren en el mismo puerto HTTP.
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as ServidorSocket } from "socket.io";
import { registrarEventosSocket } from "./manejadorSocket";

const estaEnDesarrollo = process.env.NODE_ENV !== "production";
const puerto = parseInt(process.env.PORT ?? "3000", 10);

// Inicializar la aplicación Next.js
const appNext = next({ dev: estaEnDesarrollo });
const manejarPeticion = appNext.getRequestHandler();

appNext.prepare().then(() => {
  // Crear servidor HTTP que comparte Next.js y Socket.io
  const servidorHttp = createServer((req, res) => {
    const urlParseada = parse(req.url!, true);
    manejarPeticion(req, res, urlParseada);
  });

  // Inicializar Socket.io en el mismo servidor HTTP
  const io = new ServidorSocket(servidorHttp, {
    cors: {
      origin: "*", // En producción, restringir al dominio real
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Registrar todos los manejadores de eventos del juego
  registrarEventosSocket(io);

  servidorHttp.listen(puerto, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║         🏰 LA CAMPAÑA — Servidor Online       ║
║──────────────────────────────────────────────║
║  URL:  http://localhost:${puerto}               ║
║  Modo: ${estaEnDesarrollo ? "Desarrollo               " : "Producción             "} ║
╚══════════════════════════════════════════════╝
    `);
  });
});
