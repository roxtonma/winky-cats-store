import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { CartProvider } from "@/contexts/CartContext";
import CartIcon from "@/components/CartIcon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Winky Store",
  description: "Your favorite online fashion store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryProvider>
          <CartProvider>
            <nav style={{
              padding: '1.25rem 2rem',
              borderBottom: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>
                  <a href="/" style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Winky Store
                  </a>
                </h1>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <a href="/products" style={{
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    transition: 'color 0.2s ease'
                  }}>
                    Products
                  </a>
                  <CartIcon />
                </div>
              </div>
            </nav>
            {children}
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
