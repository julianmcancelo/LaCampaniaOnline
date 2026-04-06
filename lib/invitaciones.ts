import type { RoomInvitePreview } from "../motor/tipos";

export const APP_SCHEME = "lacampania";
export const DEFAULT_WEB_URL = "https://la-campania.vercel.app";
export const DEFAULT_BACKEND_URL = "https://lacampaniaonline.onrender.com";
export const ANDROID_APP_LINK_HOST = "la-campania.vercel.app";
export const ANDROID_APP_LINK_PATH_PREFIX = "/invitar/";
export const ANDROID_DEBUG_SHA256 = "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C";
export const ANDROID_PACKAGE_NAME = "com.jcancelo.lacampaniamobile";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveWebInviteBaseUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_WEB_URL);
}

export function resolveBackendBaseUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || DEFAULT_BACKEND_URL);
}

export function buildInvitePath(roomId: string): string {
  return `/invitar/${roomId}`;
}

export function buildInviteUrl(roomId: string, baseUrl = resolveWebInviteBaseUrl()): string {
  return `${trimTrailingSlash(baseUrl)}${buildInvitePath(roomId)}`;
}

export function buildAppInviteUrl(roomId: string): string {
  return `${APP_SCHEME}://invitacion/${roomId}`;
}

export function buildPreviewUrl(roomId: string, backendUrl = resolveBackendBaseUrl()): string {
  return `${trimTrailingSlash(backendUrl)}/api/rooms/${roomId}/preview`;
}

export function getInviteStatusLabel(status: RoomInvitePreview["status"]): string {
  switch (status) {
    case "available":
      return "Disponible";
    case "full":
      return "Completa";
    case "started":
      return "En partida";
    case "closed":
      return "Cerrada";
    default:
      return "No encontrada";
  }
}
