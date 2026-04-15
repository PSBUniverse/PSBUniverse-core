import "./globals.css";
import { Inter, Manrope } from "next/font/google";
import AppLayout from "@/shared/components/layout/AppLayout";
import AuthProvider from "@/core/auth/AuthProvider";
import GlobalToastHost from "@/shared/components/ui/GlobalToastHost";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata = {
  title: "PSBUniverse",
  description: "PSBUniverse application workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="dense-workspace">
        <AuthProvider>
          <GlobalToastHost />
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
