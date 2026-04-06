import type { RoomInvitePreview } from "../../../../motor/tipos";
import {
  buildAppInviteUrl,
  buildInviteUrl,
  buildPreviewUrl,
  getInviteStatusLabel,
  resolveWebInviteBaseUrl,
} from "../../../../lib/invitaciones";
import { loadJson, removeItem, saveJson, STORAGE_KEYS } from "./storage";

export interface PendingInvite {
  roomId: string;
  source: "link" | "qr";
}

export function buildMobileInviteUrl(roomId: string): string {
  return buildInviteUrl(roomId, resolveWebInviteBaseUrl());
}

export function buildMobileSchemeInviteUrl(roomId: string): string {
  return buildAppInviteUrl(roomId);
}

export function getInvitePreviewUrl(roomId: string): string {
  return buildPreviewUrl(roomId);
}

export async function loadInvitePreview(roomId: string): Promise<RoomInvitePreview> {
  const response = await fetch(getInvitePreviewUrl(roomId));
  if (!response.ok) {
    throw new Error("No se pudo validar la sala invitada.");
  }

  return (await response.json()) as RoomInvitePreview;
}

export async function savePendingInvite(invite: PendingInvite): Promise<void> {
  await saveJson(STORAGE_KEYS.pendingInvite, invite);
}

export async function getPendingInvite(): Promise<PendingInvite | null> {
  return loadJson<PendingInvite>(STORAGE_KEYS.pendingInvite);
}

export async function clearPendingInvite(): Promise<void> {
  await removeItem(STORAGE_KEYS.pendingInvite);
}

export { getInviteStatusLabel };
