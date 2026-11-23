// Single source for the app identity used by the web manifest, the legal
// pages and the Android (Play Store) wrapper.
export const APP_NAME = "REC Studio";
export const APP_SHORT_NAME = "REC Studio";
export const APP_DESCRIPTION = "Il tuo studio professionale. Sempre con te. Clienti, schede, diete e progressi per personal trainer.";
export const THEME_COLOR = "#080808";
export const LEGAL_OWNER = process.env.NEXT_PUBLIC_LEGAL_OWNER || "";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.NEXT_PUBLIC_BILLING_EMAIL || "";
// Company shown in the footer copyright line, and the logo letter.
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "REC GROUP";
export const APP_INITIAL = APP_NAME.charAt(0).toUpperCase();

// Sales team: the public site shows no prices, only "contact sales".
// The contact form (/contatti) always works (leads saved via /api/contact);
// these optional variables add direct channels next to it.
//   NEXT_PUBLIC_SALES_EMAIL     e.g. "vendite@example.com"
//   NEXT_PUBLIC_SALES_WHATSAPP  international number, digits only, e.g. "393331234567"
export const SALES_EMAIL = process.env.NEXT_PUBLIC_SALES_EMAIL || CONTACT_EMAIL;
export const SALES_WHATSAPP = (process.env.NEXT_PUBLIC_SALES_WHATSAPP || "").replace(/\D/g, "");
export const CONTACT_SALES_PATH = "/contatti";
