import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";

export const metadata: Metadata = {
  title: "SádroSvět · Dekorace s vlastním tvarem",
  description: "Návrh katalogu SádroSvět se sádrovými dekoracemi a správou produktů.",
  icons: {
    icon: "/logo-sadrosvet.png",
    shortcut: "/logo-sadrosvet.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
