import { crearServidorTiempoReal } from "./crearServidorTiempoReal";
import { getPort } from "./config";
import { getRoomInvitePreview } from "./manejadorSalas";

const puerto = getPort();

const { servidorHttp } = crearServidorTiempoReal((req, res) => {
  const url = req.url ?? "/";
  const matchPreview = url.match(/^\/api\/rooms\/([^/]+)\/preview$/);
  if (matchPreview) {
    const preview = getRoomInvitePreview(decodeURIComponent(matchPreview[1]));
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(preview));
    return;
  }

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
