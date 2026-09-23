import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rezervacije | Perešuti domače mesarstvo",
  description:
    "Rezervirajte piknik prostor v Skaručni ali najem žar mojstra pri Perešuti domače mesarstvo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header
      className="w-full"
      style={{ background: "var(--color-brown-dark)", color: "#fff8ef" }}
    >
      <div className="container-app flex items-center justify-between py-4">
        <a href="https://peresuti.si" className="flex items-center gap-2">
          <span
            className="text-lg sm:text-xl tracking-wide"
            style={{ fontFamily: "var(--font-heading)", color: "#fff8ef" }}
          >
            Perešuti <span style={{ color: "var(--color-accent)" }}>·</span>{" "}
            domače mesarstvo
          </span>
        </a>
        <a
          href="https://peresuti.si/kontakt/"
          className="text-sm opacity-80 hover:opacity-100 hidden sm:block"
        >
          ← nazaj na peresuti.si
        </a>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer
      className="w-full mt-16 py-8 text-sm"
      style={{ background: "var(--color-brown-dark)", color: "#d9c9b6" }}
    >
      <div className="container-app flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} Perešuti domače mesarstvo</span>
        <span>040 – 832 – 040</span>
      </div>
    </footer>
  );
}
