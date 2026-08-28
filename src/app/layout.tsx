import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pole trapezu krok po kroku | Hybrid OKF Tutor",
  description: "Jednoekranowe demo tutora prowadzącego przez obliczenie pola trapezu."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
