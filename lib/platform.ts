// True when the site runs inside the Android app from Google Play (Trusted Web
// Activity). Google Play does not allow external payment links inside the app,
// so payment details are only shown on the web.
const KEY = "running-in-android-app";

export function isAndroidApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (document.referrer.startsWith("android-app://")) sessionStorage.setItem(KEY, "1");
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return document.referrer.startsWith("android-app://");
  }
}
