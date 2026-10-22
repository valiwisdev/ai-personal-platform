import type { Metadata } from "next";
import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI Personal Platform",
  description: "AI personal platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
