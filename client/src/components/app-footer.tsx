import { Link } from "wouter";

export function AppFooter() {
  return (
    <footer className="border-t py-4">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>LivePay &copy; 2026 — livepay.tech</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">Politique de confidentialite</Link>
          <Link href="/terms" className="hover:text-foreground">Conditions de service</Link>
          <Link href="/data-deletion" className="hover:text-foreground">Suppression des donnees</Link>
        </div>
      </div>
    </footer>
  );
}
