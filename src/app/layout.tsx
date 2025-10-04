import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import QueryProvider from "@/providers/QueryProvider";
import { CartProvider } from "@/contexts/CartContext";
import CartIcon from "@/components/CartIcon";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Winky Cats Store",
  description: "Your favorite online fashion store for custom designed clothes, accessories and more",
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
            <ToastContainer />
            <nav className={styles.nav}>
              <div className={styles.navContainer}>
                <h1>
                  <Link href="/" className={styles.logo}>
                    Winky Cats
                  </Link>
                </h1>
                <div className={styles.navLinks}>
                  <Link href="/products" className={styles.navLink}>
                    Products
                  </Link>
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