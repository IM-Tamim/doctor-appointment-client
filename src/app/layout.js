import { Geist, Hind_Siliguri } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SessionGuard from "@/components/shared/SessionGuard";
import ServiceWorker from "@/components/shared/ServiceWorker";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Bangla UI text. Only applied when the page language is Bangla (globals.css).
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bn",
  display: "swap",
});

// Splitting viewport/themeColor out of `metadata` is required in Next 15+ —
// leaving them inside metadata logs a deprecation warning and they stop applying.
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#008e89" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1b24" },
  ],
  width: "device-width",
  initialScale: 1,
  // Zoom stays enabled on purpose: disabling it fails WCAG 1.4.4, and this is
  // a health app where people need to enlarge text.
  maximumScale: 5,
  viewportFit: "cover", // draw under the notch / home indicator
};

export const metadata = {
  // Absolute base for the Open Graph / icon URLs.
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000"),
  applicationName: "DocAppoint",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "DocAppoint",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  title: "DocAppoint",
  description:
    "Book your doctor appointments with ease. DocAppoint is your go-to platform for finding and scheduling appointments with healthcare professionals. Experience seamless booking, personalized recommendations, and reliable reminders—all in one place. Your health, our priority.",
};

// Runs before first paint so a dark-mode user never sees a white flash.
// Kept as a raw string on purpose — a React effect runs too late for this.
const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var dark = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "docappoint-dark" : "docappoint"
    );
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  return (
    // No data-theme here on purpose. When React owns that attribute it
    // reconciles it back to this value during hydration, wiping out whatever
    // the inline script below set from localStorage — which is exactly why the
    // app snapped back to light on every refresh. Leaving it off means React
    // has no opinion about the attribute and the script is the only owner.
    <html lang={locale} className={`${geist.variable} ${hindSiliguri.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-base-100 text-base-content">
        <NextIntlClientProvider>
        {children}
        <SessionGuard />
        <ServiceWorker />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-base-100)",
              color: "var(--color-base-content)",
              border: "1px solid var(--color-base-300)",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            },
          }}
        />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
