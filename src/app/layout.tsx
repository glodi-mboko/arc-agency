import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARC Service — Portail Logistique",
  description: "Plateforme de gestion d'agence de fret — France ⇄ Kinshasa",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
