import { Redirect } from "expo-router";

export default function PantallaJugar() {
  return <Redirect href={"/local" as never} />;
}
