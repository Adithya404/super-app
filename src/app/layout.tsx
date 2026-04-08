import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/notifications";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
