import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KDKAMATO Program",
  description: "Training + Nutrition foundation that becomes more personal as your real data accumulates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
