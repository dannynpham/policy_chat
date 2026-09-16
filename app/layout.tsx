import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export const metadata: Metadata = {
  title: "PolicyChat | Ask your policy",
  description: "A focused, insurance policy assistant.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>
          <Notifications position="top-right" autoClose={5000} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
