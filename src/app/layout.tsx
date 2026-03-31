import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "deck.gl 3D Demo",
  description: "3D flight network visualization with deck.gl, MapLibre & MapTiler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
