import type { Metadata } from "next";
import ThemeRegistry from "@/providers/ThemeRegistry";
import StoreProvider from "@/providers/StoreProvider";

export const metadata: Metadata = {
  title: "JobTracker",
  description: "Track and manage your job applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </StoreProvider>
      </body>
    </html>
  );
}
