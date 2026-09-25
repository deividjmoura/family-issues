import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa/register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";
import "./side-menu.css";
import "./cyber-nav.css";
import "./kids-fx.css";
import "./complete-modal.css";
import "./game-lobby.css";
import "./live-toast.css";
import "./landing.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Family Issues", template: "%s · Family Issues" },
  description: "Transforme responsabilidades da família em uma jornada de conquistas, tarefas e recompensas.",
  applicationName: "Family Issues",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Family Issues" },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#20a8e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a1a" },
  ],
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={geistSans.variable + " " + geistMono.variable + " min-h-screen antialiased"}>
        {children}
        <PwaRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
