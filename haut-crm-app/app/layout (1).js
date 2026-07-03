import { Syne } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-syne" });

export const metadata = {
  title: "Haut CGI — Client Ledger",
  description: "Internal client CRM for Haut CGI",
  manifest: "/manifest.json",
  themeColor: "#1B1A18",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Haut CRM",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={syne.variable}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
