import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server as ServidorSocket } from "socket.io";
import { getAllowedOrigins } from "./config";
import { registrarEventosSocket } from "./manejadorSocket";

export function crearServidorTiempoReal(
  requestHandler: (req: IncomingMessage, res: ServerResponse) => void,
) {
  const servidorHttp = createServer(requestHandler);

  const io = new ServidorSocket(servidorHttp, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  registrarEventosSocket(io);

  return { servidorHttp, io };
}
