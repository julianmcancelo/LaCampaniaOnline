import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getPendingInvite } from "../lib/invitaciones";
import { useProfileStore } from "../store/profile-store";

export default function Index() {
  const hydrated = useProfileStore((state) => state.hydrated);
  const authStatus = useProfileStore((state) => state.authStatus);
  const profile = useProfileStore((state) => state.profile);
  const [pendingInviteRoomId, setPendingInviteRoomId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getPendingInvite().then((invite) => {
      if (active) {
        setPendingInviteRoomId(invite?.roomId ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!hydrated) {
    return null;
  }

  if (authStatus !== "authenticated") {
    return <Redirect href={"/acceso" as never} />;
  }

  if (!profile?.perfilCompleto) {
    return <Redirect href="/onboarding" />;
  }

  if (pendingInviteRoomId) {
    return <Redirect href={`/invitacion/${pendingInviteRoomId}` as never} />;
  }

  return <Redirect href={"/local" as never} />;
}
