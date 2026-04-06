import { parse } from "url";
import next from "next";
import { crearServidorTiempoReal } from "./crearServidorTiempoReal";
import { getPort, isDevelopment } from "./config";

const estaEnDesarrollo = isDevelopment();
const puerto = getPort();

const appNext = next({ dev: estaEnDesarrollo });
const manejarPeticion = appNext.getRequestHandler();

appNext.prepare().then(() => {
  const { servidorHttp } = crearServidorTiempoReal((req, res) => {
    const urlParseada = parse(req.url ?? "/", true);
    manejarPeticion(req, res, urlParseada);
  });

  servidorHttp.listen(puerto, () => {
    console.log(
      `[La Campaña] servidor unificado listo en http://localhost:${puerto} (${estaEnDesarrollo ? "desarrollo" : "produccion"})`,
    );
  });
});
