import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SessionGuard from "@/components/shared/SessionGuard";
import ServiceWorker from "@/components/shared/ServiceWorker";
import InstallPrompt from "@/components/shared/InstallPrompt";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="docappoint"
      className={geist.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-base-100 text-base-content">
        {children}
        <SessionGuard />
        <ServiceWorker />
        <InstallPrompt />
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
      </body>
    </html>
  );
}
