// Single source for the app identity used by the web manifest, the legal
// pages and the Android (Play Store) wrapper.
export const APP_NAME = "Ferrea";
export const APP_SHORT_NAME = "Ferrea";
export const APP_DESCRIPTION = "Il tuo studio professionale. Sempre con te. Clienti, schede, diete e progressi per personal trainer.";
export const THEME_COLOR = "#080808";
export const LEGAL_OWNER = process.env.NEXT_PUBLIC_LEGAL_OWNER || "";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.NEXT_PUBLIC_BILLING_EMAIL || "";
