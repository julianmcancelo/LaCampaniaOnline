import { ANDROID_DEBUG_SHA256, ANDROID_PACKAGE_NAME } from "../../../lib/invitaciones";

export function GET() {
  return Response.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: [ANDROID_DEBUG_SHA256],
      },
    },
  ]);
}
