import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteDescription, getSiteName, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteName = getSiteName();
const siteDescription = getSiteDescription();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} - Portal de Noticias`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    title: `${siteName} - Portal de Noticias`,
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Portal de Noticias`,
    description: siteDescription,
  },
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
  } catch {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} bg-white text-zinc-900 dark:bg-slate-950 dark:text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
