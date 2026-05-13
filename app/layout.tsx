import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Темнодушное Лето",
  description: "Забег обречённых душ через миры игр",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${cinzel.variable} ${cormorant.variable} vignette`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}