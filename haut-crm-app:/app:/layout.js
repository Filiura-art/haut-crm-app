export const metadata = {
  title: "Haut CGI — Client Ledger",
  description: "Internal client CRM for Haut CGI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
