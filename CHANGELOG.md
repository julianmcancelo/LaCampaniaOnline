# Changelog

## 0.0.2 - 2026-04-06

Release candidata para pruebas cerradas de invitaciones online y validación con testers cercanos.

### Mobile
- invitaciones por enlace HTTPS y por QR para salas `1v1`
- nueva ruta interna de invitación con confirmación previa al join
- reanudación de invitación pendiente después de acceso u onboarding
- panel de compartir en sala con copiar enlace, copiar código, compartir y mostrar QR
- app links Android para `https://la-campania.vercel.app/invitar/...`
- mejoras de flujo online mobile para entrar a sala desde enlace y validar disponibilidad

### Web y backend
- nueva landing pública de invitación en `/invitar/[roomId]`
- preview de sala para invitaciones desde backend
- archivo `assetlinks.json` para asociar dominio web con la app Android

### Notas importantes
- para que el flujo HTTPS completo funcione en producción hay que redeployar Render y Vercel
- el online mobile sigue enfocado en `Duelo / 2 jugadores`
- `3 jugadores`, `4 jugadores` y `Alianzas` siguen como `Próximamente`

## 0.0.1 - 2026-04-06

Primera release de prueba para validación cerrada.

### Mobile
- acceso con Google y modo invitado limitado
- perfil persistido con Firebase Auth + Firestore
- foto de perfil de Google con escudo temático como fallback
- puntos, estadísticas y ranking básico
- menú online mobile limitado a duelo 1v1
- modos de 3 jugadores, 4 jugadores y alianzas marcados como `Próximamente`
- mejoras visuales en mesa táctica para tablet y celular

### Notas de prueba
- esta APK release está pensada para pruebas cercanas con personas de confianza
- el online realtime sigue usando el backend actual en Render
- Google Play Games todavía no está integrado en esta versión
