import { crearServidorTiempoReal } from "./crearServidorTiempoReal";
import { getPort } from "./config";

const puerto = getPort();

const { servidorHttp } = crearServidorTiempoReal((req, res) => {
  const url = req.url ?? "/";

  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, service: "la-campania-backend" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(
    JSON.stringify({
      service: "la-campania-backend",
      ok: true,
      health: "/health",
      realtime: "socket.io",
    }),
  );
});

servidorHttp.listen(puerto, () => {
  console.log(`[La Campaña] backend realtime listo en puerto ${puerto}`);
});
