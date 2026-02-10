import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auth System - Secure Authentication",
  description: "Modern authentication system built with Next.js and Fastify",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {/* Navigation Placeholder */}
            <header className="border-b">
              <nav className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold">Auth System</h1>
                  <div className="flex gap-4">
                    {/* Navigation links will be added based on auth state in Phase 7 */}
                  </div>
                </div>
              </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t py-6 mt-auto">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                Built with Next.js 14 & Fastify
              </div>
            </footer>
          </div>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
