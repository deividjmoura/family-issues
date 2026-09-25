import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa/register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";
import "./side-menu.css";
import "./cyber-nav.css";
import "./kids-fx.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Family Tasks",
    template: "%s · Family Tasks",
  },
  description:
    "Delegue tarefas domésticas com recompensa em R$ e gamificação para quem executa.",
  applicationName: "Family Tasks",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Family Tasks",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e3a5f" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        {children}
        <PwaRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
