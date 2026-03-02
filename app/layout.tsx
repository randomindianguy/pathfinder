import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";

export const metadata: Metadata = {
  title: "MEM Pathfinder — Purdue Course Planner",
  description: "AI-powered course planning for Purdue MEM students. Pick your target role, get a personalized 3-semester plan.",
  openGraph: {
    title: "MEM Pathfinder",
    description: "AI-powered course planning for Purdue MEM students",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
