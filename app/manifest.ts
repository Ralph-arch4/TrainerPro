import type { MetadataRoute } from "next";
import { APP_NAME, APP_SHORT_NAME, APP_DESCRIPTION, THEME_COLOR } from "@/lib/brand";

// Web app manifest: makes the app installable and is what the Android
// Trusted Web Activity (Play Store build, see docs/PLAY_STORE.md) reads.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    lang: "it",
    dir: "ltr",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    categories: ["health", "fitness", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Clienti", url: "/dashboard/clienti", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Nuovo cliente", url: "/dashboard/clienti?new=1", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
