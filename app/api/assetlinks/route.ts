import { NextResponse } from "next/server";

// Digital Asset Links for the Android app (served at /.well-known/assetlinks.json
// through a rewrite in next.config.ts). Lets the Play Store build open the site
// full screen, without the browser address bar.
//   ANDROID_PACKAGE_NAME              e.g. app.recstudio.twa
//   ANDROID_SHA256_CERT_FINGERPRINTS  comma-separated SHA-256 fingerprints
//                                     (Play Console > App integrity > App signing)
export const dynamic = "force-dynamic";

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME?.trim();
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",").map((f) => f.trim().toUpperCase()).filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
  const body = packageName && fingerprints.length > 0
    ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: packageName, sha256_cert_fingerprints: fingerprints },
      }]
    : [];
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=300" } });
}
