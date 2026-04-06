# La Campaña Mobile

Cliente nativo en `React Native + Expo` para acompañar la versión web de La Campaña.

## Estado actual

- conexión real al backend Socket.io
- lobby nativo con creación y unión a salas
- sala de espera con `listo` e inicio de partida
- vista base de batalla con:
  - fase actual
  - progreso de castillos
  - jugadores conectados
  - acciones simples del flujo
  - bitácora de eventos

## Correr el proyecto

1. Crear `apps/mobile/.env` a partir de `.env.example`
2. Desde la raíz del repo:

```bash
npm run mobile:start
```

Opciones útiles:

```bash
npm run mobile:android
npm run mobile:web
npm run mobile:typecheck
```

## Estructura

- `src/app`: rutas Expo Router
- `src/components`: UI nativa del cliente
- `src/hooks`: bootstrap de socket y efectos globales
- `src/lib`: socket y utilidades de acciones
- `src/store`: estado cliente con Zustand
- `src/theme`: tokens visuales del cliente mobile

## Próximos pasos

- portar interacción táctica completa de mano, campo y objetivos
- adaptar drag and drop web a flujo táctil guiado
- mover más lógica compartida del cliente a módulos reutilizables
- preparar navegación y layouts específicos para teléfono y tablet
