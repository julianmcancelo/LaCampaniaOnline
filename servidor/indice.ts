import { parse } from "url";
import next from "next";
import { crearServidorTiempoReal } from "./crearServidorTiempoReal";
import { getPort, isDevelopment } from "./config";
import { getRoomInvitePreview } from "./manejadorSalas";

const estaEnDesarrollo = isDevelopment();
const puerto = getPort();

const appNext = next({ dev: estaEnDesarrollo });
const manejarPeticion = appNext.getRequestHandler();

appNext.prepare().then(() => {
  const { servidorHttp } = crearServidorTiempoReal((req, res) => {
    const urlParseada = parse(req.url ?? "/", true);
    const matchPreview = urlParseada.pathname?.match(/^\/api\/rooms\/([^/]+)\/preview$/);
    if (matchPreview) {
      const preview = getRoomInvitePreview(decodeURIComponent(matchPreview[1]));
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(preview));
      return;
    }
    manejarPeticion(req, res, urlParseada);
  });

  servidorHttp.listen(puerto, () => {
    console.log(
      `[La Campaña] servidor unificado listo en http://localhost:${puerto} (${estaEnDesarrollo ? "desarrollo" : "produccion"})`,
    );
  });
});
