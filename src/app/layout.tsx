import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "ツヅキ — 開いた瞬間、続きから。",
  description:
    "「読みたい」を意志ではなく仕組みで「使える知識」に変え続ける、社会人のためのビジネス書アプリ。1回2分の1論点と30秒のアウトプットで、読書が続く。",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#34558b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <StoreProvider>
          <div className="mx-auto min-h-dvh w-full max-w-md bg-paper shadow-xl">
            {children}
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
