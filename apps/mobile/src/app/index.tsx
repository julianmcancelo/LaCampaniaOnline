import { Redirect } from "expo-router";
import { useProfileStore } from "../store/profile-store";

export default function Index() {
  const hydrated = useProfileStore((state) => state.hydrated);
  const profile = useProfileStore((state) => state.profile);

  if (!hydrated) {
    return null;
  }

  if (!profile?.perfilCompleto) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={"/local" as never} />;
}
